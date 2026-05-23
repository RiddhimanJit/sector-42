import React, { useState, useEffect, useCallback } from 'react'
import { 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX,
  AlertOctagon,
  BatteryCharging,
  Eye,
  EyeOff
} from 'lucide-react'

import BootScreen from './components/BootScreen'
import SignUp from './components/SignUp'
import { plugins } from './plugins'
import { subscribeToAuthChanges, syncUserData, isConfigured, seedFactionsIfEmpty, logoutUser } from './services/firebase'

const DEFAULT_SECTORS = [
  { id: 'wt-1', name: 'Watchtower NW', status: 'secure', guards: 1, logs: [{ timestamp: '18:10', operator: 'Sentinel-1', message: 'Perimeter check complete. Visual range clear.' }] },
  { id: 'wt-2', name: 'Watchtower NE', status: 'secure', guards: 1, logs: [{ timestamp: '18:12', operator: 'Sentinel-2', message: 'Night vision sensors operational. No thermal signatures.' }] },
  { id: 'wt-3', name: 'Watchtower SW', status: 'secure', guards: 1, logs: [{ timestamp: '18:15', operator: 'Sentinel-3', message: 'Low-voltage fence operational.' }] },
  { id: 'wt-4', name: 'Watchtower SE', status: 'secure', guards: 1, logs: [{ timestamp: '18:18', operator: 'Sentinel-1', message: 'Audio pickups filtered. Minor wind noise registered.' }] },
  { id: 'gate-a', name: 'Gate Alpha', status: 'secure', guards: 2, logs: [{ timestamp: '18:05', operator: 'Sentinel-2', message: 'Reinforced hydraulic gates locked and pressured.' }] },
  { id: 'farms', name: 'Crop Farms', status: 'secure', guards: 0, logs: [{ timestamp: '17:30', operator: 'Commander', message: 'Hydroponics yield registered +12 cans food.' }] },
  { id: 'water', name: 'H2O Purifier', status: 'secure', guards: 0, logs: [{ timestamp: '17:45', operator: 'Commander', message: 'Atmospheric filters sweep complete.' }] },
  { id: 'medical', name: 'Med Bay', status: 'secure', guards: 0, logs: [{ timestamp: '17:15', operator: 'Sentinel-3', message: 'Disinfection system status: NOMINAL.' }] },
  { id: 'command', name: 'HQ Bunker', status: 'secure', guards: 1, logs: [{ timestamp: '18:00', operator: 'Commander', message: 'Tactical mainframe online. Beacon on backup fuel.' }] }
]

const DEFAULT_INVENTORY = [
  { key: 'food', name: 'Food Rations', quantity: 180, max: 500, unit: 'cans', icon: '🥫' },
  { key: 'water', name: 'Fresh H2O', quantity: 450, max: 1000, unit: 'liters', icon: '💧' },
  { key: 'medicine', name: 'Trauma Kits', quantity: 18, max: 50, unit: 'kits', icon: '💉' },
  { key: 'ammo', name: '5.56mm Rounds', quantity: 340, max: 1000, unit: 'rds', icon: '⚔️' },
  { key: 'fuel', name: 'Diesel Fuel', quantity: 95, max: 200, unit: 'L', icon: '🔥' }
]

export default function App() {
  const [booted, setBooted] = useState(false)
  const [activeTab, setActiveTab] = useState('radar')
  const [currentUser, setCurrentUser] = useState(undefined)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [population, setPopulation] = useState(42)
  const [inventory, setInventory] = useState(DEFAULT_INVENTORY)
  const [sectors, setSectors] = useState(DEFAULT_SECTORS)
  
  // Terminal Customization states
  const [lowPowerMode, setLowPowerMode] = useState(false)
  const [crtOverlay, setCrtOverlay] = useState(true)
  const [soundVolume, setSoundVolume] = useState(0.5) // 0 to 1
  const [notifications, setNotifications] = useState([])
  const [globalStatus, setGlobalStatus] = useState('secure') // secure, alert, breached

  const handleBootComplete = useCallback(() => {
    setBooted(true)
  }, [])

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      triggerUINotification('MESH CONNECTION RESTORED. Online operations active.')
    }
    const handleOffline = () => {
      setIsOnline(false)
      triggerUINotification('MESH CONNECTION LOST. Operating in offline cache mode.')
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auth Subscription
  useEffect(() => {
    seedFactionsIfEmpty()
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user)
      if (user && user.inventory && user.inventory.length > 0) {
        setInventory(user.inventory)
      }
    })
    return () => unsubscribe()
  }, [])

  // Trigger brief military notification ticker in top right
  const triggerUINotification = (text) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const newNotif = { id: Date.now(), text, timestamp }
    setNotifications(prev => [newNotif, ...prev].slice(0, 5))
  }

  // Handle global status updates based on sector changes
  useEffect(() => {
    const hasBreach = sectors.some(s => s.status === 'breached')
    const hasAlert = sectors.some(s => s.status === 'alert')
    
    if (hasBreach) {
      setGlobalStatus('breached')
    } else if (hasAlert) {
      setGlobalStatus('alert')
    } else {
      setGlobalStatus('secure')
    }
  }, [sectors])

  // Count active sentinels actively posted in fields
  const getActiveGuards = () => {
    return sectors.reduce((acc, curr) => acc + curr.guards, 0)
  }

  // Adjust Inventory items safely
  const adjustInventory = (key, delta) => {
    setInventory(prev => prev.map(item => {
      if (item.key === key) {
        const nextQty = Math.max(0, Math.min(item.max, item.quantity + delta))
        if (nextQty !== item.quantity) {
          triggerUINotification(`${item.name} stock adjusted: ${delta > 0 ? '+' : ''}${delta} ${item.unit}`)
        }
        return { ...item, quantity: nextQty }
      }
      return item
    }))
  }

  // Specific callback for expeditions yielding resources
  const addInventoryResources = (key, quantity) => {
    adjustInventory(key, quantity)
  }

  // Update Sector properties (e.g. guards, alert level status)
  const updateSector = (id, newProps) => {
    setSectors(prev => prev.map(sector => {
      if (sector.id === id) {
        return { ...sector, ...newProps }
      }
      return sector
    }))
  }

  // Add a secure military record to a specific sector log index
  const addLog = (sectorId, operator, message) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setSectors(prev => prev.map(sector => {
      if (sector.id === sectorId) {
        const updatedLogs = [...sector.logs, { timestamp, operator, message }]
        return { ...sector, logs: updatedLogs }
      }
      return sector
    }))
    triggerUINotification(`NEW SEC-LOG: ${message.slice(0, 32)}...`)
  }

  // Global Sync exporter
  const exportState = () => {
    return {
      population,
      inventory: inventory.map(item => ({ key: item.key, quantity: item.quantity })),
      sectors: sectors.map(sec => ({ id: sec.id, status: sec.status, guards: sec.guards }))
    }
  }

  // Global Sync importer
  const importState = (importedData) => {
    try {
      if (importedData.population) setPopulation(importedData.population)
      if (importedData.inventory) {
        setInventory(prev => prev.map(item => {
          const match = importedData.inventory.find(i => i.key === item.key)
          return match ? { ...item, quantity: match.quantity } : item
        }))
      }
      if (importedData.sectors) {
        setSectors(prev => prev.map(sec => {
          const match = importedData.sectors.find(s => s.id === sec.id)
          if (match) {
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            return {
              ...sec,
              status: match.status || sec.status,
              guards: typeof match.guards === 'number' ? match.guards : sec.guards,
              logs: [...sec.logs, { timestamp, operator: 'MESH-SYNC', message: `Telemetry restored from offline sync.` }]
            }
          }
          return sec
        }))
      }
      triggerUINotification('OFFLINE SYNC: Restored operations profile successfully.')
      return true
    } catch (e) {
      console.error('Mesh Sync Load Fail:', e)
      return false
    }
  }

  // Global Survival depletion ticks (every 10 seconds, resource burn rate simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      // Consumption rules:
      // Food = 0.5 per survivor + 0.2 per guard posted
      const activeGuards = getActiveGuards()
      const foodDailyRate = (population * 0.5) + (activeGuards * 0.2)
      // Water = 2.0 per survivor
      const waterDailyRate = population * 2.0
      // Fuel = 0.15 for HQ generators
      const fuelDailyRate = 8.5

      // Convert daily rates into a brief 5-second interval fraction (1 day = simulated 60s)
      const simulationFraction = 5 / 60
      const foodDeduction = Math.max(1, Math.round(foodDailyRate * simulationFraction))
      const waterDeduction = Math.max(1, Math.round(waterDailyRate * simulationFraction))
      const fuelDeduction = Math.max(1, Math.round(fuelDailyRate * simulationFraction))

      // Apply deductions
      setInventory(prev => prev.map(item => {
        if (item.key === 'food') return { ...item, quantity: Math.max(0, item.quantity - foodDeduction) }
        if (item.key === 'water') return { ...item, quantity: Math.max(0, item.quantity - waterDeduction) }
        if (item.key === 'fuel') return { ...item, quantity: Math.max(0, item.quantity - fuelDeduction) }
        return item
      }))

      // Periodic security logging simulation
      if (Math.random() > 0.75) {
        const selectedSec = sectors[Math.floor(Math.random() * sectors.length)]
        const scoutNames = ['Sentinel-1', 'Sentinel-3', 'Scout-Lead']
        const msgs = [
          'Scanned sector boundary. Grid integrity within bounds.',
          'Detected ambient movement. Resolved: wind blown foliage.',
          'HQ automated check-in recorded. Secondary capacitor holding charge.',
          'Inspected sector water line valves. No drop in flow pressure.'
        ]
        const finalMsg = msgs[Math.floor(Math.random() * msgs.length)]
        addLog(selectedSec.id, scoutNames[Math.floor(Math.random() * scoutNames.length)], finalMsg)
      }

      // Background Sync to Firebase
      if (isOnline && currentUser && isConfigured) {
        setInventory(currentInv => {
          syncUserData(currentUser.uid, currentInv).catch(e => console.error("Sync failed", e));
          return currentInv;
        });
      }

    }, 10000)

    return () => clearInterval(interval)
  }, [population, sectors])

  // Set the CRT effect and low power classes
  const getAppClasses = () => {
    let classes = 'crt-container'
    if (lowPowerMode) classes += ' low-bandwidth'
    if (globalStatus === 'breached') classes += ' emergency-red-flash'
    return classes
  }

  if (!booted) {
    return <BootScreen onComplete={handleBootComplete} />
  }

  if (currentUser === undefined) {
    return <div className="crt-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>AUTHENTICATING UPLINK...</div>
  }

  if (!currentUser) {
    if (!isOnline) {
      return (
        <div className="crt-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="cyber-panel primary-glow" style={{ textAlign: 'center', padding: '32px', maxWidth: '400px' }}>
            <AlertOctagon style={{ width: '48px', height: '48px', color: 'var(--color-danger)', marginBottom: '16px', margin: '0 auto' }} />
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-danger)', fontSize: '20px' }}>OFFLINE MODE</h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '16px', lineHeight: '1.5' }}>
              Network connection required for initial boot sequence and user authentication.
              <br/><br/>Please restore mesh connection to continue.
            </p>
          </div>
        </div>
      )
    }
    return <SignUp />
  }

  return (
    <div className={getAppClasses()} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* CRT OVERLAY LAYER SHIELD */}
      {crtOverlay && !lowPowerMode && (
        <>
          <div className="crt-overlay" />
          <div className="crt-vignette" />
          <div className="crt-flicker" />
        </>
      )}

      {/* HEADER SECTION PANEL */}
      <header className="cyber-panel primary-glow" style={{ margin: '16px', padding: '16px', borderBottom: '1px solid var(--color-border)', borderRadius: '4px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          
          {/* Logo Title & User Info */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`led-indicator ${globalStatus === 'secure' ? 'green' : globalStatus === 'alert' ? 'yellow' : 'red'}`} style={{ width: '12px', height: '12px' }}></span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '0.15em', color: 'var(--color-primary)', fontWeight: '900' }}>
                  SECTOR-42 // TSOC
                </h1>
              </div>
              <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px', letterSpacing: '0.05em' }}>
                TACTICAL SURVIVAL & OPERATIONS COMMAND TERMINAL
              </span>
            </div>
            
            {currentUser && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '1px solid var(--color-border)', paddingLeft: '16px', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                  OP: {currentUser.username || currentUser.email}
                </span>
                <button 
                  onClick={() => { logoutUser(); setBooted(false); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '9px', fontFamily: 'var(--font-mono)', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                >
                  [ DISCONNECT ]
                </button>
              </div>
            )}
          </div>

          {/* Operational Alert Levels */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--bg-black)', border: '1px solid var(--color-border)', padding: '8px 16px', borderRadius: '4px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>TACTICAL ALERT:</span>
            <span style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 'bold', 
              fontSize: '13px', 
              letterSpacing: '0.1em',
              color: globalStatus === 'breached' ? 'var(--color-danger)' : globalStatus === 'alert' ? 'var(--color-warning)' : 'var(--color-success)',
              textShadow: globalStatus === 'breached' ? '0 0 6px var(--color-danger)' : 'none'
            }}>
              {globalStatus.toUpperCase()}
            </span>
          </div>

          {/* Utility Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Battery Power Bandwidth Toggle */}
            <button 
              className={`cyber-btn ${lowPowerMode ? 'active' : ''}`}
              onClick={() => {
                setLowPowerMode(!lowPowerMode)
                triggerUINotification(lowPowerMode ? 'Normal tactical aesthetics restored.' : 'LOW POWER MODE ON: CPU load and glow minimized.')
              }}
              style={{ padding: '6px 12px', fontSize: '11px' }}
              title="Toggle Low Bandwidth / Low Power Monochrome Styles"
            >
              <BatteryCharging style={{ width: '14px', height: '14px' }} />
              {lowPowerMode ? 'FULL SPEED' : 'LOW POWER'}
            </button>

            {/* CRT visual toggle */}
            {!lowPowerMode && (
              <button 
                className={`cyber-btn ${crtOverlay ? 'active' : ''}`}
                onClick={() => setCrtOverlay(!crtOverlay)}
                style={{ padding: '6px 10px' }}
                title="Toggle Scanline Grid Tones"
              >
                {crtOverlay ? <Eye style={{ width: '14px', height: '14px' }} /> : <EyeOff style={{ width: '14px', height: '14px' }} />}
              </button>
            )}

            {/* Audio configuration */}
            <button 
              className={`cyber-btn ${soundVolume > 0 ? 'active' : ''}`}
              onClick={() => {
                const nextVol = soundVolume > 0 ? 0 : 0.5
                setSoundVolume(nextVol)
                triggerUINotification(nextVol > 0 ? 'Synthesizer speakers un-muted.' : 'Audio indicators quieted.')
              }}
              style={{ padding: '6px 10px' }}
              title="Mute Shortwave Synthesizer"
            >
              {soundVolume > 0 ? <Volume2 style={{ width: '14px', height: '14px' }} /> : <VolumeX style={{ width: '14px', height: '14px' }} />}
            </button>
          </div>

        </div>
      </header>

      {/* BODY CONTENT GRID AREA */}
      <main style={{ flexGrow: 1, padding: '0 16px 16px 16px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* SIDE BAR SECTOR NAV TAB BUTTONS */}
        <section className="cyber-panel primary-glow" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
            COMMAND CONSOLE NAVIGATION
          </span>

          {plugins.map(plugin => {
            const Icon = plugin.icon;
            return (
              <button 
                key={plugin.id}
                className={`cyber-btn ${activeTab === plugin.id ? 'active' : ''}`} 
                onClick={() => setActiveTab(plugin.id)}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                <Icon style={{ width: '16px', height: '16px' }} />
                {plugin.name}
              </button>
            )
          })}

          {/* TELEMETRY READOUT SUMMARY IN SIDEBAR */}
          <div style={{ marginTop: '16px', background: 'var(--bg-black)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
              TELEMETRY BRIEF
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Population:</span>
              <span style={{ color: 'var(--color-text-bright)', fontWeight: 'bold' }}>{population} survivors</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Posted Sentinels:</span>
              <span style={{ color: 'var(--color-text-bright)', fontWeight: 'bold' }}>{getActiveGuards()} sentinels</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Water Levels:</span>
              <span style={{ color: inventory.find(i => i.key === 'water').quantity < 200 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 'bold' }}>
                {inventory.find(i => i.key === 'water').quantity} L
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Food Reserves:</span>
              <span style={{ color: inventory.find(i => i.key === 'food').quantity < 60 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 'bold' }}>
                {inventory.find(i => i.key === 'food').quantity} cans
              </span>
            </div>
          </div>

        </section>

        {/* MAIN PANEL CONTENT FEED VIEWPORTS */}
        <section style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TAB ROUTING DISPLAY VIEWER */}
          {(() => {
            const activePlugin = plugins.find(p => p.id === activeTab);
            const ActiveComponent = activePlugin ? activePlugin.component : null;

            if (!ActiveComponent) return null;

            return (
              <ActiveComponent 
                sectors={sectors} 
                updateSector={updateSector} 
                addLog={addLog} 
                lowBandwidth={lowPowerMode} 
                inventory={inventory} 
                adjustInventory={adjustInventory}
                population={population}
                setPopulation={setPopulation}
                activeGuards={getActiveGuards()}
                addInventoryResources={addInventoryResources}
                triggerUINotification={triggerUINotification}
                exportState={exportState}
                importState={importState}
                currentUser={currentUser}
                isOnline={isOnline}
              />
            )
          })()}

        </section>
      </main>

      {/* FOOTER TICKER BANNER TACTICAL NOTIFICATIONS */}
      <footer className="cyber-panel primary-glow" style={{ margin: '0 16px 16px 16px', padding: '10px 16px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '75%' }}>
          <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>SECURE LIVE NOTIFICATIONS feed // </span>
          <span style={{ color: 'var(--color-text-bright)', animation: notifications[0] ? 'led-flash 0.5s 2 alternate' : 'none' }}>
            {notifications[0] ? `[${notifications[0].timestamp}] ${notifications[0].text}` : '[NOMINAL STATUS OPERATIONAL: Awaiting telemetry activity]'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isOnline ? 'var(--color-text-muted)' : 'var(--color-danger)' }}>
          {isOnline ? <Wifi style={{ width: '12px', height: '12px', color: 'var(--color-primary)' }} /> : <WifiOff style={{ width: '12px', height: '12px', color: 'var(--color-danger)' }} />}
          <span>{isOnline ? 'MESH-CONNECTED' : 'OFFLINE MODE'}</span>
        </div>
      </footer>

    </div>
  )
}
