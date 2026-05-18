import { useEffect, useMemo, useRef, useState } from 'react'
import { effectiveReps } from '../effectiveReps'
import { supabase } from '../supabase'
import { formatDateKey, localDateKeyFromISO, localDayStartUTC } from '../utils/dateUtils'
import PRCelebration from './PRCelebration'
import RestTimer from './RestTimer'
import ScrollWheel from './ScrollWheel'
import SetContract from './SetContract'

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

const LS_TIMER_START = 'timerStartedAt'
const LS_TIMER_DURATION = 'timerDuration'
const LS_TIMER_EXERCISE = 'timerExerciseName'
const BODYWEIGHT_KEYWORDS = [
  'push up',
  'pull up',
  'chin up',
  'dip',
  'sit up',
  'crunch',
  'plank',
  'burpee',
  'lunge',
  'squat jump',
  'box jump',
  'muscle up',
]

function clearRestTimerLocalStorage() {
  localStorage.removeItem(LS_TIMER_START)
  localStorage.removeItem(LS_TIMER_DURATION)
  localStorage.removeItem(LS_TIMER_EXERCISE)
}

function isDefaultBodyweightExercise(name) {
  const normalizedName = String(name ?? '')
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
  return BODYWEIGHT_KEYWORDS.some((keyword) => normalizedName.includes(keyword))
}

function formatWeight(value) {
  return value % 1 === 0 ? `${value}` : value.toFixed(1)
}

function formatLoggedSet(item) {
  if (item?.is_bodyweight) return `BW × ${item.reps}`
  return `${formatWeight(item.weight)} kg × ${item.reps}`
}

function rirBadgeStyle(rir) {
  if (rir === 0) return { background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }
  if (rir === 1) return { background: 'rgba(245,158,11,0.2)', color: '#fcd34d' }
  return { background: 'rgba(34,197,94,0.2)', color: '#86efac' }
}

function LogSetScreen({ open, userId, exercise, onClose, onLogged }) {
  const [weight, setWeight] = useState(0)
  const [reps, setReps] = useState(8)
  const [isBodyweight, setIsBodyweight] = useState(false)
  const [rir, setRir] = useState(null)
  const [restSeconds, setRestSeconds] = useState(90)
  const [restActive, setRestActive] = useState(false)
  const [restRemaining, setRestRemaining] = useState(0)
  const [restTotal, setRestTotal] = useState(90)
  const [restTimerStartedAt, setRestTimerStartedAt] = useState(null)
  const [restTimerExerciseName, setRestTimerExerciseName] = useState(null)
  const [restCompleteMessage, setRestCompleteMessage] = useState(false)
  const [newPRs, setNewPRs] = useState([])
  const [pendingRestStart, setPendingRestStart] = useState(false)
  const [setCountToday, setSetCountToday] = useState(0)
  const [lastSet, setLastSet] = useState(null)
  const [lastSessionSets, setLastSessionSets] = useState([])
  const [showContract, setShowContract] = useState(false)
  const [selectedContractPath, setSelectedContractPath] = useState('A')
  const [contractTarget, setContractTarget] = useState(null)
  const [contractAccepted, setContractAccepted] = useState(false)
  const [contractFlash, setContractFlash] = useState('default')
  const [saving, setSaving] = useState(false)
  const [cueOpen, setCueOpen] = useState(false)

  const canLog = rir !== null
  const hasCues = Boolean(exercise?.cue_imagine || exercise?.cue_feel || exercise?.cue_avoid)
  const defaultToBodyweight = useMemo(() => isDefaultBodyweightExercise(exercise?.name), [exercise?.name])

  const prevExerciseId = useRef(null)

  useEffect(() => {
    if (!exercise?.id) return
    if (exercise.id === prevExerciseId.current) return
    prevExerciseId.current = exercise.id
    setRir(null)
    setRestActive(false)
    setRestRemaining(0)
    setRestTimerStartedAt(null)
    setRestTimerExerciseName(null)
    clearRestTimerLocalStorage()
    setRestCompleteMessage(false)
    setNewPRs([])
    setPendingRestStart(false)
    setShowContract(false)
    setSelectedContractPath('A')
    setContractTarget(null)
    setContractAccepted(false)
    setContractFlash('default')
    setIsBodyweight(defaultToBodyweight)
    setCueOpen(false)
  }, [defaultToBodyweight, exercise?.id])

  useEffect(() => {
    if (open) return
    setRir(null)
  }, [open])

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
        setWeight(entries[0].weight ?? 0)
        setReps(entries[0].reps)
        setRestSeconds(entries[0].rest_seconds ?? 90)
      } else if (previous[0]) {
        setLastSet(null)
        setWeight(previous[0].weight ?? 0)
        setReps(previous[0].reps ?? 8)
        setRestSeconds(previous[0].rest_seconds ?? 90)
        if (entries.length === 0 && !defaultToBodyweight && !previous[0].is_bodyweight) {
          setShowContract(true)
          setSelectedContractPath('A')
        } else {
          setShowContract(false)
        }
      } else {
        setLastSet(null)
        setWeight(0)
        setReps(8)
        setRestSeconds(90)
        setShowContract(false)
      }
    })
  }, [defaultToBodyweight, open, userId, exercise?.id, exercise?.name])

  const volume = useMemo(() => Number((weight * reps).toFixed(2)), [weight, reps])

  useEffect(() => {
    if (!open || !exercise?.name) return
    const savedStart = localStorage.getItem(LS_TIMER_START)
    const savedDuration = localStorage.getItem(LS_TIMER_DURATION)
    const savedExercise = localStorage.getItem(LS_TIMER_EXERCISE)
    if (!savedStart || !savedDuration) return
    if (savedExercise && savedExercise !== exercise.name) return
    const start = Number(savedStart)
    const duration = Number(savedDuration)
    if (!Number.isFinite(start) || !Number.isFinite(duration)) return
    const elapsed = Math.floor((Date.now() - start) / 1000)
    const remaining = duration - elapsed
    if (remaining > 0) {
      setRestTimerStartedAt(start)
      setRestTotal(duration)
      setRestRemaining(remaining)
      setRestTimerExerciseName(savedExercise || exercise.name)
      setRestActive(true)
      setRestCompleteMessage(false)
    } else {
      clearRestTimerLocalStorage()
    }
  }, [open, exercise?.name])

  useEffect(() => {
    if (!restTimerStartedAt) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - restTimerStartedAt) / 1000)
      const remaining = restTotal - elapsed
      if (remaining <= 0) {
        setRestRemaining(0)
        setRestTimerStartedAt(null)
        clearRestTimerLocalStorage()
        clearInterval(interval)
      } else {
        setRestRemaining(remaining)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [restTimerStartedAt, restTotal])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible' || !restTimerStartedAt) return
      const elapsed = Math.floor((Date.now() - restTimerStartedAt) / 1000)
      const remaining = restTotal - elapsed
      if (remaining <= 0) {
        setRestRemaining(0)
        setRestTimerStartedAt(null)
        clearRestTimerLocalStorage()
      } else {
        setRestRemaining(remaining)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [restTimerStartedAt, restTotal])

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
      setRestTimerExerciseName(null)
    }, 1500)
    return () => clearTimeout(timeout)
  }, [restActive, restRemaining])

  const startRestTimer = (durationSeconds) => {
    const now = Date.now()
    const name = exercise?.name || restTimerExerciseName || ''
    setRestTimerStartedAt(now)
    setRestTotal(durationSeconds)
    setRestRemaining(durationSeconds)
    setRestCompleteMessage(false)
    localStorage.setItem(LS_TIMER_START, String(now))
    localStorage.setItem(LS_TIMER_DURATION, String(durationSeconds))
    if (name) {
      localStorage.setItem(LS_TIMER_EXERCISE, name)
      setRestTimerExerciseName(name)
    } else {
      localStorage.removeItem(LS_TIMER_EXERCISE)
      setRestTimerExerciseName(null)
    }
  }

  const resetRestTimer = (seconds) => {
    setRestSeconds(seconds)
    if (restActive) {
      startRestTimer(seconds)
    }
  }

  const baselineSet = lastSessionSets[0]
  const contractPathA = baselineSet
    ? { weight: baselineSet.weight, reps: baselineSet.reps + 1 }
    : { weight: 0, reps: 8 }
  const contractPathB = baselineSet
    ? { weight: Number((Number(baselineSet.weight) + 1).toFixed(1)), reps: baselineSet.reps }
    : { weight: 1, reps: 8 }

  const acceptContract = () => {
    const target = selectedContractPath === 'A' ? contractPathA : contractPathB
    setContractTarget(target)
    setContractAccepted(true)
    setWeight(target.weight)
    setReps(target.reps)
    setShowContract(false)
  }

  const skipContract = () => {
    setContractTarget(null)
    setContractAccepted(false)
    setShowContract(false)
  }

  const logSet = async () => {
    if (!canLog || !exercise || !userId) return
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50)
    }
    setSaving(true)

    let loggedWeight = Number(weight)
    let bodyweightSet = false

    if (isBodyweight) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('weight_kg')
        .eq('id', userId)
        .maybeSingle()

      loggedWeight = profile?.weight_kg == null ? 0 : Number(profile.weight_kg)
      bodyweightSet = true
      setWeight(loggedWeight)
    }

    const { error } = await supabase.from('sets').insert({
      user_id: userId,
      exercise_name: exercise.name,
      weight: loggedWeight,
      is_bodyweight: bodyweightSet,
      reps: Number(reps),
      rir: Number.parseInt(rir, 10),
      rest_seconds: Number(restSeconds),
      logged_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) return

    if (contractAccepted && contractTarget) {
      const contractBeaten =
        Number(weight) > Number(contractTarget.weight) ||
        Number(reps) > Number(contractTarget.reps) ||
        (Number(weight) === Number(contractTarget.weight) &&
          Number(reps) >= Number(contractTarget.reps))

      setContractFlash(contractBeaten ? 'success' : 'danger')
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setContractFlash('default')
    }

    const setVolume = Number((loggedWeight * Number(reps)).toFixed(2))
    const { data: currentPRs } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_name', exercise.name)

    const weightPR = (currentPRs ?? []).find((item) => item.pr_type === 'weight')
    const volumePR = (currentPRs ?? []).find((item) => item.pr_type === 'volume')
    const isWeightPR = !weightPR || loggedWeight > Number(weightPR.value)
    const isVolumePR = !volumePR || setVolume > Number(volumePR.value)

    if (isWeightPR) {
      await supabase.from('personal_records').upsert(
        {
          user_id: userId,
          exercise_name: exercise.name,
          pr_type: 'weight',
          value: loggedWeight,
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

    setRestCompleteMessage(false)
    if (achieved.length > 0) {
      setPendingRestStart(true)
      setNewPRs(achieved)
    } else {
      setPendingRestStart(false)
      startRestTimer(restSeconds)
      setRestActive(true)
    }

    onLogged()
  }

  const dismissPRAndStartRest = () => {
    setNewPRs([])
    if (pendingRestStart) {
      setPendingRestStart(false)
      startRestTimer(restSeconds)
      setRestActive(true)
    }
  }

  const showMain = open && exercise

  return (
    <>
    {showMain ? (
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
                    {formatLoggedSet(item)}
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

        {contractAccepted && contractTarget ? (
          <div
            style={{
              marginBottom: '10px',
              display: 'inline-flex',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 12px',
              fontSize: '12px',
              fontFamily: "'IBM Plex Mono', monospace",
              color:
                contractFlash === 'success'
                  ? '#00ff88'
                  : contractFlash === 'danger'
                    ? 'var(--danger)'
                    : 'var(--accent)',
              background:
                contractFlash === 'success'
                  ? 'rgba(0,255,136,0.15)'
                  : contractFlash === 'danger'
                    ? 'var(--danger-dim)'
                    : 'var(--accent-dim)',
            }}
          >
            CONTRACT: {contractTarget.weight} kg × {contractTarget.reps}
          </div>
        ) : null}

        {hasCues ? (
          <div style={{ margin: '0 0 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setCueOpen((prev) => !prev)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#111111',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#CCFF00', letterSpacing: '0.05em' }}>
                💡 HOW TO FEEL THIS
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{cueOpen ? '▲' : '▼'}</span>
            </button>
            {cueOpen ? (
              <div style={{ padding: '12px 14px', background: '#0d0d0d', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {exercise.cue_imagine ? (
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Imagine</div>
                    <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '14px', color: 'white', lineHeight: '1.5' }}>{exercise.cue_imagine}</div>
                  </div>
                ) : null}
                {exercise.cue_feel ? (
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Feel it in</div>
                    <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '14px', color: '#CCFF00', lineHeight: '1.5' }}>{exercise.cue_feel}</div>
                  </div>
                ) : null}
                {exercise.cue_avoid ? (
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Avoid</div>
                    <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '14px', color: '#ef4444', lineHeight: '1.5' }}>{exercise.cue_avoid}</div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setIsBodyweight((prev) => !prev)}
          style={{
            display: 'block',
            margin: '0 auto 12px',
            padding: '6px 16px',
            borderRadius: '20px',
            border: isBodyweight ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.2)',
            background: isBodyweight ? 'rgba(124,58,237,0.2)' : 'transparent',
            color: isBodyweight ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {isBodyweight ? '✓ Bodyweight' : 'Bodyweight exercise?'}
        </button>

        <div className="mb-2 flex items-center gap-3">
          <div className="flex-1">
            {isBodyweight ? (
              <div
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '28px',
                  fontWeight: '500',
                  color: 'white',
                  height: '96px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                BW
              </div>
            ) : (
              <ScrollWheel
                value={weight}
                onChange={setWeight}
                step={1}
                min={0}
                format={(item) => `${formatWeight(item)} kg`}
              />
            )}
          </div>
          {isBodyweight ? null : <div className="text-3xl text-white/60">×</div>}
          <div className="flex-1">
            <ScrollWheel value={reps} onChange={setReps} step={1} min={1} format={(item) => `${item}`} />
          </div>
        </div>
        <p className="mb-4 text-center text-sm" style={{ color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace" }}>
          {isBodyweight ? `Volume this set: ${reps} reps (bodyweight)` : `Volume this set: ${formatWeight(volume)} kg`}
        </p>

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

        {rir !== null ? (
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: '13px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Effective Reps This Set
            </span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '20px',
                fontWeight: 700,
                color: effectiveReps(reps, rir) > 0 ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {effectiveReps(reps, rir)}
            </span>
          </div>
        ) : null}

        {rir !== null && effectiveReps(reps, rir) === 0 ? (
          <p
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: '12px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: '-10px',
              marginBottom: '12px',
            }}
          >
            Too far from failure - no growth stimulus yet
          </p>
        ) : null}

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
    </div>
    ) : null}
      <RestTimer
        open={restActive}
        exerciseName={restTimerExerciseName || exercise?.name || 'Rest'}
        remaining={restRemaining}
        total={restTotal}
        restOptions={rests}
        selectedRest={restSeconds}
        onSelectRest={resetRestTimer}
        onSkip={() => {
          setRestActive(false)
          setRestCompleteMessage(false)
          setRestTimerStartedAt(null)
          setRestTimerExerciseName(null)
          clearRestTimerLocalStorage()
        }}
        completeMessage={restCompleteMessage}
      />
      {showMain ? (
        <>
      <PRCelebration
        open={newPRs.length > 0}
        exerciseName={exercise.name}
        weight={weight}
        reps={reps}
        prTypes={newPRs}
        onDismiss={dismissPRAndStartRest}
      />
      <SetContract
        open={showContract}
        exerciseName={exercise.name}
        lastSet={baselineSet}
        lastDateLabel={formatDateKey(localDateKeyFromISO(baselineSet?.logged_at))}
        pathA={contractPathA}
        pathB={contractPathB}
        selectedPath={selectedContractPath}
        onSelectPath={setSelectedContractPath}
        onAccept={acceptContract}
        onSkip={skipContract}
      />
        </>
      ) : null}
    </>
  )
}

export default LogSetScreen
