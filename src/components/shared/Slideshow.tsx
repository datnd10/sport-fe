import { useCallback, useEffect, useRef, useState } from 'react'
import './Slideshow.css'

// Simple auto-playing banner slideshow for the Trang chủ (Homepage) hero
// section. Images live as static assets in public/slideshow and are
// referenced by root-relative URL (Vite serves /public as the site root),
// so no import/bundling is needed to add or swap banners.
export type SlideshowImage = {
  src: string
  alt: string
}

const DEFAULT_IMAGES: SlideshowImage[] = [
  { src: '/slideshow/1000z-launch-website-banner_1695177885.webp', alt: 'Khuyến mãi sản phẩm mới' },
  { src: '/slideshow/ynx-eclp-banner_1695178004.webp', alt: 'Yonex Eclipsion' },
  { src: '/slideshow/victor-axelsen_1759089349.webp', alt: 'Victor Axelsen' },
  { src: '/slideshow/grpht-thrttl_1759089897.webp', alt: 'Graphite Throttle' },
  { src: '/slideshow/yonex-astrox-99_1757731351.webp', alt: 'Yonex Astrox 99' },
  { src: '/slideshow/62-1-_1764612898.webp', alt: 'Ưu đãi đặc biệt' },
]

const AUTOPLAY_INTERVAL_MS = 4500

type SlideshowProps = {
  images?: SlideshowImage[]
}

function Slideshow({ images = DEFAULT_IMAGES }: SlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback(
    (index: number) => {
      if (images.length === 0) {
        return
      }
      setActiveIndex(((index % images.length) + images.length) % images.length)
    },
    [images.length],
  )

  const goToNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  const goToPrevious = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  useEffect(() => {
    if (images.length <= 1) {
      return
    }
    timerRef.current = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length)
    }, AUTOPLAY_INTERVAL_MS)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [images.length])

  function restartAutoplay() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (images.length <= 1) {
      return
    }
    timerRef.current = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length)
    }, AUTOPLAY_INTERVAL_MS)
  }

  function handlePrevClick() {
    goToPrevious()
    restartAutoplay()
  }

  function handleNextClick() {
    goToNext()
    restartAutoplay()
  }

  function handleDotClick(index: number) {
    goTo(index)
    restartAutoplay()
  }

  if (images.length === 0) {
    return null
  }

  return (
    <section className="slideshow" aria-label="Banner khuyến mãi" aria-roledescription="carousel">
      <div className="slideshow-viewport">
        {images.map((image, index) => (
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            className={`slideshow-slide ${index === activeIndex ? 'slideshow-slide-active' : ''}`}
            aria-hidden={index !== activeIndex}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ))}
      </div>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            className="slideshow-nav slideshow-nav-prev"
            onClick={handlePrevClick}
            aria-label="Ảnh trước"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="slideshow-nav slideshow-nav-next"
            onClick={handleNextClick}
            aria-label="Ảnh kế tiếp"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="slideshow-dots" role="tablist" aria-label="Chọn banner">
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Banner ${index + 1}`}
                className={`slideshow-dot ${index === activeIndex ? 'slideshow-dot-active' : ''}`}
                onClick={() => handleDotClick(index)}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}

export default Slideshow
