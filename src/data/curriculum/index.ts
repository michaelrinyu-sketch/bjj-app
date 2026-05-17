import type { GymSystem } from '../../types/app'
import type { Technique } from './traditional'
import { traditionalCurriculum } from './traditional'
import { tenthPlanetCurriculum } from './tenth-planet'
import { gracieCombativesCurriculum } from './gracie-combatives'
import { gracieBaurraCurriculum } from './gracie-barra'

export type { Technique }

export const CURRICULUM_MAP: Record<GymSystem, Technique[]> = {
  traditional: traditionalCurriculum,
  tenth_planet: tenthPlanetCurriculum,
  gracie_combatives: gracieCombativesCurriculum,
  gracie_barra: gracieBaurraCurriculum,
  custom: [], // User builds their own
}

export function getCurriculum(system: GymSystem): Technique[] {
  return CURRICULUM_MAP[system] ?? []
}

export function getCurriculumByBelt(system: GymSystem, belt: string): Technique[] {
  return getCurriculum(system).filter(t => t.belt === belt)
}

// Maps video position labels to curriculum category names
const POSITION_CATEGORIES: Record<string, string[]> = {
  'Standing':    ['Takedowns', 'Fundamentals'],
  'Guard':       ['Guard', 'Guard Passing'],
  'Half Guard':  ['Guard'],
  'Butterfly':   ['Guard'],
  'Mount':       ['Mount'],
  'Back':        ['Back Control'],
  'Side Control':['Side Control'],
  'Submissions': [],  // all — submissions span every position
  'Takedowns':   ['Takedowns'],
  'Other':       [],  // all
}

// Subcategory keyword refinements for positions that map to a broad category
const POSITION_SUBCATEGORY_KEYWORDS: Partial<Record<string, string>> = {
  'Half Guard': 'half',
  'Butterfly':  'butterfly',
}

export function getTechniquesForPosition(system: GymSystem, position: string): Technique[] {
  const all = getCurriculum(system)
  const cats = POSITION_CATEGORIES[position]
  if (!cats || cats.length === 0) return all

  let filtered = all.filter(t => cats.includes(t.category))

  const subKeyword = POSITION_SUBCATEGORY_KEYWORDS[position]
  if (subKeyword) {
    const refined = filtered.filter(t => t.subcategory.toLowerCase().includes(subKeyword))
    if (refined.length > 0) filtered = refined
  }

  return filtered
}

export function getCurriculumGrouped(system: GymSystem, belt?: string): Record<string, Record<string, Technique[]>> {
  const techniques = belt ? getCurriculumByBelt(system, belt) : getCurriculum(system)
  const result: Record<string, Record<string, Technique[]>> = {}

  for (const technique of techniques) {
    if (!result[technique.category]) result[technique.category] = {}
    if (!result[technique.category][technique.subcategory]) result[technique.category][technique.subcategory] = []
    result[technique.category][technique.subcategory].push(technique)
  }

  return result
}
