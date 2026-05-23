import React, { useState } from 'react'
import { Trophy, Users, Star, Target, Crown, Award, Activity } from 'lucide-react'

// Simulated mock data for factions
const INITIAL_FACTIONS = [
  { id: 'f-1', name: 'Iron Wolves', members: 42, score: 8520, status: 'Hostile', color: '239, 68, 68' },
  { id: 'f-2', name: 'Neon Vanguard', members: 128, score: 7100, status: 'Neutral', color: '59, 130, 246' },
  { id: 'f-3', name: 'Bronze Barrons (You)', members: 42, score: 2500, status: 'Friendly', color: '34, 197, 94' },
  { id: 'f-4', name: 'Scrap Barons', members: 15, score: 1950, status: 'Hostile', color: '245, 158, 11' },
  { id: 'f-5', name: 'Dust Walkers', members: 8, score: 1200, status: 'Neutral', color: '168, 85, 247' },
]

export default function GuildLeaderboard({ inventory, adjustInventory, triggerUINotification, population }) {
  const [factions, setFactions] = useState(INITIAL_FACTIONS)
  const [contributionAmount, setContributionAmount] = useState(10)

  // Sort factions by score
  const sortedFactions = [...factions].sort((a, b) => b.score - a.score)

  const handleContribute = (resourceKey) => {
    const item = inventory.find(i => i.key === resourceKey)
    if (!item) return

    if (item.quantity < contributionAmount) {
      triggerUINotification(`INSUFFICIENT ${item.name.toUpperCase()} TO CONTRIBUTE TO FACTION.`)
      return
    }

    // Deduct from local inventory
    adjustInventory(resourceKey, -contributionAmount)

    // Calculate score points (e.g. food/water = 1 point per unit, ammo/medicine = 5 points)
    const pointsPerUnit = (resourceKey === 'ammo' || resourceKey === 'medicine') ? 5 : 1
    const scoreIncrease = contributionAmount * pointsPerUnit

    // Update local faction score
    setFactions(prev => prev.map(f => {
      if (f.id === 'f-3') {
        return { ...f, score: f.score + scoreIncrease }
      }
      return f
    }))

    triggerUINotification(`CONTRIBUTED ${contributionAmount} ${item.unit} TO SECTOR-42. +${scoreIncrease} NETWORK POINTS.`)
  }

  // Helper to determine rank color
  const getRankColor = (index) => {
    if (index === 0) return 'var(--color-warning)' // Gold/Yellow
    if (index === 1) return '#e2e8f0' // Silver
    if (index === 2) return '#b45309' // Bronze
    return 'var(--color-text-muted)'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>

      {/* LOCAL FACTION DASHBOARD */}
      <div className="cyber-panel primary-glow" style={{ padding: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Crown style={{ width: '18px', height: '18px' }} />
          LOCAL FACTION HUB: SECTOR-42
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>

          <div style={{ background: 'var(--bg-black)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '12px' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>CURRENT STANDING</div>
            <div style={{ fontSize: '20px', fontFamily: 'var(--font-display)', color: 'var(--color-success)', fontWeight: 'bold' }}>
              RANK #{sortedFactions.findIndex(f => f.id === 'f-3') + 1}
            </div>
          </div>

          <div style={{ background: 'var(--bg-black)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '12px' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>NETWORK SCORE</div>
            <div style={{ fontSize: '20px', fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontWeight: 'bold' }}>
              {factions.find(f => f.id === 'f-3').score.toLocaleString()} PTS
            </div>
          </div>

          <div style={{ background: 'var(--bg-black)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '12px' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>ACTIVE MEMBERS</div>
            <div style={{ fontSize: '20px', fontFamily: 'var(--font-display)', color: 'var(--color-text-bright)', fontWeight: 'bold' }}>
              {population} / 100
            </div>
          </div>

        </div>

        {/* CONTRIBUTION AREA */}
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>
            CONTRIBUTE SURVIVAL RESOURCES TO BOOST FACTION STANDING:
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="number"
              className="cyber-input"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: '80px', padding: '6px', fontSize: '12px', textAlign: 'center' }}
            />

            {inventory.map(item => (
              <button
                key={item.key}
                className="cyber-btn"
                onClick={() => handleContribute(item.key)}
                style={{ padding: '6px 12px', fontSize: '11px' }}
                disabled={item.quantity < contributionAmount}
              >
                {item.icon} {item.name}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* GLOBAL LEADERBOARD */}
      <div className="cyber-panel primary-glow" style={{ padding: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Trophy style={{ width: '18px', height: '18px' }} />
          SECTOR-42 SYNDICATE LEADERBOARD
        </h3>

        <div style={{ background: 'var(--bg-darker)', border: '1px solid #1f2533', borderRadius: '4px', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 120px 100px', gap: '10px', padding: '10px 12px', background: 'var(--bg-black)', borderBottom: '1px solid var(--color-border)', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            <div>Rank</div>
            <div>Faction Name</div>
            <div>Members</div>
            <div>Status</div>
            <div style={{ textAlign: 'right' }}>Network Pts</div>
          </div>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sortedFactions.map((faction, index) => {
              const isLocal = faction.id === 'f-3'
              return (
                <div
                  key={faction.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 100px 120px 100px',
                    gap: '10px',
                    padding: '12px',
                    borderBottom: '1px solid #1f2533',
                    alignItems: 'center',
                    background: isLocal ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ color: getRankColor(index), fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    #{index + 1}
                    {index === 0 && <Star style={{ width: '12px', height: '12px' }} fill="currentColor" />}
                  </div>
                  <div style={{ fontWeight: 'bold', color: isLocal ? 'var(--color-success)' : 'var(--color-text-bright)', fontFamily: 'var(--font-display)', fontSize: '13px', letterSpacing: '0.05em' }}>
                    {faction.name}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users style={{ width: '12px', height: '12px' }} />
                    {isLocal ? population : faction.members}
                  </div>
                  <div>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '2px',
                      fontSize: '9px',
                      background: `rgba(${faction.color}, 0.1)`,
                      color: `rgb(${faction.color})`,
                      border: `1px solid rgba(${faction.color}, 0.3)`
                    }}>
                      {faction.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                    {faction.score.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>

    </div>
  )
}
