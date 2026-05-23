import React, { useState } from 'react'
import { Crosshair, Shield, Users, Clock, Database, AlertCircle, Droplet, Fuel, HeartPulse } from 'lucide-react'

export default function GuildRaids({
  plannedRaids,
  updatePlannedRaids,
  inventory,
  adjustInventory,
  triggerUINotification,
  currentUser
}) {
  const [targetName, setTargetName] = useState('Outpost Delta')
  const [raidersCount, setRaidersCount] = useState(1)

  // Cost Per Raider
  const COST_SCRAPS = 1
  const COST_AMMO = 5
  const COST_MEDKITS = 2
  const COST_WATER = 3

  const totalScrapsCost = raidersCount * COST_SCRAPS
  const totalAmmoCost = raidersCount * COST_AMMO
  const totalMedCost = raidersCount * COST_MEDKITS
  const totalWaterCost = raidersCount * COST_WATER

  const currentScraps = inventory.find(i => i.key === 'scraps')?.quantity || 0
  const currentAmmo = inventory.find(i => i.key === 'ammo')?.quantity || 0
  const currentMeds = inventory.find(i => i.key === 'medicine')?.quantity || 0
  const currentWater = inventory.find(i => i.key === 'water')?.quantity || 0

  const canAfford = currentScraps >= totalScrapsCost && currentAmmo >= totalAmmoCost && currentMeds >= totalMedCost && currentWater >= totalWaterCost

  const handlePlanRaid = (e) => {
    e.preventDefault()

    if (!currentUser) {
      triggerUINotification('AUTH ERROR: You must be logged in to plan a raid.', 'error')
      return
    }

    if (!canAfford) {
      triggerUINotification('INSUFFICIENT RESOURCES FOR RAID MOBILIZATION.', 'error')
      return
    }

    if (!targetName.trim()) {
      triggerUINotification('TARGET DESIGNATION REQUIRED.', 'error')
      return
    }

    // Deduct resources
    adjustInventory('scraps', -totalScrapsCost)
    adjustInventory('ammo', -totalAmmoCost)
    adjustInventory('medicine', -totalMedCost)
    adjustInventory('water', -totalWaterCost)

    const now = Date.now()
    const execTime = now + (2 * 60 * 60 * 1000) // 2 Hours from now

    const newRaid = {
      id: now,
      targetName,
      raiders: raidersCount,
      plannedTime: now,
      executionTime: execTime,
      dispatcherId: currentUser.uid,
      dispatcherName: currentUser.username || 'Commander'
    }

    updatePlannedRaids(prev => [...prev, newRaid])
    triggerUINotification(`RAID PLANNED: Strike team mobilized for ${targetName}. ETA 2 Hours.`)
    setTargetName('')
    setRaidersCount(1)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
      <div className="cyber-panel primary-glow" style={{ padding: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Crosshair style={{ width: '18px', height: '18px' }} />
          OFFENSIVE RAID MOBILIZATION
        </h3>

        <form onSubmit={handlePlanRaid} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>TARGET DESIGNATION</label>
            <input 
              type="text" 
              className="cyber-input" 
              value={targetName} 
              onChange={e => setTargetName(e.target.value)} 
              placeholder="e.g. Scavenger Camp, Rival Outpost..." 
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between' }}>
              <span>STRIKE TEAM SIZE</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{raidersCount} OPERATOR(S)</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={raidersCount} 
              onChange={e => setRaidersCount(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-primary)' }}
            />
          </div>

          <div style={{ background: 'var(--bg-black)', padding: '12px', borderRadius: '4px', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <div style={{ marginBottom: '8px', color: 'var(--color-text-muted)' }}>RESOURCE REQUIREMENTS (PER OPERATOR):</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ color: currentScraps >= totalScrapsCost ? 'var(--color-text-bright)' : 'var(--color-danger)' }}>
                🔩 Scraps: {totalScrapsCost} <span style={{ opacity: 0.5 }}>/ {currentScraps}</span>
              </div>
              <div style={{ color: currentAmmo >= totalAmmoCost ? 'var(--color-text-bright)' : 'var(--color-danger)' }}>
                ⚔️ Ammo: {totalAmmoCost} <span style={{ opacity: 0.5 }}>/ {currentAmmo}</span>
              </div>
              <div style={{ color: currentMeds >= totalMedCost ? 'var(--color-text-bright)' : 'var(--color-danger)' }}>
                💉 Meds: {totalMedCost} <span style={{ opacity: 0.5 }}>/ {currentMeds}</span>
              </div>
              <div style={{ color: currentWater >= totalWaterCost ? 'var(--color-text-bright)' : 'var(--color-danger)' }}>
                💧 Water: {totalWaterCost} <span style={{ opacity: 0.5 }}>/ {currentWater}</span>
              </div>
            </div>
            {!canAfford && (
              <div style={{ color: 'var(--color-danger)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={12} /> INSUFFICIENT RESOURCES
              </div>
            )}
          </div>

          <button type="submit" className="cyber-btn" disabled={!canAfford} style={{ justifyContent: 'center', padding: '12px', fontWeight: 'bold', letterSpacing: '0.1em' }}>
            MOBILIZE STRIKE TEAM
          </button>
        </form>
      </div>

      <div className="cyber-panel primary-glow" style={{ padding: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Clock style={{ width: '18px', height: '18px' }} />
          ACTIVE DEPLOYMENTS
        </h3>

        {(!plannedRaids || plannedRaids.length === 0) ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '20px 0' }}>
            NO STRIKE TEAMS CURRENTLY MOBILIZED
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {plannedRaids.map(raid => (
              <div key={raid.id} style={{ background: 'var(--bg-black)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'bold', color: 'var(--color-text-bright)' }}>
                    TARGET: {raid.targetName.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', background: 'rgba(34,197,94,0.1)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: '2px' }}>
                    IN PROGRESS
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  <div>OPERATORS: {raid.raiders}</div>
                  <div>DISPATCHER: {raid.dispatcherName}</div>
                  <div style={{ gridColumn: '1 / -1', color: 'var(--color-warning)' }}>
                    ETA: {Math.max(0, Math.floor((raid.executionTime - Date.now()) / 60000))} MINUTES
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
