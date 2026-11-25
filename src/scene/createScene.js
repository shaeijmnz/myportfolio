import * as THREE from 'three'
import { createGirl, poseGirl } from './girl.js'
import { createRoom } from './room.js'

// ---------- helpers ----------
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const range = (p, a, b) => clamp01((p - a) / (b - a))
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const smooth = (x) => x * x * (3 - 2 * x)
const lerp = (a, b, t) => a + (b - a) * t

// Scroll timeline (0..1 across the story section). Exported so the HTML overlay uses the same beats.
export const TIMELINE = {
  heroFade: [0.02, 0.12],
  standUp: [0.1, 0.19],
  turn: [0.17, 0.25],
  walk: [0.21, 0.34],
  roomRise: [0.2, 0.34],
  camera: [0.12, 0.34],
  stage: [0.26, 0.36],
  nameCard: [0.34, 0.4],
  scan: [0.42, 0.9],
}

// ---------- hologram material ----------
function createHoloMaterial(uniforms) {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vNormal;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uScanY;
      uniform float uTime;
      varying vec3 vWorld;
      varying vec3 vNormal;
      void main() {
        if (vWorld.y > uScanY) discard;
        vec3 v = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - abs(dot(normalize(vNormal), v)), 2.0);
        float stripe = smoothstep(0.25, 0.5, abs(fract(vWorld.y * 70.0 - uTime * 0.6) - 0.5));
        float flicker = 0.94 + 0.06 * sin(uTime * 40.0 + vWorld.y * 10.0);
        float edge = smoothstep(0.05, 0.0, uScanY - vWorld.y);
        vec3 deep = vec3(0.02, 0.35, 0.85);
        vec3 bright = vec3(0.35, 0.85, 1.0);
        vec3 col = mix(deep, bright, 0.35 + fres * 0.65);
        col *= 0.7 + 0.45 * stripe;
        col += vec3(0.75, 0.95, 1.0) * edge * 1.2;
        gl_FragColor = vec4(col * flicker, 1.0);
      }
    `,
  })
}

// ---------- grid floor ----------
function createGrid() {
  const uniforms = { uOpacity: { value: 0 }, uTime: { value: 0 } }
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform float uTime;
      varying vec3 vWorld;
      void main() {
        vec2 p = vWorld.xz / 0.9;
        vec2 g = abs(fract(p - 0.5) - 0.5) / fwidth(p);
        float line = 1.0 - min(min(g.x, g.y), 1.0);
        vec2 dots = abs(fract(p) - 0.0);
        float d = length(vWorld.xz - vec2(0.0, 1.0));
        float fade = smoothstep(14.0, 2.0, d);
        float glow = smoothstep(3.5, 0.0, d) * 0.35;
        vec3 col = vec3(0.25, 0.65, 1.0);
        float a = (line * 0.35 + glow) * fade * uOpacity;
        gl_FragColor = vec4(col, a);
      }
    `,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -0.002
  return { mesh, uniforms }
}

// ---------- platform ----------
function createPlatform() {
  const g = new THREE.Group()
  const fadeMats = []
  const addMat = (m) => {
    m.transparent = true
    m.userData.baseOpacity = m.opacity
    fadeMats.push(m)
    return m
  }
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.02, 0.16, 64),
    addMat(new THREE.MeshStandardMaterial({ color: '#0b3d8c', roughness: 0.35, metalness: 0.3, emissive: '#06306e', emissiveIntensity: 0.6 })),
  )
  base.position.y = -0.08
  base.receiveShadow = true
  g.add(base)
  const step = new THREE.Mesh(
    new THREE.CylinderGeometry(1.08, 1.12, 0.06, 64),
    addMat(new THREE.MeshStandardMaterial({ color: '#0a3172', roughness: 0.4, emissive: '#05275c', emissiveIntensity: 0.5 })),
  )
  step.position.y = -0.17
  g.add(step)
  const ringMat = addMat(new THREE.MeshBasicMaterial({ color: '#57d3ff', toneMapped: false }))
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.018, 12, 96), ringMat)
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.005
  g.add(ring)
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.97, 0.01, 8, 96), ringMat)
  ring2.rotation.x = Math.PI / 2
  ring2.position.y = -0.02
  g.add(ring2)

  // light cone rising from the platform
  const beamMat = addMat(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uOpacity: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uOpacity; varying vec2 vUv; void main(){ float a = pow(1.0 - vUv.y, 2.2) * 0.32 * uOpacity; gl_FragColor = vec4(0.3,0.75,1.0,a); }`,
    }),
  )
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.84, 2.2, 64, 1, true), beamMat)
  beam.position.y = 1.1
  g.add(beam)

  // scan ring that rides up with the scan line
  const scanRingMat = addMat(new THREE.MeshBasicMaterial({ color: '#8fe6ff', toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
  const scanRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.008, 8, 96), scanRingMat)
  scanRing.rotation.x = Math.PI / 2
  g.add(scanRing)
  const scanDiscMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uOpacity: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uOpacity; varying vec2 vUv; void main(){ float d = length(vUv - 0.5) * 2.0; float a = smoothstep(1.0, 0.6, d) * smoothstep(0.0, 0.9, d) * 0.45 * uOpacity; gl_FragColor = vec4(0.4,0.85,1.0,a); }`,
  })
  const scanDisc = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), scanDiscMat)
  scanDisc.rotation.x = -Math.PI / 2
  g.add(scanDisc)

  return {
    group: g,
    scanRing,
    scanDisc,
    setOpacity(o, scanVisible) {
      for (const m of fadeMats) {
        if (m.uniforms?.uOpacity) m.uniforms.uOpacity.value = o
        else m.opacity = (m.userData.baseOpacity ?? 1) * o
      }
      scanRingMat.opacity = o * scanVisible
      scanDiscMat.uniforms.uOpacity.value = o * scanVisible
      g.visible = o > 0.001
    },
  }
}

// ---------- scene ----------
export function createScene(canvas, { onFrame } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.localClippingEnabled = true
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)

  // lights
  const hemi = new THREE.HemisphereLight('#fff7ec', '#c9b8a6', 1.25)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight('#fff4e2', 2.3)
  sun.position.set(3.5, 7, 5)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.left = -5
  sun.shadow.camera.right = 5
  sun.shadow.camera.top = 5
  sun.shadow.camera.bottom = -3
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 20
  sun.shadow.bias = -0.0005
  sun.shadow.normalBias = 0.02
  sun.shadow.radius = 6
  scene.add(sun)
  scene.add(sun.target)
  const fill = new THREE.DirectionalLight('#dfe8ff', 0.6)
  fill.position.set(-4, 3, 2)
  scene.add(fill)
  const holoLight = new THREE.PointLight('#4fc3ff', 0, 6, 1.5)
  holoLight.position.set(0, 0.4, 1.4)
  scene.add(holoLight)

  // content
  const { room, seatAnchor, update: updateRoom } = createRoom()
  scene.add(room)

  const girl = createGirl()
  scene.add(girl.root)

  const grid = createGrid()
  scene.add(grid.mesh)

  const platform = createPlatform()
  const STAGE = new THREE.Vector3(0, 0, 1.4)
  platform.group.position.copy(STAGE)
  scene.add(platform.group)

  // hologram twin for every girl mesh + clipping on the solid version
  const scanPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 100)
  const holoUniforms = { uScanY: { value: -100 }, uTime: { value: 0 } }
  const holoMat = createHoloMaterial(holoUniforms)
  const girlMeshes = []
  girl.root.traverse((o) => {
    if (o.isMesh) girlMeshes.push(o)
  })
  const clippedMats = new Set()
  for (const mesh of girlMeshes) {
    clippedMats.add(mesh.material)
    const twin = new THREE.Mesh(mesh.geometry, holoMat)
    twin.renderOrder = 1
    mesh.add(twin)
  }
  for (const m of clippedMats) m.clippingPlanes = [scanPlane]

  // camera keyframes
  const heroCam = { pos: new THREE.Vector3(4.6, 4.3, 6.6), target: new THREE.Vector3(0.15, 1.05, -0.75) }
  const stageCam = { pos: new THREE.Vector3(0, 1.32, STAGE.z + 5.6), target: new THREE.Vector3(0, 0.95, STAGE.z) }
  const camPos = new THREE.Vector3()
  const camTarget = new THREE.Vector3()

  let width = 1
  let height = 1
  function resize() {
    width = canvas.clientWidth || window.innerWidth
    height = canvas.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  // state
  let targetProgress = 0
  let progress = 0
  let introT = 0
  let started = false
  const pointer = new THREE.Vector2()
  const pointerSmooth = new THREE.Vector2()
  const onPointer = (e) => {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
  }
  window.addEventListener('pointermove', onPointer)

  const timer = new THREE.Timer()
  timer.connect(document)
  const HEMI_SKY = new THREE.Color('#fff7ec')
  const HEMI_SKY_STAGE = new THREE.Color('#8cc0ff')
  const HEMI_GROUND = new THREE.Color('#c9b8a6')
  const HEMI_GROUND_STAGE = new THREE.Color('#0d3380')
  let raf = 0
  let walkPhase = 0
  const tmp = new THREE.Vector3()
  const startPos = new THREE.Vector3()
  const standPos = new THREE.Vector3()

  function frame() {
    raf = requestAnimationFrame(frame)
    timer.update()
    const dt = Math.min(timer.getDelta(), 0.05)
    const time = timer.getElapsed()
    if (started) introT = Math.min(1, introT + dt / 1.6)

    progress += (targetProgress - progress) * Math.min(1, dt * 6)
    const p = progress
    pointerSmooth.lerp(pointer, Math.min(1, dt * 3))

    updateRoom(time)
    holoUniforms.uTime.value = time
    grid.uniforms.uTime.value = time

    // --- timeline values ---
    const stand = ease(range(p, ...TIMELINE.standUp))
    const turn = ease(range(p, ...TIMELINE.turn))
    const walkT = range(p, ...TIMELINE.walk)
    const walkE = smooth(walkT)
    const rise = ease(range(p, ...TIMELINE.roomRise))
    const camT = ease(range(p, ...TIMELINE.camera))
    const stageT = smooth(range(p, ...TIMELINE.stage))
    const scan = range(p, ...TIMELINE.scan)

    // --- room slides up and away ---
    room.position.y = rise * 9
    room.position.z = -rise * 1.5
    room.visible = rise < 0.999

    // --- girl ---
    startPos.copy(seatAnchor)
    standPos.copy(seatAnchor).add(tmp.set(0, 0, 0.35))
    girl.root.position.lerpVectors(startPos, standPos, stand)
    girl.root.position.lerp(STAGE, walkE)
    // while still seated she rides the room up a little if scrolled oddly
    girl.root.rotation.y = Math.PI + turn * Math.PI
    const walking = Math.sin(walkT * Math.PI)
    walkPhase = walkT * Math.PI * 7
    poseGirl(girl.joints, {
      sit: 1 - stand,
      time,
      walk: walking * (walkT > 0 && walkT < 1 ? 1 : 0),
      walkPhase,
      lookAtCamera: stageT,
    })
    // look toward the visitor's pointer once on stage
    if (stageT > 0) {
      girl.joints.head.rotation.y += stageT * pointerSmooth.x * 0.35
      girl.joints.head.rotation.x += stageT * pointerSmooth.y * 0.15
    }

    // --- scan ---
    const girlTop = 1.75
    const scanY = scan > 0 ? lerp(-0.05, girlTop + 0.05, scan) : -100
    scanPlane.constant = -scanY
    holoUniforms.uScanY.value = scanY
    const scanVisible = scan > 0 && scan < 1 ? 1 : 0
    platform.scanRing.position.y = scanY
    platform.scanDisc.position.y = scanY
    const ringScale = 0.75 + Math.sin(Math.min(1, scan) * Math.PI) * 0.12
    platform.scanRing.scale.setScalar(ringScale)
    platform.scanDisc.scale.setScalar(ringScale)
    platform.setOpacity(stageT, scanVisible)
    grid.uniforms.uOpacity.value = stageT
    holoLight.intensity = stageT * 2.5

    // lighting shifts from warm studio to cool stage
    hemi.color.copy(HEMI_SKY).lerp(HEMI_SKY_STAGE, stageT * 0.6)
    hemi.groundColor.copy(HEMI_GROUND).lerp(HEMI_GROUND_STAGE, stageT)
    sun.intensity = lerp(2.3, 1.6, stageT)

    // --- camera ---
    const aspect = width / height
    const portrait = aspect < 1
    const distScale = portrait ? Math.min(2.3, 1.15 / aspect) : Math.max(1, 1.5 / aspect)
    camTarget.lerpVectors(heroCam.target, stageCam.target, camT)
    camPos.lerpVectors(heroCam.pos, stageCam.pos, camT)
    // keep distance consistent with screen shape
    camPos.sub(camTarget).multiplyScalar(lerp(distScale * (1 + (1 - introT) * 0.25), portrait ? distScale : Math.max(1, 1.2 / aspect), camT)).add(camTarget)
    // intro swing
    const intro = 1 - ease(introT)
    camPos.x += intro * 1.5
    camPos.y += intro * 0.8
    // subtle parallax from the pointer
    camPos.x += pointerSmooth.x * 0.18 * (1 - camT * 0.5)
    camPos.y -= pointerSmooth.y * 0.1
    camera.position.copy(camPos)
    camera.lookAt(camTarget)

    // shift the hero scene to the right so the name has room on the left
    const shift = portrait ? 0 : lerp(-0.17, 0, camT)
    const shiftY = portrait ? lerp(-0.16, 0, camT) : 0
    camera.setViewOffset(width, height, width * shift, height * shiftY, width, height)

    renderer.render(scene, camera)
    onFrame?.(p, introT)
  }

  // warm up shaders before revealing
  renderer.compile(scene, camera)
  frame()

  return {
    setProgress(p) {
      targetProgress = p
    },
    jumpTo(p) {
      targetProgress = p
      progress = p
    },
    start() {
      started = true
    },
    dispose() {
      cancelAnimationFrame(raf)
      timer.dispose()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      renderer.dispose()
    },

  }
}
