"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"


/**
 * Radial picker: over a blurred screen, options burst out of a centre button
 * onto a circle (inspired by the 21st.dev "circle menu"). Opening staggers the
 * options out; closing folds them back while the centre spins. Long lists are
 * split into pages of `perPage` that turn in like a dial (‹ › or swipe).
 *
 * Every option carries `data-jump-index`, so a press-and-slide gesture that
 * started elsewhere (e.g. on the button that opened it) can hit-test options.
 */

export type RadialOption = {
  key: string
  /** Value reported to onSelect (and put on data-jump-index). */
  index: number
  label: string
  icon: ReactNode
  active?: boolean
  muted?: boolean
}

const ITEM = 54

export function RadialMenu({
  open,
  onClose,
  options,
  onSelect,
  hoverIndex = null,
  title,
  subtitle,
  header,
  container,
  perPage = 10,
  rtl = false,
  labels,
  formatNumber = String,
}: {
  open: boolean
  onClose: () => void
  options: RadialOption[]
  onSelect: (index: number) => void
  /** Option under a press-and-slide gesture. */
  hoverIndex?: number | null
  title?: ReactNode
  subtitle?: ReactNode
  /** Extra controls above the circle (e.g. product chips). */
  header?: ReactNode
  /** Element to cover (defaults to document.body). */
  container?: Element | null
  perPage?: number
  rtl?: boolean
  labels: { close: string; previous: string; next: string }
  formatNumber?: (n: number) => string
}) {
  const reduceMotion = useReducedMotion()
  const pages = Math.max(1, Math.ceil(options.length / perPage))
  const activePage = Math.max(0, Math.floor(Math.max(0, options.findIndex((o) => o.active)) / perPage))
  const [page, setPage] = useState(activePage)
  const [turn, setTurn] = useState(1)

  // Open on the page holding the current option; reset when the list changes.
  const optionsKey = options.map((o) => o.key).join("|")
  useEffect(() => {
    if (open) setPage(activePage)
  }, [open, optionsKey])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const goPage = (d: 1 | -1) => {
    const next = Math.min(pages - 1, Math.max(0, page + d))
    if (next === page) return
    setTurn(d)
    setPage(next)
  }

  const pageOptions = useMemo(
    () => options.slice(page * perPage, page * perPage + perPage),
    [options, page, perPage],
  )

  const size = typeof window !== "undefined" ? Math.min(window.innerWidth * 0.88, 360) : 340
  const n = pageOptions.length
  // Few options sit closer in.
  const radius = (size / 2) * (n <= 4 ? 0.62 : 0.78)

  const target = container ?? (typeof document !== "undefined" ? document.body : null)
  if (!target) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="radial-overlay"
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ zIndex: 500, position: target === document.body ? "fixed" : "absolute" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: reduceMotion ? 0 : 0.18, duration: 0.2 } }}
          transition={{ duration: 0.18 }}
        >
          {/* Blurred screen */}
          <div
            className="absolute inset-0"
            onClick={onClose}
            style={{
              background: "rgba(236, 245, 240, 0.72)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          />

          <div className="relative flex flex-col items-center" style={{ gap: 10 }}>
            {title && <div className="text-center">{title}</div>}
            {subtitle && <div className="text-center">{subtitle}</div>}
            {header}

            {/* The circle */}
            <motion.div
              className="relative"
              style={{ width: size, height: size, touchAction: "pan-y" }}
              onPanEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 50) goPage((info.offset.x < 0) !== rtl ? 1 : -1)
              }}
            >
              {/* Guide ring */}
              <div
                aria-hidden
                className="absolute rounded-full"
                style={{
                  inset: size / 2 - radius,
                  border: "1.5px dashed rgba(8, 127, 99, 0.18)",
                }}
              />

              <AnimatePresence mode="popLayout" initial={true} custom={turn}>
                <motion.div
                  key={`page-${page}-${optionsKey}`}
                  className="absolute inset-0"
                  custom={turn}
                  variants={{
                    enter: (d: number) => ({ rotate: reduceMotion ? 0 : d * 35 * (rtl ? -1 : 1), opacity: 0 }),
                    center: { rotate: 0, opacity: 1 },
                    exit: (d: number) => ({ rotate: reduceMotion ? 0 : -d * 35 * (rtl ? -1 : 1), opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 220, damping: 26 }}
                >
                  {pageOptions.map((o, k) => {
                    // Clockwise from the top (anticlockwise in RTL).
                    const theta = ((2 * Math.PI * k) / n) * (rtl ? -1 : 1) - Math.PI / 2
                    const hot = hoverIndex === o.index
                    return (
                      <motion.button
                        key={o.key}
                        type="button"
                        data-jump-index={o.index}
                        onClick={() => {
                          onSelect(o.index)
                          onClose()
                        }}
                        aria-current={o.active || undefined}
                        className="absolute flex flex-col items-center"
                        style={{ left: "50%", top: "50%", width: ITEM, marginLeft: -ITEM / 2, marginTop: -ITEM / 2 }}
                        initial={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                        animate={{
                          x: Math.cos(theta) * radius,
                          y: Math.sin(theta) * radius,
                          scale: hot ? 1.14 : 1,
                          opacity: 1,
                        }}
                        exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 26,
                          delay: reduceMotion ? 0 : k * 0.025,
                        }}
                      >
                        <span
                          className="flex items-center justify-center rounded-full"
                          style={{
                            width: ITEM,
                            height: ITEM,
                            background: hot ? "#DDF2E8" : "#FFFFFF",
                            border: o.active ? "3px solid #087F63" : "1px solid #DCE9E3",
                            boxShadow: "0 6px 16px rgba(18, 65, 48, 0.16)",
                            opacity: o.muted && !o.active ? 0.6 : 1,
                          }}
                        >
                          {o.icon}
                        </span>
                        <span
                          dir="auto"
                          className="text-center"
                          style={{
                            marginTop: 4,
                            width: 84,
                            fontSize: 11.5,
                            fontWeight: o.active ? 800 : 700,
                            lineHeight: 1.15,
                            color: o.active ? "#087F63" : "#183B34",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textShadow: "0 1px 2px rgba(255,255,255,0.9)",
                          }}
                        >
                          {o.label}
                        </span>
                      </motion.button>
                    )
                  })}
                </motion.div>
              </AnimatePresence>

              {/* Centre: close */}
              <motion.button
                type="button"
                onClick={onClose}
                aria-label={labels.close}
                className="absolute left-1/2 top-1/2 flex items-center justify-center rounded-full"
                style={{ width: 58, height: 58, marginLeft: -29, marginTop: -29, background: "#087F63", boxShadow: "0 8px 20px rgba(8, 127, 99, 0.35)" }}
                initial={{ rotate: -90, scale: 0.6 }}
                animate={{ rotate: 0, scale: 1 }}
                exit={{ rotate: 180, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </motion.button>
            </motion.div>

            {pages > 1 && (
              <div className="flex items-center gap-4">
                {([-1, 1] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => goPage(d)}
                    disabled={d === -1 ? page === 0 : page === pages - 1}
                    aria-label={d === -1 ? labels.previous : labels.next}
                    className="flex items-center justify-center rounded-full disabled:opacity-35"
                    style={{ width: 40, height: 40, background: "#FFFFFF", boxShadow: "0 3px 10px rgba(18, 65, 48, 0.14)", order: d === -1 ? 0 : 2 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#183B34" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points={(d === 1) !== rtl ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
                    </svg>
                  </button>
                ))}
                <span style={{ order: 1, fontSize: 14, fontWeight: 800, color: "#183B34", minWidth: 56, textAlign: "center" }}>
                  {formatNumber(page + 1)} / {formatNumber(pages)}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    target,
  )
}
