import type { FoodTypeTag } from '../db/types'

// One-tap protein portions for fast logging (spec §5.3). Values are typical
// approximations for quick entry; the user can always edit kcal/protein.
export interface Portion {
  name: string
  kcal: number
  proteinG: number
  typeTag: FoodTypeTag
}

export const QUICK_PORTIONS: Portion[] = [
  { name: 'Protein shake (1 scoop)', kcal: 120, proteinG: 25, typeTag: 'leanProtein' },
  { name: 'Chicken breast (150 g)', kcal: 246, proteinG: 46, typeTag: 'leanProtein' },
  { name: 'Greek yoghurt (170 g)', kcal: 100, proteinG: 17, typeTag: 'dairy' },
  { name: 'Two eggs', kcal: 156, proteinG: 12, typeTag: 'leanProtein' },
  { name: 'Tin of tuna (95 g)', kcal: 100, proteinG: 23, typeTag: 'leanProtein' },
  { name: 'Tofu (150 g)', kcal: 180, proteinG: 17, typeTag: 'leanProtein' },
  { name: 'Lentils, cooked (1 cup)', kcal: 230, proteinG: 18, typeTag: 'vegFibre' },
  { name: 'Cottage cheese (100 g)', kcal: 98, proteinG: 11, typeTag: 'dairy' },
  { name: 'Mixed salad + dressing', kcal: 120, proteinG: 3, typeTag: 'vegFibre' },
  { name: 'Oats (60 g dry)', kcal: 228, proteinG: 8, typeTag: 'wholeCarb' },
]
