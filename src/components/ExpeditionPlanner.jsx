import React, { useState, useEffect } from 'react'
import { Navigation, Compass, ShieldAlert, Crosshair, Users, Activity, PlusCircle, CheckCircle, Radio } from 'lucide-react'

export default function ExpeditionPlanner({ addInventoryResources, triggerUINotification }) {
  const [targetPOI, setTargetPOI] = useState('pharmacy')
  const [squadSize, setSquadSize] = useState(3)
  const [timeOfDay, setTimeOfDay] = useState('day')
  const [ammoAssigned, setAmmoAssigned] = useState(30)
  const [medsAssigned, setMedsAssigned] = useState(2)
  const [activeExpeditions, setActiveExpeditions] = useState([])

  // Points of Interest metadata
  const locations = {
    pharmacy: { name: 'MegaMart Pharmacy', dist: 3.5, baseRisk: 15, description: 'Source of antibiotics, antiseptics, and trauma supplies.', loot: 'medicine' },
    fuel: { name: 'Sector-9 Fuel Depot', dist: 8.2, baseRisk: 40, description: 'Contains diesel reserves for colony power generators.', loot: 'fuel' },
    supermarket: { name: 'Overrun Retail Plaza', dist: 5.1, baseRisk: 25, description: 'Ration cans, dry goods, and miscellaneous tools.', loot: 'food' },
    armory: { name: 'Police Precinct 4', dist: 12.0, baseRisk: 60, description: 'High probability of ammunition boxes and security gear.', loot: 'ammo' },
    purification: { name: 'Riverway Water Outpost', dist: 2.1, baseRisk: 10, description: 'Check water quality and retrieve purification filters.', loot: 'water' },
  }

  // Calculate Risk Level Dynamically
  const calculateRisk = () => {
    const loc = locations[targetPOI]
    if (!loc) return 0

    let score = loc.baseRisk
    
    // Distance factor (+5 per km)
    score += Math.floor(loc.dist * 5)
    
    // Time of Day factor (+30 for night)
    if (timeOfDay === 'night') score += 30
    
    // Squad size defense modifier
    if (squadSize === 1) score += 25
    if (squadSize === 2) score += 12
    if (squadSize >= 5) score -= 10
    
    // Equipment dampeners
    score -= Math.floor(ammoAssigned / 5) // more ammo decreases risk (max ammo 100)
    score -= medsAssigned * 8            // more meds decrease risk
    
    return Math.max(5, Math.min(100, score))
  }

  const getRiskTier = (score) => {
    if (score <= 30) return { label: 'LOW RISK', color: 'var(--color-success)', class: 'green' }
    if (score <= 60) return { label: 'MODERATE', color: 'var(--color-warning)', class: 'yellow' }
    if (score <= 80) return { label: 'HIGH RISK', color: '#ff8800', class: 'orange' }
    return { label: 'EXTREME RISK', color: 'var(--color-danger)', class: 'red' }
  }

  const handleLaunch = () => {
    const loc = locations[targetPOI]
    const riskScore = calculateRisk()
    const riskTier = getRiskTier(riskScore)

    const newExpedition = {
      id: Date.now(),
      location: loc.name,
      lootType: loc.loot,
      squadSize,
      time: timeOfDay,
      riskScore,
      riskTier,
      progress: 0,
      status: 'dispatched',
      logs: ['[00:00] Dispatch: Squad departed Command Bunker via tactical vehicle.'],
      timer: 20 // 20 seconds duration for rapid testing and realistic feel
    }

    setActiveExpeditions(prev => [newExpedition, ...prev])
    triggerUINotification(`Expedition dispatched to ${loc.name}!`)
  }

  // Handle simulated tick updates for active expeditions
  useEffect(() => {
    if (activeExpeditions.length === 0) return

    const interval = setInterval(() => {
      setActiveExpeditions(prev => {
        let updatedNeeded = false
        const nextList = prev.map(exp => {
          if (exp.status === 'completed' || exp.status === 'aborted') return exp
          updatedNeeded = true
          
          const nextProgress = Math.min(100, exp.progress + 5)
          const ticksLeft = Math.max(0, exp.timer - 1)
          
          let nextStatus = exp.status
          let newLog = null

          // Trigger simulated logs at specific progress points
          if (nextProgress === 20) {
            newLog = `[00:04] Scout: Arrived at ${exp.location} perimeter. Scanning structures.`
          } else if (nextProgress === 40) {
            if (exp.riskScore > 60 && Math.random() > 0.4) {
              newLog = `[00:08] RADIO ALERT: Hostile pack sighted! Taking defensive positions.`
            } else {
              newLog = `[00:08] Comm: Secured secondary entrypoint. Commencing sweep for ${exp.lootType.toUpperCase()}.`
            }
          } else if (nextProgress === 60) {
            newLog = `[00:12] Scout: Target goods loaded. Securing payload. Initiating exfiltration.`
          } else if (nextProgress === 80) {
            newLog = `[00:16] Comm: Retreated to heavy transport. Heading back to HQ.`
          } else if (nextProgress === 100) {
            nextStatus = 'completed'
            newLog = `[00:20] Command: Arrival confirmed! Squad returned safely. Rations and gear deposited.`
            
            // Calculate final loot yield
            let yieldQty = 0
            if (exp.lootType === 'food') yieldQty = Math.floor(Math.random() * 60) + 30
            else if (exp.lootType === 'water') yieldQty = Math.floor(Math.random() * 100) + 50
            else if (exp.lootType === 'medicine') yieldQty = Math.floor(Math.random() * 10) + 4
            else if (exp.lootType === 'ammo') yieldQty = Math.floor(Math.random() * 80) + 40
            else if (exp.lootType === 'fuel') yieldQty = Math.floor(Math.random() * 50) + 20
            
            // Add items to inventory and trigger notifications
            addInventoryResources(exp.lootType, yieldQty)
            triggerUINotification(`SUCCESS: Expedition retrieved +${yieldQty} ${exp.lootType}!`)
            exp.yieldDescription = `+${yieldQty} ${exp.lootType.toUpperCase()}`
          }

          return {
            ...exp,
            progress: nextProgress,
            status: nextStatus,
            timer: ticksLeft,
            logs: newLog ? [...exp.logs, newLog] : exp.logs
          }
        })

        return nextList
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [activeExpeditions])

  const riskScore = calculateRisk()
  const riskTier = getRiskTier(riskScore)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* EXPEDITION FORM */}
        <div className="cyber-panel primary-glow" style={{ padding: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            <Compass style={{ width: '18px', height: '18px' }} />
            EXPEDITION DISPATCH
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Target Select */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                1. SELECT SCAN TARGET AREA
              </label>
              <select 
                className="cyber-select" 
                value={targetPOI}
                onChange={(e) => setTargetPOI(e.target.value)}
              >
                <option value="pharmacy">MegaMart Pharmacy (Medicine - Close)</option>
                <option value="supermarket">Overrun Retail Plaza (Food - Mid)</option>
                <option value="fuel">Sector-9 Fuel Depot (Diesel Fuel - Mid)</option>
                <option value="purification">Riverway Water Outpost (Fresh Water - Near)</option>
                <option value="armory">Police Precinct 4 (Ammunition - Far)</option>
              </select>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px', fontStyle: 'italic' }}>
                {locations[targetPOI].description}
              </span>
            </div>

            {/* Config details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  2. SQUAD SIZE
                </label>
                <select 
                  className="cyber-select"
                  value={squadSize}
                  onChange={(e) => setSquadSize(parseInt(e.target.value) || 1)}
                >
                  <option value="1">1 Operator (Solo Scout)</option>
                  <option value="2">2 Operators (Buddy Team)</option>
                  <option value="3">3 Operators (Standard Fireteam)</option>
                  <option value="4">4 Operators (Enforced Fireteam)</option>
                  <option value="6">6 Operators (Colony Strike Squad)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  3. TIMING PROTOCOL
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <button 
                    type="button" 
                    className={`cyber-btn ${timeOfDay === 'day' ? 'active' : ''}`}
                    onClick={() => setTimeOfDay('day')}
                    style={{ padding: '6px', fontSize: '10px', justifyContent: 'center' }}
                  >
                    DAY LIGHT
                  </button>
                  <button 
                    type="button" 
                    className={`cyber-btn ${timeOfDay === 'night' ? 'active' : ''}`}
                    onClick={() => setTimeOfDay('night')}
                    style={{ padding: '6px', fontSize: '10px', justifyContent: 'center' }}
                  >
                    NIGHTFALL
                  </button>
                </div>
              </div>
            </div>

            {/* Gear provisions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--bg-black)', padding: '10px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  PROVISION AMMUNITION
                </label>
                <select 
                  className="cyber-select"
                  value={ammoAssigned}
                  onChange={(e) => setAmmoAssigned(parseInt(e.target.value) || 0)}
                  style={{ padding: '6px', fontSize: '11px' }}
                >
                  <option value="0">0 Rounds (Melee only)</option>
                  <option value="15">15 Rounds (Light Ammo)</option>
                  <option value="30">30 Rounds (Standard loadout)</option>
                  <option value="60">60 Rounds (Heavy Suppressive)</option>
                  <option value="100">100 Rounds (Maximum Supply)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  PROVISION MED-KITS
                </label>
                <select 
                  className="cyber-select"
                  value={medsAssigned}
                  onChange={(e) => setMedsAssigned(parseInt(e.target.value) || 0)}
                  style={{ padding: '6px', fontSize: '11px' }}
                >
                  <option value="0">0 Kits</option>
                  <option value="1">1 Med-kit</option>
                  <option value="2">2 Med-kits</option>
                  <option value="4">4 Med-kits (Emergency-heavy)</option>
                </select>
              </div>
            </div>

            <button 
              className="cyber-btn" 
              onClick={handleLaunch} 
              style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: '4px' }}
            >
              <Compass style={{ width: '16px', height: '16px' }} />
              LAUNCH EXPEDITION
            </button>

          </div>
        </div>

        {/* RISK CALCULATION READOUT */}
        <div className="cyber-panel primary-glow" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <ShieldAlert style={{ width: '18px', height: '18px' }} />
              HAZARD PROJECTION ENGINE
            </h3>

            <div style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--bg-black)', border: '1px solid var(--color-border)', borderRadius: '4px', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', fontFamily: 'var(--font-mono)' }}>
                ESTIMATED HAZARD THREAT SCORE
              </span>
              <span style={{ fontSize: '42px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: riskTier.color }}>
                {riskScore}%
              </span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: riskTier.color, fontWeight: 'bold', fontFamily: 'var(--font-display)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span className={`led-indicator ${riskTier.class}`}></span>
                {riskTier.label}
              </div>
            </div>

            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Target Distance:</span>
                <span style={{ color: 'var(--color-text-bright)' }}>{locations[targetPOI].dist} km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Base Location Threat:</span>
                <span style={{ color: 'var(--color-text-bright)' }}>{locations[targetPOI].baseRisk}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Time Complexity:</span>
                <span style={{ color: timeOfDay === 'night' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {timeOfDay === 'night' ? '+30 (Night Patrol)' : '0 (Daylight)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Squad Buff:</span>
                <span style={{ color: squadSize >= 4 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {squadSize === 1 ? '+25 (Vulnerable)' : squadSize >= 5 ? '-10 (Strong)' : 'Standard'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginTop: '12px' }}>
            * Projected hazard accounts for environmental factors, low light and undead density. Heavy ammunition loadouts and medical kits act as safety margins.
          </div>
        </div>

      </div>

      {/* DISPATCH MONITOR */}
      <div className="cyber-panel primary-glow" style={{ padding: '16px' }}>
        <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Activity style={{ width: '16px', height: '16px' }} />
          SATELLITE SQUAD DISPATCH CHANNELS
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeExpeditions.length === 0 ? (
            <div style={{ background: 'var(--bg-black)', border: '1px solid var(--color-border)', padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              No active expeditions. Plan a mission above and launch scouts.
            </div>
          ) : (
            activeExpeditions.map((exp) => (
              <div 
                key={exp.id} 
                style={{ 
                  background: 'var(--bg-black)', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '4px', 
                  padding: '12px',
                  display: 'grid',
                  gridTemplateColumns: '200px 1fr',
                  gap: '20px'
                }}
              >
                
                {/* Status Column */}
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                    {exp.location.toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    <span>SQUAD: {exp.squadSize}P</span>
                    <span>•</span>
                    <span style={{ color: exp.riskTier.color }}>{exp.riskTier.label}</span>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                      <span>Progress</span>
                      <span>{exp.progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-panel)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${exp.progress}%`, 
                          height: '100%', 
                          background: exp.status === 'completed' ? 'var(--color-success)' : 'var(--color-primary)',
                          transition: 'width 0.2s'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {exp.status === 'completed' ? (
                      <span style={{ color: 'var(--color-success)', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                        <CheckCircle style={{ width: '12px', height: '12px' }} />
                        SECURED: {exp.yieldDescription}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-primary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                        <Radio style={{ width: '12px', height: '12px', animation: 'led-flash 1s infinite alternate' }} />
                        COMM LINK ACTIVE ({exp.timer}s)
                      </span>
                    )}
                  </div>
                </div>

                {/* Radio Log Stream */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', display: 'block', borderBottom: '1px solid #1c222e', paddingBottom: '4px', marginBottom: '6px' }}>
                    RADIO CHANNEL SECURE READOUT
                  </span>
                  <div style={{ flexGrow: 1, maxHeight: '90px', overflowY: 'auto', background: '#050608', padding: '6px', border: '1px solid #141822', fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#88a855' }}>
                    {exp.logs.slice().reverse().map((log, i) => (
                      <div key={i} style={{ marginBottom: '2px', color: log.includes('ALERT') ? 'var(--color-danger)' : log.includes('confirmed') ? 'var(--color-success)' : '#88a855' }}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
