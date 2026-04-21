import { useEffect, useMemo, useState } from 'react'
import { totalEffectiveReps } from '../effectiveReps'
import exercises from '../exercises.json'
import { supabase } from '../supabase'
import { formatDateKey } from '../utils/dateUtils'

const categories = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio']

function PRs({ user }) {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])
  const [allSets, setAllSets] = useState([])
  const [expanded, setExpanded] = useState(
    categories.reduce((acc, item) => ({ ...acc, [item]: true }), {}),
  )

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true)
      const [{ data: prData }, { data: setsData }, { data: allSetsData }] = await Promise.all([
        supabase
          .from('personal_records')
          .select('*')
          .eq('user_id', user.id)
          .order('exercise_name', { ascending: true }),
        supabase
          .from('sets')
          .select('exercise_name')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(200),
        supabase
          .from('sets')
          .select('reps, rir, exercise_name')
          .eq('user_id', user.id),
      ])

      const categoryByExercise = new Map()
      for (const item of exercises) {
        categoryByExercise.set(item.name.toLowerCase(), item.category)
      }
      for (const item of setsData ?? []) {
        const key = item.exercise_name?.toLowerCase()
        if (!key) continue
        if (!categoryByExercise.has(key)) {
          categoryByExercise.set(key, 'Core')
        }
      }

      const byExercise = new Map()
      for (const row of prData ?? []) {
        const key = row.exercise_name
        if (!byExercise.has(key)) {
          byExercise.set(key, {
            exerciseName: row.exercise_name,
            category: categoryByExercise.get(row.exercise_name.toLowerCase()) ?? 'Core',
            weightPR: null,
            volumePR: null,
            achievedAt: row.achieved_at,
          })
        }
        const current = byExercise.get(key)
        if (row.pr_type === 'weight') current.weightPR = Number(row.value)
        if (row.pr_type === 'volume') current.volumePR = Number(row.value)
        if (new Date(row.achieved_at) > new Date(current.achievedAt)) {
          current.achievedAt = row.achieved_at
        }
      }

      setRecords(Array.from(byExercise.values()))
      setAllSets(allSetsData ?? [])
      setLoading(false)
    }

    fetchRecords()
  }, [user.id])

  const grouped = useMemo(() => {
    const map = categories.reduce((acc, item) => ({ ...acc, [item]: [] }), {})
    for (const item of records) {
      if (!map[item.category]) map[item.category] = []
      map[item.category].push(item)
    }
    return map
  }, [records])

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '14px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Personal Records</h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '62px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '16px', color: 'var(--text-secondary)' }}>
          Log your first sets to start tracking PRs
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {categories.map((category) => {
            const entries = grouped[category] ?? []
            if (entries.length === 0) return null
            const isOpen = expanded[category]

            return (
              <div key={category} style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => ({ ...prev, [category]: !prev[category] }))}
                  style={{ width: '100%', minHeight: '44px', border: 'none', background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '12px', fontWeight: 600 }}
                >
                  <span>{category}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen ? (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {entries.map((row) => (
                      <div key={row.exerciseName} style={{ borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-base)', padding: '10px' }}>
                        {(() => {
                          const exerciseSets = allSets.filter((s) => s.exercise_name === row.exerciseName)
                          const totalEffReps = totalEffectiveReps(exerciseSets)
                          return (
                            <>
                              <p style={{ margin: '0 0 6px 0', color: 'white', fontSize: '14px', fontWeight: 500 }}>{row.exerciseName}</p>
                              <p style={{ margin: '0 0 4px 0', color: 'var(--accent)', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace" }}>
                                🏆 Best weight: {row.weightPR ?? '-'} kg
                              </p>
                              <p style={{ margin: '0 0 4px 0', color: 'var(--accent)', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace" }}>
                                📦 Best set: {row.volumePR ?? '-'} kg
                              </p>
                              <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                                Date achieved: {formatDateKey(row.achievedAt)}
                              </p>
                              <p
                                style={{
                                  fontFamily: "'Barlow', sans-serif",
                                  fontSize: '12px',
                                  color: 'var(--text-muted)',
                                  marginTop: '6px',
                                  marginBottom: 0,
                                }}
                              >
                                {totalEffReps} effective reps logged lifetime
                              </p>
                            </>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PRs
