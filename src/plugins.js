import { Shield, Flame, Compass, Radio, BookOpen, Share2 } from 'lucide-react'

// Import components
import RadarMap from './components/RadarMap'
import InventoryTracker from './components/InventoryTracker'
import ExpeditionPlanner from './components/ExpeditionPlanner'
import MorseRadio from './components/MorseRadio'
import Manual from './components/Manual'
import MeshSync from './components/MeshSync'

export const plugins = [
  {
    id: 'radar',
    name: 'DEFENSE RADAR',
    icon: Shield,
    component: RadarMap
  },
  {
    id: 'inventory',
    name: 'RESERVES INDEX',
    icon: Flame,
    component: InventoryTracker
  },
  {
    id: 'expedition',
    name: 'EXPEDITIONS',
    icon: Compass,
    component: ExpeditionPlanner
  },
  {
    id: 'morse',
    name: 'FIELD TELEGRAPHY',
    icon: Radio,
    component: MorseRadio
  },
  {
    id: 'manual',
    name: 'SURVIVAL MANUAL',
    icon: BookOpen,
    component: Manual
  },
  {
    id: 'sync',
    name: 'MESH OFFLINE SYNC',
    icon: Share2,
    component: MeshSync
  }
]
