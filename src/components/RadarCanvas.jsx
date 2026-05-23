import React, { useEffect, useRef, useCallback } from 'react'

const BLIPS = [
  { x: -.35, y: -.42, color: '239,68,68',  label: 'H1',    km: 2.3 },
  { x:  .32, y:  .38, color: '245,158,11', label: 'H2',    km: 4.1 },
  { x:  .12, y: -.28, color: '59,130,246', label: 'SCOUT', km: null },
  { x: -.2,  y:  .15, color: '34,197,94',  label: 'CACHE', km: null },
  { x:  .65, y: -.50, color: '239,68,68',  label: 'WOLVES', km: 8.2 },
  { x: -.55, y:  .60, color: '59,130,246', label: 'VANGUARD', km: 6.4 },
  { x:  .70, y:  .45, color: '245,158,11', label: 'BARONS', km: 9.1 },
  { x: -.40, y: -.65, color: '168,85,247', label: 'DUST', km: 7.8 },
]

export default function RadarCanvas({ lowBandwidth }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const angleRef = useRef(0)
  const blipsRef = useRef(
    BLIPS.map(b => ({ 
      ...b, 
      trigAngle: Math.random() * Math.PI * 2,
      dx: (Math.random() - 0.5) * 0.001,
      dy: (Math.random() - 0.5) * 0.001
    }))
  )
  const hordeRef = useRef({ h1: 2.3, h2: 4.1 })
  const h1DistRef = useRef(null)
  const h2DistRef = useRef(null)
  const contactCountRef = useRef(null)
  const clockRef = useRef(null)

  // Clock updater
  useEffect(() => {
    const updateClock = () => {
      if (!clockRef.current) return
      const now = new Date()
      const pad = n => String(n).padStart(2, '0')
      clockRef.current.textContent =
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    }
    updateClock()
    const id = setInterval(updateClock, 1000)
    return () => clearInterval(id)
  }, [])

  // Horde drift simulation
  useEffect(() => {
    const id = setInterval(() => {
      hordeRef.current.h1 = Math.max(0, hordeRef.current.h1 - 0.01)
      hordeRef.current.h2 = Math.max(0, hordeRef.current.h2 - 0.005)
      if (h1DistRef.current)
        h1DistRef.current.textContent = hordeRef.current.h1.toFixed(1) + ' KM'
      if (h2DistRef.current)
        h2DistRef.current.textContent = hordeRef.current.h2.toFixed(1) + ' KM'
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    // Responsive sizing relative to container
    const rect = canvas.parentElement.getBoundingClientRect()
    const SIZE = Math.min(rect.width - 26, 310)

    canvas.style.width = SIZE + 'px'
    canvas.style.height = SIZE + 'px'
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr

    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const R = cx - 6 * dpr

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background
    ctx.fillStyle = '#010a03'
    ctx.beginPath()
    ctx.arc(cx, cy, R + 4, 0, Math.PI * 2)
    ctx.fill()

    // Range rings
    ;[1, .75, .5, .25].forEach(ratio => {
      ctx.strokeStyle = 'rgba(34,197,94,.1)'
      ctx.lineWidth = dpr
      ctx.beginPath()
      ctx.arc(cx, cy, R * ratio, 0, Math.PI * 2)
      ctx.stroke()
    })

    // Cardinal lines
    ctx.strokeStyle = 'rgba(34,197,94,.07)'
    ctx.lineWidth = dpr
    ;[
      [cx - R, cy, cx + R, cy],
      [cx, cy - R, cx, cy + R],
      [cx - R * .7, cy - R * .7, cx + R * .7, cy + R * .7],
      [cx + R * .7, cy - R * .7, cx - R * .7, cy + R * .7]
    ].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    })

    // Cardinal labels
    ctx.fillStyle = 'rgba(34,197,94,.25)'
    ctx.font = `${9 * dpr}px Share Tech Mono`
    ctx.textAlign = 'center'
    ctx.fillText('N', cx, cy - R + 14 * dpr)
    ctx.fillText('S', cx, cy + R - 4 * dpr)
    ctx.textAlign = 'left'
    ctx.fillText('E', cx + R - 14 * dpr, cy + 4 * dpr)
    ctx.textAlign = 'right'
    ctx.fillText('W', cx - R + 14 * dpr, cy + 4 * dpr)
    ctx.textAlign = 'center'

    if (!lowBandwidth) {
      // Sweep trail
      angleRef.current = (angleRef.current + 0.022) % (Math.PI * 2)
      const angle = angleRef.current

      for (let i = 30; i >= 0; i--) {
        const a = angle - i * 0.04
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, R, a, a + 0.04)
        ctx.closePath()
        ctx.fillStyle = `rgba(34,197,94,${(30 - i) / 30 * 0.18})`
        ctx.fill()
      }

      // Sweep line
      ctx.strokeStyle = 'rgba(34,197,94,.85)'
      ctx.lineWidth = 1.5 * dpr
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R)
      ctx.stroke()

      // Blips
      const blips = blipsRef.current
      blips.forEach(b => {
        // Random drift physics
        b.x += b.dx;
        b.y += b.dy;
        const distSq = b.x * b.x + b.y * b.y;
        if (distSq > 0.64) {
          b.dx = -b.dx;
          b.dy = -b.dy;
        } else if (Math.random() < 0.02) {
          b.dx += (Math.random() - 0.5) * 0.0005;
          b.dy += (Math.random() - 0.5) * 0.0005;
          const speedSq = b.dx * b.dx + b.dy * b.dy;
          if (speedSq > 0.000005) {
             b.dx *= 0.8;
             b.dy *= 0.8;
          }
        }

        const age = (angle - b.trigAngle + Math.PI * 8) % (Math.PI * 2)
        const alpha = Math.max(0, 1 - age / (Math.PI * 1.6))

        if (alpha > 0.02) {
          const bx = cx + b.x * R
          const by = cy + b.y * R

          // Outer glow
          ctx.fillStyle = `rgba(${b.color},${alpha * .25})`
          ctx.beginPath()
          ctx.arc(bx, by, 10 * dpr, 0, Math.PI * 2)
          ctx.fill()

          // Core dot
          ctx.fillStyle = `rgba(${b.color},${alpha * .95})`
          ctx.beginPath()
          ctx.arc(bx, by, 4 * dpr, 0, Math.PI * 2)
          ctx.fill()

          // Label
          if (alpha > 0.4) {
            ctx.fillStyle = `rgba(${b.color},${alpha * .7})`
            ctx.font = `${7 * dpr}px Share Tech Mono`
            ctx.fillText(b.label, bx, by - 8 * dpr)
          }
        }

        // Retrigger blip when sweep passes
        const ba = Math.atan2(b.y, b.x)
        const diff = Math.abs((angle - ba + Math.PI * 4) % (Math.PI * 2))
        if (diff < 0.05) b.trigAngle = angle
      })
    }

    // Colony center
    ctx.fillStyle = 'rgba(34,197,94,.2)'
    ctx.beginPath()
    ctx.arc(cx, cy, 10 * dpr, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#22c55e'
    ctx.beginPath()
    ctx.arc(cx, cy, 5 * dpr, 0, Math.PI * 2)
    ctx.fill()

    // Border
    ctx.strokeStyle = 'rgba(34,197,94,.22)'
    ctx.lineWidth = 2 * dpr
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.stroke()

    animRef.current = requestAnimationFrame(draw)
  }, [lowBandwidth])

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [draw])

  return (
    <div className="radar-canvas-wrap">
      <div className="radar-canvas-clock" ref={clockRef}>--:--:--</div>

      <div className="radar-canvas-panel">
        <div className="radar-canvas-accent" />
        <div className="radar-canvas-header">
          <span className="radar-canvas-title">📡 RADAR — SECTOR-42</span>
          <span className="radar-canvas-badge">SCANNING</span>
        </div>
        <div className="radar-canvas-body">
          <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '50%' }} />
        </div>
      </div>

      <div className="radar-canvas-readout">
        RANGE <span>10.0 KM</span> &nbsp;·&nbsp;
        SWEEP <span>0.21 Hz</span> &nbsp;·&nbsp;
        CONTACTS <span ref={contactCountRef}>8</span>
        <br />
        HORDE ALPHA <span ref={h1DistRef}>2.3 KM</span> &nbsp;·&nbsp;
        HORDE BETA <span ref={h2DistRef}>4.1 KM</span>
      </div>

      <div className="radar-canvas-legend">
        <div className="radar-leg-row">
          <div className="radar-leg-dot" style={{ background: '#ef4444' }} />
          HORDE ALPHA (NW)
        </div>
        <div className="radar-leg-row">
          <div className="radar-leg-dot" style={{ background: '#f59e0b' }} />
          HORDE BETA (SE)
        </div>
        <div className="radar-leg-row">
          <div className="radar-leg-dot" style={{ background: '#3b82f6' }} />
          SCOUT TEAM
        </div>
        <div className="radar-leg-row">
          <div className="radar-leg-dot" style={{ background: '#22c55e' }} />
          SUPPLY CACHE
        </div>
        <div className="radar-leg-row" style={{ marginTop: '8px', color: 'var(--color-primary)' }}>
          <div className="radar-leg-dot" style={{ background: 'var(--color-primary)' }} />
          FACTION SIGNALS DETECTED
        </div>
      </div>
    </div>
  )
}
