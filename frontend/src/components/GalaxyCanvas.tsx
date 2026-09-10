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
  zoomBy: (factor: number) => void
  resetView: () => void
  /** Briefly flare a star — used when a wish arrives or receives light. */
  flareWish: (wishId: string) => void
}

const FLARE_DURATION_MS = 1300

const MIN_ZOOM = 0.5
const MAX_ZOOM = 4.0

interface GalaxyCanvasProps {
  wishes: Wish[]
  selectedWish: Wish | null
  onSelectWish: (wish: Wish | null) => void
  showConstellationLines?: boolean
}

// Connects a set of wishes into a single natural-looking constellation shape:
// a minimum spanning tree over world-space distance, so every star joins the
// pattern with exactly one line to its nearest unvisited neighbor (no messy
// full mesh, no isolated stars).
function buildConstellationEdges(wishes: Wish[]): [Wish, Wish][] {
  if (wishes.length < 2) return []

  const edges: [Wish, Wish][] = []
  const inTree = new Set<number>([0])
  const remaining = new Set<number>(wishes.map((_, i) => i).filter((i) => i !== 0))

  while (remaining.size > 0) {
    let bestFrom = -1
    let bestTo = -1
    let bestDist = Number.POSITIVE_INFINITY

    for (const i of inTree) {
      for (const j of remaining) {
        const dx = wishes[i].x - wishes[j].x
        const dy = wishes[i].y - wishes[j].y
        const dist = dx * dx + dy * dy
        if (dist < bestDist) {
          bestDist = dist
          bestFrom = i
          bestTo = j
        }
      }
    }

    if (bestTo === -1) break
    edges.push([wishes[bestFrom], wishes[bestTo]])
    inTree.add(bestTo)
    remaining.delete(bestTo)
  }

  return edges
}

// Normalises a star's stored depth (z ∈ [0.1, 1.0]) to 0 = farthest, 1 = nearest.
// Every depth-driven visual property below is derived from this single value so
// the layers stay consistent with each other.
function depthOf(wish: Wish): number {
  const z = wish.z ?? 0.3
  return Math.max(0, Math.min(1, (z - 0.1) / 0.9))
}

// How much of a camera pan a layer inherits. Far layers barely move, near ones
// overshoot — the wider this spread, the stronger the sense of volume.
function panFactor(depthT: number): number {
  return 0.45 + depthT * 1.05
}

// Perspective: zooming in expands near layers much faster than far ones, so the
// sky opens up around you instead of scaling like a flat image.
function zoomFactor(depthT: number, cameraScale: number): number {
  return 1 + (cameraScale - 1) * (0.55 + depthT * 0.85)
}

// Fraction of the viewport that must always still show sky. Without this the
// camera pans without limit and the whole starfield can be dragged off-screen
// with no way back short of a reload.
const MIN_VISIBLE_FRACTION = 0.32

// Constrains a camera translation so the starfield can never be panned out of
// reach. Measured at mid-depth, which all layers track closely enough.
function clampPan(value: number, viewportSize: number, cameraScale: number): number {
  const pan = panFactor(0.5)
  const worldSize = viewportSize * zoomFactor(0.5, cameraScale)
  const margin = viewportSize * MIN_VISIBLE_FRACTION
  const min = (margin - worldSize) / pan
  const max = (viewportSize - margin) / pan
  if (min > max) return (min + max) / 2
  return Math.max(min, Math.min(max, value))
}

interface DustPoint {
  x: number
  y: number
  radius: number
  opacity: number
  h: number
  s: number
  l: number
}

interface DustLayer {
  points: DustPoint[]
  depthT: number
}

// Deterministic ambient dust. Several layers at different depths (rather than a
// single flat sheet) are what make the emptiness between wish-stars read as
// space with volume instead of a dark backdrop.
function generateDustLayer(key: string, count: number, depthT: number): DustLayer {
  const points: DustPoint[] = []
  for (let i = 0; i < count; i++) {
    const seed = hashString(`${key}-${i}`)
    // Spread well beyond the viewport so panning never reveals an edge.
    const x = -0.6 + ((seed % 1000) / 1000) * 2.2
    const rawY = -0.6 + (((seed >>> 10) % 1000) / 1000) * 2.2
    // Pull each point partway toward the galactic band so the band reads as a
    // dense drift of faint stars rather than a flat grey gradient, while the
    // rest of the sky still stays populated.
    const bandY = 0.25 + 0.5 * x
    const pull = (((seed >>> 6) % 100) / 100) * 0.55
    const y = rawY + (bandY - rawY) * pull
    // Farther layers are finer and fainter.
    const radius = 0.5 + (((seed >>> 20) % 100) / 100) * (0.5 + depthT * 1.6)
    const opacity = (0.05 + (((seed >>> 24) % 100) / 100) * 0.13) * (0.55 + depthT * 0.75)
    const color = getStarTemperatureColor(seed % 360)
    points.push({ x, y, radius, opacity, ...color })
  }
  return { points, depthT }
}

const DUST_LAYERS: DustLayer[] = [
  generateDustLayer('dust-far', 120, 0.05),
  generateDustLayer('dust-mid', 80, 0.25),
  generateDustLayer('dust-near', 45, 0.45),
]

// A soft diagonal galactic band along y ≈ 0.25 + 0.5x — the same band the
// server biases star placement toward (see starPlacement.ts), so the glow sits
// where the stars actually cluster instead of fighting them.
const BAND_NODES = Array.from({ length: 7 }).map((_, i) => {
  const t = i / 6
  return { x: -0.1 + t * 1.2, y: 0.25 + 0.5 * (-0.1 + t * 1.2) }
})

export const GalaxyCanvas = forwardRef<GalaxyCanvasRef, GalaxyCanvasProps>(
  function GalaxyCanvas({ wishes, selectedWish, onSelectWish, showConstellationLines = false }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const constellationEdgesRef = useRef<[Wish, Wish][]>([])
    // wishId -> flare start time. Entries are removed once they finish.
    const flaresRef = useRef<Map<string, number>>(new Map())

    useEffect(() => {
      constellationEdgesRef.current = showConstellationLines ? buildConstellationEdges(wishes) : []
    }, [wishes, showConstellationLines])

    // Camera state: target and current (lerped)
    const cameraRef = useRef({
      targetX: 0,
      targetY: 0,
      targetScale: 1,
      currentX: 0,
      currentY: 0,
      currentScale: 1,
    })

    // Ambient idle drift: after a few seconds with no input, the camera wanders
    // gently on its own so the sky feels alive rather than static. Any pointer
    // or wheel interaction resets the idle clock immediately.
    // 0 = never interacted; the render loop compares against its own
    // requestAnimationFrame timestamp, which shares performance.now()'s clock,
    // so drift begins IDLE_DRIFT_DELAY_MS after load until the first input.
    const lastInteractionRef = useRef(0)
    const idleDriftRef = useRef({ active: false, anchorX: 0, anchorY: 0, startTime: 0 })
    const IDLE_DRIFT_DELAY_MS = 4000

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
    // Preview of the hovered wish, anchored to the cursor rather than to the
    // star, so it stays put while the camera is still easing into place.
    const [hoverPreview, setHoverPreview] = useState<{
      text: string
      x: number
      y: number
    } | null>(null)
    const wishesRef = useRef(wishes)
    const selectedWishRef = useRef(selectedWish)
    const hoveredWishIdRef = useRef(hoveredWishId)

    // Painter's algorithm: far stars first so near stars overlap them, not the
    // other way round. Sorted once per change rather than every frame.
    useEffect(() => {
      wishesRef.current = [...wishes].sort((a, b) => (a.z ?? 0.3) - (b.z ?? 0.3))
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

      // Star world position (in canvas CSS-pixel space)
      const worldX = wish.x * rect.width
      const worldY = wish.y * rect.height

      // Invert the parallax render formula to find the camera translation that
      // places this star at the viewport centre.
      // Render formula: screenX = cam.X * pan(d) + worldX * zoom(d, camScale)
      // Solving for cam.X: cam.X = (viewport/2 - worldX * zoom) / pan
      const depthT = depthOf(wish)
      const pan = panFactor(depthT)
      const zoom = zoomFactor(depthT, cam.targetScale)
      cam.targetX = (rect.width / 2 - worldX * zoom) / pan
      cam.targetY = (rect.height / 2 - worldY * zoom) / pan

      if (instant || prefersReducedMotionRef.current) {
        cam.currentX = cam.targetX
        cam.currentY = cam.targetY
      }
    }, [])

    // Zoom about the viewport centre, for the on-screen controls and keyboard.
    const zoomBy = useCallback((factor: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const cam = cameraRef.current
      lastInteractionRef.current = performance.now()

      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cam.targetScale * factor))
      const centreX = rect.width / 2
      const centreY = rect.height / 2
      const worldX = (centreX - cam.targetX) / cam.targetScale
      const worldY = (centreY - cam.targetY) / cam.targetScale

      cam.targetScale = newScale
      cam.targetX = centreX - worldX * newScale
      cam.targetY = centreY - worldY * newScale
    }, [])

    // Escape hatch back to the default framing of the whole sky.
    const resetView = useCallback(() => {
      const cam = cameraRef.current
      lastInteractionRef.current = performance.now()
      cam.targetX = 0
      cam.targetY = 0
      cam.targetScale = 1
    }, [])

    const flareWish = useCallback((wishId: string) => {
      flaresRef.current.set(wishId, performance.now())
    }, [])

    useImperativeHandle(ref, () => ({
      recenterOnWish,
      zoomBy,
      resetView,
      flareWish,
    }), [recenterOnWish, zoomBy, resetView, flareWish])

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

        // Ambient idle drift — only while untouched, not dragging/pinching,
        // and no wish is selected (selection already owns the camera target).
        const idle = idleDriftRef.current
        const isIdle =
          !reducedMotion &&
          !dragInfoRef.current.isDragging &&
          !selectedWishRef.current &&
          time - lastInteractionRef.current > IDLE_DRIFT_DELAY_MS

        if (isIdle) {
          if (!idle.active) {
            idle.active = true
            idle.anchorX = cam.targetX
            idle.anchorY = cam.targetY
            idle.startTime = time
          }
          const t = time - idle.startTime
          cam.targetX = idle.anchorX + Math.sin(t / 9000) * 18
          cam.targetY = idle.anchorY + Math.cos(t / 12000) * 12
        } else {
          idle.active = false
        }

        // Keep the sky reachable. Applied here rather than in each input
        // handler so drag, wheel, pinch, keyboard and recenter are all bounded
        // by the same rule.
        cam.targetX = clampPan(cam.targetX, rect.width, cam.targetScale)
        cam.targetY = clampPan(cam.targetY, rect.height, cam.targetScale)

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
        // Layer 0: Galactic band — the deepest layer, so it barely shifts.
        // Drawn in-canvas (not as a CSS background) so it pans with the sky;
        // a viewport-fixed glow reads as a smudge on the screen the moment
        // the user drags.
        // ----------------------------------------------------
        {
          const bandDepth = 0.02
          const pan = panFactor(bandDepth)
          const zoom = zoomFactor(bandDepth, cam.currentScale)
          // Each node is drawn as an ellipse elongated ALONG the band axis and
          // squashed across it, so the nodes fuse into one continuous diagonal
          // band with a visible edge — plain circles just wash the whole frame.
          const bandAngle = Math.atan2(0.5 * rect.height, rect.width)
          const bandRadius = Math.max(rect.width, rect.height) * 0.32 * zoom

          for (const node of BAND_NODES) {
            const nx = cam.currentX * pan + node.x * rect.width * zoom
            const ny = cam.currentY * pan + node.y * rect.height * zoom

            ctx.save()
            ctx.translate(nx, ny)
            ctx.rotate(bandAngle)
            ctx.scale(1, 0.34)
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, bandRadius)
            grad.addColorStop(0, 'rgba(108, 130, 200, 0.075)')
            grad.addColorStop(0.5, 'rgba(80, 98, 158, 0.03)')
            grad.addColorStop(1, 'rgba(62, 76, 130, 0)')
            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.arc(0, 0, bandRadius, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
          }
        }

        // ----------------------------------------------------
        // Layer 1: Ambient dust — three sheets at increasing depth, each
        // inheriting more of the camera pan than the one behind it.
        // ----------------------------------------------------
        for (const layer of DUST_LAYERS) {
          const pan = panFactor(layer.depthT)
          const zoom = zoomFactor(layer.depthT, cam.currentScale)

          for (const pt of layer.points) {
            const px = cam.currentX * pan + pt.x * rect.width * zoom
            const py = cam.currentY * pan + pt.y * rect.height * zoom
            if (px < -40 || px > rect.width + 40 || py < -40 || py > rect.height + 40) continue

            const r = pt.radius * (1 + (zoom - 1) * 0.5)
            const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, r * 3)
            glowGrad.addColorStop(0, `hsla(${pt.h}, ${pt.s}%, ${pt.l}%, ${pt.opacity})`)
            glowGrad.addColorStop(1, `hsla(${pt.h}, ${pt.s}%, ${pt.l}%, 0)`)
            ctx.fillStyle = glowGrad
            ctx.beginPath()
            ctx.arc(px, py, r * 3, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        // ----------------------------------------------------
        // Layer 1.5: Constellation lines — when a single category is in
        // view, its stars are connected into their constellation shape
        // (minimum spanning tree, computed once per wishes change above).
        // ----------------------------------------------------
        if (constellationEdgesRef.current.length > 0) {
          ctx.save()
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)'
          ctx.lineWidth = 1
          for (const [a, b] of constellationEdgesRef.current) {
            const aDepth = depthOf(a)
            const aPan = panFactor(aDepth)
            const aZoom = zoomFactor(aDepth, cam.currentScale)
            const ax = cam.currentX * aPan + a.x * rect.width * aZoom
            const ay = cam.currentY * aPan + a.y * rect.height * aZoom

            const bDepth = depthOf(b)
            const bPan = panFactor(bDepth)
            const bZoom = zoomFactor(bDepth, cam.currentScale)
            const bx = cam.currentX * bPan + b.x * rect.width * bZoom
            const by = cam.currentY * bPan + b.y * rect.height * bZoom

            ctx.beginPath()
            ctx.moveTo(ax, ay)
            ctx.lineTo(bx, by)
            ctx.stroke()
          }
          ctx.restore()
        }

        // ----------------------------------------------------
        // Layer 2: Main Starfield
        // ----------------------------------------------------
        // Depth (z ∈ [0.1, 1.0], normalised to depthT ∈ [0, 1]) is the DOMINANT
        // visual cue — it drives position, size, opacity and focus. The stored
        // per-star `size`/`brightness` are applied only as a narrow ±15% jitter
        // on top: when they were allowed to dominate, a large-but-far star
        // rendered identically to a small-but-near one and the depth signal
        // cancelled out entirely, flattening the sky.
        //
        // Far stars: small, faint, diffuse (mostly halo, no hard core).
        // Near stars: large, bright, crisp core with a tight halo.
        // This mimics atmospheric perspective / depth-of-field, which is what
        // actually sells depth in a static frame — parallax only sells it while
        // the camera is moving.
        //
        // The 5px drag-vs-click threshold (handlePointerMove) fires on raw
        // pointer delta in screen space, before any world or parallax transform,
        // and is therefore unaffected by the parallax model.

        const currentWishes = wishesRef.current
        const selWish = selectedWishRef.current
        const hovWishId = hoveredWishIdRef.current

        for (const wish of currentWishes) {
          const depthT = depthOf(wish)
          const pan = panFactor(depthT)
          const zoom = zoomFactor(depthT, cam.currentScale)

          const wx = cam.currentX * pan + wish.x * rect.width * zoom
          const wy = cam.currentY * pan + wish.y * rect.height * zoom

          // Narrow per-star jitter so stars aren't mechanically uniform, while
          // leaving depth firmly in charge of the hierarchy.
          const clampedSize = Math.max(1.2, Math.min(2.8, wish.size))
          const sizeJitter = 0.85 + ((clampedSize - 1.2) / 1.6) * 0.3

          // Radius: ~1.3px at the back, ~3.4px at the front. The back of the
          // field is deliberately kept above ~1px and well inside the visible
          // range — every star is somebody's wish, so "far" must still mean
          // findable and clickable, not nearly invisible.
          const radiusZoom = 1 + (cam.currentScale - 1) * 0.3 * (0.35 + depthT)
          const coreRadius = (1.3 + depthT * 2.1) * sizeJitter * radiusZoom

          // Far stars carry a proportionally wider, softer halo; near stars a
          // tighter, more defined one.
          const glowRadius = coreRadius * (4.6 - depthT * 1.9)

          const color = getStarTemperatureColor(wish.hue)

          const clampedBrightness = Math.max(0.8, Math.min(1.3, wish.brightness))
          const brightnessJitter = 0.92 + ((clampedBrightness - 0.8) / 0.5) * 0.16
          // Floor at 0.5 so distant stars stay clearly legible against the
          // background; depth still doubles apparent brightness front to back.
          const baseOpacity = (0.5 + depthT * 0.45) * brightnessJitter

          // Twinkle: near/bright stars scintillate more visibly than faint ones.
          let twinkleFactor = 0
          if (!reducedMotion) {
            const { phase, period } = getStarTwinkleProps(wish.id)
            const amplitude = 0.06 + depthT * 0.13
            twinkleFactor = Math.sin((time / period) * Math.PI * 2 + phase) * amplitude
          }
          const alpha = Math.max(0.34, Math.min(1.0, baseOpacity * (1 + twinkleFactor)))

          // 1. Soft radial halo
          const glow = ctx.createRadialGradient(wx, wy, coreRadius * 0.25, wx, wy, glowRadius)
          glow.addColorStop(0, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${0.55 * alpha})`)
          glow.addColorStop(0.4, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${0.16 * alpha})`)
          glow.addColorStop(1, `hsla(${color.h}, ${color.s}%, ${color.l}%, 0)`)
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(wx, wy, glowRadius, 0, Math.PI * 2)
          ctx.fill()

          // 2. Core — firms up with proximity so near stars read as closer,
          // but every star keeps a solid, clickable centre.
          const coreStrength = Math.min(1, 0.62 + depthT * 0.6)
          ctx.fillStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${alpha * coreStrength})`
          ctx.beginPath()
          ctx.arc(wx, wy, coreRadius, 0, Math.PI * 2)
          ctx.fill()

          // 3. Specular pinpoint on the nearest stars only — the detail that
          // makes the front layer read as genuinely closer to the viewer.
          if (depthT > 0.6) {
            const hotspot = (depthT - 0.6) / 0.4
            ctx.fillStyle = `hsla(${color.h}, ${Math.round(color.s * 0.4)}%, 98%, ${alpha * hotspot * 0.85})`
            ctx.beginPath()
            ctx.arc(wx, wy, coreRadius * 0.4, 0, Math.PI * 2)
            ctx.fill()
          }

          // 4. Arrival / light flare — an expanding ring plus a brightness
          // lift, so a wish landing in the sky or receiving light is visible
          // on the canvas itself rather than only in the UI around it.
          const flareStart = flaresRef.current.get(wish.id)
          if (flareStart !== undefined) {
            const flareT = (time - flareStart) / FLARE_DURATION_MS
            if (flareT >= 1) {
              flaresRef.current.delete(wish.id)
            } else if (!reducedMotion) {
              const ease = 1 - Math.pow(1 - flareT, 3)
              const ringRadius = coreRadius + ease * 34
              const fade = 1 - flareT

              ctx.strokeStyle = `hsla(${color.h}, ${color.s}%, 96%, ${fade * 0.55})`
              ctx.lineWidth = 1.5
              ctx.beginPath()
              ctx.arc(wx, wy, ringRadius, 0, Math.PI * 2)
              ctx.stroke()

              const burst = ctx.createRadialGradient(wx, wy, 0, wx, wy, coreRadius * 6)
              burst.addColorStop(0, `hsla(${color.h}, ${color.s}%, 97%, ${fade * 0.5})`)
              burst.addColorStop(1, `hsla(${color.h}, ${color.s}%, 97%, 0)`)
              ctx.fillStyle = burst
              ctx.beginPath()
              ctx.arc(wx, wy, coreRadius * 6, 0, Math.PI * 2)
              ctx.fill()
            }
          }

          // 5. Selection ring outline (thin, low-opacity, pulsing slowly per 7.1)
          const isSelected = selWish?.id === wish.id
          const isHovered = hovWishId === wish.id

          if (isSelected) {
            const pulse = reducedMotion
              ? 0.5
              : Math.sin((time / 2400) * Math.PI * 2) * 0.5 + 0.5
            const ringRadius = coreRadius + 4.5 + pulse * 2.0
            const ringOpacity = 0.4 + pulse * 0.35
            ctx.strokeStyle = `hsla(${color.h}, ${color.s}%, 94%, ${ringOpacity})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.arc(wx, wy, ringRadius, 0, Math.PI * 2)
            ctx.stroke()
          } else if (isHovered) {
            // Clear, deliberate hover target — the previous 0.35-alpha hairline
            // was hard to notice while scanning the sky.
            ctx.strokeStyle = `hsla(${color.h}, ${color.s}%, 96%, 0.8)`
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.arc(wx, wy, coreRadius + 5, 0, Math.PI * 2)
            ctx.stroke()
          }
        }

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
        lastInteractionRef.current = performance.now()
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

    // Hit-test function: computes each star's actual screen position using its
    // per-star p(z) parallax factor (matching the render loop exactly), then
    // measures distance in screen pixels. This correctly handles stars at
    // different depths having different screen positions during a pan.
    //
    // NOTE: this function is called only on pointer-up (click) and hover, which
    // is strictly downstream of the 5px drag-vs-click threshold check — that
    // check fires on raw pointer delta before any transform.
    const findNearestWishAtScreenPos = (screenX: number, screenY: number): Wish | null => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const cam = cameraRef.current

      let nearest: Wish | null = null
      let minDistance = Number.POSITIVE_INFINITY

      // wishesRef is depth-sorted far → near, and `<=` lets a nearer star win a
      // tie, so clicking overlapping stars picks the one drawn on top.
      for (const wish of wishesRef.current) {
        const depthT = depthOf(wish)
        const pan = panFactor(depthT)
        const zoom = zoomFactor(depthT, cam.currentScale)
        // Star screen position (mirrors the render loop exactly)
        const wx = cam.currentX * pan + wish.x * rect.width * zoom
        const wy = cam.currentY * pan + wish.y * rect.height * zoom

        const screenDist = Math.hypot(wx - screenX, wy - screenY)

        // Tolerance tracks the rendered size: near stars are visibly larger and
        // so get a correspondingly larger tap target.
        const toleranceScreen = 18 + depthT * 14

        if (screenDist <= toleranceScreen && screenDist <= minDistance) {
          minDistance = screenDist
          nearest = wish
        }
      }

      return nearest
    }

    // Pointer events: drag, pinch-to-zoom, click hit-testing
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      lastInteractionRef.current = performance.now()
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
        const localX = e.clientX - rect.left
        const localY = e.clientY - rect.top
        const nearest = findNearestWishAtScreenPos(localX, localY)
        setHoveredWishId(nearest ? nearest.id : null)
        setHoverPreview(
          nearest ? { text: nearest.text, x: localX, y: localY } : null
        )
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
          setHoverPreview(null)
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

    // Keyboard navigation, so the sky is usable without a mouse wheel or
    // trackpad gestures (and discoverable for anyone who never tries dragging).
    const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
      const cam = cameraRef.current
      const step = e.shiftKey ? 160 : 60
      let handled = true

      switch (e.key) {
        case 'ArrowLeft': cam.targetX += step; break
        case 'ArrowRight': cam.targetX -= step; break
        case 'ArrowUp': cam.targetY += step; break
        case 'ArrowDown': cam.targetY -= step; break
        case '+':
        case '=': zoomBy(1.25); break
        case '-':
        case '_': zoomBy(1 / 1.25); break
        case '0': resetView(); break
        default: handled = false
      }

      if (handled) {
        e.preventDefault()
        lastInteractionRef.current = performance.now()
      }
    }

    return (
      <>
        <canvas
          ref={canvasRef}
          className="starfield"
          aria-label="Galaxy of wishes canvas — drag to pan, scroll to zoom, arrow keys to move"
          tabIndex={0}
          style={hoveredWishId ? { cursor: 'pointer' } : undefined}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={() => {
            setHoveredWishId(null)
            setHoverPreview(null)
          }}
          onKeyDown={handleKeyDown}
        />
        {hoverPreview && (
          <div
            className="star-hover-preview"
            style={{ left: hoverPreview.x, top: hoverPreview.y }}
            aria-hidden="true"
          >
            {hoverPreview.text.length > 90
              ? `${hoverPreview.text.slice(0, 90)}…`
              : hoverPreview.text}
          </div>
        )}
      </>
    )
  }
)
