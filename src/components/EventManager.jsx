import React, { useEffect, useState } from 'react'
import { AlertTriangle, CloudLightning, ShieldAlert, Crosshair, Clock } from 'lucide-react'

// Constants
const EVENT_COOLDOWN_MS = 60 * 60 * 1000 // 1 Hour
// For testing/mocking, we can use a shorter cooldown, but we stick to 1 hour as requested.

const EVENT_TYPES = ['acid_rain', 'scavenger_raid', 'perimeter_breach']

export default function EventManager({
  activeEvent,
  lastEventTime,
  updateEventsData,
  sectors,
  updateSector,
  inventory,
  adjustInventory,
  addLog,
  triggerUINotification,
  currentUser,
  plannedRaids,
  updatePlannedRaids
}) {

  // 1. Random Event Generator & Resolver
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      const now = Date.now();

      // Check if we need to trigger a new event
      if (!activeEvent) {
        // If lastEventTime is 0, initialize it to now so it starts counting,
        // or trigger immediately for first time? Let's initialize to now.
        if (lastEventTime === 0) {
          updateEventsData({ lastEventTime: now });
          return;
        }

        if (now - lastEventTime > EVENT_COOLDOWN_MS) {
          // Trigger event!
          const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
          const targetSector = sectors[Math.floor(Math.random() * sectors.length)];
          
          let baseDuration = 10 * 60 * 1000; // 10 mins base
          if (type !== 'acid_rain') {
            // Guards reduce duration by 2 mins per guard, min 2 mins
            baseDuration = Math.max(2 * 60 * 1000, baseDuration - (targetSector.guards * 2 * 60 * 1000));
          }

          const newEvent = {
            id: now,
            type,
            targetSectorId: targetSector.id,
            startTime: now,
            duration: baseDuration,
            dispatcherId: currentUser.uid // This client handles the resolution
          };

          updateEventsData({
            activeEvent: newEvent,
            lastEventTime: now
          });
          
          triggerUINotification(`GLOBAL ALERT: ${type.toUpperCase()} DETECTED!`);
        }
      } else {
        // We have an active event. Is it time to resolve it?
        if (now > activeEvent.startTime + activeEvent.duration) {
          // Only the dispatcher resolves it to avoid duplicate damage
          // Fallback: if 5 minutes past duration and dispatcher is offline, anyone resolves
          const isDispatcher = activeEvent.dispatcherId === currentUser.uid;
          const isOrphaned = now > activeEvent.startTime + activeEvent.duration + (5 * 60 * 1000);

          if (isDispatcher || isOrphaned) {
            resolveEvent(activeEvent);
          }
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [activeEvent, lastEventTime, sectors, currentUser]);

  const resolveEvent = (event) => {
    const targetSector = sectors.find(s => s.id === event.targetSectorId);
    const guards = targetSector ? targetSector.guards : 0;

    let damageMsg = '';

    if (event.type === 'acid_rain') {
      // Damages water supply
      const waterLost = Math.floor(Math.random() * 50) + 20;
      adjustInventory('water', -waterLost);
      damageMsg = `Acid rain contaminated water supplies. Lost ${waterLost} L.`;
    } else if (event.type === 'scavenger_raid') {
      // Steals items, mitigated by guards
      const stealBase = 100;
      const amountStolen = Math.max(0, stealBase - (guards * 30));
      if (amountStolen > 0) {
        adjustInventory('food', -Math.floor(amountStolen * 0.5));
        adjustInventory('ammo', -Math.floor(amountStolen * 0.5));
        damageMsg = `Scavengers raided ${targetSector?.name}. Stole resources!`;
      } else {
        damageMsg = `Scavengers attempted to raid ${targetSector?.name} but were repelled by guards!`;
      }
      
      if (amountStolen > 30 && targetSector) {
        updateSector(targetSector.id, { status: 'damaged' });
      }
    } else if (event.type === 'perimeter_breach') {
      // Causes a breach
      const breachChance = Math.max(0.1, 0.9 - (guards * 0.2)); // 90% base, -20% per guard
      if (Math.random() < breachChance) {
        if (targetSector) {
          updateSector(targetSector.id, { status: 'breached' });
        }
        damageMsg = `Undead breached the perimeter at ${targetSector?.name}! Sector compromised.`;
      } else {
        damageMsg = `Breach attempted at ${targetSector?.name}. Guards successfully defended the wall.`;
      }
    }

    triggerUINotification(`EVENT RESOLVED: ${damageMsg}`);
    if (targetSector) {
      addLog(targetSector.id, 'SYSTEM', damageMsg);
    }

    // Clear event
    updateEventsData({ activeEvent: null });
  };

  // 2. Offensive Raids Resolver
  useEffect(() => {
    if (!plannedRaids || plannedRaids.length === 0 || !currentUser) return;

    const interval = setInterval(() => {
      const now = Date.now();
      let needsUpdate = false;

      const nextRaids = plannedRaids.filter(raid => {
        if (now > raid.executionTime) {
          // Time to resolve
          const isDispatcher = raid.dispatcherId === currentUser.uid;
          const isOrphaned = now > raid.executionTime + (5 * 60 * 1000);

          if (isDispatcher || isOrphaned) {
            resolveOffensiveRaid(raid);
            needsUpdate = true;
            return false; // Remove from list
          }
        }
        return true; // Keep in list
      });

      if (needsUpdate) {
        updatePlannedRaids(nextRaids);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [plannedRaids, currentUser]);

  const resolveOffensiveRaid = (raid) => {
    // Generate loot based on raider count
    const lootMulti = raid.raiders;
    const foodLoot = Math.floor(Math.random() * 50) * lootMulti;
    const ammoLoot = Math.floor(Math.random() * 80) * lootMulti;
    const scrapLoot = Math.floor(Math.random() * 20) * lootMulti;
    const medLoot = Math.floor(Math.random() * 5) * lootMulti;

    adjustInventory('food', foodLoot);
    adjustInventory('ammo', ammoLoot);
    adjustInventory('scraps', scrapLoot);
    adjustInventory('medicine', medLoot);

    triggerUINotification(`OFFENSIVE RAID SUCCESS: Strike team returned from ${raid.targetName}! Loot secured.`);
  };


  // Rendering Banner
  if (!activeEvent) return null;

  return (
    <div style={{
      background: 'var(--color-danger)',
      color: 'var(--bg-black)',
      padding: '12px 16px',
      margin: '16px 16px 0 16px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontWeight: 'bold',
      fontFamily: 'var(--font-display)',
      animation: 'led-flash 2s infinite alternate',
      boxShadow: '0 0 15px var(--color-danger)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertTriangle style={{ width: '20px', height: '20px' }} />
        <span style={{ fontSize: '16px', letterSpacing: '0.05em' }}>
          ACTIVE CRISIS PROTOCOL: {activeEvent.type.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock style={{ width: '14px', height: '14px' }} />
        TIME REMAINING: {Math.max(0, Math.floor((activeEvent.startTime + activeEvent.duration - Date.now()) / 60000))} MINS
      </div>
    </div>
  )
}
