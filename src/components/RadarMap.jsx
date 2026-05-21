import React, { useState } from 'react'
import { Shield, AlertTriangle, ShieldAlert, ShieldCheck, UserPlus, Users, PlusCircle, History } from 'lucide-react'

export default function RadarMap({ sectors, updateSector, addLog, lowBandwidth }) {
  const [selectedSectorId, setSelectedSectorId] = useState('gate-a')
  const [newLogText, setNewLogText] = useState('')
  const [logOperator, setLogOperator] = useState('Sentinel-1')

  const selectedSector = sectors.find(s => s.id === selectedSectorId) || sectors[0]

  const handleStatusChange = (status) => {
    updateSector(selectedSectorId, { status })
    
    // Auto-create log entry on status change
    const msg = `SECURITY ADVISORY: Security level adjusted to [${status.toUpperCase()}]`
    addLog(selectedSectorId, logOperator, msg)
  }

  const handleGuardChange = (e) => {
    const guards = parseInt(e.target.value) || 0
    updateSector(selectedSectorId, { guards })
  }

  const handleAddLogSubmit = (e) => {
    e.preventDefault()
    if (!newLogText.trim()) return
    addLog(selectedSectorId, logOperator, newLogText.trim())
    setNewLogText('')
  }

  // Define SVG positions for sectors to render them interactively
  const sectorPositions = {
    'wt-1': { cx: 80, cy: 80, r: 24, label: 'WT-1 (NW)' },
    'wt-2': { cx: 420, cy: 80, r: 24, label: 'WT-2 (NE)' },
    'wt-3': { cx: 80, cy: 320, r: 24, label: 'WT-3 (SW)' },
    'wt-4': { cx: 420, cy: 320, r: 24, label: 'WT-4 (SE)' },
    'gate-a': { cx: 250, cy: 50, r: 28, label: 'GATE ALPHA' },
    'farms': { cx: 160, cy: 200, r: 35, label: 'CROP FARMS' },
    'water': { cx: 340, cy: 200, r: 30, label: 'H2O PURIFIER' },
    'medical': { cx: 250, cy: 280, r: 32, label: 'MED BAY' },
    'command': { cx: 250, cy: 160, r: 26, label: 'HQ BUNKER' },
  }

  const getStatusColor = (status, alpha = 1) => {
    if (status === 'breached') return `rgba(255, 51, 51, ${alpha})`
    if (status === 'alert') return `rgba(255, 204, 0, ${alpha})`
    return `rgba(0, 255, 136, ${alpha})`
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* INTERACTIVE RADAR SVG PANEL */}
        <div className={`cyber-panel ${selectedSector.status === 'breached' ? 'danger-glow' : 'primary-glow'}`} style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield style={{ width: '18px', height: '18px' }} />
              PERIMETER TACTICAL FEED
            </h3>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              LIVE MONITORING
            </span>
          </div>

          <div className="radar-grid" style={{ width: '100%', height: '360px', border: '1px solid var(--color-border)', borderRadius: '4px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {!lowBandwidth && <div className="radar-sweep"></div>}

            <svg viewBox="0 0 500 400" style={{ width: '100%', height: '100%' }}>
              {/* Grid Lines */}
              <line x1="250" y1="0" x2="250" y2="400" stroke="var(--color-border)" strokeDasharray="3 3" />
              <line x1="0" y1="200" x2="500" y2="200" stroke="var(--color-border)" strokeDasharray="3 3" />

              {/* Connecting lines representing perimeter walls */}
              <polygon 
                points="80,80 250,50 420,80 420,320 250,280 80,320" 
                fill="none" 
                stroke="var(--color-border)" 
                strokeWidth="2" 
                strokeDasharray="4 4" 
              />

              {/* Sectors */}
              {sectors.map((sector) => {
                const pos = sectorPositions[sector.id]
                if (!pos) return null
                const color = getStatusColor(sector.status)
                const isSelected = sector.id === selectedSectorId

                return (
                  <g 
                    key={sector.id} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedSectorId(sector.id)}
                  >
                    {/* Ring Pulse for Alert/Breached states */}
                    {!lowBandwidth && (sector.status === 'breached' || sector.status === 'alert') && (
                      <circle 
                        cx={pos.cx} 
                        cy={pos.cy} 
                        r={pos.r + 12} 
                        fill="none" 
                        stroke={color} 
                        strokeWidth="1"
                        style={{
                          transformOrigin: `${pos.cx}px ${pos.cy}px`,
                          animation: 'radar-pulse 2s infinite ease-out'
                        }}
                      />
                    )}

                    {/* Sector Base Node */}
                    <circle 
                      cx={pos.cx} 
                      cy={pos.cy} 
                      r={pos.r} 
                      fill="var(--bg-black)" 
                      stroke={color} 
                      strokeWidth={isSelected ? '3' : '1.5'} 
                      style={{
                        transition: 'all 0.2s',
                        filter: isSelected ? `drop-shadow(0 0 8px ${color})` : 'none'
                      }}
                    />

                    {/* Text Label inside/next to node */}
                    <text 
                      x={pos.cx} 
                      y={pos.cy + 4} 
                      fill={color} 
                      fontSize="9" 
                      fontFamily="var(--font-mono)"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {sector.id.toUpperCase()}
                    </text>

                    {/* Threat indicator tag */}
                    {sector.status !== 'secure' && (
                      <circle 
                        cx={pos.cx + pos.r - 4} 
                        cy={pos.cy - pos.r + 4} 
                        r="6" 
                        fill={color} 
                      />
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Custom pulse keyframe inline */}
            <style>{`
              @keyframes radar-pulse {
                0% { transform: scale(0.6); opacity: 1; }
                100% { transform: scale(1.4); opacity: 0; }
              }
            `}</style>
          </div>
        </div>

        {/* SECTOR CONTROL PANEL */}
        <div className="cyber-panel primary-glow" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                SECTOR CONTROL: {selectedSector.name.toUpperCase()}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`led-indicator ${selectedSector.status === 'secure' ? 'green' : selectedSector.status === 'alert' ? 'yellow' : 'red'}`}></span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 'bold' }}>
                  {selectedSector.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                SET DEFENSE LEVEL
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button 
                  className={`cyber-btn ${selectedSector.status === 'secure' ? 'active' : ''}`}
                  onClick={() => handleStatusChange('secure')}
                  style={{ padding: '6px', fontSize: '11px', justifyContent: 'center' }}
                >
                  <ShieldCheck style={{ width: '14px', height: '14px' }} />
                  SECURE
                </button>
                <button 
                  className={`cyber-btn ${selectedSector.status === 'alert' ? 'active' : ''}`}
                  onClick={() => handleStatusChange('alert')}
                  style={{ padding: '6px', fontSize: '11px', justifyContent: 'center', color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}
                >
                  <AlertTriangle style={{ width: '14px', height: '14px' }} />
                  ALERT
                </button>
                <button 
                  className={`cyber-btn danger ${selectedSector.status === 'breached' ? 'active' : ''}`}
                  onClick={() => handleStatusChange('breached')}
                  style={{ padding: '6px', fontSize: '11px', justifyContent: 'center' }}
                >
                  <ShieldAlert style={{ width: '14px', height: '14px' }} />
                  BREACH
                </button>
              </div>
            </div>

            {/* GUARD SCHEDULER */}
            <div style={{ marginBottom: '16px', background: 'var(--bg-black)', padding: '12px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', fontFamily: 'var(--font-display)' }}>
                  <Users style={{ width: '14px', height: '14px', color: 'var(--color-primary)' }} />
                  ASSIGNED GUARDIANS
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '14px' }}>
                  {selectedSector.guards} / 10
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="10" 
                value={selectedSector.guards} 
                onChange={handleGuardChange}
                style={{ width: '100%', accentColor: 'var(--color-primary)', background: 'var(--bg-panel)', height: '6px', borderRadius: '3px', outline: 'none' }}
              />
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                Ration requirement increases by +0.2 cans/day per sentinel actively posted.
              </span>
            </div>
          </div>

          {/* LOGGING INCIDENT */}
          <form onSubmit={handleAddLogSubmit} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
              <PlusCircle style={{ width: '14px', height: '14px', color: 'var(--color-primary)' }} />
              LOG NEW INCIDENT
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', marginBottom: '8px' }}>
              <select 
                className="cyber-select"
                value={logOperator}
                onChange={(e) => setLogOperator(e.target.value)}
                style={{ fontSize: '11px', padding: '6px' }}
              >
                <option value="Sentinel-1">SNTL-1</option>
                <option value="Sentinel-2">SNTL-2</option>
                <option value="Sentinel-3">SNTL-3</option>
                <option value="Commander">CO-HQ</option>
                <option value="Scout-Lead">SCOUT</option>
              </select>
              <input 
                type="text" 
                className="cyber-input" 
                placeholder="Log activity, threat movements..."
                value={newLogText}
                onChange={(e) => setNewLogText(e.target.value)}
                style={{ fontSize: '11px', padding: '6px' }}
              />
            </div>
            <button type="submit" className="cyber-btn" style={{ width: '100%', padding: '6px', fontSize: '11px', justifyContent: 'center' }}>
              SUBMIT RECORD
            </button>
          </form>

        </div>
      </div>

      {/* SECTOR HISTORICAL SECURITY LOG */}
      <div className="cyber-panel primary-glow" style={{ padding: '16px' }}>
        <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <History style={{ width: '16px', height: '16px' }} />
          LOG ARCHIVE: {selectedSector.name.toUpperCase()}
        </h4>
        <div style={{ background: 'var(--bg-black)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px', maxHeight: '180px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          {selectedSector.logs.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px' }}>
              No critical activities recorded in this sector.
            </div>
          ) : (
            selectedSector.logs.slice().reverse().map((log, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: '6px 8px', 
                  borderBottom: index !== 0 ? '1px solid #1c222e' : 'none', 
                  display: 'grid', 
                  gridTemplateColumns: '120px 80px 1fr',
                  gap: '8px',
                  alignItems: 'start'
                }}
              >
                <span style={{ color: 'var(--color-text-muted)' }}>{log.timestamp}</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{log.operator}</span>
                <span style={{ color: log.message.includes('BREACHED') || log.message.includes('Alert') ? 'var(--color-danger)' : 'var(--color-text-bright)' }}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
