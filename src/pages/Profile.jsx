import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function todayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function Profile({ user }) {
  const navigate = useNavigate()
  const [birthYear, setBirthYear] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [weightDate, setWeightDate] = useState(todayKey())
  const [weightHistory, setWeightHistory] = useState([])
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingWeight, setSavingWeight] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [weightSaved, setWeightSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [hasPersonalData, setHasPersonalData] = useState(false)
  const [isEditingPersonal, setIsEditingPersonal] = useState(true)

  const fetchProfile = async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('profiles')
      .select('date_of_birth, height_cm, weight_kg')
      .eq('id', user.id)
      .maybeSingle()

    if (!data) return
    const year = data.date_of_birth ? String(data.date_of_birth).slice(0, 4) : ''
    setBirthYear(year)
    setHeightCm(data.height_cm ?? '')
    setWeightKg(data.weight_kg ?? '')
    const hasData = Boolean(year || data.height_cm)
    setHasPersonalData(hasData)
    setIsEditingPersonal(!hasData)
  }

  const fetchWeightHistory = async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('weight_history')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_on', { ascending: false })
      .limit(20)
    setWeightHistory(data ?? [])
  }

  useEffect(() => {
    fetchProfile()
    fetchWeightHistory()
  }, [user?.id])

  const saveProfile = async () => {
    if (!user?.id) return
    setErrorMessage('')
    setSavingProfile(true)
    const birthDate = birthYear ? `${birthYear}-01-01` : null
    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          date_of_birth: birthDate,
          height_cm: heightCm === '' ? null : Number(heightCm),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
    setSavingProfile(false)
    if (error) {
      setErrorMessage(error.message)
      return
    }
    setHasPersonalData(Boolean(birthYear || heightCm))
    setIsEditingPersonal(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const age = birthYear ? new Date().getFullYear() - Number(birthYear) : null

  const saveWeightEntry = async () => {
    if (!user?.id) return
    if (weightKg === '') {
      setErrorMessage('Enter weight before saving history.')
      return
    }
    setErrorMessage('')
    setSavingWeight(true)
    const { error } = await supabase.from('weight_history').insert({
      user_id: user.id,
      weight_kg: Number(weightKg),
      recorded_on: weightDate || todayKey(),
    })
    setSavingWeight(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }
    await supabase
      .from('profiles')
      .update({
        weight_kg: Number(weightKg),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    await fetchWeightHistory()
    setWeightSaved(true)
    setTimeout(() => setWeightSaved(false), 2000)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/signin')
  }

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '24px' }}>Profile</h1>
      <div style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Email</p>
            <p style={{ marginTop: '4px' }}>{user.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            style={{ minHeight: '36px', minWidth: '72px', padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(239,68,68,0.2)', color: '#fecaca', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{ marginTop: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '16px' }}>
        <p style={{ margin: 0, marginBottom: '12px', fontSize: '15px' }}>Personal stats</p>
        {hasPersonalData ? (
          <div style={{ marginBottom: '10px', borderRadius: '10px', background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '10px 12px' }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
              {birthYear ? `Birth year ${birthYear}${age !== null ? ` (${age} years)` : ''}` : 'Birth year not set'}
            </p>
            <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
              {heightCm ? `Height ${heightCm} cm` : 'Height not set'}
            </p>
          </div>
        ) : null}
        {isEditingPersonal ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="number"
              min="1900"
              max="2100"
              value={birthYear}
              onChange={(event) => setBirthYear(event.target.value)}
              placeholder="Year of birth"
              style={{ height: '44px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: 'var(--bg-card)', color: 'white', padding: '0 12px' }}
            />
            <input
              type="number"
              value={heightCm}
              onChange={(event) => setHeightCm(event.target.value)}
              placeholder="Height (cm)"
              style={{ height: '44px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: 'var(--bg-card)', color: 'white', padding: '0 12px' }}
            />
            <button
              type="button"
              onClick={saveProfile}
              disabled={savingProfile}
              style={{ height: '44px', borderRadius: '10px', border: 'none', background: 'var(--accent)', color: '#000000', cursor: 'pointer', opacity: savingProfile ? 0.6 : 1, fontWeight: 600 }}
            >
              {savingProfile ? 'Saving...' : hasPersonalData ? 'Save changes' : 'Save personal data'}
            </button>
            {profileSaved ? <p style={{ margin: 0, fontSize: '13px', color: '#86efac' }}>Saved ✓</p> : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingPersonal(true)}
            style={{ height: '40px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', width: '100%' }}
          >
            Edit personal data
          </button>
        )}
      </div>

      <div style={{ marginTop: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '16px' }}>
        <p style={{ margin: 0, marginBottom: '10px', fontSize: '15px' }}>Weight log</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
          <input
            type="number"
            value={weightKg}
            onChange={(event) => setWeightKg(event.target.value)}
            placeholder="Weight (kg)"
            style={{ height: '44px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: 'var(--bg-card)', color: 'white', padding: '0 12px' }}
          />
          <input
            type="date"
            value={weightDate}
            onChange={(event) => setWeightDate(event.target.value)}
            style={{ height: '44px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: 'var(--bg-card)', color: 'white', padding: '0 12px' }}
          />
          <button
            type="button"
            onClick={saveWeightEntry}
            disabled={savingWeight}
            style={{ height: '44px', borderRadius: '10px', border: 'none', background: 'var(--accent)', color: '#000000', cursor: 'pointer', opacity: savingWeight ? 0.6 : 1, fontWeight: 600 }}
          >
            {savingWeight ? 'Saving...' : 'Save weight entry'}
          </button>
          {weightSaved ? <p style={{ margin: 0, fontSize: '13px', color: '#86efac' }}>Weight saved ✓</p> : null}
        </div>

        <p style={{ margin: 0, marginBottom: '10px', fontSize: '15px' }}>Weight history</p>
        {weightHistory.length === 0 ? (
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>No entries yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {weightHistory.map((item) => (
              <div
                key={`${item.id}-${item.recorded_on}`}
                style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}
              >
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{item.recorded_on}</span>
                <span style={{ color: 'white', fontSize: '13px' }}>{item.weight_kg} kg</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {errorMessage ? (
        <p style={{ marginTop: '10px', color: '#fca5a5', fontSize: '13px' }}>
          {errorMessage}
        </p>
      ) : null}

    </div>
  )
}

export default Profile
