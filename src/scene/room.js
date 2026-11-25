import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...opts })
}

function box(w, h, d, material, r = 0.04) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2)), material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function cyl(rt, rb, h, material, seg = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

// ---------- animated monitor screens ----------

const CODE_COLORS = ['#ff9f5a', '#f6d860', '#8bd17c', '#c792ea', '#7fc8f8', '#f78c9c', '#e6e1f0']

function createCodeScreen() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 320
  const ctx = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4

  const lines = []
  const newLine = () => {
    const indent = Math.floor(Math.random() * 4)
    const tokens = []
    const count = 1 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      tokens.push({ w: 18 + Math.random() * 70, c: CODE_COLORS[Math.floor(Math.random() * CODE_COLORS.length)] })
    }
    return { indent, tokens, typed: 0, total: tokens.reduce((s, t) => s + t.w + 8, 0) }
  }
  for (let i = 0; i < 13; i++) {
    const l = newLine()
    l.typed = l.total
    lines.push(l)
  }
  lines.push(newLine())

  let acc = 0
  function draw() {
    ctx.fillStyle = '#2b2933'
    ctx.fillRect(0, 0, 512, 320)
    ctx.fillStyle = '#35323f'
    ctx.fillRect(0, 0, 512, 26)
    ;['#ff6b6b', '#ffd166', '#5bd18b'].forEach((c, i) => {
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.arc(16 + i * 16, 13, 4.5, 0, Math.PI * 2)
      ctx.fill()
    })
    lines.forEach((line, row) => {
      const y = 40 + row * 19
      ctx.fillStyle = '#5c586b'
      ctx.fillRect(12, y, 14, 7)
      let x = 40 + line.indent * 22
      let budget = line.typed
      for (const tok of line.tokens) {
        if (budget <= 0) break
        const w = Math.min(tok.w, budget)
        ctx.fillStyle = tok.c
        ctx.fillRect(x, y, w, 7)
        x += tok.w + 8
        budget -= tok.w + 8
      }
      if (row === lines.length - 1) {
        ctx.fillStyle = Math.floor(acc * 3) % 2 ? '#ffffff' : 'transparent'
        ctx.fillRect(x - (budget < 0 ? -budget : 0) + 2, y - 2, 3, 11)
      }
    })
    texture.needsUpdate = true
  }

  let last = 0
  function update(time) {
    acc = time
    if (time - last < 0.06) return
    last = time
    const cur = lines[lines.length - 1]
    cur.typed += 9
    if (cur.typed >= cur.total + 30) {
      lines.push(newLine())
      if (lines.length > 14) lines.shift()
    }
    draw()
  }
  draw()
  return { texture, update }
}

function createDesignScreen() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 320
  const ctx = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace

  function update(time) {
    ctx.fillStyle = '#2b2933'
    ctx.fillRect(0, 0, 512, 320)
    // sidebar
    ctx.fillStyle = '#35323f'
    ctx.fillRect(0, 0, 70, 320)
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i === 0 ? '#6c8cff' : '#57536a'
      ctx.beginPath()
      ctx.roundRect(20, 22 + i * 46, 30, 30, 8)
      ctx.fill()
    }
    // header lines
    ctx.fillStyle = '#7a7690'
    ctx.fillRect(100, 30, 160, 10)
    ctx.fillStyle = '#57536a'
    ctx.fillRect(100, 52, 240, 7)
    ctx.fillRect(100, 66, 200, 7)
    // cards with a soft pulse
    const cards = [
      [100, 95, '#f28cb0'],
      [240, 95, '#7fc8f8'],
      [380, 95, '#f6d860'],
    ]
    cards.forEach(([x, y, c], i) => {
      const lift = Math.sin(time * 1.6 + i) * 3
      ctx.fillStyle = '#3a3746'
      ctx.beginPath()
      ctx.roundRect(x, y + lift, 115, 120, 10)
      ctx.fill()
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.roundRect(x + 12, y + 12 + lift, 91, 54, 6)
      ctx.fill()
      ctx.fillStyle = '#6a6680'
      ctx.fillRect(x + 12, y + 78 + lift, 70, 7)
      ctx.fillRect(x + 12, y + 92 + lift, 50, 7)
    })
    // progress bar
    const p = (time * 0.15) % 1
    ctx.fillStyle = '#3a3746'
    ctx.fillRect(100, 250, 395, 10)
    ctx.fillStyle = '#5bd18b'
    ctx.fillRect(100, 250, 395 * p, 10)
    texture.needsUpdate = true
  }
  update(0)
  let last = 0
  return {
    texture,
    update(time) {
      if (time - last < 0.05) return
      last = time
      update(time)
    },
  }
}

function noteTexture(symbol, color) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  ctx.font = 'bold 100px "Segoe UI Symbol", "Arial Unicode MS", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(symbol, 64, 70)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// ---------- room ----------

export function createRoom() {
  const room = new THREE.Group()
  room.name = 'room'
  const updaters = []

  const M = {
    white: mat('#fbf8f3', { roughness: 0.5 }),
    offWhite: mat('#ece6dc'),
    wood: mat('#d9a86c', { roughness: 0.7 }),
    woodLight: mat('#ead2a6', { roughness: 0.7 }),
    dark: mat('#4a4458', { roughness: 0.45 }),
    darker: mat('#38333f', { roughness: 0.4 }),
    metal: mat('#9a98a3', { roughness: 0.35, metalness: 0.4 }),
    orange: mat('#ee8a2c', { roughness: 0.75 }),
    orangeLight: mat('#f3ad45', { roughness: 0.75 }),
    yellow: mat('#f4d470', { roughness: 0.8 }),
    yellowLight: mat('#f7e39a', { roughness: 0.8 }),
    cork: mat('#a5876c', { roughness: 0.95 }),
    frame: mat('#e7d3a8', { roughness: 0.6 }),
    blue: mat('#8fb3e3', { roughness: 0.55 }),
    blueLight: mat('#c8dbf3', { roughness: 0.55 }),
    green: mat('#8ccf2e', { roughness: 0.5 }),
    greenDark: mat('#5fa61f', { roughness: 0.5 }),
    pot: mat('#b49a8a', { roughness: 0.8 }),
    red: mat('#e8616d', { roughness: 0.35 }),
    paperBlue: mat('#b9d0ef'),
    paper: mat('#fdfbf6'),
    book1: mat('#a7adbd'),
    book2: mat('#f0a43a'),
    book3: mat('#f7c35e'),
    pink: mat('#f28cb0'),
  }

  // invisible planes that only show soft shadows on the cream backdrop
  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.16 })
  const floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), shadowMat)
  floorShadow.rotation.x = -Math.PI / 2
  floorShadow.position.set(0, 0.001, 0)
  floorShadow.receiveShadow = true
  room.add(floorShadow)
  const wallShadow = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.ShadowMaterial({ opacity: 0.1 }))
  wallShadow.position.set(0, 3, -2.05)
  wallShadow.receiveShadow = true
  room.add(wallShadow)

  // ---- rug: stacked rounded layers ----
  const rugLayers = [
    [5.4, 4.2, M.orange, 0.03],
    [4.8, 3.65, M.yellowLight, 0.045],
    [4.1, 3.0, M.orangeLight, 0.06],
    [3.4, 2.4, M.yellow, 0.075],
  ]
  rugLayers.forEach(([w, d, m, y]) => {
    const r = box(w, 0.03, d, m, 0.015)
    r.position.set(0.1, y - 0.015, 0.05)
    r.castShadow = false
    room.add(r)
  })

  // ---- desk ----
  const desk = new THREE.Group()
  desk.position.set(0, 0, -1.25)
  room.add(desk)
  const top = box(2.9, 0.09, 1.05, M.white, 0.04)
  top.position.y = 0.86
  desk.add(top)
  for (const [x, z] of [[-1.3, -0.4], [1.3, -0.4], [-1.3, 0.4], [1.3, 0.4]]) {
    const leg = cyl(0.045, 0.035, 0.82, M.wood, 16)
    leg.position.set(x, 0.41, z)
    leg.rotation.z = x > 0 ? -0.04 : 0.04
    desk.add(leg)
  }

  // ---- monitors ----
  function monitor(x, ry, screen) {
    const g = new THREE.Group()
    g.position.set(x, 0.905, -0.18)
    g.rotation.y = ry
    const frame = box(1.18, 0.74, 0.07, M.dark, 0.05)
    frame.position.y = 0.62
    g.add(frame)
    const s = new THREE.Mesh(
      new THREE.PlaneGeometry(1.08, 0.64),
      new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false }),
    )
    s.position.set(0, 0.62, 0.037)
    g.add(s)
    const neck = box(0.09, 0.32, 0.05, M.darker, 0.02)
    neck.position.set(0, 0.17, -0.02)
    g.add(neck)
    const foot = box(0.42, 0.025, 0.24, M.darker, 0.012)
    foot.position.y = 0.012
    g.add(foot)
    desk.add(g)
    updaters.push(screen.update)
    return g
  }
  monitor(-0.66, 0.2, createDesignScreen())
  monitor(0.64, -0.2, createCodeScreen())

  // keyboard + mouse
  const keyboard = box(0.62, 0.025, 0.2, M.offWhite, 0.012)
  keyboard.position.set(-0.08, 0.92, 0.3)
  keyboard.rotation.y = 0.05
  desk.add(keyboard)
  const mousePad = box(0.32, 0.008, 0.26, M.pink, 0.004)
  mousePad.position.set(0.42, 0.909, 0.32)
  desk.add(mousePad)
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 14), M.offWhite)
  mouse.scale.set(0.8, 0.45, 1.15)
  mouse.position.set(0.42, 0.925, 0.33)
  mouse.castShadow = true
  desk.add(mouse)
  updaters.push((t) => {
    mouse.position.x = 0.42 + Math.sin(t * 1.7) * 0.025 + Math.sin(t * 4.3) * 0.012
    mouse.position.z = 0.33 + Math.cos(t * 2.1) * 0.025
  })

  // pencil cup
  const cup = cyl(0.07, 0.065, 0.16, M.woodLight, 20)
  cup.position.set(-1.2, 0.99, 0.05)
  desk.add(cup)
  ;[M.blue, M.red, M.yellow].forEach((m, i) => {
    const p = cyl(0.012, 0.012, 0.24, m, 8)
    p.position.set(-1.2 + (i - 1) * 0.03, 1.08, 0.05 + (i % 2) * 0.02)
    p.rotation.z = (i - 1) * 0.18
    desk.add(p)
  })

  // mug with a heart
  const mug = cyl(0.06, 0.055, 0.13, M.pink, 20)
  mug.position.set(-1.02, 0.97, 0.3)
  desk.add(mug)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 8, 16), M.pink)
  handle.position.set(-0.955, 0.97, 0.3)
  desk.add(handle)

  // speaker + rubik-ish cube
  const speaker = box(0.24, 0.3, 0.2, M.orangeLight, 0.04)
  speaker.position.set(1.22, 1.06, 0.08)
  speaker.rotation.y = -0.4
  desk.add(speaker)
  const cone = cyl(0.075, 0.075, 0.02, M.darker, 24)
  cone.rotation.x = Math.PI / 2
  cone.position.set(0, 0.02, 0.105)
  speaker.add(cone)
  const cube = new THREE.Group()
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) {
    const c = box(0.042, 0.042, 0.042, (i + j + k) % 2 ? M.blue : M.blueLight, 0.008)
    c.position.set((i - 1) * 0.045, (j - 1) * 0.045, (k - 1) * 0.045)
    cube.add(c)
  }
  cube.position.set(0.98, 0.98, 0.26)
  cube.rotation.y = 0.5
  desk.add(cube)

  // ---- chair ----
  const chair = new THREE.Group()
  chair.position.set(0, 0, -0.3)
  room.add(chair)
  const seat = box(0.62, 0.07, 0.56, M.white, 0.03)
  seat.position.y = 0.5
  chair.add(seat)
  const backRest = box(0.6, 0.62, 0.06, M.white, 0.03)
  backRest.position.set(0, 0.86, 0.3)
  backRest.rotation.x = -0.1
  chair.add(backRest)
  const post = cyl(0.03, 0.03, 0.4, M.metal, 12)
  post.position.y = 0.27
  chair.add(post)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const spoke = box(0.36, 0.035, 0.05, M.metal, 0.015)
    spoke.position.set(Math.cos(a) * 0.17, 0.06, Math.sin(a) * 0.17)
    spoke.rotation.y = -a
    chair.add(spoke)
    const wheel = cyl(0.03, 0.03, 0.03, M.darker, 10)
    wheel.rotation.z = Math.PI / 2
    wheel.position.set(Math.cos(a) * 0.34, 0.03, Math.sin(a) * 0.34)
    chair.add(wheel)
  }

  // ---- wall shelf with books + cactus ----
  const shelf = new THREE.Group()
  shelf.position.set(-1.55, 2.25, -1.85)
  room.add(shelf)
  const board = box(1.0, 0.06, 0.32, M.woodLight, 0.02)
  shelf.add(board)
  ;[[-0.34, 0.42, M.book1], [-0.25, 0.46, M.book2], [-0.15, 0.4, M.book3]].forEach(([x, h, m]) => {
    const b = box(0.08, h, 0.26, m, 0.012)
    b.position.set(x, h / 2 + 0.03, 0)
    shelf.add(b)
  })
  const smallPot = cyl(0.08, 0.06, 0.14, M.white, 20)
  smallPot.position.set(0.12, 0.1, 0)
  shelf.add(smallPot)
  const cactus = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.1, 6, 14), M.green)
  cactus.position.set(0.12, 0.27, 0)
  cactus.castShadow = true
  shelf.add(cactus)
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.05, 6, 10), M.green)
  arm.position.set(0.17, 0.3, 0)
  arm.rotation.z = -0.5
  shelf.add(arm)

  // ---- pinboard ----
  const pin = new THREE.Group()
  pin.position.set(0.55, 2.55, -1.95)
  pin.rotation.y = -0.08
  room.add(pin)
  const pinFrame = box(1.75, 1.15, 0.07, M.frame, 0.06)
  pin.add(pinFrame)
  const corkFace = box(1.58, 0.98, 0.04, M.cork, 0.03)
  corkFace.position.z = 0.03
  pin.add(corkFace)
  ;[[-0.38, 0.12, 0.1, M.paperBlue], [0.35, -0.18, -0.12, M.paper], [0.05, 0.25, 0.05, M.yellowLight]].forEach(([x, y, r, m]) => {
    const note = box(0.38, 0.42, 0.012, m, 0.004)
    note.position.set(x, y, 0.06)
    note.rotation.z = r
    pin.add(note)
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), M.red)
    p.position.set(x - 0.06, y + 0.14, 0.1)
    p.castShadow = true
    pin.add(p)
  })

  // ---- picture frame ----
  const pic = new THREE.Group()
  pic.position.set(2.35, 1.95, -1.6)
  pic.rotation.set(0, -0.35, -0.08)
  room.add(pic)
  pic.add(box(0.95, 0.72, 0.1, M.blue, 0.08))
  const inner = box(0.78, 0.55, 0.04, M.blueLight, 0.04)
  inner.position.z = 0.05
  pic.add(inner)
  const mountain = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.28, 3), M.white)
  mountain.position.set(-0.08, -0.1, 0.08)
  mountain.scale.z = 0.15
  pic.add(mountain)
  const mountain2 = mountain.clone()
  mountain2.position.set(0.15, -0.14, 0.085)
  mountain2.scale.set(0.8, 0.75, 0.15)
  pic.add(mountain2)
  const sun = new THREE.Mesh(new THREE.CircleGeometry(0.08, 24), M.white)
  sun.position.set(0.17, 0.12, 0.075)
  pic.add(sun)

  // ---- floor plant ----
  const plant = new THREE.Group()
  plant.position.set(2.35, 0, 0.55)
  room.add(plant)
  const pot = cyl(0.36, 0.28, 0.6, M.pot, 32)
  pot.position.y = 0.3
  plant.add(pot)
  ;[0.12, 0.3, 0.48].forEach((y) => {
    const band = cyl(0.365 - y * 0.07 + 0.005, 0.365 - y * 0.07 + 0.005, 0.06, M.white, 32)
    band.position.y = y
    plant.add(band)
  })
  const leaves = []
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14), i % 2 ? M.green : M.greenDark)
    leaf.scale.set(0.55, 1.9, 0.18)
    const pivot = new THREE.Group()
    pivot.position.y = 0.6
    pivot.rotation.y = (i / 6) * Math.PI * 2
    leaf.position.y = 0.32
    leaf.castShadow = true
    const tilt = new THREE.Group()
    tilt.rotation.x = 0.35 + (i % 3) * 0.12
    tilt.add(leaf)
    pivot.add(tilt)
    plant.add(pivot)
    leaves.push(tilt)
  }
  updaters.push((t) => {
    leaves.forEach((l, i) => {
      l.rotation.z = Math.sin(t * 1.2 + i) * 0.04
    })
  })

  // ---- floating music notes ----
  const notes = []
  ;[['♪', '#5fc6ef'], ['♫', '#f28cb0'], ['♪', '#f3ad45']].forEach(([s, c], i) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTexture(s, c), transparent: true, depthWrite: false }))
    sprite.scale.setScalar(0.28)
    room.add(sprite)
    notes.push({ sprite, offset: i * 1.3 })
  })
  updaters.push((t) => {
    notes.forEach(({ sprite, offset }) => {
      const k = ((t * 0.35 + offset / 4) % 1)
      sprite.position.set(1.35 + Math.sin(k * 6 + offset) * 0.15 + offset * 0.08, 1.4 + k * 0.9, -1.1)
      sprite.material.opacity = Math.sin(k * Math.PI)
    })
  })

  // Seat position the girl uses (world space, room at rest)
  const seatAnchor = new THREE.Vector3(0, 0, -0.32)

  return {
    room,
    seatAnchor,
    update(time) {
      for (const u of updaters) u(time)
    },
  }
}
