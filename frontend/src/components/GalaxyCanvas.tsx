import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from 'react'
import {
  getStarTemperatureColor,
  getStarTwinkleProps,
  hashString,
} from '../utils/starColors'

export interface Wish {
  id: string
  text: string
  category: string
  status: string
  visibility: string
  createdAt: string
  fulfilledAt?: string | null
  fulfillmentNote?: string | null
  reactions: number
  x: number
  y: number
  z: number
  size: number
  brightness: number
  hue: number
}

export interface GalaxyCanvasRef {
  recenterOnWish: (wish: Wish, instant?: boolean) => void
}

interface GalaxyCanvasProps {
  wishes: Wish[]
  selectedWish: Wish | null
  onSelectWish: (wish: Wish | null) => void
}

interface DistantPoint {
  x: number
  y: number
  radius: number
  opacity: number
  h: number
  s: number
  l: number
}

// Generate static deterministic distant atmospheric points for parallax
function generateDistantPoints(count = 60): DistantPoint[] {
  const points: DistantPoint[] = []
  for (let i = 0; i < count; i++) {
    const seed = hashString(`distant-star-${i}`)
    // Coordinate spread from -0.4 to 1.6
    const x = -0.4 + ((seed % 1000) / 1000) * 2.0
    const y = -0.4 + (((seed >>> 10) % 1000) / 1000) * 2.0
    const radius = 2.5 + (((seed >>> 20) % 100) / 100) * 2.5
    const opacity = 0.08 + (((seed >>> 24) % 100) / 100) * 0.10 // 0.08 to 0.18
    const hue = (seed % 360)
    const color = getStarTemperatureColor(hue)
    points.push({ x, y, radius, opacity, ...color })
  }
  return points
}

const DISTANT_POINTS = generateDistantPoints(65)

export const GalaxyCanvas = forwardRef<GalaxyCanvasRef, GalaxyCanvasProps>(
  function GalaxyCanvas({ wishes, selectedWish, onSelectWish }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Camera state: target and current (lerped)
    const cameraRef = useRef({
      targetX: 0,
      targetY: 0,
      targetScale: 1,
      currentX: 0,
      currentY: 0,
      currentScale: 1,
    })

    // Pointer tracking for drag and pinch
    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
    const dragInfoRef = useRef({
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      isDragging: false,
      initialPinchDist: 0,
      initialScale: 1,
    })

    const [hoveredWishId, setHoveredWishId] = useState<string | null>(null)
    const wishesRef = useRef(wishes)
    const selectedWishRef = useRef(selectedWish)
    const hoveredWishIdRef = useRef(hoveredWishId)

    useEffect(() => {
      wishesRef.current = wishes
    }, [wishes])

    useEffect(() => {
      selectedWishRef.current = selectedWish
    }, [selectedWish])

    useEffect(() => {
      hoveredWishIdRef.current = hoveredWishId
    }, [hoveredWishId])

    // Motion preference detection
    const prefersReducedMotionRef = useRef(false)
    useEffect(() => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      prefersReducedMotionRef.current = mediaQuery.matches
      const handler = (e: MediaQueryListEvent) => {
        prefersReducedMotionRef.current = e.matches
      }
      mediaQuery.addEventListener?.('change', handler)
      return () => mediaQuery.removeEventListener?.('change', handler)
    }, [])

    // Recenter camera implementation
    const recenterOnWish = useCallback((wish: Wish, instant = false) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const cam = cameraRef.current

      // Wish world coordinates
      const worldX = wish.x * rect.width
      const worldY = wish.y * rect.height

      // Target to center the star in viewport
      cam.targetX = rect.width / 2 - worldX * cam.targetScale
      cam.targetY = rect.height / 2 - worldY * cam.targetScale

      if (instant || prefersReducedMotionRef.current) {
        cam.currentX = cam.targetX
        cam.currentY = cam.targetY
      }
    }, [])

    useImperativeHandle(ref, () => ({
      recenterOnWish,
    }), [recenterOnWish])

    // Main animation & render loop
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      let animationFrameId: number

      const render = (time: number) => {
        const rect = canvas.getBoundingClientRect()
        const ratio = window.devicePixelRatio || 1

        const targetW = Math.max(1, Math.floor(rect.width * ratio))
        const targetH = Math.max(1, Math.floor(rect.height * ratio))
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW
          canvas.height = targetH
        }

        const cam = cameraRef.current
        const reducedMotion = prefersReducedMotionRef.current

        // Smooth camera lerp
        if (reducedMotion) {
          cam.currentX = cam.targetX
          cam.currentY = cam.targetY
          cam.currentScale = cam.targetScale
        } else {
          cam.currentX += (cam.targetX - cam.currentX) * 0.15
          cam.currentY += (cam.targetY - cam.currentY) * 0.15
          cam.currentScale += (cam.targetScale - cam.currentScale) * 0.15
        }

        // Apply DPR scale so canvas context coords match CSS pixels
        ctx.save()
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
        ctx.clearRect(0, 0, rect.width, rect.height)

        // ----------------------------------------------------
        // Layer 1: Distant Parallax Atmosphere Layer (35% speed)
        // ----------------------------------------------------
        ctx.save()
        ctx.translate(cam.currentX * 0.35, cam.currentY * 0.35)
        const parallaxScale = 1 + (cam.currentScale - 1) * 0.15
        ctx.scale(parallaxScale, parallaxScale)

        for (const pt of DISTANT_POINTS) {
          const px = pt.x * rect.width
          const py = pt.y * rect.height
          const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, pt.radius * 3)
          glowGrad.addColorStop(0, `hsla(${pt.h}, ${pt.s}%, ${pt.l}%, ${pt.opacity})`)
          glowGrad.addColorStop(1, `hsla(${pt.h}, ${pt.s}%, ${pt.l}%, 0)`)
          ctx.fillStyle = glowGrad
          ctx.beginPath()
          ctx.arc(px, py, pt.radius * 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()

        // ----------------------------------------------------
        // Layer 2: Main Starfield (Full Camera Pan & Zoom)
        // ----------------------------------------------------
        ctx.save()
        ctx.translate(cam.currentX, cam.currentY)
        ctx.scale(cam.currentScale, cam.currentScale)

        const currentWishes = wishesRef.current
        const selWish = selectedWishRef.current
        const hovWishId = hoveredWishIdRef.current

        for (const wish of currentWishes) {
          const wx = wish.x * rect.width
          const wy = wish.y * rect.height

          // Core radius scaled strictly 1.5px - 3.0px by wish.size
          const clampedSize = Math.max(0.8, Math.min(2.5, wish.size))
          const coreRadius = 1.5 + (clampedSize - 0.8) * 0.88 // range ~1.5px - 3.0px
          const glowRadius = coreRadius * 3.5

          // Restrained color mapping
          const color = getStarTemperatureColor(wish.hue)

          // Base opacity hierarchy from brightness (0.6 - 1.0)
          const clampedBrightness = Math.max(0.5, Math.min(1.5, wish.brightness))
          const baseOpacity = 0.6 + ((clampedBrightness - 0.5) / 1.0) * 0.4

          // Twinkle animation (skip when reduced motion)
          let twinkleFactor = 0
          if (!reducedMotion) {
            const { phase, period } = getStarTwinkleProps(wish.id)
            twinkleFactor = Math.sin((time / period) * Math.PI * 2 + phase) * 0.12 // +/- 12%
          }
          const alpha = Math.max(0.2, Math.min(1.0, baseOpacity * (1 + twinkleFactor)))

          // 1. Soft radial glow only (not oversized flat blur blob)
          const glow = ctx.createRadialGradient(wx, wy, coreRadius * 0.4, wx, wy, glowRadius)
          glow.addColorStop(0, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${0.6 * alpha})`)
          glow.addColorStop(0.45, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${0.18 * alpha})`)
          glow.addColorStop(1, `hsla(${color.h}, ${color.s}%, ${color.l}%, 0)`)
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(wx, wy, glowRadius, 0, Math.PI * 2)
          ctx.fill()

          // 2. Small solid core
          ctx.fillStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${alpha})`
          ctx.beginPath()
          ctx.arc(wx, wy, coreRadius, 0, Math.PI * 2)
          ctx.fill()

          // 3. Selection ring outline (thin, low-opacity, pulsing slowly per 7.1)
          const isSelected = selWish?.id === wish.id
          const isHovered = hovWishId === wish.id

          if (isSelected) {
            const pulse = reducedMotion
              ? 0.5
              : Math.sin((time / 2400) * Math.PI * 2) * 0.5 + 0.5 // 2.4s period
            const ringRadius = coreRadius + 4.5 + pulse * 2.0
            const ringOpacity = 0.4 + pulse * 0.35 // 0.4 - 0.75
            ctx.strokeStyle = `hsla(${color.h}, ${color.s}%, 94%, ${ringOpacity})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.arc(wx, wy, ringRadius, 0, Math.PI * 2)
            ctx.stroke()
          } else if (isHovered) {
            // Subtle hover indicator ring
            ctx.strokeStyle = `hsla(${color.h}, ${color.s}%, 90%, 0.35)`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.arc(wx, wy, coreRadius + 4, 0, Math.PI * 2)
            ctx.stroke()
          }
        }

        ctx.restore() // Restore main camera transform
        ctx.restore() // Restore DPR transform

        animationFrameId = requestAnimationFrame(render)
      }

      animationFrameId = requestAnimationFrame(render)
      return () => cancelAnimationFrame(animationFrameId)
    }, [])

    // Wheel zoom centered on cursor
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const onWheel = (e: WheelEvent) => {
        e.preventDefault()
        const rect = canvas.getBoundingClientRect()
        const cursorX = e.clientX - rect.left
        const cursorY = e.clientY - rect.top
        const cam = cameraRef.current

        // Zoom factor
        const zoomDelta = e.deltaY < 0 ? 1.15 : 1 / 1.15
        const newScale = Math.max(0.5, Math.min(4.0, cam.targetScale * zoomDelta))

        // World coordinate under cursor before zoom
        const worldX = (cursorX - cam.targetX) / cam.targetScale
        const worldY = (cursorY - cam.targetY) / cam.targetScale

        // Keep world point stationary under cursor
        cam.targetX = cursorX - worldX * newScale
        cam.targetY = cursorY - worldY * newScale
        cam.targetScale = newScale

        if (prefersReducedMotionRef.current) {
          cam.currentX = cam.targetX
          cam.currentY = cam.targetY
          cam.currentScale = cam.targetScale
        }
      }

      canvas.addEventListener('wheel', onWheel, { passive: false })
      return () => canvas.removeEventListener('wheel', onWheel)
    }, [])

    // Hit-test function converting CSS screen coordinates to world coordinates
    const findNearestWishAtScreenPos = (screenX: number, screenY: number): Wish | null => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const cam = cameraRef.current

      // Convert screen click into world space:
      // screenX = worldX * cam.currentScale + cam.currentX
      // worldX = (screenX - cam.currentX) / cam.currentScale
      const worldClickX = (screenX - cam.currentX) / cam.currentScale
      const worldClickY = (screenY - cam.currentY) / cam.currentScale

      let nearest: Wish | null = null
      let minDistance = Number.POSITIVE_INFINITY

      for (const wish of wishesRef.current) {
        const wx = wish.x * rect.width
        const wy = wish.y * rect.height
        const worldDist = Math.hypot(wx - worldClickX, wy - worldClickY)

        // Screen distance = worldDist * cam.currentScale
        // Tolerance in screen pixels: forgiving when zoomed out, tight when zoomed in
        const toleranceScreen = Math.max(22, wish.size * 10)
        const toleranceWorld = toleranceScreen / cam.currentScale

        if (worldDist <= toleranceWorld && worldDist < minDistance) {
          minDistance = worldDist
          nearest = wish
        }
      }

      return nearest
    }

    // Pointer events: drag, pinch-to-zoom, click hit-testing
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Prevent pointer capture issue & text selection
      e.currentTarget.setPointerCapture(e.pointerId)
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      const drag = dragInfoRef.current
      if (activePointersRef.current.size === 1) {
        drag.startX = e.clientX
        drag.startY = e.clientY
        drag.lastX = e.clientX
        drag.lastY = e.clientY
        drag.isDragging = false
      } else if (activePointersRef.current.size === 2) {
        // Pinch start
        const pts = Array.from(activePointersRef.current.values())
        drag.initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
        drag.initialScale = cameraRef.current.targetScale
        drag.lastX = (pts[0].x + pts[1].x) / 2
        drag.lastY = (pts[0].y + pts[1].y) / 2
        drag.isDragging = true
      }
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!activePointersRef.current.has(e.pointerId)) {
        // Hover detection on desktop when not dragging
        const rect = e.currentTarget.getBoundingClientRect()
        const nearest = findNearestWishAtScreenPos(e.clientX - rect.left, e.clientY - rect.top)
        setHoveredWishId(nearest ? nearest.id : null)
        return
      }

      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const drag = dragInfoRef.current
      const cam = cameraRef.current

      if (activePointersRef.current.size === 1) {
        // Single pointer drag pan
        const distFromStart = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY)
        if (distFromStart >= 5) {
          drag.isDragging = true
          setHoveredWishId(null)
        }

        if (drag.isDragging) {
          const dx = e.clientX - drag.lastX
          const dy = e.clientY - drag.lastY
          cam.targetX += dx
          cam.targetY += dy

          if (prefersReducedMotionRef.current) {
            cam.currentX = cam.targetX
            cam.currentY = cam.targetY
          }
        }

        drag.lastX = e.clientX
        drag.lastY = e.clientY
      } else if (activePointersRef.current.size === 2) {
        // Two-pointer pinch zoom & mid-point drag
        const pts = Array.from(activePointersRef.current.values())
        const rect = e.currentTarget.getBoundingClientRect()
        const currentPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
        const currentMidX = (pts[0].x + pts[1].x) / 2 - rect.left
        const currentMidY = (pts[0].y + pts[1].y) / 2 - rect.top

        if (drag.initialPinchDist > 0) {
          const scaleFactor = currentPinchDist / drag.initialPinchDist
          const newScale = Math.max(0.5, Math.min(4.0, drag.initialScale * scaleFactor))

          // Anchor pinch around currentMid
          const worldX = (currentMidX - cam.targetX) / cam.targetScale
          const worldY = (currentMidY - cam.targetY) / cam.targetScale

          cam.targetScale = newScale
          cam.targetX = currentMidX - worldX * newScale
          cam.targetY = currentMidY - worldY * newScale

          if (prefersReducedMotionRef.current) {
            cam.currentX = cam.targetX
            cam.currentY = cam.targetY
            cam.currentScale = cam.targetScale
          }
        }
      }
    }

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const drag = dragInfoRef.current
      const rect = e.currentTarget.getBoundingClientRect()

      if (!drag.isDragging && activePointersRef.current.size === 1) {
        // It was a click, not a pan drag!
        const screenX = e.clientX - rect.left
        const screenY = e.clientY - rect.top
        const nearest = findNearestWishAtScreenPos(screenX, screenY)
        if (nearest) {
          onSelectWish(nearest)
        }
      }

      activePointersRef.current.delete(e.pointerId)
      if (activePointersRef.current.size === 0) {
        drag.isDragging = false
        drag.initialPinchDist = 0
      }
    }

    const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
      activePointersRef.current.delete(e.pointerId)
      if (activePointersRef.current.size === 0) {
        dragInfoRef.current.isDragging = false
        dragInfoRef.current.initialPinchDist = 0
      }
    }

    return (
      <canvas
        ref={canvasRef}
        className="starfield"
        aria-label="Galaxy of wishes canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
    )
  }
)
