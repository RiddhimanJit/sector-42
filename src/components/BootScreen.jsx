import React, { useState, useEffect, useRef } from 'react'

const BOOT_LINES = [
  { t: 'INITIALIZING SECTOR-42 COLONY COMMAND SYSTEM v2.0...', c: '' },
  { t: 'BIOS: POST VERIFICATION PASSED', c: 'ok' },
  { t: 'CPU: APOCALYPSE-CORE v7.4 @ 2.4GHz — 4 CORES ACTIVE', c: 'ok' },
  { t: 'MEMORY: 8GB TACTICAL RAM', c: 'ok' },
  { t: 'POWER: GENERATOR B — FUEL AT 22% — LOW FUEL WARNING', c: 'warn' },
  { t: 'NETWORK: OFFLINE — NO EXTERNAL UPLINK AVAILABLE', c: 'warn' },
  { t: 'PERIMETER SENSORS: ONLINE — 12/14 NODES RESPONDING', c: 'warn' },
  { t: 'ZOMBIE THREAT DATABASE: LOADING...', c: 'info' },
  { t: 'BIOMETRIC SCANNER: ACTIVE', c: 'ok' },
  { t: 'RADAR ARRAY: CALIBRATED — 5KM RANGE', c: 'ok' },
  { t: 'COLONY ROSTER: 47 SURVIVORS REGISTERED', c: 'ok' },
  { t: 'RESOURCE MONITORS: ONLINE', c: 'ok' },
  { t: '', c: '' },
  { t: '!! CRITICAL — HORDE ALPHA (~340) DETECTED 2.3KM NORTHWEST — ETA: 14H', c: 'crit' },
  { t: '!! CRITICAL — FOOD STORES AT 18% — IMMEDIATE RATIONING REQUIRED', c: 'crit' },
  { t: '!! WARNING  — SCOUT TEAM BRAVO: CONTACT LOST 3H 22M AGO', c: 'warn' },
  { t: '', c: '' },
  { t: 'ALL SYSTEMS OPERATIONAL.', c: 'ok' },
  { t: 'WELCOME BACK, COMMANDER. SECTOR-42 IS COUNTING ON YOU.', c: 'rdy' },
]

export default function BootScreen({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState([])
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [skipped, setSkipped] = useState(false)
  const containerRef = useRef(null)
  const animatingRef = useRef(true)

  useEffect(() => {
    let cancelled = false

    const runBoot = async () => {
      for (let i = 0; i < BOOT_LINES.length; i++) {
        if (cancelled || !animatingRef.current) break

        await new Promise(r => setTimeout(r, 20))

        setVisibleLines(prev => [...prev, BOOT_LINES[i]])
        setProgress(((i + 1) / BOOT_LINES.length) * 100)

        // Slower reveal for critical lines (indices 13-15)
        const delay = (i >= 13 && i <= 15) ? 180 : 80
        await new Promise(r => setTimeout(r, delay))
      }

      if (!cancelled && animatingRef.current) {
        await new Promise(r => setTimeout(r, 1200))
        setDone(true)
      }
    }

    runBoot()
    return () => { cancelled = true }
  }, [])

  // Auto-transition after done
  useEffect(() => {
    if (done && !skipped) {
      const timer = setTimeout(() => {
        onComplete()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [done, skipped, onComplete])

  const handleSkip = () => {
    animatingRef.current = false
    setSkipped(true)
    onComplete()
  }

  const getLineClass = (c) => {
    const base = 'boot-line'
    if (c) return `${base} boot-${c}`
    return base
  }

  const getSuffix = (c) => {
    if (c === 'ok') return ' ................. [OK]'
    if (c === 'warn') return ' ......... [WARN]'
    return ''
  }

  return (
    <div className="boot-screen" onClick={handleSkip}>
      <div className="boot-content">
        <div className="boot-logo">SECTOR-42</div>

        <div className="boot-lines" ref={containerRef}>
          {visibleLines.map((line, i) => (
            <div key={i} className={getLineClass(line.c)}>
              {line.t || '\u00a0'}
              {line.c === 'ok' && <span className="boot-suffix-ok">{getSuffix('ok')}</span>}
              {line.c === 'warn' && <span className="boot-suffix-warn">{getSuffix('warn')}</span>}
            </div>
          ))}
        </div>

        <div className="boot-bar">
          <div className="boot-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="boot-skip-hint">
          {done ? 'BOOT COMPLETE — ENTERING COMMAND TERMINAL...' : 'CLICK ANYWHERE TO SKIP'}
        </div>
      </div>

      {/* Scanline overlay for boot screen */}
      <div className="boot-scanlines" />
    </div>
  )
}
