import { useEffect, useMemo, useRef, useState } from 'react'
import ExerciseSearch from '../components/ExerciseSearch'
import LogSetScreen from '../components/LogSetScreen'
import { supabase } from '../supabase'

function rirBadgeStyle(rir) {
  if (rir === 0) return 'bg-red-500/20 text-red-300'
  if (rir === 1) return 'bg-amber-500/20 text-amber-300'
  return 'bg-green-500/20 text-green-300'
}

function SwipeableSetRow({ set, isOpen, onRequestOpen, onRequestClose, onDelete, showHint }) {
  const rowRef = useRef(null)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const currentXRef = useRef(0)
  const currentOffsetRef = useRef(isOpen ? -80 : 0)
  const isDraggingRef = useRef(false)
  const isHorizontalRef = useRef(false)

  const applyOffset = (offset, withTransition) => {
    const el = rowRef.current
    if (!el) return
    el.style.transition = withTransition ? 'transform 0.2s ease' : 'none'
    el.style.transform = `translateX(${offset}px)`
    currentOffsetRef.current = offset
  }

  useEffect(() => {
    applyOffset(isOpen ? -80 : 0, true)
  }, [isOpen])

  useEffect(() => {
    const el = rowRef.current
    if (!el) return undefined

    const handleTouchStart = (event) => {
      const touch = event.touches[0]
      startXRef.current = touch.clientX
      startYRef.current = touch.clientY
      currentXRef.current = touch.clientX
      isDraggingRef.current = true
      isHorizontalRef.current = false
      if (!isOpen) {
        onRequestClose()
      }
      applyOffset(currentOffsetRef.current, false)
    }

    const handleTouchMove = (event) => {
      if (!isDraggingRef.current) return
      const touch = event.touches[0]
      currentXRef.current = touch.clientX
      const deltaX = currentXRef.current - startXRef.current
      const deltaY = touch.clientY - startYRef.current

      if (!isHorizontalRef.current && Math.abs(deltaX) > Math.abs(deltaY)) {
        isHorizontalRef.current = true
      }

      if (isHorizontalRef.current) {
        event.preventDefault()
      } else {
        return
      }

      const baseOffset = isOpen ? -80 : 0
      const nextOffset = Math.max(-80, Math.min(0, baseOffset + deltaX))
      applyOffset(nextOffset, false)
    }

    const handleTouchEnd = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      const shouldOpen = currentOffsetRef.current <= -60
      applyOffset(shouldOpen ? -80 : 0, true)
      if (shouldOpen) {
        onRequestOpen(set.id)
      } else {
        onRequestClose()
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isOpen, onRequestClose, onRequestOpen, set.id])

  const onMouseDown = (event) => {
    event.preventDefault()
    startXRef.current = event.clientX
    currentXRef.current = event.clientX
    isDraggingRef.current = true
    applyOffset(currentOffsetRef.current, false)

    const onMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return
      currentXRef.current = moveEvent.clientX
      const deltaX = currentXRef.current - startXRef.current
      const baseOffset = isOpen ? -80 : 0
      const nextOffset = Math.max(-80, Math.min(0, baseOffset + deltaX))
      applyOffset(nextOffset, false)
    }

    const onMouseUp = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      const shouldOpen = currentOffsetRef.current <= -60
      applyOffset(shouldOpen ? -80 : 0, true)
      if (shouldOpen) {
        onRequestOpen(set.id)
      } else {
        onRequestClose()
      }
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={() => onDelete(set.id)}
        className="absolute right-0 top-0 z-0 flex h-full w-20 items-center justify-center bg-[#dc2626] text-sm text-white"
      >
        Delete
      </button>
      <div
        ref={rowRef}
        onMouseDown={onMouseDown}
        className="relative z-10 flex cursor-grab items-center justify-between border border-white/10 bg-[#17172a] px-3 py-3"
        style={{ transform: 'translateX(0px)' }}
      >
        <div>
          <p>{set.exercise_name}</p>
          <p className="text-sm text-white/60">
            {set.weight} × {set.reps} · Rest {set.rest_seconds}s
          </p>
          {showHint ? <p className="mt-1 text-xs text-white/30">← swipe to delete</p> : null}
        </div>
        <span className={`rounded-full px-2 py-1 text-xs ${rirBadgeStyle(set.rir)}`}>
          RIR {set.rir === 0 ? '0' : set.rir === 1 ? '1-2' : '3+'}
        </span>
      </div>
    </div>
  )
}

function Home({ user }) {
  const [sets, setSets] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [exercise, setExercise] = useState(null)
  const [openRowId, setOpenRowId] = useState(null)
  const [showSwipeHint, setShowSwipeHint] = useState(true)

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

  useEffect(() => {
    const hintTimer = setTimeout(() => setShowSwipeHint(false), 3000)
    return () => {
      clearTimeout(hintTimer)
    }
  }, [])

  const deleteSet = async (setId) => {
    const previousSets = sets
    setSets((current) => current.filter((set) => set.id !== setId))
    setOpenRowId((current) => (current === setId ? null : current))

    const { error } = await supabase.from('sets').delete().eq('id', setId)
    if (error) {
      setSets(previousSets)
      setOpenRowId(null)
    }
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
            <SwipeableSetRow
              key={set.id}
              set={set}
              isOpen={openRowId === set.id}
              onRequestOpen={(rowId) => setOpenRowId(rowId)}
              onRequestClose={() => setOpenRowId(null)}
              onDelete={deleteSet}
              showHint={showSwipeHint && sets[0]?.id === set.id}
            />
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
