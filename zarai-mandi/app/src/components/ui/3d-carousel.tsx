"use client"

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type WheelEvent,
} from "react"
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion"

import { cn } from "@/lib/utils"

/**
 * 3D ring carousel (adapted from the 21st.dev "3D photo carousel").
 *
 * Cards stand around a tilted ring on a tray: the front card faces the viewer
 * and grows, neighbours turn away and recede, and the back of the ring peeks
 * over the top as solid, opaque card backs (so it reads as a full circle of
 * cards without anything see-through). The
 * original fits every photo onto one cylinder; here the ring has a fixed number
 * of slots and items stream through them, so it scales to hundreds of items.
 * With at least `minLoop` items the ring loops endlessly (fewer than `slots`
 * items close the ring with just those cards); with fewer it is an arc that
 * stops at the first and last item.
 *
 * Every card is placed individually (x = R·sinθ, z = R·(cosθ − 1)) and painted
 * in depth order, so overlapping cards never cut through each other.
 *
 * Controlled: the parent owns `activeIndex`; drags, flicks, taps on side
 * cards, arrow keys and trackpad swipes report through `onActiveIndexChange`.
 */

const SPRING = { type: "spring", stiffness: 170, damping: 26, mass: 1 } as const
const PERSPECTIVE = 640
const DEFAULTS = { radiusFactor: 1.2, tilt: 0.38, frontBoost: 0.14 }
const TRAY_GAP = 10

/**
 * Vertical extent of the ring around its centre, in px, for a given card size
 * and scale: the back row (far away, shrunk by perspective) or the grown front
 * card sets the top; the front card and the tray edge set the bottom.
 */
export function ringExtent(
  cardWidth: number,
  cardHeight: number,
  scale: number,
  opts: { radiusFactor?: number; tilt?: number; frontBoost?: number } = {},
) {
  const { radiusFactor, tilt, frontBoost } = { ...DEFAULTS, ...opts }
  const h = cardHeight * scale
  const radius = cardWidth * scale * radiusFactor
  const lift = radius * tilt
  const backScale = PERSPECTIVE / (PERSPECTIVE + 2 * radius)
  const top = Math.min((-h / 2 - 2 * lift) * backScale, (-h * (1 + frontBoost)) / 2)
  const bottom = (h * (1 + frontBoost)) / 2 + TRAY_GAP
  return { top, bottom, height: bottom - top }
}

/** Largest card scale (≤ maxScale) whose ring fits `height` and keeps the card within `widthFraction` of `width`. */
export function fitRingScale({
  cardWidth,
  cardHeight,
  width,
  height,
  maxScale = 1.3,
  minScale = 0.5,
  widthFraction = 0.52,
  margin = 8,
}: {
  cardWidth: number
  cardHeight: number
  width: number
  height: number
  maxScale?: number
  minScale?: number
  widthFraction?: number
  margin?: number
}) {
  let s = Math.min(maxScale, (width * widthFraction) / cardWidth)
  while (s > minScale && ringExtent(cardWidth, cardHeight, s).height > height - margin * 2) s -= 0.01
  return Math.max(minScale, s)
}

export type ThreeDCarouselProps<T> = {
  items: T[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  renderItem: (item: T, index: number, isActive: boolean) => ReactNode
  /** What a card shows from behind (the back half of the ring). */
  renderBack?: (item: T, index: number) => ReactNode
  getKey: (item: T, index: number) => string
  /** Layout size of one card; every card is drawn at this size times `cardScale`. */
  cardWidth: number
  cardHeight: number
  cardScale?: number
  /** Cards around the full ring. */
  slots?: number
  /** Fewest items that still form a looping ring. */
  minLoop?: number
  /** Ring radius as a multiple of the (scaled) card width. */
  radiusFactor?: number
  /** How far the back of the ring rises (0 = seen side-on). */
  tilt?: number
  /** Draw the tray the ring stands on. */
  tray?: boolean
  /** Gentle idle sway so the ring feels alive. */
  sway?: boolean
  /** Extra scale of the front card (eases in/out with distance from the front). */
  frontBoost?: number
  /** Mirror the order (next card on the left) for right-to-left languages. */
  rtl?: boolean
  className?: string
  ariaLabel?: string
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const mod = (a: number, n: number) => ((a % n) + n) % n

function ThreeDCarouselInner<T>({
  items,
  activeIndex,
  onActiveIndexChange,
  renderItem,
  renderBack,
  getKey,
  cardWidth,
  cardHeight,
  cardScale = 1,
  slots: maxSlots = 12,
  minLoop = 6,
  radiusFactor = DEFAULTS.radiusFactor,
  tilt = DEFAULTS.tilt,
  tray = true,
  sway = true,
  frontBoost = DEFAULTS.frontBoost,
  rtl = false,
  className,
  ariaLabel,
}: ThreeDCarouselProps<T>) {
  const count = items.length
  const loop = count >= minLoop
  const slots = loop ? Math.min(maxSlots, count) : maxSlots
  const last = Math.max(0, count - 1)
  const dir = rtl ? -1 : 1
  const step = 360 / slots
  const w = cardWidth * cardScale
  const h = cardHeight * cardScale
  const radius = w * radiusFactor
  // Dragging this many pixels turns the ring by exactly one card.
  const pxPerStep = Math.max(40, radius * Math.sin((step * Math.PI) / 180))
  const reduceMotion = useReducedMotion()

  const indexOf = useCallback(
    (p: number) => (loop ? mod(Math.round(p), count) : clamp(Math.round(p), 0, last)),
    [loop, count, last],
  )

  // `position` is unbounded when looping: item = position mod count.
  const position = useMotionValue(clamp(activeIndex, 0, last))
  const [center, setCenter] = useState(() => Math.round(position.get()))
  useMotionValueEvent(position, "change", (v) => setCenter(Math.round(v)))

  // Idle sway, in degrees, added to every card's angle.
  const swayDeg = useMotionValue(0)
  useEffect(() => {
    if (!sway || reduceMotion) return
    const controls = animate(swayDeg, [0, 1.4, 0, -1.4, 0], {
      duration: 7,
      ease: "easeInOut",
      repeat: Infinity,
    })
    return () => controls.stop()
  }, [sway, reduceMotion, swayDeg])

  const animRef = useRef<AnimationPlaybackControls | null>(null)
  const targetRef = useRef(position.get())

  const settleTo = useCallback(
    (target: number, velocity = 0) => {
      targetRef.current = target
      animRef.current?.stop()
      if (reduceMotion) {
        position.jump(target)
        return
      }
      animRef.current = animate(position, target, { ...SPRING, velocity })
    },
    [position, reduceMotion],
  )

  // Follow the controlled index (dots, jump list, product switch). Takes the
  // short way round the ring; long jumps start half a turn away so the spin
  // reads as movement without a long wait.
  useEffect(() => {
    if (count === 0) return
    const current = targetRef.current
    if (indexOf(current) === clamp(activeIndex, 0, last)) return
    let target = clamp(activeIndex, 0, last)
    if (loop) {
      let diff = mod(target - Math.round(current), count)
      if (diff > count / 2) diff -= count
      target = Math.round(current) + diff
    }
    const from = position.get()
    const maxSpin = Math.floor(slots / 2)
    if (Math.abs(target - from) > maxSpin) {
      position.jump(target - Math.sign(target - from) * maxSpin)
    }
    settleTo(target)
  }, [activeIndex, count, last, loop, indexOf, position, settleTo, slots])

  const commit = (target: number, velocity = 0) => {
    const t = loop ? target : clamp(target, 0, last)
    settleTo(t, velocity)
    const idx = indexOf(t)
    if (idx !== activeIndex) onActiveIndexChange(idx)
  }

  // Drag: the ring follows the finger, then keeps spinning with the flick.
  const panStart = useRef(0)
  const panned = useRef(false)
  const onPanStart = () => {
    panned.current = true
    animRef.current?.stop()
    panStart.current = position.get()
  }
  const onPan = (_: PointerEvent, info: { offset: { x: number } }) => {
    let next = panStart.current - (dir * info.offset.x) / pxPerStep
    if (!loop) {
      // Rubber-band past the first / last card.
      if (next < 0) next *= 0.25
      if (next > last) next = last + (next - last) * 0.25
    }
    position.set(next)
  }
  const onPanEnd = (_: PointerEvent, info: { velocity: { x: number } }) => {
    const v = (-dir * info.velocity.x) / pxPerStep
    const projected = position.get() + clamp(v * 0.32, -slots, slots)
    commit(Math.round(projected), v)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const s = e.key === "ArrowRight" ? dir : e.key === "ArrowLeft" ? -dir : 0
    if (!s) return
    e.preventDefault()
    commit(Math.round(targetRef.current) + s)
  }

  // Trackpad / mouse-wheel horizontal scrolling (desktop device preview).
  const wheelAcc = useRef(0)
  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
    wheelAcc.current += e.deltaX
    if (Math.abs(wheelAcc.current) < 45) return
    commit(Math.round(targetRef.current) + Math.sign(wheelAcc.current) * dir)
    wheelAcc.current = 0
  }

  // Every slot on the ring, as absolute positions (stable keys while spinning).
  const half = Math.floor(slots / 2)
  const slotsOnRing: number[] = []
  if (count > 0) {
    for (let k = center - half; k < center + half; k++) {
      if (!loop && (k < 0 || k > last)) continue
      slotsOnRing.push(k)
    }
  }

  const frontIndex = indexOf(center)
  const lift = radius * tilt
  // Vertical extent around the stage centre: the back row (far away, so shrunk
  // by perspective) or the grown front card sets the top; the front card and
  // the tray set the bottom. Centre that span in the stage.
  const backScale = PERSPECTIVE / (PERSPECTIVE + 2 * radius)
  const extent = ringExtent(cardWidth, cardHeight, cardScale, { radiusFactor, tilt, frontBoost })
  const frontBottom = (h * (1 + frontBoost)) / 2
  const trayFront = extent.bottom
  const shiftY = -(extent.top + extent.bottom) / 2

  return (
    <motion.div
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      dir="ltr"
      onKeyDown={onKeyDown}
      onWheel={onWheel}
      onPointerDownCapture={() => {
        panned.current = false
      }}
      onPanStart={onPanStart}
      onPan={onPan}
      onPanEnd={onPanEnd}
      className={cn("relative h-full w-full select-none overflow-hidden outline-none", className)}
      style={{
        perspective: PERSPECTIVE,
        // Perspective from the ring's own centre, so ringExtent() is exact.
        perspectiveOrigin: `50% calc(50% + ${shiftY}px)`,
        touchAction: "pan-y",
      }}
    >
      {/* Soft warm light glowing from behind the ring */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2"
        style={{
          top: `calc(50% + ${shiftY - lift * 0.6}px)`,
          width: w * 2.6,
          height: h * 1.5,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(ellipse at center, rgba(255, 241, 196, 0.85) 0%, rgba(255, 248, 225, 0.45) 38%, rgba(255, 255, 255, 0) 70%)",
        }}
      />
      {tray && (
        <RingTray
          radius={radius}
          cardWidth={w}
          back={(h / 2 - 2 * lift) * backScale}
          front={trayFront}
          frontBottom={frontBottom}
          shiftY={shiftY}
        />
      )}

      {slotsOnRing.map((k) => {
        const i = loop ? mod(k, count) : k
        return (
          <RingFace
            key={`${getKey(items[i], i)}@${k}`}
            slot={k}
            position={position}
            swayDeg={swayDeg}
            boost={frontBoost}
            step={step}
            dir={dir}
            radius={radius}
            lift={lift}
            shiftY={shiftY}
            width={cardWidth}
            scale={cardScale}
            isFront={i === frontIndex}
            back={renderBack?.(items[i], i)}
            onClickCapture={(e) => {
              // A drag is not a tap; a tap on a side card turns it to the front.
              if (panned.current) {
                e.preventDefault()
                e.stopPropagation()
                return
              }
              if (Math.round(targetRef.current) !== k) {
                e.preventDefault()
                e.stopPropagation()
                commit(k)
              }
            }}
          >
            {renderItem(items[i], i, i === activeIndex)}
          </RingFace>
        )
      })}
    </motion.div>
  )
}

/**
 * Platform the ring stands on: a disc whose back edge meets the bottoms of the
 * back cards and whose front edge sits just below the front card, only as wide
 * as the ring, with a soft contact shadow under the front card.
 */
function RingTray({
  radius,
  cardWidth,
  back,
  front,
  frontBottom,
  shiftY,
}: {
  radius: number
  cardWidth: number
  /** y of the back cards' bottoms (relative to the ring centre). */
  back: number
  /** y of the tray's front edge. */
  front: number
  frontBottom: number
  shiftY: number
}) {
  // The ring's sides sit ~0.75·R out once perspective shrinks them.
  const rx = radius * 0.8 + cardWidth * 0.06
  const ry = Math.max(12, (front - back) / 2)
  const cy = (front + back) / 2
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2"
      style={{ top: `calc(50% + ${shiftY}px)`, width: 0, height: 0 }}
    >
      {/* Disc: darker at the back, lighter towards the viewer */}
      <div
        className="absolute rounded-[50%]"
        style={{
          left: -rx,
          top: cy - ry,
          width: rx * 2,
          height: ry * 2,
          background: "linear-gradient(180deg, rgba(210, 232, 222, 0.45) 0%, rgba(240, 248, 244, 0.7) 60%, rgba(255, 255, 255, 0.85) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.9)",
          boxShadow: "0 2px 0 rgba(8, 127, 99, 0.08), 0 14px 22px -16px rgba(6, 60, 48, 0.35)",
        }}
      />
      {/* Contact shadow under the front card */}
      <div
        className="absolute rounded-[50%]"
        style={{
          left: -cardWidth * 0.5,
          top: frontBottom - 8,
          width: cardWidth,
          height: 16,
          background: "radial-gradient(ellipse at center, rgba(6, 60, 48, 0.22) 0%, rgba(6, 60, 48, 0) 70%)",
        }}
      />
    </div>
  )
}

const RingFace = memo(function RingFace({
  slot,
  position,
  swayDeg,
  boost,
  step,
  dir,
  radius,
  lift,
  shiftY,
  width,
  scale,
  isFront,
  back,
  onClickCapture,
  children,
}: {
  slot: number
  position: MotionValue<number>
  swayDeg: MotionValue<number>
  boost: number
  step: number
  dir: number
  radius: number
  lift: number
  shiftY: number
  width: number
  scale: number
  isFront: boolean
  back?: ReactNode
  onClickCapture: (e: MouseEvent) => void
  children: ReactNode
}) {
  const place = (p: number, s: number) => {
    const deg = ((slot - p) * step + s) * dir
    const rad = (deg * Math.PI) / 180
    const cos = Math.cos(rad)
    // Front half faces outward; back half turns to face the viewer.
    const face = Math.abs(deg) > 90 ? deg - 180 * Math.sign(deg) : deg
    return {
      x: radius * Math.sin(rad),
      y: -(1 - cos) * lift,
      z: radius * (cos - 1),
      face,
      cos,
    }
  }

  // 1 at the front, easing to 0 one card away: drives the front card's growth,
  // so the emphasis hands over smoothly while sliding.
  const emphasisOf = (p: number) => {
    const d = Math.min(1, Math.abs(slot - p))
    return 0.5 + 0.5 * Math.cos(d * Math.PI)
  }
  const transform = useTransform([position, swayDeg], ([p, s]: number[]) => {
    const { x, y, z, face } = place(p, s)
    const grow = 1 + boost * emphasisOf(p)
    return `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) rotateY(${face}deg) scale(${scale * grow})`
  })
  const zIndex = useTransform([position, swayDeg], ([p, s]: number[]) => 200 + Math.round(place(p, s).cos * 100))
  // Past the side of the ring a card shows its back: an opaque card back
  // (switches while the card is edge-on, so the change is never visible).
  const backShown = useTransform([position, swayDeg], ([p, s]: number[]) => {
    const deg = Math.abs(((slot - p) * step + s) * dir)
    return clamp((deg - 86) / 8, 0, 1)
  })
  // Cards further round the ring sit in slightly deeper shade.
  const filter = useTransform([position, swayDeg], ([p, s]: number[]) => {
    const { cos } = place(p, s)
    return `brightness(${clamp(0.95 + cos * 0.05, 0.9, 1)})`
  })

  return (
    <motion.div
      className="absolute left-1/2"
      aria-hidden={!isFront}
      onClickCapture={onClickCapture}
      style={{ top: `calc(50% + ${shiftY}px)`, width, filter, zIndex, transform }}
    >
      {children}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: backShown, zIndex: 50 }}>
        {back ?? <CardBack />}
      </motion.div>
    </motion.div>
  )
})

/** Opaque back of a card: soft mint with an inset rim and a light leaf mark. */
function CardBack() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        borderRadius: 16,
        background: "linear-gradient(160deg, #F4FAF7 0%, #E6F1EC 100%)",
        border: "1px solid #D3E4DC",
        boxShadow: "inset 0 0 0 6px rgba(255, 255, 255, 0.7)",
      }}
    >
      <svg width="30%" viewBox="0 0 24 24" fill="none" stroke="#B9D6C9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    </div>
  )
}

export const ThreeDCarousel = ThreeDCarouselInner as <T>(
  props: ThreeDCarouselProps<T>,
) => ReturnType<typeof ThreeDCarouselInner>
