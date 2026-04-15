import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import ScrollWheel from './ScrollWheel'

const rirOptions = [
  { label: '0', description: 'Absolute failure', value: 0, active: 'bg-red-500/20 border-red-500 text-red-300' },
  { label: '1-2', description: 'Close to failure', value: 1, active: 'bg-amber-500/20 border-amber-500 text-amber-300' },
  { label: '3+', description: 'More in tank', value: 2, active: 'bg-green-500/20 border-green-500 text-green-300' },
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

function formatLastSet(lastSet) {
  if (!lastSet) return 'First set today'
  const rirText = lastSet.rir === 0 ? '0' : lastSet.rir === 1 ? '1-2' : '3+'
  return `Last: ${formatWeight(lastSet.weight)} kg × ${lastSet.reps} · RIR ${rirText}`
}

function LogSetScreen({ open, userId, exercise, onClose, onLogged }) {
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [expiredOverride, setExpiredOverride] = useState(false)
  const [weight, setWeight] = useState(20)
  const [reps, setReps] = useState(8)
  const [rir, setRir] = useState(null)
  const [restSeconds, setRestSeconds] = useState(90)
  const [setCountToday, setSetCountToday] = useState(0)
  const [lastSet, setLastSet] = useState(null)
  const [saving, setSaving] = useState(false)

  const canLog = rir !== null && (secondsLeft > 0 || expiredOverride)

  useEffect(() => {
    if (!open) return
    setSecondsLeft(30)
    setExpiredOverride(false)
    setRir(null)
  }, [open, exercise?.id])

  useEffect(() => {
    if (!open || !exercise?.name || !userId) return

    const todayStart = `${new Date().toISOString().split('T')[0]}T00:00:00.000Z`
    const tomorrowStart = `${new Date(Date.now() + 86400000).toISOString().split('T')[0]}T00:00:00.000Z`

    supabase
      .from('sets')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_name', exercise.name)
      .gte('logged_at', todayStart)
      .lt('logged_at', tomorrowStart)
      .order('logged_at', { ascending: false })
      .then(({ data }) => {
        const entries = data ?? []
        setSetCountToday(entries.length)
        if (entries[0]) {
          setLastSet(entries[0])
          setWeight(entries[0].weight)
          setReps(entries[0].reps)
          setRestSeconds(entries[0].rest_seconds ?? 90)
        } else {
          setLastSet(null)
          setWeight(20)
          setReps(8)
          setRestSeconds(90)
        }
      })
  }, [open, userId, exercise?.id, exercise?.name])

  useEffect(() => {
    if (!open || secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [open, secondsLeft])

  const radius = 52
  const circumference = 2 * Math.PI * radius
  const progress = secondsLeft / 30
  const strokeDashoffset = circumference * (1 - progress)
  const timerColor = secondsLeft > 20 ? '#7c3aed' : secondsLeft > 10 ? '#f59e0b' : '#ef4444'

  const volume = useMemo(() => Number((weight * reps).toFixed(2)), [weight, reps])

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
  }

  if (!open || !exercise) return null

  return (
    <div className="fixed inset-0 z-50 bg-[#0f0f1a]">
      <div className="mx-auto h-full w-full max-w-[430px] overflow-y-auto p-4 pb-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl">{exercise.name}</h2>
            <div className="mt-1 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs">
              Set {setCountToday + 1}
            </div>
            <p className="mt-2 text-sm text-white/60">{formatLastSet(lastSet)}</p>
          </div>
          <button type="button" className="h-11 min-w-[44px] text-2xl" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="mb-4 flex flex-col items-center">
          <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
            <circle cx="66" cy="66" r={radius} stroke="#2a2a3e" strokeWidth="10" fill="transparent" />
            <circle
              cx="66"
              cy="66"
              r={radius}
              stroke={timerColor}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="-mt-[84px] mb-[52px] text-3xl font-semibold">{secondsLeft}</div>
        </div>

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
        <p className="mb-4 text-center text-sm text-white/60">Volume this set: {formatWeight(volume)} kg</p>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {rirOptions.map((option) => (
            <button
              type="button"
              key={option.label}
              onClick={() => setRir(option.value)}
              className={`min-h-[44px] rounded-xl border px-2 py-3 text-left ${
                rir === option.value ? option.active : 'border-white/15 bg-[#17172a]'
              }`}
            >
              <div className="font-semibold">{option.label}</div>
              <div className="text-xs text-white/70">{option.description}</div>
            </button>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-4 gap-2">
          {rests.map((item) => (
            <button
              type="button"
              key={item.seconds}
              onClick={() => setRestSeconds(item.seconds)}
              className={`min-h-[44px] rounded-full border text-sm ${
                restSeconds === item.seconds
                  ? 'border-[#7c3aed] bg-[#7c3aed] text-white'
                  : 'border-white/15 bg-[#17172a] text-white/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={logSet}
          disabled={!canLog || saving}
          className="h-12 w-full rounded-xl bg-[#7c3aed] text-base disabled:opacity-40"
        >
          {secondsLeft === 0 && !expiredOverride ? 'Time expired' : saving ? 'Logging...' : 'Log set'}
        </button>
        {secondsLeft === 0 && !expiredOverride ? (
          <button
            type="button"
            onClick={() => setExpiredOverride(true)}
            className="mt-2 h-11 w-full text-sm text-white/60 underline"
          >
            Log anyway
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default LogSetScreen
