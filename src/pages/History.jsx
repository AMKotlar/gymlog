import { useEffect, useMemo, useState } from 'react'
import { recalculatePRForExercise } from '../components/PRRecalculator'
import Skeleton from '../components/Skeleton'
import { supabase } from '../supabase'

function rirClass(rir) {
  if (rir === 0) return 'bg-red-500/20 text-red-300'
  if (rir === 1) return 'bg-amber-500/20 text-amber-300'
  return 'bg-green-500/20 text-green-300'
}

function History({ user }) {
  const [sets, setSets] = useState([])
  const [sessions, setSessions] = useState([])
  const [expandedDate, setExpandedDate] = useState('')
  const [editingSetId, setEditingSetId] = useState('')
  const [editForm, setEditForm] = useState({ weight: '', reps: '', rir: 1 })
  const [loading, setLoading] = useState(true)

  const fetchHistoryData = async () => {
    setLoading(true)
    const [setsResponse, sessionsResponse] = await Promise.all([
      supabase
        .from('sets')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false }),
      supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
    ])

    setSets(setsResponse.data ?? [])
    setSessions(sessionsResponse.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchHistoryData()
  }, [user.id])

  const sessionByDate = useMemo(() => {
    const map = new Map()
    for (const session of sessions) {
      if (!map.has(session.date)) {
        map.set(session.date, session)
      }
    }
    return map
  }, [sessions])

  const beginEdit = (set) => {
    setEditingSetId(set.id)
    setEditForm({ weight: set.weight, reps: set.reps, rir: set.rir })
  }

  const saveEdit = async (setId) => {
    supabase
      .from('sets')
      .update({
        weight: Number(editForm.weight),
        reps: Number(editForm.reps),
        rir: Number(editForm.rir),
      })
      .eq('id', setId)
      .then(async () => {
        setEditingSetId('')
        await fetchHistoryData()
      })
  }

  const deleteSet = async (setId) => {
    const setToDelete = sets.find((s) => s.id === setId)
    const exerciseName = setToDelete?.exercise_name

    setSets((current) => current.filter((item) => item.id !== setId))

    const { error } = await supabase
      .from('sets')
      .delete()
      .eq('id', setId)

    if (error) {
      console.error('Delete failed:', error)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 300))

    if (exerciseName) {
      await recalculatePRForExercise(user.id, exerciseName)
    }
  }

  const grouped = useMemo(() => {
    const map = new Map()
    for (const set of sets) {
      const dateKey = String(set.logged_at).split('T')[0]
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey).push(set)
    }
    return Array.from(map.entries())
  }, [sets])

  return (
    <div className="p-4">
      {loading ? (
        <div style={{ padding: '16px' }}>
          <Skeleton width="120px" height="28px" style={{ marginBottom: '16px' }} />
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '14px',
                marginBottom: '8px',
              }}
            >
              <Skeleton width="100px" height="14px" style={{ marginBottom: '8px' }} />
              <Skeleton width="160px" height="12px" />
            </div>
          ))}
        </div>
      ) : (
        <>
      <h1 className="mb-4 text-2xl">History</h1>
      <div className="space-y-2">
        {grouped.map(([dateKey, dateSets]) => {
          const volume = dateSets.reduce((sum, set) => sum + Number(set.weight) * Number(set.reps), 0)
          const expanded = expandedDate === dateKey
          const session = sessionByDate.get(dateKey)
          return (
            <div key={dateKey} className="rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <button
                type="button"
                onClick={() => setExpandedDate(expanded ? '' : dateKey)}
                className="flex min-h-[44px] w-full items-center justify-between px-3 py-3 text-left"
              >
                <div>
                  <p style={{ fontWeight: 500 }}>{new Date(dateKey).toLocaleDateString()}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                      
                      {volume.toFixed(1)} kg · {dateSets.length} sets
                    </span>
                    {session?.comment ? <span style={{ fontSize: '14px' }}>💬</span> : null}
                  </div>
                </div>
                <span className="text-white/50">{expanded ? '−' : '+'}</span>
              </button>
              {expanded ? (
                <div className="space-y-2 p-3" style={{ borderTop: '1px solid var(--border)' }}>
                  {session?.comment ? (
                    <div style={{ background: 'var(--bg-base)', borderRadius: '10px', padding: '12px', marginBottom: '12px', borderLeft: '3px solid var(--accent)' }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workout note</p>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.5' }}>{session.comment}</p>
                    </div>
                  ) : null}
                  {dateSets.map((set) => (
                    <div key={set.id} className="flex items-center justify-between rounded-lg p-2" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                      {editingSetId === set.id ? (
                        <div style={{ width: '100%' }}>
                          <p style={{ marginBottom: '8px' }}>{set.exercise_name}</p>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <input
                              type="number"
                              step="2.5"
                              value={editForm.weight}
                              onChange={(event) =>
                                setEditForm((prev) => ({ ...prev, weight: event.target.value }))
                              }
                              style={{ flex: 1, height: '36px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', color: 'white', padding: '0 8px' }}
                            />
                            <input
                              type="number"
                              step="1"
                              value={editForm.reps}
                              onChange={(event) =>
                                setEditForm((prev) => ({ ...prev, reps: event.target.value }))
                              }
                              style={{ flex: 1, height: '36px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', color: 'white', padding: '0 8px' }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                            {[0, 1, 2].map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setEditForm((prev) => ({ ...prev, rir: value }))}
                                style={{
                                  flex: 1,
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255,255,255,0.2)',
                                  background: Number(editForm.rir) === value ? 'var(--accent)' : 'var(--bg-elevated)',
                                  color: Number(editForm.rir) === value ? '#000000' : 'white',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}
                              >
                                {value === 0 ? '0' : value === 1 ? '1-2' : '3+'}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => saveEdit(set.id)}
                              style={{ flex: 1, height: '34px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#000000', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSetId('')}
                              style={{ flex: 1, height: '34px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p>{set.exercise_name}</p>
                            <p className="text-sm text-white/60">
                              {set.weight} × {set.reps}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`rounded-full px-2 py-1 text-xs ${rirClass(set.rir)}`}>
                              RIR {set.rir === 0 ? '0' : set.rir === 1 ? '1-2' : '3+'}
                            </span>
                            <button
                              type="button"
                              onClick={() => beginEdit(set)}
                              style={{ minWidth: '32px', minHeight: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSet(set.id)}
                              style={{ minWidth: '32px', minHeight: '32px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
        </>
      )}
    </div>
  )
}

export default History
