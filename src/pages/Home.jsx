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
  const [showCongrats, setShowCongrats] = useState(false)

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

  const handleDoneForToday = async () => {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('sessions').insert({
      user_id: user.id,
      date: today,
      completed_at: new Date().toISOString(),
    })
    setShowCongrats(true)
  }

  return (
    <div className="px-4 pb-4 pt-4">
      <header className="mb-5" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h1 style={{ fontSize: '22px', marginTop: '4px' }}>Today: {volume.toFixed(1)} kg</h1>
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          style={{ background: '#7c3aed', border: 'none', borderRadius: '50%', width: '44px', height: '44px', fontSize: '24px', color: 'white', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          +
        </button>
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
                  {set.weight} {'\u00D7'} {set.reps} {'\u00B7'} Rest {set.rest_seconds}s
                </p>
              </div>
              <div className="ml-2 flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs ${rirBadgeStyle(set.rir)}`}>
                  RIR {set.rir === 0 ? '0' : set.rir === 1 ? '1-2' : '3+'}
                </span>
                <button
                  type="button"
                  onClick={() => deleteSet(set.id)}
                  style={{ minHeight: '44px', minWidth: '72px', padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(239,68,68,0.2)', color: '#fecaca', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  aria-label="Delete set"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {sets.length > 0 ? (
        <button
          onClick={handleDoneForToday}
          style={{ width: '100%', padding: '14px', marginTop: '20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '15px', cursor: 'pointer' }}
        >
          Done for today 🏁
        </button>
      ) : null}

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

      {showCongrats ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#0f0f1a',
            zIndex: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{ width: '100%', maxWidth: '430px', textAlign: 'center' }}>
            <div style={{ fontSize: '54px' }}>🏁</div>
            <h2 style={{ margin: '14px 0 10px 0', color: 'white', fontSize: '30px' }}>Great workout!</h2>
            <p style={{ margin: '0 0 6px 0', color: 'rgba(255,255,255,0.75)', fontSize: '16px' }}>
              Total volume: {volume.toFixed(1)} kg
            </p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '16px' }}>Sets logged: {sets.length}</p>
            <button
              type="button"
              onClick={() => setShowCongrats(false)}
              style={{
                marginTop: '18px',
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                border: 'none',
                background: '#7c3aed',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Home
