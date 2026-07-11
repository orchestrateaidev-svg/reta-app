import type { Units } from '../db/settings'

// Conversion + display helpers. Storage is ALWAYS metric (kg/cm/ml); imperial
// is a display/entry layer only, so the data model never becomes ambiguous.

export const KG_PER_LB = 0.45359237
export const CM_PER_IN = 2.54
export const ML_PER_FLOZ = 29.5735

export function kgToDisplay(kg: number, units: Units): number {
  return units === 'imperial' ? kg / KG_PER_LB : kg
}
export function displayToKg(v: number, units: Units): number {
  return units === 'imperial' ? v * KG_PER_LB : v
}
export function cmToDisplay(cm: number, units: Units): number {
  return units === 'imperial' ? cm / CM_PER_IN : cm
}
export function displayToCm(v: number, units: Units): number {
  return units === 'imperial' ? v * CM_PER_IN : v
}

export function weightUnit(units: Units): string {
  return units === 'imperial' ? 'lb' : 'kg'
}
export function lengthUnit(units: Units): string {
  return units === 'imperial' ? 'in' : 'cm'
}

export function fmtWeight(kg: number, units: Units, dp = 1): string {
  return `${kgToDisplay(kg, units).toFixed(dp)} ${weightUnit(units)}`
}

/** Water is always logged/targeted in ml internally; display in ml (metric)
 *  or fl oz (imperial). */
export function mlToDisplay(ml: number, units: Units): number {
  return units === 'imperial' ? ml / ML_PER_FLOZ : ml
}
export function fmtWater(ml: number, units: Units): string {
  if (units === 'imperial') return `${Math.round(mlToDisplay(ml, units))} fl oz`
  return ml >= 1000 ? `${(ml / 1000).toFixed(2)} L` : `${Math.round(ml)} ml`
}
