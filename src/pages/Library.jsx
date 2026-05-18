import { useEffect, useMemo, useState } from 'react'
import exercises from '../exercises.json'
import { supabase } from '../supabase'

const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio']

function categoryBadgeStyle() {
  return {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '10px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '4px 8px',
    borderRadius: '999px',
    border: '1px solid rgba(204,255,0,0.3)',
    background: 'rgba(204,255,0,0.1)',
    color: '#CCFF00',
    flexShrink: 0,
  }
}

function CuePanel({ exercise }) {
  const hasCues = Boolean(exercise?.cue_imagine || exercise?.cue_feel || exercise?.cue_avoid)

  if (!hasCues) {
    return (
      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
        No cues available yet
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {exercise.cue_imagine ? (
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Imagine</div>
          <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '15px', color: 'white', lineHeight: '1.5' }}>{exercise.cue_imagine}</div>
        </div>
      ) : null}
      {exercise.cue_feel ? (
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Feel it in</div>
          <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '15px', color: '#CCFF00', lineHeight: '1.5' }}>{exercise.cue_feel}</div>
        </div>
      ) : null}
      {exercise.cue_avoid ? (
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Avoid</div>
          <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '15px', color: '#ef4444', lineHeight: '1.5' }}>{exercise.cue_avoid}</div>
        </div>
      ) : null}
    </div>
  )
}

function Library({ user }) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [customExercises, setCustomExercises] = useState([])
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    supabase
      .from('custom_exercises')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
      .then(({ data }) => {
        setCustomExercises(data ?? [])
        setLoading(false)
      })
  }, [user?.id])

  const allExercises = useMemo(() => {
    const custom = customExercises.map((item) => ({
      ...item,
      id: item.id,
      cue_imagine: null,
      cue_feel: null,
      cue_avoid: null,
    }))
    return [...exercises, ...custom]
  }, [customExercises])

  const filtered = useMemo(() => {
    let list = allExercises
    if (selectedCategory !== 'All') {
      list = list.filter((item) => item.category === selectedCategory)
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((item) => item.name.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [allExercises, query, selectedCategory])

  if (selectedExercise) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '16px 16px 24px' }}>
        <button
          type="button"
          onClick={() => setSelectedExercise(null)}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '26px',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '20px',
          }}
        >
          ←
        </button>

        <h1
          style={{
            margin: '0 0 12px',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '36px',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'white',
            lineHeight: 1.05,
          }}
        >
          {selectedExercise.name}
        </h1>
        <span style={{ ...categoryBadgeStyle(), display: 'inline-block', marginBottom: '28px' }}>
          {selectedExercise.category}
        </span>

        <div
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#111111',
            padding: '18px 16px',
          }}
        >
          <CuePanel exercise={selectedExercise} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 16px 8px' }}>
      <h1
        style={{
          margin: '0 0 16px',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '32px',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'white',
        }}
      >
        Library
      </h1>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search exercises..."
        style={{
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: '12px',
          padding: '14px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#111111',
          color: 'white',
          fontFamily: "'Barlow', sans-serif",
          fontSize: '16px',
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
        {categories.map((category) => {
          const active = selectedCategory === category
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              style={{
                flexShrink: 0,
                border: active ? '1px solid rgba(204,255,0,0.3)' : '1px solid rgba(255,255,255,0.08)',
                background: active ? 'rgba(204,255,0,0.1)' : '#111111',
                color: active ? '#CCFF00' : 'rgba(255,255,255,0.55)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                borderRadius: '999px',
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              {category}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Barlow', sans-serif" }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((exercise) => (
            <button
              key={`${exercise.id}-${exercise.name}`}
              type="button"
              onClick={() => setSelectedExercise(exercise)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: '#111111',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: '15px', color: 'white', fontWeight: 600 }}>{exercise.name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={categoryBadgeStyle()}>{exercise.category}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '18px' }}>›</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Library
