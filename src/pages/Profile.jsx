import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function Profile({ user }) {
  const navigate = useNavigate()
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('profiles')
      .select('date_of_birth, height_cm, weight_kg')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        setDateOfBirth(data.date_of_birth ?? '')
        setHeightCm(data.height_cm ?? '')
        setWeightKg(data.weight_kg ?? '')
      })
  }, [user?.id])

  const saveProfile = async () => {
    if (!user?.id) return
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      date_of_birth: dateOfBirth || null,
      height_cm: heightCm === '' ? null : Number(heightCm),
      weight_kg: weightKg === '' ? null : Number(weightKg),
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) return
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/signin')
  }

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '24px' }}>Profile</h1>
      <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: '#17172a', padding: '16px' }}>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Email</p>
        <p style={{ marginTop: '4px' }}>{user.email}</p>
      </div>

      <div style={{ marginTop: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: '#17172a', padding: '16px' }}>
        <p style={{ margin: 0, marginBottom: '12px', fontSize: '15px' }}>Personal stats</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
            style={{ height: '44px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#17172a', color: 'white', padding: '0 12px' }}
          />
          <input
            type="number"
            value={heightCm}
            onChange={(event) => setHeightCm(event.target.value)}
            placeholder="Height (cm)"
            style={{ height: '44px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#17172a', color: 'white', padding: '0 12px' }}
          />
          <input
            type="number"
            value={weightKg}
            onChange={(event) => setWeightKg(event.target.value)}
            placeholder="Weight (kg)"
            style={{ height: '44px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#17172a', color: 'white', padding: '0 12px' }}
          />
          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            style={{ height: '44px', borderRadius: '10px', border: 'none', background: '#7c3aed', color: 'white', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saved ? <p style={{ margin: 0, fontSize: '13px', color: '#86efac' }}>Saved ✓</p> : null}
        </div>
      </div>

      <button
        type="button"
        onClick={signOut}
        style={{ marginTop: '14px', height: '48px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white' }}
      >
        Sign out
      </button>
    </div>
  )
}

export default Profile
