import * as React from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

// Split-panel product slider: a photo on the left, the copy on the right, round
// thumbnails riding the seam. Each step the copy lifts out and the next rises in,
// then the next photo slides over the last one while it turns square.

export type SplitSlide = {
  title: string
  description: string
  /** Photo for the left panel. Portrait works best (about 9:10). */
  image: string
  /** Small round thumbnail for the seam. Falls back to the photo. */
  thumb?: string
  alt?: string
  /** Button label. Falls back to `ctaLabel`. */
  cta?: string
  href?: string
}

export type SplitSocial = { label: string; href: string; icon: "facebook" | "instagram" | "youtube" }

export type SplitPhotoSliderProps = {
  slides: SplitSlide[]
  /** Wordmark shown over the photo, top left. */
  brand?: React.ReactNode
  socials?: SplitSocial[]
  /** Small vertical line of text, bottom left. */
  credit?: string
  ctaLabel?: string
  /** Button and line colour. */
  accent?: string
  titleFont?: string
  /** Page scroll per slide, as a fraction of `height`. */
  scrollPerSlide?: number
  /** Scrolling past the last slide comes round to the first, both ways. */
  loop?: boolean
  /** Stage height. Keep it a definite length; percentages collapse once installed. */
  height?: string
  className?: string
  onChange?: (index: number) => void
  onCta?: (slide: SplitSlide, index: number) => void
}

// #region steps
/** Wraps any index into 0..n-1, so stepping past either end loops. */
export function wrap(i: number, n: number): number {
  return n > 0 ? ((i % n) + n) % n : 0
}

/** +1 when the move reads as "next", -1 as "previous": dots take the short way round. */
export function directionFor(from: number, to: number, n: number): 1 | -1 {
  const d = wrap(to - from, n)
  return d === 0 || d <= n / 2 ? 1 : -1
}

/** "01" style counter. */
export function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n)
}

/**
 * Scroll steps in the section. Looping, it runs one step past the last slide,
 * back round to the first, so its bottom shows exactly what its top shows and
 * the scroll can jump from one to the other unseen.
 */
export function spans(n: number, loop: boolean): number {
  return Math.max(0, loop ? n : n - 1)
}

/** The step (0..steps) a scroll progress (0-1) rests nearest. */
export function stepAt(progress: number, steps: number): number {
  return Math.round(Math.min(1, Math.max(0, progress)) * steps)
}

/** Scroll offset inside the section that rests on step `s`. */
export function scrollFor(s: number, steps: number, start: number, end: number): number {
  return steps > 0 ? start + (s / steps) * (end - start) : start
}
// #endregion

// Note: the original component embeds its own display font (base64 woff2) under
// the family name "SPS Playfair". Nyumba Yangu already loads Fraunces site-wide,
// so that embedded font is dropped here and `titleFont` defaults to Fraunces
// instead — same mechanism (a CSS var consumed by .sps-title), just no duplicate
// ~20KB font payload baked into the bundle.
const CSS =
  ".sps-track{position:relative;width:100%;container-type:inline-size}" +
  ".sps-root{position:sticky;top:0;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;" +
  "color:var(--color-foreground);background:color-mix(in oklab,var(--color-background) 76%,var(--sps-accent));font-family:ui-sans-serif,system-ui,sans-serif;outline:none}" +
  ".sps-root:focus-visible{box-shadow:inset 0 0 0 2px var(--sps-accent)}" +
  ".sps-media{position:relative;overflow:hidden;background:color-mix(in oklab,var(--color-foreground) 10%,var(--color-background))}" +
  ".sps-shot{position:absolute;inset:0;overflow:hidden;visibility:hidden}" +
  ".sps-shot[data-on]{visibility:visible;z-index:1}" +
  ".sps-img{position:absolute;inset:0;transform-origin:50% 50%}" +
  ".sps-img>img{display:block;width:100%;height:100%;max-width:none;object-fit:cover;object-position:50% 40%}" +
  ".sps-brand{position:absolute;z-index:3;left:5.5cqw;top:max(18px,3.4cqw);margin:0;font-weight:700;font-size:clamp(13px,1.4cqw,22px);letter-spacing:-.01em;display:flex;align-items:center;gap:.45em;color:#211a15}" +
  ".sps-credit{position:absolute;z-index:3;left:max(16px,2.4cqw);bottom:max(20px,3.4cqw);margin:0;writing-mode:vertical-rl;transform:rotate(180deg);font-size:clamp(9px,.8cqw,13px);letter-spacing:.04em;color:#2c241e}" +
  ".sps-dots{position:absolute;z-index:4;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;gap:clamp(10px,1.45cqw,24px);margin:0;padding:0;list-style:none}" +
  ".sps-dot{display:block;width:clamp(22px,2.4cqw,42px);height:clamp(22px,2.4cqw,42px);padding:0;border:0;border-radius:50%;overflow:hidden;cursor:pointer;background:none;" +
  "box-shadow:0 0 0 0 var(--sps-ring),0 2px 6px rgba(0,0,0,.18);transition:box-shadow .45s ease,transform .45s cubic-bezier(.2,.7,.2,1)}" +
  ".sps-dot>img{display:block;width:100%;height:100%;max-width:none;object-fit:cover}" +
  ".sps-dot:hover{transform:scale(1.08)}" +
  ".sps-dot[aria-current=true]{box-shadow:0 0 0 2px var(--sps-ring),0 2px 8px rgba(0,0,0,.22)}" +
  ".sps-dot:focus-visible{outline:2px solid var(--sps-accent);outline-offset:3px}" +
  ".sps-panel{position:relative;display:flex;align-items:center;padding:0 9cqw 0 11cqw}" +
  ".sps-social{position:absolute;top:max(18px,3.4cqw);right:max(18px,2.4cqw);display:flex;gap:clamp(10px,1cqw,16px);margin:0;padding:0;list-style:none}" +
  ".sps-social a{display:block;color:var(--color-foreground);opacity:.9;transition:opacity .2s}" +
  ".sps-social a:hover{opacity:.55}" +
  ".sps-social svg{display:block;width:clamp(11px,1.2cqw,19px);height:clamp(11px,1.2cqw,19px)}" +
  ".sps-copy{display:grid;width:100%;max-width:30em}" +
  ".sps-block{grid-area:1/1;visibility:hidden}" +
  ".sps-block[data-on]{visibility:visible}" +
  ".sps-count{position:relative;width:2.6em;height:2.5em;font-size:clamp(10px,.95cqw,15px);color:var(--color-foreground);margin-bottom:1.4em}" +
  ".sps-now,.sps-all{position:absolute;line-height:1}" +
  ".sps-now{left:0;top:0}" +
  ".sps-all{right:0;bottom:0}" +
  ".sps-count>i{position:absolute;left:.35em;top:50%;width:2.2em;height:1px;background:var(--sps-accent);transform:rotate(-48deg)}" +
  ".sps-title{margin:0 0 .5em;font-family:var(--sps-font);font-weight:700;font-size:clamp(34px,4.1cqw,74px);line-height:1.05;letter-spacing:-.01em}" +
  ".sps-desc{margin:0 0 2.2em;max-width:25em;font-size:clamp(12px,1.12cqw,18px);line-height:1.6;color:var(--color-muted-foreground)}" +
  ".sps-cta{display:inline-flex;align-items:center;justify-content:center;min-width:13.5em;height:3.5em;padding:0 1.6em;border:0;cursor:pointer;" +
  "font:inherit;font-size:clamp(9px,.82cqw,13px);font-weight:700;letter-spacing:.24em;text-transform:uppercase;text-decoration:none;color:#241b14;background:var(--sps-accent);transition:filter .25s}" +
  ".sps-cta:hover{filter:brightness(1.06) saturate(1.1)}" +
  ".sps-cta:focus-visible{outline:2px solid var(--color-foreground);outline-offset:3px}" +
  ".sps-arrows{position:absolute;right:max(18px,2.6cqw);bottom:max(20px,3.6cqw);display:flex;flex-direction:column;gap:clamp(8px,.9cqw,14px)}" +
  ".sps-arrow{display:block;padding:4px;border:0;background:none;cursor:pointer;color:var(--color-foreground);opacity:.6;transition:opacity .2s,transform .3s}" +
  ".sps-arrow:hover{opacity:1}" +
  ".sps-arrow:first-child:hover{transform:translateY(-3px)}" +
  ".sps-arrow:last-child:hover{transform:translateY(3px)}" +
  ".sps-arrow:focus-visible{outline:2px solid var(--sps-accent);opacity:1}" +
  ".sps-arrow svg{display:block;width:clamp(9px,.85cqw,14px);height:clamp(24px,2.9cqw,44px)}" +
  ".sps-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}" +
  "@container (max-width:640px){" +
  ".sps-root{grid-template-columns:1fr;grid-template-rows:56% 1fr}" +
  ".sps-brand{left:20px;top:18px;font-size:14px}" +
  ".sps-credit{display:none}" +
  ".sps-dots{top:56%;flex-direction:row;gap:12px}" +
  ".sps-dot{width:30px;height:30px}" +
  ".sps-panel{align-items:flex-start;padding:44px 24px 24px}" +
  ".sps-social{top:auto;bottom:24px;right:auto;left:24px}" +
  ".sps-title{font-size:clamp(32px,9cqw,44px)}" +
  ".sps-desc{font-size:13px;margin-bottom:1.6em}" +
  ".sps-cta{font-size:10px}" +
  ".sps-count{font-size:11px;margin-bottom:.8em}" +
  ".sps-arrows{right:18px;bottom:20px;flex-direction:row;gap:18px}" +
  ".sps-arrows svg{width:10px;height:28px}}" +
  "@media (prefers-reduced-motion:reduce){.sps-dot,.sps-arrow,.sps-cta,.sps-social a{transition:none}}"

function Icon({ name }: { name: SplitSocial["icon"] }) {
  if (name === "facebook")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4z" />
      </svg>
    )
  if (name === "instagram")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r=".6" fill="currentColor" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-3.8 31 31 0 0 0-.4-3.8zM10 15V9l5.2 3L10 15z" />
    </svg>
  )
}

function Arrow({ up }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 12 38" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      {up ? <path d="M6 37V1M1.5 5.5 6 1l4.5 4.5" /> : <path d="M6 1v36M1.5 32.5 6 37l4.5-4.5" />}
    </svg>
  )
}

export default function SplitPhotoSlider({
  slides,
  brand,
  socials = [],
  credit,
  ctaLabel = "Order now",
  accent = "#c4a27a",
  titleFont = "'Fraunces', Georgia, serif",
  scrollPerSlide = 0.7,
  loop = true,
  height = "100svh",
  className,
  onChange,
  onCta,
}: SplitPhotoSliderProps) {
  const n = slides.length
  const steps = spans(n, loop)
  const [index, setIndex] = React.useState(0)
  const [reducedMotion, setReducedMotion] = React.useState(false)
  const trackRef = React.useRef(null as HTMLDivElement | null)
  const shots = React.useRef([] as (HTMLDivElement | null)[])
  const blocks = React.useRef([] as (HTMLDivElement | null)[])
  const tl = React.useRef(null as gsap.core.Timeline | null)
  const st = React.useRef(null as ScrollTrigger | null)
  const current = React.useRef(0)
  const reduced = React.useRef(false)
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => {
      reduced.current = mq.matches
      setReducedMotion(mq.matches)
    }
    on()
    mq.addEventListener("change", on)
    return () => {
      mq.removeEventListener("change", on)
      tl.current?.kill()
    }
  }, [])

  const go = React.useCallback(
    (target: number, dir?: 1 | -1) => {
      const from = current.current
      const to = wrap(target, n)
      if (to === from || n < 2) return
      const d = dir ?? directionFor(from, to, n)
      tl.current?.progress(1).kill()
      current.current = to
      setIndex(to)
      onChangeRef.current?.(to)

      const oldShot = shots.current[from]
      const newShot = shots.current[to]
      const oldBlock = blocks.current[from]
      const newBlock = blocks.current[to]
      if (!oldShot || !newShot || !oldBlock || !newBlock) return
      const oldImg = oldShot.firstElementChild
      const newImg = newShot.firstElementChild
      const oldLines = oldBlock.querySelectorAll("[data-sps-l]")
      const newLines = newBlock.querySelectorAll("[data-sps-l]")

      // Both stay visible for the whole move; the attributes React sets after this
      // render decide who is left showing once the timeline lets go.
      gsap.set([oldShot, newShot, oldBlock, newBlock], { visibility: "visible" })
      gsap.set(oldShot, { zIndex: 1 })
      gsap.set(newShot, { zIndex: 2 })
      const done = () => {
        gsap.set([oldShot, newShot, oldBlock, newBlock], { clearProps: "visibility,zIndex" })
        gsap.set([oldShot, oldImg, newShot, newImg], { clearProps: "transform" })
        gsap.set([oldLines, newLines], { clearProps: "transform,opacity" })
      }

      if (reduced.current) {
        const t = gsap.timeline({ onComplete: done })
        t.fromTo(newShot, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "none", clearProps: "opacity" })
        t.fromTo(newLines, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "none" }, 0)
        t.set(oldLines, { opacity: 0 }, 0)
        tl.current = t
        return
      }

      const t = gsap.timeline({ onComplete: done })
      // Copy: the old lines lift out top-first, then the new rise in.
      t.to(oldLines, { y: -38 * d, opacity: 0, duration: 0.42, ease: "power2.in", stagger: 0.045 }, 0)
      t.fromTo(newLines, { y: 46 * d, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.07 }, 0.3)
      // Photo: the next slides over from the top (bottom when going back) turned
      // and a touch large, the last drifts away under it.
      t.fromTo(newShot, { yPercent: -100 * d }, { yPercent: 0, duration: 0.95, ease: "power3.inOut" }, 0.2)
      t.fromTo(oldShot, { yPercent: 0 }, { yPercent: 42 * d, duration: 0.95, ease: "power3.inOut" }, 0.2)
      t.fromTo(newImg, { rotation: -11 * d, scale: 1.34 }, { rotation: 0, scale: 1, duration: 1.35, ease: "power2.out" }, 0.22)
      t.to(oldImg, { rotation: 7 * d, scale: 1.12, duration: 0.95, ease: "power2.in" }, 0.2)
      tl.current = t
    },
    [n],
  )

  // The page scroll steps the slides. Each step past the half-way mark plays the
  // whole transition; letting go snaps the scroll onto the slide.
  React.useEffect(() => {
    const track = trackRef.current
    if (!track || n < 2) return
    const trigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      snap: reducedMotion ? undefined : { snapTo: 1 / steps, duration: { min: 0.3, max: 0.8 }, delay: 0.08, ease: "power2.inOut" },
      onUpdate: (self) => {
        // Looping: the bottom of the section shows what its top shows, so jump there unseen.
        if (loop && self.progress >= 1 && self.direction > 0) {
          self.scroll(self.start + 1)
          return
        }
        const i = wrap(stepAt(self.progress, steps), n)
        if (i !== current.current) go(i, self.direction > 0 ? 1 : -1)
      },
    })
    // At the very top there is no scroll left to fire onUpdate, so a wheel up wraps.
    // trigger.scroll() is the cached scroll position, not a layout read.
    const onWheel = (e: WheelEvent) => {
      if (!loop || e.deltaY >= 0 || Math.abs(trigger.scroll() - trigger.start) > 1) return
      trigger.scroll(trigger.end - 1)
    }
    window.addEventListener("wheel", onWheel, { passive: true })
    const first = wrap(stepAt(trigger.progress, steps), n)
    current.current = first
    setIndex(first)
    st.current = trigger
    return () => {
      window.removeEventListener("wheel", onWheel)
      trigger.kill()
      st.current = null
    }
  }, [n, steps, loop, reducedMotion, go])

  // Arrows, dots and keys play the transition and move the scroll to match.
  const jump = (to: number, dir?: 1 | -1) => {
    const i = wrap(to, n)
    go(i, dir)
    const s = st.current
    if (s && s.isActive) window.scrollTo({ top: scrollFor(i, steps, s.start, s.end), behavior: "instant" })
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") jump(current.current + 1, 1)
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") jump(current.current - 1, -1)
    else return
    e.preventDefault()
  }

  if (n === 0) return null
  const style = { height, "--sps-accent": accent, "--sps-ring": "var(--color-background)", "--sps-font": titleFont } as React.CSSProperties

  return (
    <div ref={trackRef} className="sps-track" style={{ height: "calc(" + height + " * " + (1 + steps * scrollPerSlide) + ")" }}>
      <section
        className={"sps-root" + (className ? " " + className : "")}
        style={style}
        role="region"
        aria-roledescription="carousel"
        aria-label={typeof brand === "string" ? brand : "Product slider"}
        tabIndex={0}
        onKeyDown={onKey}
      >
        <style>{CSS}</style>

        <div className="sps-media">
          {slides.map((s, i) => (
            <div
              key={i}
              className="sps-shot"
              data-on={i === index ? "" : undefined}
              aria-hidden={i !== index}
              ref={(el) => {
                shots.current[i] = el
              }}
            >
              <div className="sps-img">
                <img
                  src={s.image}
                  alt={s.alt ?? s.title}
                  width={800}
                  height={1000}
                  draggable={false}
                  loading={i === index ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>
            </div>
          ))}
          {brand ? <p className="sps-brand">{brand}</p> : null}
          {credit ? <p className="sps-credit">{credit}</p> : null}
        </div>

        <ul className="sps-dots" aria-label="Choose a slide">
          {slides.map((s, i) => (
            <li key={i}>
              <button type="button" className="sps-dot" aria-label={s.title} aria-current={i === index} onClick={() => jump(i)}>
                <img src={s.thumb ?? s.image} alt="" width={42} height={42} draggable={false} />
              </button>
            </li>
          ))}
        </ul>

        <div className="sps-panel">
          {socials.length ? (
            <ul className="sps-social">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} aria-label={s.label}>
                    <Icon name={s.icon} />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="sps-copy" aria-live="polite">
            {slides.map((s, i) => (
              <div
                key={i}
                className="sps-block"
                data-on={i === index ? "" : undefined}
                aria-hidden={i !== index}
                ref={(el) => {
                  blocks.current[i] = el
                }}
              >
                <div className="sps-count" data-sps-l="">
                  <span className="sps-now" aria-hidden="true">
                    {pad2(i + 1)}
                  </span>
                  <i />
                  <span className="sps-all" aria-hidden="true">
                    {pad2(n)}
                  </span>
                  <span className="sps-sr">{"Slide " + (i + 1) + " of " + n}</span>
                </div>
                <h2 className="sps-title" data-sps-l="">
                  {s.title}
                </h2>
                <p className="sps-desc" data-sps-l="">
                  {s.description}
                </p>
                <div data-sps-l="">
                  {s.href ? (
                    <a className="sps-cta" href={s.href} tabIndex={i === index ? 0 : -1} onClick={() => onCta?.(s, i)}>
                      {s.cta ?? ctaLabel}
                    </a>
                  ) : (
                    <button type="button" className="sps-cta" tabIndex={i === index ? 0 : -1} onClick={() => onCta?.(s, i)}>
                      {s.cta ?? ctaLabel}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="sps-arrows">
            <button type="button" className="sps-arrow" aria-label="Previous slide" onClick={() => jump(current.current - 1, -1)}>
              <Arrow up />
            </button>
            <button type="button" className="sps-arrow" aria-label="Next slide" onClick={() => jump(current.current + 1, 1)}>
              <Arrow />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
