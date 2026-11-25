import { useEffect, useRef } from 'react'
import './App.css'

function StudioScene() {
  return (
    <div className="studio-scene" role="img" aria-label="A cozy 3D-inspired creative workspace">
      <div className="pinboard">
        <span className="note note-one"><i /></span>
        <span className="note note-two"><i /></span>
      </div>
      <div className="wall-shelf">
        <span className="book book-one" />
        <span className="book book-two" />
        <span className="shelf-plant"><i /><i /><i /></span>
      </div>
      <div className="picture-frame"><span /><i /></div>
      <div className="rug rug-back" />
      <div className="rug rug-middle" />
      <div className="rug rug-front" />
      <div className="desk">
        <span className="desk-top" />
        <span className="desk-leg leg-left" />
        <span className="desk-leg leg-right" />
      </div>
      <div className="monitor monitor-left">
        <div className="screen">
          <span className="screen-sidebar" />
          <i /><i /><i /><i /><i />
        </div>
        <span className="monitor-neck" />
        <span className="monitor-foot" />
      </div>
      <div className="monitor monitor-right">
        <div className="screen code-screen">
          <i /><i /><i /><i /><i /><i /><i />
        </div>
        <span className="monitor-neck" />
        <span className="monitor-foot" />
      </div>
      <div className="desk-cup"><i /><i /><i /></div>
      <div className="chair">
        <span className="chair-back" />
        <span className="chair-seat" />
        <span className="chair-post" />
        <span className="chair-base" />
      </div>
      <div className="designer">
        <span className="designer-hair" />
        <span className="designer-head" />
        <span className="designer-body" />
        <span className="designer-arm" />
        <span className="designer-leg" />
      </div>
      <div className="floor-plant">
        <span className="leaf leaf-one" />
        <span className="leaf leaf-two" />
        <span className="leaf leaf-three" />
        <span className="leaf leaf-four" />
        <span className="plant-pot" />
      </div>
      <span className="music-note note-a">♪</span>
      <span className="music-note note-b">♫</span>
    </div>
  )
}

function Avatar() {
  return (
    <div className="avatar" aria-hidden="true">
      <div className="avatar-head">
        <span className="avatar-hair" />
        <span className="avatar-face">
          <i className="avatar-eye eye-left" />
          <i className="avatar-eye eye-right" />
          <i className="avatar-smile" />
        </span>
        <span className="avatar-ear ear-left" />
        <span className="avatar-ear ear-right" />
      </div>
      <div className="avatar-neck" />
      <div className="avatar-body">
        <span className="avatar-sleeve sleeve-left" />
        <span className="avatar-sleeve sleeve-right" />
      </div>
      <span className="avatar-arm arm-left" />
      <span className="avatar-arm arm-right" />
      <span className="avatar-leg leg-left" />
      <span className="avatar-leg leg-right" />
      <span className="avatar-shoe shoe-left" />
      <span className="avatar-shoe shoe-right" />
    </div>
  )
}

function App() {
  const storyRef = useRef(null)

  useEffect(() => {
    const story = storyRef.current
    if (!story) return undefined

    let animationFrame = 0
    const updateProgress = () => {
      animationFrame = 0
      const maxScroll = story.offsetHeight - window.innerHeight
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const progress = reducedMotion
        ? 1
        : Math.max(0, Math.min(1, -story.getBoundingClientRect().top / maxScroll))
      const heroProgress = reducedMotion
        ? 0
        : Math.max(0, Math.min(1, window.scrollY / window.innerHeight))

      story.style.setProperty('--story-progress', `${progress}`)
      story.style.setProperty('--star-opacity', `${0.55 + progress * 0.45}`)
      story.style.setProperty('--platform-opacity', `${0.4 + progress * 0.6}`)
      story.style.setProperty('--avatar-lift', `${(1 - progress) * 55}px`)
      story.style.setProperty('--avatar-rotation', `${(1 - progress) * -18}deg`)
      story.style.setProperty('--avatar-scale', `${0.82 + progress * 0.18}`)
      story.style.setProperty('--avatar-opacity', `${0.55 + progress * 0.45}`)
      story.style.setProperty('--label-lift', `${(1 - progress) * 24}px`)
      story.style.setProperty('--label-opacity', `${Math.min(1, progress * 2 + 0.2)}`)
      story.previousElementSibling?.style.setProperty('--hero-scene-shift', `${-heroProgress * 65}px`)
      story.previousElementSibling?.style.setProperty('--hero-scene-scale', `${1 - heroProgress * 0.08}`)
      story.previousElementSibling?.style.setProperty('--hero-intro-shift', `${-heroProgress * 80}px`)
      story.previousElementSibling?.style.setProperty('--hero-intro-opacity', `${Math.max(0, 1 - heroProgress * 1.25)}`)
    }

    const requestUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateProgress)
    }

    updateProgress()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <main className="portfolio-page">
      <header className="site-header">
        <a className="brand-mark" href="#top" aria-label="Shaeirra Jimenez home">SJ.</a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#about">ABOUT</a>
          <a href="#projects">PROJECTS</a>
          <a href="#contact">CONTACT</a>
        </nav>
        <a className="contact-button" href="#contact">GET IN TOUCH <span aria-hidden="true">↗</span></a>
      </header>

      <section className="portfolio-hero" id="top">
        <div className="hero-content" aria-labelledby="hero-title">
          <div className="intro">
            <p className="eyebrow"><span /> CREATIVE DEVELOPER <span className="eyebrow-year">— 2026</span></p>
            <h1 id="hero-title">Shaeirra<br />Jimenez</h1>
            <p className="role-sticker">WEB DEVELOPER</p>
            <p className="intro-note">I bring playful ideas to life<br />through thoughtful digital experiences.</p>
          </div>
          <div className="scene-wrap">
            <StudioScene />
          </div>
        </div>
        <div className="hero-footer" aria-hidden="true">
          <span>DESIGN · CODE · CREATE</span>
          <span className="scroll-cue"><i /> SCROLL TO EXPLORE</span>
          <span>BASED IN THE PHILIPPINES</span>
        </div>
      </section>

      <section className="scroll-story" id="about" ref={storyRef} aria-labelledby="story-title">
        <div className="story-stage">
          <div className="story-stars" aria-hidden="true" />
          <div className="story-grid" aria-hidden="true" />
          <div className="location-card">
            <h2 id="story-title">Shaeirra</h2>
            <p><span aria-hidden="true">⌖</span> Philippines</p>
          </div>
          <div className="avatar-platform" aria-hidden="true">
            <span className="platform-glow" />
            <span className="platform-ring ring-one" />
            <span className="platform-ring ring-two" />
            <span className="platform-top" />
          </div>
          <Avatar />
          <p className="story-cue" aria-hidden="true">KEEP SCROLLING <span>↓</span></p>
        </div>
      </section>
    </main>
  )
}

export default App
