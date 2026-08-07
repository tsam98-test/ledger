'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function updatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setError('')
    setMessage('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      setMessage('Password updated successfully.')

      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-6">
          Reset Password
        </h1>

        <form
          onSubmit={updatePassword}
          className="space-y-4"
        >
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white"
          />

          {error && (
            <div className="text-red-400 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="text-green-400 text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-3 text-white font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 disabled:opacity-50"
          >
            {loading
              ? 'Updating...'
              : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
