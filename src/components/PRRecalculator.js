import { supabase } from '../supabase'

export async function recalculatePRForExercise(userId, exerciseName) {
  console.log('PRRecalculator: running for', exerciseName, userId)

  const { data: sets, error } = await supabase
    .from('sets')
    .select('weight, reps')
    .eq('user_id', userId)
    .eq('exercise_name', exerciseName)

  console.log('PRRecalculator: remaining sets:', sets, 'error:', error)

  if (!sets || sets.length === 0) {
    console.log('PRRecalculator: no sets left, deleting PR')
    const { error: deleteError } = await supabase
      .from('personal_records')
      .delete()
      .eq('user_id', userId)
      .eq('exercise_name', exerciseName)
    console.log('PRRecalculator: delete error:', deleteError)
    return
  }

  const bestWeight = Math.max(...sets.map((s) => Number(s.weight)))
  const bestVolume = Math.max(...sets.map((s) => Number(s.weight) * Number(s.reps)))

  await supabase
    .from('personal_records')
    .upsert(
      [
        {
          user_id: userId,
          exercise_name: exerciseName,
          pr_type: 'weight',
          value: bestWeight,
          achieved_at: new Date().toISOString(),
        },
        {
          user_id: userId,
          exercise_name: exerciseName,
          pr_type: 'volume',
          value: bestVolume,
          achieved_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'user_id,exercise_name,pr_type' },
    )
}
