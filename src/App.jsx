import { useEffect, useRef, useState } from 'react'
import './App.css'

const NAME_FIRST = 'Shaeirra'
const NAME_LAST = 'Jimenez'
const LOCATION = 'Philippines'

const clamp01 = (x) => Math.min(1, Math.max(0, x))

// Preview mode: ?p=0.5 freezes the story at that point (used for screenshots; scrolling is ignored).
const PREVIEW_P = (() => {
  const v = parseFloat(new URLSearchParams(window.location.search).get('p'))
  return Number.isNaN(v) ? null : clamp01(v)
})()
const range = (p, [a, b]) => clamp01((p - a) / (b - a))

// The HTML overlay follows the same smoothed progress as the 3D scene (called every frame).
function applyProgress(p, T, ui, counter, lastPhase, setPhase) {
  if (!ui) return
  const hero = 1 - range(p, T.heroFade)
  const rise = range(p, T.roomRise)
  const stage = range(p, T.stage)
  const name = range(p, T.nameCard)
  const scan = range(p, T.scan)
  ui.style.setProperty('--hero', hero.toFixed(3))
  ui.style.setProperty('--rise', (rise * rise * (3 - 2 * rise)).toFixed(4))
  ui.style.setProperty('--stage', stage.toFixed(3))
  ui.style.setProperty('--name', name.toFixed(3))
  ui.style.setProperty('--scan', scan.toFixed(3))
  ui.style.setProperty('--bio', clamp01((scan - 0.45) / 0.12).toFixed(3))
  ui.style.setProperty('--skills', clamp01((scan - 0.85) / 0.12).toFixed(3))
  if (counter) counter.textContent = String(Math.round(scan * 100)).padStart(3, '0')
  const next = stage > 0.5 ? 'stage' : 'hero'
  if (next !== lastPhase.current) {
    lastPhase.current = next
    setPhase(next)
  }
}

function Loader({ value, done }) {
  return (
    <div className={`loader ${done ? 'is-done' : ''}`} aria-live="polite" aria-busy={!done}>
      <div className="loader-inner">
        <div className="loader-cube" aria-hidden="true">
          <span /><span /><span />
        </div>
        <p className="loader-name">{NAME_FIRST} {NAME_LAST}</p>
        <div className="loader-bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${value / 100})` }} />
        </div>
        <p className="loader-count">{String(Math.round(value)).padStart(3, '0')}%</p>
        <p className="loader-hint">building the studio…</p>
      </div>
    </div>
  )
}

export default function App() {
  const canvasRef = useRef(null)
  const storyRef = useRef(null)
  const uiRef = useRef(null)
  const counterRef = useRef(null)
  const sceneRef = useRef(null)
  const [loadTarget, setLoadTarget] = useState(5)
  const [loadShown, setLoadShown] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [phase, setPhase] = useState('hero')
  const lastPhase = useRef('hero')

  // ----- load the 3D scene (real loading steps drive the loader) -----
  useEffect(() => {
    let cancelled = false
    let api = null
    ;(async () => {
      const fontsReady = document.fonts?.ready ?? Promise.resolve()
      const mod = await import('./scene/createScene.js')
      if (cancelled) return
      setLoadTarget(45)
      await fontsReady
      if (cancelled) return
      setLoadTarget(70)
      await new Promise((r) => requestAnimationFrame(r))
      api = mod.createScene(canvasRef.current, {
        onFrame: (p) => applyProgress(p, mod.TIMELINE, uiRef.current, counterRef.current, lastPhase, setPhase),
      })
      sceneRef.current = api
      if (cancelled) return api.dispose()
      setLoadTarget(100)
    })()
    return () => {
      cancelled = true
      api?.dispose()
    }
  }, [])

  // ease the loader number toward the real progress
  useEffect(() => {
    if (loadShown >= 100) {
      const t = setTimeout(() => {
        setLoaded(true)
        sceneRef.current?.start()
      }, 350)
      return () => clearTimeout(t)
    }
    const id = setTimeout(() => {
      setLoadShown((v) => Math.min(loadTarget, v + Math.max(1, (loadTarget - v) * 0.12)))
    }, 28)
    return () => clearTimeout(id)
  }, [loadShown, loadTarget])

  // lock scrolling until loaded
  useEffect(() => {
    document.documentElement.classList.toggle('is-loading', !loaded)
    if (!loaded) return
    if (PREVIEW_P !== null) sceneRef.current?.jumpTo(PREVIEW_P)
    else window.scrollTo(0, 0)
  }, [loaded])

  // ----- scroll → scene progress -----
  useEffect(() => {
    if (PREVIEW_P !== null) return undefined
    const onScroll = () => {
      const story = storyRef.current
      if (!story || !sceneRef.current) return
      const max = story.offsetHeight - window.innerHeight
      sceneRef.current.setProgress(clamp01(window.scrollY / max))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [loaded])

  function scrollToStory(p) {
    const story = storyRef.current
    if (!story) return
    const max = story.offsetHeight - window.innerHeight
    window.scrollTo({ top: p * max, behavior: 'smooth' })
  }

  const go = (e, where) => {
    e.preventDefault()
    if (where === 'top') return scrollToStory(0)
    if (where === 'about') return scrollToStory(1)
    document.getElementById(where)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Loader value={loadShown} done={loaded} />

      <div className={`experience phase-${phase} ${loaded ? 'is-loaded' : ''}`} ref={uiRef}>
        {/* backgrounds */}
        <div className="bg-night" aria-hidden="true" />
        <div className="bg-studio" aria-hidden="true" />

        <canvas className="webgl" ref={canvasRef} aria-label="3D scene of Shaeirra working at her desk" />

        <header className="site-header">
          <a className="brand-mark" href="#top" onClick={(e) => go(e, 'top')} aria-label={`${NAME_FIRST} ${NAME_LAST} home`}>
            <span>SJ</span>
          </a>
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#about" className={phase === 'stage' ? 'active' : ''} onClick={(e) => go(e, 'about')}>ABOUT</a>
            <a href="#projects" onClick={(e) => go(e, 'projects')}>PROJECTS</a>
            <a href="#contact" onClick={(e) => go(e, 'contact')}>CONTACT</a>
          </nav>
          <a className="contact-button" href="#contact" onClick={(e) => go(e, 'contact')}>GET IN TOUCH</a>
        </header>

        {/* hero copy */}
        <div className="hero-copy">
          <h1>
            <span>{NAME_FIRST}</span>
            <span>{NAME_LAST}</span>
          </h1>
          <p className="role-sticker">WEB DEVELOPER</p>
        </div>

        <p className="scroll-hint" aria-hidden="true">
          <span className="mouse"><i /></span> scroll
        </p>

        {/* hologram cards */}
        <div className="holo-ui" aria-live="polite">
          <div className="holo-card card-name">
            <h2>{NAME_FIRST}</h2>
            <p>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></svg>
              {LOCATION}
            </p>
            <span className="leader" aria-hidden="true" />
          </div>
          <div className="holo-card card-bio">
            <p>Builds playful, interactive web experiences that are fast, friendly, and fun to use.</p>
            <span className="leader" aria-hidden="true" />
          </div>
          <div className="holo-card card-skills">
            <h3>Skills</h3>
            <ul>
              <li>React &amp; JavaScript</li>
              <li>Three.js &amp; WebGL</li>
              <li>HTML, CSS &amp; Animation</li>
              <li>UI / UX Design</li>
              <li>Responsive Websites</li>
            </ul>
            <span className="leader" aria-hidden="true" />
          </div>
          <div className="scan-counter" ref={counterRef} aria-hidden="true">000</div>
        </div>
      </div>

      {/* scroll space that drives the 3D timeline */}
      <div className="story" ref={storyRef} id="top">
        <span id="about" className="story-anchor" />
      </div>

      <section className="page-section projects" id="projects">
        <h2>Projects</h2>
        <p className="section-lead">A few things I&apos;ve built. More coming soon.</p>
        <div className="project-grid">
          {['Project One', 'Project Two', 'Project Three'].map((t, i) => (
            <article className="project-card" key={t}>
              <div className={`project-thumb thumb-${i}`} />
              <h3>{t}</h3>
              <p>Short description of the project, the problem it solves, and the tools used.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section contact" id="contact">
        <h2>Let&apos;s build something together</h2>
        <p className="section-lead">Have an idea, a project, or just want to say hi?</p>
        <a className="contact-button big" href="mailto:hello@example.com">SAY HELLO</a>
        <footer>© {new Date().getFullYear()} {NAME_FIRST} {NAME_LAST} · {LOCATION}</footer>
      </section>
    </>
  )
}
