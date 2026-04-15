import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function Profile({ user }) {
  const navigate = useNavigate()

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/signin')
  }

  return (
    <div className="p-4">
      <h1 className="mb-6 text-2xl">Profile</h1>
      <div className="rounded-xl border border-white/10 bg-[#17172a] p-4">
        <p className="text-sm text-white/60">Email</p>
        <p className="mt-1">{user.email}</p>
      </div>
      <button
        type="button"
        onClick={signOut}
        className="mt-4 h-12 w-full rounded-lg border border-white/20 text-white"
      >
        Sign out
      </button>
    </div>
  )
}

export default Profile
