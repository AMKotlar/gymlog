import { supabase } from '../supabase'

export async function recalculatePRForExercise(userId, exerciseName) {
  const { data: sets } = await supabase
    .from('sets')
    .select('weight, reps')
    .eq('user_id', userId)
    .eq('exercise_name', exerciseName)

  if (!sets || sets.length === 0) {
    await supabase
      .from('personal_records')
      .delete()
      .eq('user_id', userId)
      .eq('exercise_name', exerciseName)
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
