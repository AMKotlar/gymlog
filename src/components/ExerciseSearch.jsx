import { useEffect, useMemo, useState } from 'react'
import exercises from '../exercises.json'
import { supabase } from '../supabase'

const categories = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio']

function ExerciseSearch({ open, userId, onClose, onSelect }) {
  const [query, setQuery] = useState('')
  const [customExercises, setCustomExercises] = useState([])
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
  }, [open, userId])

  const merged = useMemo(() => {
    const list = [...exercises, ...customExercises.map((item) => ({ ...item, id: item.id || item.exercise_id }))]
    if (!query.trim()) return list.slice(0, 80)
    const lowered = query.toLowerCase()
    return list.filter((item) => item.name.toLowerCase().includes(lowered)).slice(0, 80)
  }, [customExercises, query])

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
    <div className="fixed inset-0 z-40 bg-[#0f0f1a]">
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col p-4">
        <div className="mb-3 flex items-center gap-2">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search exercise..."
            className="h-12 w-full rounded-lg border border-white/15 bg-[#17172a] px-3 text-white outline-none"
          />
          <button type="button" onClick={onClose} className="h-12 min-w-[44px] text-2xl text-white/80">
            ×
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto pb-2">
          {merged.map((exercise) => (
            <button
              key={`${exercise.id}-${exercise.name}`}
              type="button"
              onClick={() => onSelect(exercise)}
              className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-white/10 bg-[#17172a] px-3 py-3 text-left"
            >
              <span>{exercise.name}</span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">{exercise.category}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => setShowAdd((prev) => !prev)}
            className="h-11 w-full rounded-lg border border-[#7c3aed] text-[#7c3aed]"
          >
            Add custom exercise
          </button>
          {showAdd ? (
            <div className="mt-3 space-y-2">
              <input
                value={newExercise.name}
                onChange={(event) => setNewExercise((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Exercise name"
                className="h-11 w-full rounded-lg border border-white/15 bg-[#17172a] px-3 outline-none"
              />
              <select
                value={newExercise.category}
                onChange={(event) =>
                  setNewExercise((prev) => ({ ...prev, category: event.target.value }))
                }
                className="h-11 w-full rounded-lg border border-white/15 bg-[#17172a] px-3 outline-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={saving}
                onClick={saveCustomExercise}
                className="h-11 w-full rounded-lg bg-[#7c3aed] disabled:opacity-60"
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
