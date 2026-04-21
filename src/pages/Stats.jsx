import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Skeleton from '../components/Skeleton'
import StrengthChart from '../components/StrengthChart'
import { totalEffectiveReps } from '../effectiveReps'
import allExercises from '../exercises.json'
import { supabase } from '../supabase'
import { formatDateKey } from '../utils/dateUtils'

function Stats({ user }) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])
  const [allSets, setAllSets] = useState([])
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [{ data: prs }, { data: sets }] = await Promise.all([
        supabase
          .from('personal_records')
          .select('*')
          .eq('user_id', user.id)
          .order('achieved_at', { ascending: false }),
        supabase
          .from('sets')
          .select('exercise_name, weight, reps, rir, logged_at')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: true }),
      ])

      const categoryByExercise = new Map()
      for (const item of allExercises) {
        categoryByExercise.set(item.name.toLowerCase(), item.category)
      }

      const byExercise = new Map()
      for (const row of prs ?? []) {
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
      setAllSets(sets ?? [])
      setLoading(false)
    }

    fetchData()
  }, [user.id, location.key])

  const exerciseLifetimeEffReps = useMemo(() => {
    const map = new Map()
    for (const set of allSets) {
      const key = set.exercise_name
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(set)
    }
    const totals = new Map()
    for (const [name, sets] of map.entries()) {
      totals.set(name, totalEffectiveReps(sets))
    }
    return totals
  }, [allSets])

  const groupedCategories = useMemo(() => {
    const grouped = {}
    for (const row of records) {
      if (!grouped[row.category]) grouped[row.category] = []
      grouped[row.category].push(row)
    }

    const categories = Object.keys(grouped).map((category) => {
      const totalEff = grouped[category].reduce(
        (sum, row) => sum + (exerciseLifetimeEffReps.get(row.exerciseName) ?? 0),
        0,
      )
      return { category, totalEff, entries: grouped[category] }
    })

    categories.sort((a, b) => b.totalEff - a.totalEff)
    return categories
  }, [records, exerciseLifetimeEffReps])

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ margin: '0 0 14px 0', fontSize: '24px', fontFamily: "'IBM Plex Mono', monospace" }}>STATS</h1>
      <p
        style={{
          margin: '0 0 10px 0',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontSize: '12px',
          fontFamily: "'Barlow', sans-serif",
        }}
      >
        PERSONAL RECORDS
      </p>

      {loading ? (
        <div style={{ padding: '16px' }}>
          <Skeleton width="80px" height="28px" style={{ marginBottom: '24px' }} />
          <Skeleton width="140px" height="11px" style={{ marginBottom: '12px' }} />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                marginBottom: '8px',
              }}
            >
              <Skeleton width="160px" height="16px" style={{ marginBottom: '10px' }} />
              <Skeleton width="120px" height="14px" style={{ marginBottom: '8px' }} />
              <Skeleton width="80px" height="12px" />
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--accent)', fontSize: '16px', marginBottom: '8px' }}>
            NO DATA YET
          </p>
          <p style={{ fontFamily: "'Barlow', sans-serif", color: 'var(--text-muted)', fontSize: '14px' }}>
            Log your first sets to start tracking progress
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {groupedCategories.map((group) => (
            <section key={group.category}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontSize: '11px',
                    fontFamily: "'Barlow', sans-serif",
                  }}
                >
                  {group.category}
                </p>
                <div style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {group.entries.map((row) => {
                  const isOpen = Boolean(expanded[row.exerciseName])
                  const lifetimeEff = exerciseLifetimeEffReps.get(row.exerciseName) ?? 0
                  return (
                    <div
                      key={row.exerciseName}
                      style={{ borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '10px' }}
                    >
                      <p style={{ margin: '0 0 6px 0', color: 'white', fontSize: '15px', fontFamily: "'Barlow', sans-serif", fontWeight: 500 }}>
                        {row.exerciseName}
                      </p>
                      <p style={{ margin: '0 0 4px 0', color: 'var(--accent)', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace" }}>
                        🏆 Best weight: {row.weightPR ?? '-'} kg
                      </p>
                      <p style={{ margin: '0 0 4px 0', color: 'white', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace" }}>
                        📦 Best set: {row.volumePR ?? '-'} kg
                      </p>
                      <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '12px', fontFamily: "'Barlow', sans-serif" }}>
                        Date: {formatDateKey(row.achievedAt)}
                      </p>
                      <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '12px', fontFamily: "'Barlow', sans-serif" }}>
                        {lifetimeEff} effective reps logged
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((prev) => ({
                              ...prev,
                              [row.exerciseName]: !prev[row.exerciseName],
                            }))
                          }
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontFamily: "'Barlow', sans-serif",
                          }}
                        >
                          {isOpen ? '▲ Hide progress' : '▼ Show progress'}
                        </button>
                      </div>
                      {isOpen ? <StrengthChart sets={allSets} exerciseName={row.exerciseName} /> : null}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export default Stats
