import React, { useState } from 'react'
import { Share2, Download, Upload, Copy, Check, ShieldAlert, WifiOff } from 'lucide-react'

export default function MeshSync({ exportState, importState, triggerUINotification }) {
  const [importJson, setImportJson] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleExport = () => {
    const data = exportState()
    const jsonStr = JSON.stringify(data, null, 2)
    
    // Copy to clipboard
    navigator.clipboard.writeText(jsonStr)
      .then(() => {
        setIsCopied(true)
        triggerUINotification('Profile copied to secure clipboard.')
        setTimeout(() => setIsCopied(false), 3000)
      })
      .catch((err) => {
        console.error('Failed to copy state:', err)
        triggerUINotification('Failed to auto-copy. Copy manually below.')
      })
  }

  const handleImportSubmit = (e) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!importJson.trim()) {
      setErrorMsg('Error: Profile input buffer is empty.')
      return
    }

    try {
      const parsed = JSON.parse(importJson.trim())
      
      // Basic schema validation
      if (!parsed.inventory || !parsed.sectors || typeof parsed.population !== 'number') {
        throw new Error('Missing core profile fields (inventory, sectors, or population).')
      }

      // Perform state update
      const success = importState(parsed)
      if (success) {
        triggerUINotification('RESTORE COMPLETE: Operations profile loaded.')
        setImportJson('')
      } else {
        throw new Error('State updater rejected the configuration payload.')
      }

    } catch (err) {
      setErrorMsg(`MALFORMED DATA: ${err.message}`)
      triggerUINotification('RESTORE FAILED: Invalid profile structure.')
    }
  }

  const getExportString = () => {
    const data = exportState()
    return JSON.stringify(data)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
      
      {/* Mesh Banner */}
      <div style={{ background: 'rgba(255, 136, 0, 0.08)', border: '1px solid var(--color-primary)', borderRadius: '4px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <WifiOff style={{ width: '40px', height: '40px', color: 'var(--color-primary)', flexShrink: 0 }} />
        <div>
          <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '14px', marginBottom: '4px' }}>
            LOCAL MESH COMMUNICATIONS PROTOCOL (OFFLINE SYNC)
          </h4>
          <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
            Sector-42 operates in a completely isolated zero-bandwidth environment. To sync defense levels, medical incident logs, and resource metrics with other regional bunkers, export your operations telemetry packet and transmit it over shortwave analog packet radio or physical USB drives.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* EXPORT PANEL */}
        <div className="cyber-panel primary-glow" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <Download style={{ width: '18px', height: '18px' }} />
              TELEMETRY PACKET EXPORTER
            </h3>
            
            <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
              Generate a secure, condensed JSON telemetry chunk containing current survivor headcounts, perimeter threat statuses, guard rosters, and raw supply caches.
            </p>

            <textarea 
              readOnly 
              className="cyber-input" 
              value={getExportString()}
              style={{ height: '130px', fontFamily: 'var(--font-mono)', fontSize: '10.5px', background: 'var(--bg-black)', color: '#8c9ba5', resize: 'none', wordBreak: 'break-all', marginBottom: '12px' }}
              onClick={(e) => e.target.select()}
            />
          </div>

          <button 
            className={`cyber-btn ${isCopied ? 'active' : ''}`} 
            onClick={handleExport}
            style={{ width: '100%', padding: '10px', justifyContent: 'center' }}
          >
            {isCopied ? (
              <>
                <Check style={{ width: '16px', height: '16px' }} />
                PACKET COPIED!
              </>
            ) : (
              <>
                <Copy style={{ width: '16px', height: '16px' }} />
                EXPORT & COPY TELEMETRY
              </>
            )}
          </button>
        </div>

        {/* IMPORT PANEL */}
        <div className="cyber-panel primary-glow" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <form onSubmit={handleImportSubmit} style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                <Upload style={{ width: '18px', height: '18px' }} />
                RESTORE OPERATIONS PACKET
              </h3>
              
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                Paste a telemetry packet received from an external shortwave station below to override and restore Sector-42's current active status.
              </p>

              <textarea 
                className="cyber-input" 
                placeholder='Paste raw JSON packet here (e.g. {"inventory": [...], "sectors": [...], "population": 42})'
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                style={{ height: '130px', fontFamily: 'var(--font-mono)', fontSize: '10.5px', background: 'var(--bg-black)', resize: 'none', marginBottom: '12px' }}
              />

              {errorMsg && (
                <div style={{ background: 'rgba(255, 51, 51, 0.08)', border: '1px solid var(--color-danger)', borderRadius: '4px', padding: '8px', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                  <ShieldAlert style={{ color: 'var(--color-danger)', width: '16px', height: '16px', flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>
                    {errorMsg}
                  </span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="cyber-btn"
              style={{ width: '100%', padding: '10px', justifyContent: 'center', background: 'var(--bg-panel-hover)' }}
            >
              <Share2 style={{ width: '16px', height: '16px' }} />
              LOAD PACKET CONFIGURATION
            </button>
          </form>
        </div>

      </div>

    </div>
  )
}
