import React, { useState } from 'react'
import { Plus, Minus, Info, Flame, AlertCircle, TrendingDown, Users } from 'lucide-react'

export default function InventoryTracker({ inventory, adjustInventory, population, setPopulation, activeGuards }) {
  const [transactionAmount, setTransactionAmount] = useState(10)
  const [hoveredInfo, setHoveredInfo] = useState(null)

  // Standard consumption rates per person per day
  const baseRates = {
    food: 0.5,     // cans of food
    water: 2.0,    // liters of water
    medicine: 0.05, // kits
    ammo: 0.1,     // rounds (standard security expenditure)
    fuel: 0.15,    // liters (generators)
    scraps: 0      // scraps don't have a daily population burn rate
  }

  // Calculate active consumption rates
  // active sentinels consume extra food (high exertion)
  const sentinelExtraFood = activeGuards * 0.2

  const getDailyRate = (key) => {
    let rate = baseRates[key] * population
    if (key === 'food') {
      rate += sentinelExtraFood
    }
    return parseFloat(rate.toFixed(2))
  }

  const getDaysRemaining = (key, quantity) => {
    const dailyRate = getDailyRate(key)
    if (dailyRate <= 0) return Infinity
    return Math.floor(quantity / dailyRate)
  }

  const getStatus = (days) => {
    if (days <= 7) return { text: 'CRITICAL', color: 'var(--color-danger)', class: 'red' }
    if (days <= 21) return { text: 'WARNING', color: 'var(--color-warning)', class: 'yellow' }
    return { text: 'STABLE', color: 'var(--color-success)', class: 'green' }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
      
      {/* POPULATION & BURN RATE CONFIGURATOR */}
      <div className="cyber-panel primary-glow" style={{ padding: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Users style={{ width: '18px', height: '18px' }} />
          COLONY CONSUMPTION INDEX
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Colony Survivor Population:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '16px' }}>
                {population} Survivors
              </span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="200" 
              value={population} 
              onChange={(e) => setPopulation(parseInt(e.target.value) || 1)}
              style={{ width: '100%', accentColor: 'var(--color-primary)', background: 'var(--bg-panel)', height: '6px', borderRadius: '3px', outline: 'none' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              <span>1 MIN</span>
              <span>100 COMFORT CAP</span>
              <span>200 MAXIMUM</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-black)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '12px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Operational Intake Details
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Base Food Demands:</span>
              <span>{(population * baseRates.food).toFixed(1)} cans/day</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: activeGuards > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
              <span>Sentinel Exertion Bump (+0.2):</span>
              <span>+{sentinelExtraFood.toFixed(1)} cans/day ({activeGuards} posted)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #1c222e', paddingTop: '4px', marginTop: '4px', color: 'var(--color-text-bright)' }}>
              <span>Combined Water Flow:</span>
              <span>{getDailyRate('water').toFixed(1)} L/day</span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED SUPPLY LEDGER */}
      <div className="cyber-panel primary-glow" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame style={{ width: '18px', height: '18px' }} />
            RESOURCE RESERVES & RATIO TRACKER
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>ADJUSTMENT CHUNK SIZE:</span>
            <input 
              type="number" 
              className="cyber-input" 
              value={transactionAmount} 
              onChange={(e) => setTransactionAmount(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: '60px', padding: '4px 6px', fontSize: '11px', textAlign: 'center' }} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {inventory.map((item) => {
            const daily = getDailyRate(item.key)
            const daysLeft = getDaysRemaining(item.key, item.quantity)
            const status = getStatus(daysLeft)
            const pct = Math.min(100, Math.floor((item.quantity / item.max) * 100))

            return (
              <div 
                key={item.key} 
                className="inventory-item" 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '120px 1fr 180px', 
                  gap: '20px', 
                  alignItems: 'center',
                  background: 'var(--bg-darker)',
                  border: '1px solid #1f2533',
                  borderRadius: '4px',
                  padding: '12px'
                }}
              >
                {/* NAME & QUANTITY */}
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--color-primary)' }}>{item.icon}</span>
                    <span style={{ textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontSize: '12px' }}>{item.name}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--color-text-bright)', marginTop: '4px' }}>
                    {item.quantity} <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{item.unit}</span>
                  </div>
                </div>

                {/* PROGRESS BAR & STATS */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Capacity: {pct}%</span>
                    <span>Daily Burn: -{daily} {item.unit}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-black)', borderRadius: '4px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${pct}%`, 
                        height: '100%', 
                        background: daysLeft <= 7 ? 'var(--color-danger)' : daysLeft <= 21 ? 'var(--color-warning)' : 'var(--color-success)',
                        boxShadow: daysLeft <= 7 ? '0 0 8px var(--color-danger)' : 'none',
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                </div>

                {/* DAYS REMAINING & ADJUST CONTROLS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  {/* Depletion badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className={`led-indicator ${status.class}`}></span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 'bold', color: status.color }}>
                        {daysLeft === Infinity ? 'INFINITY' : `${daysLeft} DAYS`}
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      EST. DEPLETION
                    </span>
                  </div>

                  {/* Increment/Decrement Buttons */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      className="cyber-btn" 
                      onClick={() => adjustInventory(item.key, -transactionAmount)}
                      style={{ padding: '6px', width: '28px', height: '28px', justifyContent: 'center' }}
                      title={`Subtract ${transactionAmount} ${item.unit}`}
                    >
                      <Minus style={{ width: '12px', height: '12px' }} />
                    </button>
                    <button 
                      className="cyber-btn" 
                      onClick={() => adjustInventory(item.key, transactionAmount)}
                      style={{ padding: '6px', width: '28px', height: '28px', justifyContent: 'center' }}
                      title={`Add ${transactionAmount} ${item.unit}`}
                    >
                      <Plus style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>

                </div>

              </div>
            )
          })}
        </div>

        {/* RESOURCE DISASTER ADVISORY BANNER */}
        {inventory.some(item => getDaysRemaining(item.key, item.quantity) <= 7) && (
          <div style={{ background: 'rgba(255, 51, 51, 0.1)', border: '1px solid var(--color-danger)', borderRadius: '4px', padding: '10px', marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <AlertCircle style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-bright)' }}>
              <strong style={{ color: 'var(--color-danger)' }}>CRITICAL SHORTAGE DETECTED:</strong> One or more crucial resources have a forecasted reserves lifespan of under 7 days. Standard survival rations must be reduced by 30% immediately, or dispatch scavenging expeditions to prevent critical colony starvation.
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
