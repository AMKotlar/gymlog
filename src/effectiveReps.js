// The "proximity to failure" threshold.
// Only reps within this many reps of failure count as effective.
// Adjust this constant to change the model sensitivity.
const FAILURE_THRESHOLD = 5

function getRIRValue(rir) {
  if (rir === 0) return 0
  if (rir === 1) return 1.5
  return 4 // rir === 2 means "3+" - use 4 as conservative estimate
}

export function effectiveReps(reps, rir) {
  return Math.max(0, reps - getRIRValue(rir) - FAILURE_THRESHOLD)
}

export function totalEffectiveReps(sets) {
  // sets = array of { reps, rir }
  return sets.reduce((sum, set) => sum + effectiveReps(Number(set.reps), Number(set.rir)), 0)
}

export function effectiveRepsChange(currentSets, previousSets) {
  // Returns percentage change in effective reps vs previous session
  // Returns null if no previous data
  if (!previousSets || previousSets.length === 0) return null
  const current = totalEffectiveReps(currentSets)
  const previous = totalEffectiveReps(previousSets)
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}
