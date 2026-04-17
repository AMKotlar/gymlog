import { useEffect, useMemo, useState } from 'react'
import exercises from '../exercises.json'
import { supabase } from '../supabase'

const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio']
const customExerciseCategories = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio']

function ExerciseSearch({ open, userId, onClose, onSelect }) {
  const [query, setQuery] = useState('')
  const [customExercises, setCustomExercises] = useState([])
  const [recentExercises, setRecentExercises] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [newExercise, setNewExercise] = useState({ name: '', category: 'Chest' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !userId) return
    supabase
      .from('custom_exercises')
      .select('*')
      .eq('user_id', userId)
      .order('name')
      .then(({ data }) => setCustomExercises(data ?? []))

    supabase
      .from('sets')
      .select('exercise_name')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const seen = new Set()
        const recent = []
        for (const item of data ?? []) {
          const name = item.exercise_name
          if (!name || seen.has(name)) continue
          seen.add(name)
          recent.push(name)
          if (recent.length === 8) break
        }
        setRecentExercises(recent)
      })
  }, [open, userId])

  const filtered = useMemo(() => {
    const combined = [...exercises, ...customExercises.map((item) => ({ ...item, id: item.id || item.exercise_id }))]
    if (query.trim()) {
      return combined.filter((e) => e.name.toLowerCase().includes(query.toLowerCase())).slice(0, 80)
    }
    if (selectedCategory !== 'All') {
      return combined.filter((e) => e.category === selectedCategory).slice(0, 80)
    }
    return combined.slice(0, 80)
  }, [query, selectedCategory, customExercises])

  const saveCustomExercise = async () => {
    if (!newExercise.name.trim()) return
    setSaving(true)
    const payload = {
      user_id: userId,
      name: newExercise.name.trim(),
      category: newExercise.category,
    }

    const { data, error } = await supabase
      .from('custom_exercises')
      .insert(payload)
      .select('*')
      .single()

    setSaving(false)
    if (error || !data) return
    onSelect({ id: data.id, name: data.name, category: data.category })
    setShowAdd(false)
    setNewExercise({ name: '', category: 'Chest' })
  }

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: '#0f0f1a' }}>
      <div
        style={{
          margin: '0 auto',
          display: 'flex',
          height: '100%',
          width: '100%',
          maxWidth: '430px',
          flexDirection: 'column',
          padding: '16px',
        }}
      >
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search exercise..."
            style={{
              height: '48px',
              width: '100%',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#17172a',
              padding: '0 12px',
              color: 'white',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={onClose}
            style={{ height: '48px', minWidth: '44px', fontSize: '24px', color: 'rgba(255,255,255,0.8)' }}
          >
            X
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>
          {!query.trim() && recentExercises.length > 0 ? (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Recent</p>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                {recentExercises.map((name) => (
                  <button
                    key={name}
                    onClick={() => onSelect({ name, category: '' })}
                    style={{ background: '#17172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '8px 14px', color: 'white', fontSize: '13px', whiteSpace: 'nowrap', cursor: 'pointer' }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {!query.trim() ? (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                Browse by muscle
              </p>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    style={{
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '20px',
                      padding: '8px 12px',
                      color: 'white',
                      fontSize: '13px',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      background: selectedCategory === category ? '#7c3aed' : '#17172a',
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((exercise) => (
              <button
                key={`${exercise.id || exercise.name}-${exercise.name}`}
                type="button"
                onClick={() => onSelect(exercise)}
                style={{
                  display: 'flex',
                  minHeight: '44px',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: '#17172a',
                  padding: '12px',
                  textAlign: 'left',
                  color: 'white',
                }}
              >
                <span>{exercise.name}</span>
                <span
                  style={{
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '4px 8px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {exercise.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
          <button
            type="button"
            onClick={() => setShowAdd((prev) => !prev)}
            style={{
              height: '44px',
              width: '100%',
              borderRadius: '10px',
              border: '1px solid #7c3aed',
              color: '#7c3aed',
              background: 'transparent',
            }}
          >
            Add custom exercise
          </button>
          {showAdd ? (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                value={newExercise.name}
                onChange={(event) => setNewExercise((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Exercise name"
                style={{
                  height: '44px',
                  width: '100%',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: '#17172a',
                  padding: '0 12px',
                  color: 'white',
                  outline: 'none',
                }}
              />
              <select
                value={newExercise.category}
                onChange={(event) =>
                  setNewExercise((prev) => ({ ...prev, category: event.target.value }))
                }
                style={{
                  height: '44px',
                  width: '100%',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: '#17172a',
                  padding: '0 12px',
                  color: 'white',
                  outline: 'none',
                }}
              >
                {customExerciseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={saving}
                onClick={saveCustomExercise}
                style={{
                  height: '44px',
                  width: '100%',
                  borderRadius: '10px',
                  background: '#7c3aed',
                  color: 'white',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ExerciseSearch
