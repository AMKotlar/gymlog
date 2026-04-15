import { useEffect, useMemo, useState } from 'react'
import ExerciseSearch from '../components/ExerciseSearch'
import LogSetScreen from '../components/LogSetScreen'
import { supabase } from '../supabase'

function rirBadgeStyle(rir) {
  if (rir === 0) return 'bg-red-500/20 text-red-300'
  if (rir === 1) return 'bg-amber-500/20 text-amber-300'
  return 'bg-green-500/20 text-green-300'
}

function Home({ user }) {
  const [sets, setSets] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [exercise, setExercise] = useState(null)

  const fetchTodaySets = async () => {
    const todayStart = `${new Date().toISOString().split('T')[0]}T00:00:00.000Z`
    const tomorrowStart = `${new Date(Date.now() + 86400000).toISOString().split('T')[0]}T00:00:00.000Z`
    const { data } = await supabase
      .from('sets')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', todayStart)
      .lt('logged_at', tomorrowStart)
      .order('logged_at', { ascending: false })
    setSets(data ?? [])
  }

  useEffect(() => {
    fetchTodaySets()
  }, [])

  const deleteSet = async (setId) => {
    setSets((current) => current.filter((set) => set.id !== setId))
    await supabase.from('sets').delete().eq('id', setId)
  }

  const volume = useMemo(
    () => sets.reduce((sum, item) => sum + Number(item.weight) * Number(item.reps), 0),
    [sets],
  )

  return (
    <div className="px-4 pb-4 pt-4">
      <header className="mb-5">
        <p className="text-sm text-white/60">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        <h1 className="mt-1 text-2xl">Today volume: {volume.toFixed(1)} kg</h1>
      </header>

      <section className="space-y-2">
        {sets.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#17172a] p-4 text-white/60">
            No sets logged yet. Tap + to start.
          </div>
        ) : (
          sets.map((set) => (
            <div
              key={set.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-[#17172a] px-3 py-3"
            >
              <div>
                <p>{set.exercise_name}</p>
                <p className="text-sm text-white/60">
                  {set.weight} × {set.reps} · Rest {set.rest_seconds}s
                </p>
              </div>
              <div className="ml-2 flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs ${rirBadgeStyle(set.rir)}`}>
                  RIR {set.rir === 0 ? '0' : set.rir === 1 ? '1-2' : '3+'}
                </span>
                <button
                  type="button"
                  onClick={() => deleteSet(set.id)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-lg text-white/40 hover:text-red-400"
                  aria-label="Delete set"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#7c3aed] text-3xl"
      >
        +
      </button>

      <ExerciseSearch
        open={searchOpen}
        userId={user.id}
        onClose={() => setSearchOpen(false)}
        onSelect={(selected) => {
          setSearchOpen(false)
          setExercise(selected)
        }}
      />

      <LogSetScreen
        open={Boolean(exercise)}
        userId={user.id}
        exercise={exercise}
        onClose={() => setExercise(null)}
        onLogged={() => {
          setExercise(null)
          fetchTodaySets()
        }}
      />
    </div>
  )
}

export default Home
