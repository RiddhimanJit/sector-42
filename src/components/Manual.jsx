import React, { useState } from 'react'
import { BookOpen, Search, ShieldAlert, HeartPulse, Shield, Wrench, Droplet } from 'lucide-react'

const PROCEDURES = [
  {
    id: 'infection',
    category: 'medical',
    title: 'Infection Mitigation Protocol',
    icon: <HeartPulse style={{ width: '16px', height: '16px' }} />,
    summary: 'Standard operating procedures for managing biological contamination or pathogen exposure in the field.',
    steps: [
      'Isolate the exposed individual immediately in the sub-level medical quarantine unit.',
      'Administer high-potency broad-spectrum antibiotics within the first 3 hours of suspected contact.',
      'Sterilize the contact point using a 10% chemical chlorine solution or direct thermal flame treatment.',
      'Monitor vital signs continuously. Look for signs of hyper-aggressive behavior, rapid necrosis, or neural degradation.',
      'If neural shift exceeds 85%, seal quarantine vault doors and purge the containment atmosphere using carbon dioxide ventilation.'
    ],
    warnings: 'CRITICAL: Airborne pathogen transmission is highly probable in confined unventilated spaces. Do not breach quarantine locks without class-4 hazard suits.'
  },
  {
    id: 'filtration',
    category: 'survival',
    title: 'Chemical & Bacterial Water Filtration',
    icon: <Droplet style={{ width: '16px', height: '16px' }} />,
    summary: 'Procedures for processing raw atmospheric condensation or runoff water into potable rations.',
    steps: [
      'Pass raw fluid through a coarse sand and charcoal particulate filter to remove heavy solid debris.',
      'Add 2 filtration tablets per 5 liters of fluid, or run the fluid through the primary Sector-42 H2O Purifier unit.',
      'Boil at a continuous 100°C for a minimum of 15 minutes to neutralize thermal-resistant viral strains.',
      'Store processed water only in sealed stainless steel containers to prevent post-filtration bacterial growth.'
    ],
    warnings: 'DO NOT consume unboiled condensation from cooling vents near the sector generators due to toxic glycol coolant leaks.'
  },
  {
    id: 'weapons',
    category: 'security',
    title: 'Tactical Weapon & Defense Grid Maintenance',
    icon: <Shield style={{ width: '16px', height: '16px' }} />,
    summary: 'Preventative and reactive maintenance for field-issued kinetic rifles and boundary defensive fences.',
    steps: [
      'Field-strip the kinetic rifle assembly and inspect the main firing bolt for micro-fractures.',
      'Clean carbon deposits from the gas expansion tube using high-grade synthetic solvent.',
      'Apply micro-thin lubrication to all moving parts, specifically focusing on the chamber loading ramp.',
      'For perimeter security fences: inspect secondary backup capacitor banks to ensure holding charge is above 12,000V.',
      'Clear organic detritus and overgrown foliage from the lower ground rails of Gate Alpha to prevent motor resistance.'
    ],
    warnings: 'WARNING: Ensure weapon battery packs or ammunition cylinders are fully disengaged before running automated diagnostics to prevent accidental discharge.'
  },
  {
    id: 'generator',
    category: 'engineering',
    title: 'HQ Generator Cold Start & Load Management',
    icon: <Wrench style={{ width: '16px', height: '16px' }} />,
    summary: 'Emergency cold-start procedures for the primary Sector-42 diesel generators under system-wide blackout states.',
    steps: [
      'Manually toggle the main breaker switches in high-voltage room B to the "OFF" position.',
      'Prime the secondary fuel injection pump manually until pressure gauge reads 4.5 Bars.',
      'Engage the starter batteries. Hold the manual glow-plug button down for exactly 15 seconds.',
      'Turn starter keys to initiate combustion. Immediately adjust governor throttle to 1800 RPM.',
      'Wait for oil pressure to stabilize, then re-engage individual grid sector breakers sequentially (Medical Bay first, then Perimeter Fences).'
    ],
    warnings: 'DANGER: Do not attempt to start generators if fuel level is below 5% to avoid air locks in fuel supply lines, which requires professional disassembly.'
  },
  {
    id: 'scout',
    category: 'survival',
    title: 'Expedition Survival & Emergency Retreat',
    icon: <BookOpen style={{ width: '16px', height: '16px' }} />,
    summary: 'Rules of engagement and survival tactics when fireteams are cut off from the main Sector-42 HQ Bunker.',
    steps: [
      'Immediately activate the shortwave radio distress beacon at frequency 148.50 MHz.',
      'Establish a defensible perimeter inside concrete or reinforced structures with limited entrance nodes.',
      'Post double-sentinel shifts on a rotating 2-hour watch cycle to minimize sleep deprivation.',
      'Strictly conserve rations: restrict intake to 1 food can and 1.5 liters of water per survivor per 24 hours.',
      'Under extreme breach: initiate visual Morse signaling using high-powered searchlights or flares toward Watchtower 1.'
    ],
    warnings: 'AVOID all contact with unknown survivor groups in sector 9 retail ruins due to verified hostile scavenger raiding history.'
  }
]

export default function Manual() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedId, setExpandedId] = useState('infection')

  const filteredProcedures = PROCEDURES.filter(proc => {
    const matchesSearch = proc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          proc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          proc.steps.some(step => step.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || proc.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
      
      {/* MANUAL CONTROLS */}
      <div className="cyber-panel primary-glow" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen style={{ width: '18px', height: '18px' }} />
            SURVIVAL FIELD MANUAL (REV. 42)
          </h3>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            OFFLINE KNOWLEDGE SYNCED
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="cyber-input" 
              placeholder="Search index keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
            <Search style={{ position: 'absolute', left: '10px', top: '12px', width: '14px', height: '14px', color: 'var(--color-text-muted)' }} />
          </div>

          {/* Category buttons */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['all', 'medical', 'security', 'engineering', 'survival'].map((cat) => (
              <button
                key={cat}
                className={`cyber-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
                style={{ padding: '6px 12px', fontSize: '10px', textTransform: 'uppercase' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ARTICLE LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Index list */}
        <div className="cyber-panel primary-glow" style={{ padding: '16px', maxHeight: '420px', overflowY: 'auto' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '10px', fontFamily: 'var(--font-mono)' }}>
            PROCEDURE DIRECTORY INDEX
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredProcedures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                [ NO INDEX FOUND FOR GIVEN SEARCH ]
              </div>
            ) : (
              filteredProcedures.map((proc) => (
                <div
                  key={proc.id}
                  className={`cyber-panel ${expandedId === proc.id ? 'primary-glow' : ''}`}
                  onClick={() => setExpandedId(proc.id)}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    background: expandedId === proc.id ? 'var(--bg-panel-hover)' : 'var(--bg-darker)',
                    border: expandedId === proc.id ? '1px solid var(--color-primary)' : '1px solid #1c222e',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '12.5px', color: expandedId === proc.id ? 'var(--color-primary)' : 'var(--color-text-bright)' }}>
                      {proc.title}
                    </span>
                    <span style={{ color: 'var(--color-primary)' }}>{proc.icon}</span>
                  </div>
                  <p style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '4px', lineClamp: '2', WebkitLineClamp: '2', display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {proc.summary}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Article content viewer */}
        <div className="cyber-panel primary-glow" style={{ padding: '16px' }}>
          {PROCEDURES.find(p => p.id === expandedId) ? (
            (() => {
              const article = PROCEDURES.find(p => p.id === expandedId)
              return (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '12px' }}>
                      <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {article.icon}
                        {article.title.toUpperCase()}
                      </h4>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '2px 6px', background: 'var(--bg-black)', border: '1px solid var(--color-border)', borderRadius: '2px', textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                        {article.category}
                      </span>
                    </div>

                    {/* Summary */}
                    <p style={{ fontSize: '12px', color: 'var(--color-text-bright)', marginBottom: '12px', fontStyle: 'italic', background: 'var(--bg-darker)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid var(--color-primary)' }}>
                      {article.summary}
                    </p>

                    {/* Step list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                        OPERATIONAL EXECUTION STEPS:
                      </span>
                      {article.steps.map((step, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: '8px', fontSize: '12px', alignItems: 'start' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontWeight: 'bold', background: 'var(--bg-black)', border: '1px solid var(--color-border)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifySelf: 'start', justifyContent: 'center', fontSize: '10px' }}>
                            {idx + 1}
                          </span>
                          <span style={{ color: 'var(--color-text-bright)' }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Warning banner */}
                  <div style={{ background: 'rgba(255, 51, 51, 0.05)', border: '1px dashed var(--color-danger)', borderRadius: '4px', padding: '10px', display: 'flex', gap: '8px', alignItems: 'start' }}>
                    <ShieldAlert style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: '2px', width: '16px', height: '16px' }} />
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ffb3b3', lineHeight: '1.4' }}>
                      {article.warnings}
                    </div>
                  </div>
                </div>
              )
            })()
          ) : (
            <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              [ SELECT AN ARTICLE FROM INDEX TREE ]
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
