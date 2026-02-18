'use client'

import { useEffect, useState, useRef } from 'react'
import { useInView } from '@/hooks/use-in-view'

interface FulfillmentRingProps {
  total: number
  completed: number
  proved: number
  inProgress: number
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export function FulfillmentRing({ total, completed, proved, inProgress }: FulfillmentRingProps) {
  const { ref, inView } = useInView({ threshold: 0.3 })
  const [displayPct, setDisplayPct] = useState(0)
  const [displayTotal, setDisplayTotal] = useState(0)
  const [displayCompleted, setDisplayCompleted] = useState(0)
  const [displayProved, setDisplayProved] = useState(0)
  const [displayInProgress, setDisplayInProgress] = useState(0)
  const [displayAwaitingProof, setDisplayAwaitingProof] = useState(0)
  const animatedRef = useRef(false)

  const targetPct = total > 0 ? Math.round((proved / total) * 100) : 0
  const awaitingProof = completed - proved
  const awaitingCompletion = total - completed

  const radius = 72
  const circumference = 2 * Math.PI * radius
  const targetOffset = total > 0 ? circumference * (1 - proved / total) : circumference

  useEffect(() => {
    if (!inView || animatedRef.current) return
    animatedRef.current = true

    const duration = 1500
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)

      setDisplayPct(Math.round(eased * targetPct))
      setDisplayTotal(Math.round(eased * total))
      setDisplayCompleted(Math.round(eased * completed))
      setDisplayProved(Math.round(eased * proved))
      setDisplayInProgress(Math.round(eased * inProgress))
      setDisplayAwaitingProof(Math.round(eased * awaitingProof))

      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }

    requestAnimationFrame(tick)
  }, [inView, targetPct, total, completed, proved, inProgress, awaitingProof])

  return (
    <div ref={ref} className="text-center">
      {/* SVG Ring */}
      <div className="w-32 h-32 sm:w-44 sm:h-44 mx-auto">
        <svg viewBox="0 0 180 180" className="w-full h-full">
          {/* Background circle */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="var(--color-copper)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={inView ? targetOffset : circumference}
            transform="rotate(-90 90 90)"
            style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
          />
          {/* Center text */}
          <text
            x="90"
            y="85"
            textAnchor="middle"
            className="fill-kurobeni text-4xl sm:text-5xl font-bold"
            style={{ fontSize: '42px', fontWeight: 700, fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}
          >
            {displayPct}%
          </text>
          <text
            x="90"
            y="108"
            textAnchor="middle"
            className="fill-gray-400"
            style={{ fontSize: '12px', fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}
          >
            verified
          </text>
        </svg>
      </div>

      {/* Flanking stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mt-10">
        <StatItem label="Promised" value={displayTotal} dotColor="bg-gray-300" />
        <StatItem label="Fulfilled" value={displayCompleted} dotColor="bg-green-400" />
        <StatItem label="Proof Collected" value={displayProved} dotColor="bg-copper" />
        <StatItem label="In Progress" value={displayInProgress} dotColor="bg-blue-400" />
        <StatItem label="Awaiting Proof" value={displayAwaitingProof} dotColor="bg-amber-400" />
      </div>

      {/* Summary text */}
      <p className="text-sm text-gray-500 text-center mt-6">
        {completed} deliverable{completed !== 1 ? 's' : ''} fulfilled, {proved} verified with proof
        {awaitingCompletion > 0 && (
          <>, {awaitingCompletion} awaiting completion</>
        )}
      </p>
    </div>
  )
}

function StatItem({ label, value, dotColor }: { label: string; value: number; dotColor: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
