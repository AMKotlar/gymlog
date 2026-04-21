import { useEffect, useMemo, useState } from 'react'
import { recalculatePRForExercise } from '../components/PRRecalculator'
import ExerciseSearch from '../components/ExerciseSearch'
import LogSetScreen from '../components/LogSetScreen'
import QuickStartModal from '../components/QuickStartModal'
import Skeleton from '../components/Skeleton'
import { effectiveRepsChange, totalEffectiveReps } from '../effectiveReps'
import allExercises from '../exercises.json'
import { supabase } from '../supabase'

function getLocalDateKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function rirBadgeStyle(rir) {
  if (rir === 0) return 'bg-red-500/20 text-red-300'
  if (rir === 1) return 'bg-amber-500/20 text-amber-300'
  return 'bg-green-500/20 text-green-300'
}

const SESSION_TYPES = {
  PUSH: { label: 'Push', emoji: '💪', categories: ['Chest', 'Shoulders', 'Arms'] },
  PULL: { label: 'Pull', emoji: '🔙', categories: ['Back', 'Arms'] },
  LEGS: { label: 'Legs', emoji: '🦵', categories: ['Legs'] },
  UPPER: { label: 'Upper', emoji: '⬆️', categories: ['Chest', 'Shoulders', 'Arms', 'Back'] },
  LOWER: { label: 'Lower', emoji: '⬇️', categories: ['Legs'] },
  FULL: { label: 'Full Body', emoji: '⚡', categories: ['Chest', 'Shoulders', 'Arms', 'Back', 'Legs', 'Core'] },
}

const PUSH_PULL_LEGS_ROTATION = ['PUSH', 'PULL', 'LEGS']
const UPPER_LOWER_ROTATION = ['UPPER', 'LOWER', 'UPPER', 'LOWER']

function localDayStartUTC(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date()
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString()
}

function localDateKeyFromISO(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function inferSessionTypeFromCategories(categories) {
  if (!categories.length) return null
  const counts = categories.reduce((acc, category) => {
    acc[category] = (acc[category] ?? 0) + 1
    return acc
  }, {})
  const chestShouldersCount = (counts.Chest ?? 0) + (counts.Shoulders ?? 0)
  const backCount = counts.Back ?? 0
  const legsCount = counts.Legs ?? 0
  const coreCount = counts.Core ?? 0
  const armsCount = counts.Arms ?? 0
  const unique = new Set(categories)

  if (legsCount > 0 && unique.size === 1) return 'LEGS'
  if (backCount > chestShouldersCount && backCount >= armsCount) return 'PULL'
  if (chestShouldersCount > backCount && chestShouldersCount >= legsCount) return 'PUSH'
  if (legsCount > 0 && chestShouldersCount + backCount + armsCount + coreCount > 0) return 'FULL'
  if (legsCount > 0) return 'LOWER'
  if (chestShouldersCount + backCount + armsCount > 0) return 'UPPER'
  return 'FULL'
}

function getSuggestedSession(recentSessions) {
  if (!recentSessions.length) return 'PUSH'
  const lastType = recentSessions[0].type
  if (!lastType) return 'PUSH'

  const rotationIndex = PUSH_PULL_LEGS_ROTATION.indexOf(lastType)
  if (rotationIndex >= 0) {
    return PUSH_PULL_LEGS_ROTATION[(rotationIndex + 1) % PUSH_PULL_LEGS_ROTATION.length]
  }
  const upperLowerIndex = UPPER_LOWER_ROTATION.lastIndexOf(lastType)
  if (upperLowerIndex >= 0) {
    return UPPER_LOWER_ROTATION[(upperLowerIndex + 1) % UPPER_LOWER_ROTATION.length]
  }
  if (lastType === 'FULL') return 'PUSH'
  return 'PUSH'
}

function Home({ user }) {
  const [sets, setSets] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [exercise, setExercise] = useState(null)
  const [showCongrats, setShowCongrats] = useState(false)
  const [workoutComment, setWorkoutComment] = useState('')
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [todayCompleted, setTodayCompleted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [suggestedSession, setSuggestedSession] = useState(null)
  const [daysSinceLastSession, setDaysSinceLastSession] = useState(0)
  const [quickStartExercises, setQuickStartExercises] = useState([])
  const [showQuickStartModal, setShowQuickStartModal] = useState(false)
  const [congratsEffReps, setCongratsEffReps] = useState(0)
  const [congratsChange, setCongratsChange] = useState(null)
  const [loading, setLoading] = useState(true)

  const exerciseByName = useMemo(() => {
    const map = new Map()
    for (const item of allExercises) {
      map.set(item.name, item)
    }
    return map
  }, [])

  const fetchTodaySets = async () => {
    setLoading(true)
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
    setLoading(false)
  }

  useEffect(() => {
    fetchTodaySets()
  }, [user.id])

  useEffect(() => {
    supabase
      .from('sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', getLocalDateKey())
      .order('completed_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        setTodayCompleted((data ?? []).length > 0)
      })
  }, [user.id])

  useEffect(() => {
    const fetchSmartSuggestion = async () => {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const sevenDaysAgoUTC = localDayStartUTC(sevenDaysAgo)
      const { data: recentSets } = await supabase
        .from('sets')
        .select('exercise_name, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', sevenDaysAgoUTC)
        .order('logged_at', { ascending: false })

      if (!recentSets || recentSets.length === 0) {
        setSuggestedSession('PUSH')
        setDaysSinceLastSession(0)
        return
      }

      const byDate = new Map()
      for (const item of recentSets) {
        const key = item.logged_at.split('T')[0]
        if (!byDate.has(key)) byDate.set(key, [])
        byDate.get(key).push(item)
      }

      const recentSessions = Array.from(byDate.entries())
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .slice(0, 7)
        .map(([date, daySets]) => {
          const categories = daySets
            .map((set) => exerciseByName.get(set.exercise_name)?.category)
            .filter(Boolean)
          return { date, type: inferSessionTypeFromCategories(categories) }
        })

      const lastDate = recentSessions[0]?.date
      if (lastDate) {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const lastStart = new Date(`${lastDate}T00:00:00`)
        const diffMs = todayStart.getTime() - lastStart.getTime()
        const diffDays = Math.max(0, Math.floor(diffMs / 86400000))
        setDaysSinceLastSession(diffDays)
      } else {
        setDaysSinceLastSession(0)
      }
      setSuggestedSession(getSuggestedSession(recentSessions))
    }

    fetchSmartSuggestion()
  }, [user.id, exerciseByName])

  const deleteSet = async (setId) => {
    const setToDelete = sets.find((s) => s.id === setId)
    const exerciseName = setToDelete?.exercise_name

    setSets((current) => current.filter((set) => set.id !== setId))

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

  const volume = useMemo(
    () => sets.reduce((sum, item) => sum + Number(item.weight) * Number(item.reps), 0),
    [sets],
  )

  const handleQuickStart = async (sessionType) => {
    const session = SESSION_TYPES[sessionType]
    if (!session) return

    const thirtyDaysAgo = localDayStartUTC(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    const { data: historySets } = await supabase
      .from('sets')
      .select('exercise_name, logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', thirtyDaysAgo)
      .order('logged_at', { ascending: false })

    const relevantExercises = []
    const seen = new Set()
    for (const set of historySets ?? []) {
      const exerciseMatch = exerciseByName.get(set.exercise_name)
      if (!exerciseMatch) continue
      if (!session.categories.includes(exerciseMatch.category)) continue
      if (seen.has(set.exercise_name)) continue
      seen.add(set.exercise_name)
      relevantExercises.push({ name: set.exercise_name, category: exerciseMatch.category })
      if (relevantExercises.length === 6) break
    }

    if (relevantExercises.length === 0) {
      setSearchOpen(true)
      return
    }

    setSuggestedSession(sessionType)
    setQuickStartExercises(relevantExercises)
    setShowQuickStartModal(true)
  }

  const handleDoneForToday = async () => {
    setSaving(true)
    try {
      const prevSessionStart = localDayStartUTC(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      const { data: prevSets } = await supabase
        .from('sets')
        .select('reps, rir, logged_at')
        .eq('user_id', user.id)
        .lt('logged_at', localDayStartUTC())
        .gte('logged_at', prevSessionStart)
        .order('logged_at', { ascending: false })

      const prevSessionSets = []
      let prevDate = null
      for (const set of prevSets ?? []) {
        const dateKey = localDateKeyFromISO(set.logged_at)
        if (!prevDate) prevDate = dateKey
        if (dateKey !== prevDate) break
        prevSessionSets.push(set)
      }

      const currentEffReps = totalEffectiveReps(sets)
      const changePercent = effectiveRepsChange(sets, prevSessionSets)
      setCongratsEffReps(currentEffReps)
      setCongratsChange(changePercent)

      let { error } = await supabase.from('sessions').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        completed_at: new Date().toISOString(),
        comment: workoutComment || null,
      })
      if (error?.message?.toLowerCase().includes('completed_at')) {
        const retry = await supabase.from('sessions').insert({
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          comment: workoutComment || null,
        })
        error = retry.error
      }
      if (error) {
        console.error('Session insert error:', error)
        alert('Could not save session: ' + error.message)
        setSaving(false)
        return
      }
      setShowCommentModal(false)
      setWorkoutComment('')
      setTodayCompleted(true)
      setShowCongrats(true)
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Unexpected error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 pb-4 pt-4">
      {loading ? (
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '20px' }}>
            <Skeleton width="120px" height="12px" style={{ marginBottom: '8px' }} />
            <Skeleton width="200px" height="28px" />
          </div>
          {[1, 2, 3].map((i) => (
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
              <Skeleton width="140px" height="14px" style={{ marginBottom: '8px' }} />
              <Skeleton width="100px" height="12px" />
            </div>
          ))}
        </div>
      ) : (
        <>
      <header className="mb-5" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h1 style={{ fontSize: '28px', marginTop: '4px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>Today: {volume === 0 ? '0' : volume.toFixed(1)} kg</h1>
        </div>
        {!todayCompleted ? (
          <button
            onClick={() => setSearchOpen(true)}
            style={{ background: 'var(--accent)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', fontSize: '24px', color: '#000000', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            +
          </button>
        ) : null}
      </header>

      {todayCompleted ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏁</div>
          <p style={{ color: 'white', fontSize: '20px', fontWeight: '500', marginBottom: '8px' }}>Workout done!</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Great work today.</p>
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Today's exercises</p>
            {sets.map((set) => (
              <div key={set.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'white', fontSize: '14px' }}>{set.exercise_name}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: "'IBM Plex Mono', monospace" }}>{set.weight} kg × {set.reps}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setTodayCompleted(false)}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '10px 24px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer' }}
          >
            Edit today's sets
          </button>
        </div>
      ) : (
        <>
          <section className="space-y-2">
            {sets.length === 0 ? (
              <div
                className="rounded-xl p-4"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
              >
                {daysSinceLastSession >= 3 ? (
                  <p style={{ color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', marginBottom: '16px' }}>
                    WELCOME BACK — {daysSinceLastSession} DAYS SINCE LAST SESSION
                  </p>
                ) : null}

                {suggestedSession ? (
                  <div
                    onClick={() => handleQuickStart(suggestedSession)}
                    style={{
                      background: 'var(--accent-dim)',
                      border: '1px solid var(--accent-border)',
                      borderRadius: 'var(--radius)',
                      padding: '16px',
                      marginBottom: '16px',
                      cursor: 'pointer',
                    }}
                  >
                    <p style={{ color: 'var(--text-muted)', fontFamily: "'Barlow', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                      SUGGESTED TODAY
                    </p>
                    <p style={{ color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
                      {SESSION_TYPES[suggestedSession].emoji} {SESSION_TYPES[suggestedSession].label.toUpperCase()} DAY
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontFamily: "'Barlow', sans-serif", fontSize: '13px' }}>
                      Based on your recent training - tap to load last {SESSION_TYPES[suggestedSession].label} exercises
                    </p>
                  </div>
                ) : null}

                <p style={{ color: 'var(--text-muted)', fontFamily: "'Barlow', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                  {suggestedSession ? 'OR CHOOSE:' : 'WHAT ARE YOU TRAINING TODAY?'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  {Object.entries(SESSION_TYPES).map(([key, session]) => (
                    <button
                      key={key}
                      onClick={() => handleQuickStart(key)}
                      style={{
                        background: suggestedSession === key ? 'var(--accent-dim)' : 'var(--bg-card)',
                        border: suggestedSession === key ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '12px 8px',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{session.emoji}</div>
                      <div style={{ color: 'white', fontFamily: "'Barlow', sans-serif", fontSize: '12px', fontWeight: 600 }}>{session.label}</div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setSearchOpen(true)}
                  style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px', color: 'var(--text-muted)', fontFamily: "'Barlow', sans-serif", fontSize: '13px', cursor: 'pointer' }}
                >
                  Browse all exercises instead
                </button>
              </div>
            ) : (
              sets.map((set) => (
                <div
                  key={set.id}
                  className="flex items-center justify-between rounded-xl px-3 py-3"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                >
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 500 }}>{set.exercise_name}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono', monospace" }}>
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
                      style={{ minHeight: '44px', minWidth: '72px', padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid rgba(255,68,68,0.5)', background: 'var(--danger-dim)', color: 'var(--danger)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
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
              onClick={() => setShowCommentModal(true)}
              style={{ width: '100%', padding: '14px', marginTop: '20px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '12px', color: 'var(--text-secondary)', fontSize: '15px', cursor: 'pointer' }}
            >
              Done for today 🏁
            </button>
          ) : null}
        </>
      )}

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
          fetchTodaySets()
        }}
      />

      <QuickStartModal
        open={showQuickStartModal}
        sessionType={suggestedSession}
        sessionLabel={suggestedSession ? SESSION_TYPES[suggestedSession].label : ''}
        exercises={quickStartExercises}
        onClose={() => setShowQuickStartModal(false)}
        onSelect={(exerciseChoice) => {
          const fullExercise = exerciseByName.get(exerciseChoice.name) ?? exerciseChoice
          setShowQuickStartModal(false)
          setExercise(fullExercise)
        }}
        onSearchAll={() => {
          setShowQuickStartModal(false)
          setSearchOpen(true)
        }}
      />

      {showCongrats ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-base)',
            zIndex: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{ width: '100%', maxWidth: '430px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>
              {congratsEffReps >= 30 ? '🔥' : congratsEffReps >= 15 ? '💪' : '✅'}
            </div>
            <h2
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '26px',
                color: 'white',
                marginBottom: '20px',
              }}
            >
              WORKOUT COMPLETE
            </h2>
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                marginBottom: '20px',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)', marginBottom: '12px' }}>
                <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Volume</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '15px', color: 'white' }}>{volume.toFixed(0)} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)', marginBottom: '12px' }}>
                <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sets Logged</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '15px', color: 'white' }}>{sets.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Effective Reps</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '22px', fontWeight: 700, color: 'var(--accent)' }}>
                    {congratsEffReps}
                  </span>
                  {congratsChange !== null ? (
                    <span
                      style={{
                        fontFamily: "'Barlow', sans-serif",
                        fontSize: '12px',
                        color: congratsChange >= 0 ? '#00ff88' : 'var(--danger)',
                        marginLeft: '8px',
                      }}
                    >
                      {congratsChange >= 0 ? `+${congratsChange}%` : `${congratsChange}%`} vs last session
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            {congratsChange !== null ? (
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', textAlign: 'center' }}>
                {congratsChange > 0
                  ? `${congratsChange}% more growth stimulus than last session 🔥`
                  : congratsChange === 0
                    ? 'Same growth stimulus as last session — push harder next time'
                    : 'Less stimulus than last session — were you fatigued?'}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setShowCongrats(false)}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: 'var(--accent)',
                color: '#000',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      ) : null}

      {showCommentModal ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '380px' }}>
            <p style={{ color: 'white', fontSize: '18px', fontWeight: '500', marginBottom: '6px' }}>How was your workout?</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '16px' }}>Add a note (optional)</p>
            <textarea
              value={workoutComment}
              onChange={(e) => setWorkoutComment(e.target.value)}
              placeholder="e.g. Felt strong today, shoulder was a bit tight..."
              rows={4}
              style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '14px', resize: 'none', fontFamily: 'inherit', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={async () => {
                  setWorkoutComment('')
                  await handleDoneForToday()
                }}
                style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer' }}
              >
                Skip
              </button>
              <button
                onClick={handleDoneForToday}
                disabled={saving}
                style={{ flex: 2, padding: '12px', background: 'var(--accent)', border: 'none', borderRadius: '10px', color: '#000000', fontSize: '14px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving...' : 'Save & finish 🏁'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
        </>
      )}
    </div>
  )
}

export default Home
