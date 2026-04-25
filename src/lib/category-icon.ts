import type { LucideIcon } from 'lucide-react'
import {
  Beef,
  ChefHat,
  Drumstick,
  Egg,
  Fish,
  Gift,
  Sparkles,
} from 'lucide-react'

/** Small decorative icon per common meat-commerce category name (fallback: drumstick). */
export function getCategoryDecorativeIcon(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (n.includes('chicken') || n.includes('poultry')) return Drumstick
  if (n.includes('mutton') || n.includes('lamb') || n.includes('goat')) return Beef
  if (n.includes('beef')) return Beef
  if (n.includes('sea') || n.includes('fish') || n.includes('prawn') || n.includes('crab')) return Fish
  if (n.includes('egg')) return Egg
  if (n.includes('marin')) return Sparkles
  if (n.includes('ready') || n.includes('cook')) return ChefHat
  if (n.includes('combo')) return Gift
  return Drumstick
}
