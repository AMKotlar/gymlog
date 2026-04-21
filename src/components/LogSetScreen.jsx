import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { formatDateKey } from '../utils/dateUtils'
import PRCelebration from './PRCelebration'
import RestTimer from './RestTimer'
import ScrollWheel from './ScrollWheel'

const rirOptions = [
  {
    top: '0',
    middle: 'To failure',
    bottom: 'Could not do one more rep',
    value: 0,
    activeBg: 'rgba(239,68,68,0.2)',
    activeBorder: '1px solid #ef4444',
    activeText: '#fca5a5',
  },
  {
    top: '1-2',
    middle: 'Almost there',
    bottom: '1 or 2 reps left',
    value: 1,
    activeBg: 'rgba(245,158,11,0.2)',
    activeBorder: '1px solid #f59e0b',
    activeText: '#fcd34d',
  },
  {
    top: '3+',
    middle: 'Had more left',
    bottom: '3 or more reps left',
    value: 2,
    activeBg: 'rgba(34,197,94,0.2)',
    activeBorder: '1px solid #22c55e',
    activeText: '#86efac',
  },
]

const rests = [
  { label: '45s', seconds: 45 },
  { label: '90s', seconds: 90 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
]

function formatWeight(value) {
  return value % 1 === 0 ? `${value}` : value.toFixed(1)
}

function localDayStartUTC() {
  const now = new Date()
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return localMidnight.toISOString()
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

function rirBadgeStyle(rir) {
  if (rir === 0) return { background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }
  if (rir === 1) return { background: 'rgba(245,158,11,0.2)', color: '#fcd34d' }
  return { background: 'rgba(34,197,94,0.2)', color: '#86efac' }
}

function LogSetScreen({ open, userId, exercise, onClose, onLogged }) {
  const [weight, setWeight] = useState(20)
  const [reps, setReps] = useState(8)
  const [rir, setRir] = useState(null)
  const [restSeconds, setRestSeconds] = useState(90)
  const [restActive, setRestActive] = useState(false)
  const [restRemaining, setRestRemaining] = useState(0)
  const [restTotal, setRestTotal] = useState(90)
  const [restCompleteMessage, setRestCompleteMessage] = useState(false)
  const [newPRs, setNewPRs] = useState([])
  const [pendingRestStart, setPendingRestStart] = useState(false)
  const [setCountToday, setSetCountToday] = useState(0)
  const [lastSet, setLastSet] = useState(null)
  const [lastSessionSets, setLastSessionSets] = useState([])
  const [saving, setSaving] = useState(false)

  const canLog = rir !== null

  useEffect(() => {
    if (!open) return
    setRir(null)
    setRestActive(false)
    setRestCompleteMessage(false)
    setNewPRs([])
    setPendingRestStart(false)
  }, [open, exercise?.id])

  useEffect(() => {
    if (!open || !exercise?.name || !userId) return

    const todayStart = `${new Date().toISOString().split('T')[0]}T00:00:00.000Z`
    const tomorrowStart = `${new Date(Date.now() + 86400000).toISOString().split('T')[0]}T00:00:00.000Z`

    Promise.all([
      supabase
        .from('sets')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_name', exercise.name)
        .gte('logged_at', todayStart)
        .lt('logged_at', tomorrowStart)
        .order('logged_at', { ascending: false }),
      supabase
        .from('sets')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_name', exercise.name)
        .lt('logged_at', localDayStartUTC())
        .order('logged_at', { ascending: false })
        .limit(5),
    ]).then(([todayResponse, lastSessionResponse]) => {
      const entries = todayResponse.data ?? []
      const previous = lastSessionResponse.data ?? []

      setSetCountToday(entries.length)
      setLastSessionSets(previous)
      if (entries[0]) {
        setLastSet(entries[0])
        setWeight(entries[0].weight)
        setReps(entries[0].reps)
        setRestSeconds(entries[0].rest_seconds ?? 90)
      } else if (previous[0]) {
        setLastSet(null)
        setWeight(previous[0].weight ?? 20)
        setReps(previous[0].reps ?? 8)
        setRestSeconds(previous[0].rest_seconds ?? 90)
      } else {
        setLastSet(null)
        setWeight(20)
        setReps(8)
        setRestSeconds(90)
      }
    })
  }, [open, userId, exercise?.id, exercise?.name])

  const volume = useMemo(() => Number((weight * reps).toFixed(2)), [weight, reps])

  useEffect(() => {
    if (!restActive || restRemaining <= 0) return
    const interval = setInterval(() => {
      setRestRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [restActive, restRemaining])

  useEffect(() => {
    if (!restActive || restRemaining !== 0) return

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(200)
    } else if (typeof window !== 'undefined') {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime)
        oscillator.connect(gain)
        gain.connect(audioCtx.destination)
        oscillator.start()
        oscillator.stop(audioCtx.currentTime + 0.18)
        oscillator.onended = () => audioCtx.close()
      } catch {
        // no-op if WebAudio is unavailable
      }
    }

    setRestCompleteMessage(true)
    const timeout = setTimeout(() => {
      setRestActive(false)
      setRestCompleteMessage(false)
    }, 1500)
    return () => clearTimeout(timeout)
  }, [restActive, restRemaining])

  const resetRestTimer = (seconds) => {
    setRestSeconds(seconds)
    if (restActive) {
      setRestTotal(seconds)
      setRestRemaining(seconds)
      setRestCompleteMessage(false)
    }
  }

  const logSet = async () => {
    if (!canLog || !exercise || !userId) return
    setSaving(true)
    const { error } = await supabase.from('sets').insert({
      user_id: userId,
      exercise_name: exercise.name,
      weight: Number(weight),
      reps: Number(reps),
      rir: Number.parseInt(rir, 10),
      rest_seconds: Number(restSeconds),
      logged_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) return
    onLogged()

    const setVolume = Number((Number(weight) * Number(reps)).toFixed(2))
    const { data: currentPRs } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_name', exercise.name)

    const weightPR = (currentPRs ?? []).find((item) => item.pr_type === 'weight')
    const volumePR = (currentPRs ?? []).find((item) => item.pr_type === 'volume')
    const isWeightPR = !weightPR || Number(weight) > Number(weightPR.value)
    const isVolumePR = !volumePR || setVolume > Number(volumePR.value)

    if (isWeightPR) {
      await supabase.from('personal_records').upsert(
        {
          user_id: userId,
          exercise_name: exercise.name,
          pr_type: 'weight',
          value: Number(weight),
          achieved_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,exercise_name,pr_type' },
      )
    }

    if (isVolumePR) {
      await supabase.from('personal_records').upsert(
        {
          user_id: userId,
          exercise_name: exercise.name,
          pr_type: 'volume',
          value: setVolume,
          achieved_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,exercise_name,pr_type' },
      )
    }

    const achieved = []
    if (isWeightPR) achieved.push('weight')
    if (isVolumePR) achieved.push('volume')

    setRestTotal(restSeconds)
    setRestRemaining(restSeconds)
    setRestCompleteMessage(false)
    setPendingRestStart(true)
    setNewPRs(achieved)

    if (achieved.length === 0) {
      setPendingRestStart(false)
      setRestActive(true)
    }
  }

  const dismissPRAndStartRest = () => {
    setNewPRs([])
    if (pendingRestStart) {
      setPendingRestStart(false)
      setRestActive(true)
    }
  }

  if (!open || !exercise) return null

  return (
    <div className="fixed inset-0 z-50" style={{ background: 'var(--bg-base)' }}>
      <div className="mx-auto h-full w-full max-w-[430px] overflow-y-auto p-4 pb-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl" style={{ fontSize: '22px', fontWeight: 700 }}>{exercise.name}</h2>
            <div className="mt-1 inline-flex rounded-full px-3 py-1 text-xs" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace" }}>
              Set {setCountToday + 1}
            </div>
          </div>
          <button type="button" className="h-11 min-w-[44px] text-2xl" onClick={onClose}>
            ×
          </button>
        </div>

        {lastSessionSets.length > 0 ? (
          <div
            style={{
              marginBottom: '12px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              padding: '10px',
              borderLeft: '3px solid var(--accent)',
            }}
          >
            <p style={{ margin: 0, marginBottom: '8px', color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
              Last session — {formatDateKey(localDateKeyFromISO(lastSessionSets[0].logged_at))}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {lastSessionSets.slice(0, 5).map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
                    {formatWeight(item.weight)} kg × {item.reps}
                  </span>
                  <span
                    style={{
                      ...rirBadgeStyle(item.rir),
                      borderRadius: '999px',
                      padding: '2px 8px',
                      fontSize: '11px',
                    }}
                  >
                    RIR {item.rir === 0 ? '0' : item.rir === 1 ? '1-2' : '3+'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mb-2 flex items-center gap-3">
          <div className="flex-1">
            <ScrollWheel
              value={weight}
              onChange={setWeight}
              step={2.5}
              min={2.5}
              format={(item) => `${formatWeight(item)} kg`}
            />
          </div>
          <div className="text-3xl text-white/60">×</div>
          <div className="flex-1">
            <ScrollWheel value={reps} onChange={setReps} step={1} min={1} format={(item) => `${item}`} />
          </div>
        </div>
        <p className="mb-4 text-center text-sm" style={{ color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace" }}>Volume this set: {formatWeight(volume)} kg</p>

        <p style={{ color: 'white', fontSize: '15px', fontWeight: '500', marginBottom: '10px' }}>
          How did you feel after this set?
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '12px', marginTop: '-6px' }}>
          How many more reps could you have done?
        </p>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {rirOptions.map((option) => (
            <button
              type="button"
              key={option.top}
              onClick={() => setRir(option.value)}
              style={{
                minHeight: '90px',
                borderRadius: '12px',
                border: rir === option.value ? option.activeBorder : '1px solid var(--border-strong)',
                background: rir === option.value ? option.activeBg : 'var(--bg-elevated)',
                textAlign: 'left',
                padding: '10px',
                color: rir === option.value ? option.activeText : 'white',
              }}
            >
              <div style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.1 }}>{option.top}</div>
              <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 700 }}>{option.middle}</div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{option.bottom}</div>
            </button>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-4 gap-2">
          {rests.map((item) => (
            <button
              type="button"
              key={item.seconds}
              onClick={() => resetRestTimer(item.seconds)}
              className={`min-h-[44px] rounded-full border text-sm ${
                restSeconds === item.seconds
                  ? ''
                  : ''
              }`}
              style={
                restSeconds === item.seconds
                  ? { border: '1px solid var(--accent-border)', background: 'var(--accent)', color: '#000000' }
                  : { border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={logSet}
          disabled={!canLog || saving}
          className="h-12 w-full rounded-xl text-base disabled:opacity-40"
          style={{ background: 'var(--accent)', color: '#000000', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}
        >
          {saving ? 'Logging...' : 'Log set'}
        </button>
      </div>
      <RestTimer
        open={restActive}
        exerciseName={exercise.name}
        remaining={restRemaining}
        total={restTotal}
        restOptions={rests}
        selectedRest={restSeconds}
        onSelectRest={resetRestTimer}
        onSkip={() => {
          setRestActive(false)
          setRestCompleteMessage(false)
        }}
        completeMessage={restCompleteMessage}
      />
      <PRCelebration
        open={newPRs.length > 0}
        exerciseName={exercise.name}
        weight={weight}
        reps={reps}
        prTypes={newPRs}
        onDismiss={dismissPRAndStartRest}
      />
    </div>
  )
}

export default LogSetScreen
