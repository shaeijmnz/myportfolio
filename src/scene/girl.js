import * as THREE from 'three'

// A stylised, chibi-proportioned girl built from primitives.
// The rig faces +Z. Every joint is a Group, so poses are just rotations.

const COLORS = {
  skin: '#f7cfb2',
  blush: '#f59a9a',
  hair: '#3d2420',
  hairShine: '#5a362d',
  top: '#f28cb0',
  topDark: '#de6f98',
  skirt: '#2f3a67',
  sock: '#ffffff',
  shoe: '#ffffff',
  shoeAccent: '#ff7aa8',
  eye: '#24140f',
  bow: '#ff6f9f',
}

export const HIP_HEIGHT = 0.7

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, ...opts })
}

function capsule(radius, length, material) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 8, 20), material)
  mesh.castShadow = true
  return mesh
}

function sphere(radius, material, segW = 32, segH = 24) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segW, segH), material)
  mesh.castShadow = true
  return mesh
}

export function createGirl() {
  const m = {
    skin: mat(COLORS.skin, { roughness: 0.7 }),
    blush: mat(COLORS.blush, { roughness: 0.9, transparent: true, opacity: 0.55 }),
    hair: mat(COLORS.hair, { roughness: 0.55 }),
    top: mat(COLORS.top),
    topDark: mat(COLORS.topDark),
    skirt: mat(COLORS.skirt, { side: THREE.DoubleSide }),
    sock: mat(COLORS.sock),
    shoe: mat(COLORS.shoe, { roughness: 0.4 }),
    shoeAccent: mat(COLORS.shoeAccent),
    eye: mat(COLORS.eye, { roughness: 0.2 }),
    white: mat('#ffffff', { roughness: 0.2, emissive: '#ffffff', emissiveIntensity: 0.4 }),
    bow: mat(COLORS.bow),
    mouth: mat('#c2525f'),
  }

  const root = new THREE.Group()
  root.name = 'girl'

  const hips = new THREE.Group()
  hips.position.y = HIP_HEIGHT
  root.add(hips)

  // pelvis + skirt
  const pelvis = sphere(0.155, m.skirt)
  pelvis.scale.set(1.05, 0.72, 0.85)
  hips.add(pelvis)

  const skirtGroup = new THREE.Group()
  hips.add(skirtGroup)
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 0.2, 32, 1, true), m.skirt)
  skirt.position.y = -0.07
  skirt.castShadow = true
  skirtGroup.add(skirt)
  const skirtHem = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.012, 8, 40), m.white)
  skirtHem.rotation.x = Math.PI / 2
  skirtHem.position.y = -0.17
  skirtGroup.add(skirtHem)

  // spine / torso
  const spine = new THREE.Group()
  spine.position.y = 0.05
  hips.add(spine)

  const torso = capsule(0.16, 0.2, m.top)
  torso.position.y = 0.19
  torso.scale.set(1.05, 1, 0.8)
  spine.add(torso)
  // little collar
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 10, 28), m.white)
  collar.rotation.x = Math.PI / 2
  collar.position.y = 0.42
  spine.add(collar)
  // heart on the shirt
  const heart = new THREE.Group()
  const heartL = sphere(0.028, m.white, 16, 12)
  heartL.position.set(-0.02, 0.01, 0)
  const heartR = heartL.clone()
  heartR.position.x = 0.02
  const heartB = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.055, 16), m.white)
  heartB.rotation.z = Math.PI
  heartB.position.y = -0.022
  heart.add(heartL, heartR, heartB)
  heart.scale.z = 0.4
  heart.position.set(0.05, 0.25, 0.13)
  spine.add(heart)

  // neck + head
  const neck = new THREE.Group()
  neck.position.y = 0.4
  spine.add(neck)
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 16), m.skin)
  neckMesh.position.y = 0.03
  neck.add(neckMesh)

  const head = new THREE.Group()
  head.position.y = 0.06
  neck.add(head)

  const HEAD_Y = 0.27
  const skull = sphere(0.3, m.skin, 48, 36)
  skull.position.y = HEAD_Y
  skull.scale.set(1.02, 0.97, 0.95)
  head.add(skull)

  // ears
  for (const side of [-1, 1]) {
    const ear = sphere(0.055, m.skin, 16, 12)
    ear.position.set(side * 0.29, HEAD_Y - 0.01, 0)
    ear.scale.set(0.6, 1, 0.8)
    head.add(ear)
  }

  // face
  const face = new THREE.Group()
  face.position.y = HEAD_Y
  head.add(face)

  const eyes = new THREE.Group()
  face.add(eyes)
  for (const side of [-1, 1]) {
    const eye = new THREE.Group()
    eye.position.set(side * 0.105, -0.02, 0.262)
    eye.rotation.y = side * 0.32
    const ball = sphere(0.058, m.eye, 24, 18)
    ball.scale.set(0.9, 1.15, 0.45)
    eye.add(ball)
    const shine = sphere(0.018, m.white, 12, 10)
    shine.position.set(side * -0.015 + 0.012, 0.025, 0.022)
    eye.add(shine)
    const shine2 = sphere(0.008, m.white, 8, 8)
    shine2.position.set(-0.012, -0.022, 0.024)
    eye.add(shine2)
    // lashes
    const lash = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.009, 6, 20, Math.PI * 0.75), m.eye)
    lash.position.set(0, 0.005, 0.012)
    lash.rotation.z = Math.PI * 0.125
    lash.scale.set(1, 1.15, 1)
    eye.add(lash)
    const flick = capsule(0.007, 0.03, m.eye)
    flick.position.set(side * 0.06, 0.045, 0.01)
    flick.rotation.z = side * -0.9
    eye.add(flick)
    eyes.add(eye)

    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), m.blush)
    blush.position.set(side * 0.17, -0.09, 0.0)
    blush.lookAt(side * 0.6, -0.3, 1.4)
    blush.position.set(side * 0.175, -0.095, 0.238)
    face.add(blush)

    const brow = capsule(0.008, 0.045, m.hair)
    brow.rotation.z = Math.PI / 2 + side * 0.18
    brow.position.set(side * 0.105, 0.085, 0.27)
    face.add(brow)
  }

  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.008, 8, 20, Math.PI), m.mouth)
  mouth.rotation.z = Math.PI
  mouth.position.set(0, -0.105, 0.283)
  face.add(mouth)

  const nose = sphere(0.014, m.skin, 10, 8)
  nose.position.set(0, -0.055, 0.29)
  face.add(nose)

  // hair
  const hairGroup = new THREE.Group()
  hairGroup.position.y = HEAD_Y
  head.add(hairGroup)

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.322, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.56), m.hair)
  cap.rotation.x = -0.42
  cap.castShadow = true
  hairGroup.add(cap)

  // bangs: a fan of soft blobs over the forehead
  const bangs = [
    [-0.19, 0.12, 0.2, 0.5],
    [-0.1, 0.15, 0.25, 0.2],
    [0.0, 0.16, 0.265, 0],
    [0.11, 0.15, 0.25, -0.25],
    [0.2, 0.11, 0.19, -0.55],
  ]
  for (const [x, y, z, rz] of bangs) {
    const b = sphere(0.085, m.hair, 20, 14)
    b.position.set(x, y, z)
    b.scale.set(0.9, 1.25, 0.5)
    b.rotation.z = rz
    hairGroup.add(b)
  }

  // long back hair
  const back = capsule(0.25, 0.32, m.hair)
  back.position.set(0, -0.2, -0.13)
  back.scale.set(1.18, 1, 0.62)
  hairGroup.add(back)
  const backTip = sphere(0.2, m.hair)
  backTip.position.set(0, -0.48, -0.15)
  backTip.scale.set(1.25, 0.8, 0.55)
  hairGroup.add(backTip)

  // side locks framing the face
  for (const side of [-1, 1]) {
    const lock = capsule(0.07, 0.34, m.hair)
    lock.position.set(side * 0.27, -0.2, 0.06)
    lock.rotation.z = side * 0.08
    lock.scale.set(1, 1, 0.75)
    hairGroup.add(lock)
    const curl = sphere(0.075, m.hair, 16, 12)
    curl.position.set(side * 0.255, -0.41, 0.09)
    hairGroup.add(curl)
  }

  // shine streak
  const streak = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.012, 6, 32, Math.PI * 0.45), m.white)
  streak.material = mat(COLORS.hairShine)
  streak.rotation.set(-0.6, 0, Math.PI * 0.27)
  streak.position.set(0, 0.04, 0.06)
  hairGroup.add(streak)

  // bow on the back of the head
  const bow = new THREE.Group()
  for (const side of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.14, 20), m.bow)
    loop.rotation.z = side * -Math.PI / 2
    loop.position.x = side * 0.075
    loop.scale.set(1, 1, 0.5)
    loop.castShadow = true
    bow.add(loop)
  }
  const knot = sphere(0.035, m.bow, 16, 12)
  bow.add(knot)
  bow.position.set(0.12, 0.22, -0.2)
  bow.rotation.set(-0.5, 0.35, 0.35)
  hairGroup.add(bow)

  // arms
  function makeArm(side) {
    const shoulder = new THREE.Group()
    shoulder.position.set(side * 0.205, 0.33, 0)
    spine.add(shoulder)
    const sleeve = sphere(0.078, m.top, 20, 16)
    sleeve.scale.set(1, 1.15, 1)
    sleeve.position.y = -0.04
    shoulder.add(sleeve)
    const upper = capsule(0.052, 0.13, m.skin)
    upper.position.y = -0.12
    shoulder.add(upper)
    const elbow = new THREE.Group()
    elbow.position.y = -0.22
    shoulder.add(elbow)
    const fore = capsule(0.048, 0.12, m.skin)
    fore.position.y = -0.09
    elbow.add(fore)
    const wrist = new THREE.Group()
    wrist.position.y = -0.19
    elbow.add(wrist)
    const hand = sphere(0.06, m.skin, 20, 16)
    hand.scale.set(0.95, 1.15, 0.8)
    hand.position.y = -0.03
    wrist.add(hand)
    const thumb = capsule(0.02, 0.03, m.skin)
    thumb.position.set(side * -0.04, -0.01, 0.03)
    thumb.rotation.z = side * 0.6
    wrist.add(thumb)
    return { shoulder, elbow, wrist }
  }

  // legs
  function makeLeg(side) {
    const hip = new THREE.Group()
    hip.position.set(side * 0.085, -0.04, 0)
    hips.add(hip)
    const thigh = capsule(0.072, 0.18, m.skin)
    thigh.position.y = -0.14
    hip.add(thigh)
    const knee = new THREE.Group()
    knee.position.y = -0.29
    hip.add(knee)
    const shin = capsule(0.062, 0.16, m.skin)
    shin.position.y = -0.11
    knee.add(shin)
    const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.067, 0.064, 0.12, 20), m.sock)
    sock.position.y = -0.2
    sock.castShadow = true
    knee.add(sock)
    const ankle = new THREE.Group()
    ankle.position.y = -0.3
    knee.add(ankle)
    const shoe = capsule(0.075, 0.1, m.shoe)
    shoe.rotation.x = Math.PI / 2
    shoe.position.set(0, -0.02, 0.04)
    shoe.scale.set(1.05, 1, 0.85)
    ankle.add(shoe)
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.025, 0.24), m.shoeAccent)
    sole.position.set(0, -0.075, 0.04)
    sole.castShadow = true
    ankle.add(sole)
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.02, 0.04), m.shoeAccent)
    strap.position.set(0, 0.03, 0.06)
    ankle.add(strap)
    return { hip, knee, ankle }
  }

  const armL = makeArm(1)
  const armR = makeArm(-1)
  const legL = makeLeg(1)
  const legR = makeLeg(-1)

  const joints = { root, hips, spine, neck, head, eyes, skirtGroup, armL, armR, legL, legR }
  return { root, joints, materials: m }
}

// ---------- poses ----------

const lerp = (a, b, t) => a + (b - a) * t

// Rotations (x, y, z) for each joint, sitting at a desk vs standing upright.
const SIT = {
  hipsY: 0.6,
  spine: [0.16, 0, 0],
  head: [-0.12, 0, 0],
  armL: { shoulder: [-1.05, 0, 0.18], elbow: [-0.55, 0, 0], wrist: [0.5, 0, 0] },
  armR: { shoulder: [-1.0, 0, -0.22], elbow: [-0.6, 0, 0], wrist: [0.55, 0, 0] },
  legL: { hip: [-1.55, 0.06, 0.04], knee: [1.45, 0, 0], ankle: [0.15, 0, 0] },
  legR: { hip: [-1.55, -0.06, -0.04], knee: [1.45, 0, 0], ankle: [0.15, 0, 0] },
  skirt: [-0.35, 0, 0],
}

const STAND = {
  hipsY: HIP_HEIGHT,
  spine: [0, 0, 0],
  head: [0, 0, 0],
  armL: { shoulder: [0, 0, 0.16], elbow: [-0.12, 0, 0], wrist: [0, 0, 0] },
  armR: { shoulder: [0, 0, -0.16], elbow: [-0.12, 0, 0], wrist: [0, 0, 0] },
  legL: { hip: [0, 0, 0.02], knee: [0, 0, 0], ankle: [0, 0, 0] },
  legR: { hip: [0, 0, -0.02], knee: [0, 0, 0], ankle: [0, 0, 0] },
  skirt: [0, 0, 0],
}

function setRot(obj, a, b, t) {
  obj.rotation.set(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t))
}

/**
 * Applies the blended pose plus procedural motion.
 * @param joints   rig joints
 * @param sit      1 = sitting, 0 = standing
 * @param time     seconds
 * @param walk     walking amount 0..1 and phase
 */
export function poseGirl(joints, { sit, time, walk = 0, walkPhase = 0, lookAtCamera = 0 }) {
  const t = 1 - sit // blend from SIT (t=0) to STAND (t=1)
  const { hips, spine, head, eyes, skirtGroup, armL, armR, legL, legR } = joints

  hips.position.y = lerp(SIT.hipsY, STAND.hipsY, t)
  setRot(spine, SIT.spine, STAND.spine, t)
  setRot(head, SIT.head, STAND.head, t)
  setRot(skirtGroup, SIT.skirt, STAND.skirt, t)
  for (const [name, arm] of [['armL', armL], ['armR', armR]]) {
    setRot(arm.shoulder, SIT[name].shoulder, STAND[name].shoulder, t)
    setRot(arm.elbow, SIT[name].elbow, STAND[name].elbow, t)
    setRot(arm.wrist, SIT[name].wrist, STAND[name].wrist, t)
  }
  for (const [name, leg] of [['legL', legL], ['legR', legR]]) {
    setRot(leg.hip, SIT[name].hip, STAND[name].hip, t)
    setRot(leg.knee, SIT[name].knee, STAND[name].knee, t)
    setRot(leg.ankle, SIT[name].ankle, STAND[name].ankle, t)
  }

  // ---- working at the desk (fades out as she stands) ----
  if (sit > 0.001) {
    // Head alternates between the two monitors, holding on each one.
    const cycle = (time % 7) / 7
    const look = smoothPulse(cycle) // 0 → left screen, 1 → right screen
    head.rotation.y += sit * lerp(0.38, -0.34, look)
    head.rotation.x += sit * (Math.sin(time * 0.9) * 0.03 - 0.03)
    head.rotation.z += sit * lerp(0.05, -0.05, look)
    spine.rotation.y += sit * lerp(0.08, -0.06, look)

    // Right hand drives the mouse in small loops.
    const mx = Math.sin(time * 1.7) * 0.5 + Math.sin(time * 4.3) * 0.25
    const mz = Math.cos(time * 2.1) * 0.5
    armR.shoulder.rotation.x += sit * mz * 0.08
    armR.shoulder.rotation.z += sit * mx * 0.09
    armR.elbow.rotation.x += sit * mz * 0.08
    armR.wrist.rotation.z += sit * Math.sin(time * 6) * 0.05

    // Left hand taps on the keyboard.
    const tap = Math.max(0, Math.sin(time * 11)) * Math.max(0, Math.sin(time * 1.3 + 1))
    armL.elbow.rotation.x += sit * tap * 0.12
    armL.wrist.rotation.x += sit * tap * 0.2

    // Foot swinging under the chair.
    legL.knee.rotation.x += sit * (Math.sin(time * 2.2) * 0.12)
    legR.knee.rotation.x += sit * (Math.sin(time * 2.2 + 1.8) * 0.1)
  }

  // ---- standing idle ----
  if (t > 0.001) {
    const breathe = Math.sin(time * 2) * 0.5 + 0.5
    spine.rotation.x += t * (breathe * 0.025 - 0.01)
    armL.shoulder.rotation.z += t * breathe * 0.03
    armR.shoulder.rotation.z -= t * breathe * 0.03
    head.rotation.z += t * Math.sin(time * 0.8) * 0.04 * (1 - walk)
    head.rotation.y += t * Math.sin(time * 0.5) * 0.08 * (1 - walk) * (1 - lookAtCamera)
  }

  // ---- walking ----
  if (walk > 0.001) {
    const s = Math.sin(walkPhase)
    const c = Math.cos(walkPhase)
    legL.hip.rotation.x += walk * s * 0.55
    legR.hip.rotation.x -= walk * s * 0.55
    legL.knee.rotation.x += walk * Math.max(0, -s) * 0.7
    legR.knee.rotation.x += walk * Math.max(0, s) * 0.7
    armL.shoulder.rotation.x -= walk * s * 0.45
    armR.shoulder.rotation.x += walk * s * 0.45
    hips.position.y += walk * Math.abs(c) * 0.03
    spine.rotation.y += walk * s * 0.06
  }

  // ---- blinking ----
  const blinkT = time % 3.6
  const blink = blinkT < 0.14 ? Math.sin((blinkT / 0.14) * Math.PI) : 0
  eyes.scale.y = 1 - blink * 0.9
}

// 0 for the first part of the cycle, 1 for the second, with smooth transitions.
function smoothPulse(c) {
  const ease = (x) => x * x * (3 - 2 * x)
  if (c < 0.38) return 0
  if (c < 0.5) return ease((c - 0.38) / 0.12)
  if (c < 0.88) return 1
  return 1 - ease((c - 0.88) / 0.12)
}
