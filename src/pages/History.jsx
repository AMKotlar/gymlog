import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'

function rirClass(rir) {
  if (rir === 0) return 'bg-red-500/20 text-red-300'
  if (rir === 1) return 'bg-amber-500/20 text-amber-300'
  return 'bg-green-500/20 text-green-300'
}

function History({ user }) {
  const [sets, setSets] = useState([])
  const [expandedDate, setExpandedDate] = useState('')

  useEffect(() => {
    supabase
      .from('sets')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .then(({ data }) => setSets(data ?? []))
  }, [user.id])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const set of sets) {
      const dateKey = new Date(set.logged_at).toISOString().slice(0, 10)
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey).push(set)
    }
    return Array.from(map.entries())
  }, [sets])

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl">History</h1>
      <div className="space-y-2">
        {grouped.map(([dateKey, dateSets]) => {
          const volume = dateSets.reduce((sum, set) => sum + Number(set.weight) * Number(set.reps), 0)
          const expanded = expandedDate === dateKey
          return (
            <div key={dateKey} className="rounded-xl border border-white/10 bg-[#17172a]">
              <button
                type="button"
                onClick={() => setExpandedDate(expanded ? '' : dateKey)}
                className="flex min-h-[44px] w-full items-center justify-between px-3 py-3 text-left"
              >
                <div>
                  <p>{new Date(dateKey).toLocaleDateString()}</p>
                  <p className="text-sm text-white/60">{volume.toFixed(1)} kg · {dateSets.length} sets</p>
                </div>
                <span className="text-white/50">{expanded ? '−' : '+'}</span>
              </button>
              {expanded ? (
                <div className="space-y-2 border-t border-white/10 p-3">
                  {dateSets.map((set) => (
                    <div key={set.id} className="flex items-center justify-between rounded-lg border border-white/10 p-2">
                      <div>
                        <p>{set.exercise_name}</p>
                        <p className="text-sm text-white/60">
                          {set.weight} × {set.reps}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs ${rirClass(set.rir)}`}>
                        RIR {set.rir === 0 ? '0' : set.rir === 1 ? '1-2' : '3+'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default History
