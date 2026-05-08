'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // NEW
  const [isSignup, setIsSignup] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)

  // NEW
  const [isSignup, setIsSignup] = useState(false)

  const router = useRouter()
  const supabase = createClient()

 async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccessMessage('Password reset link sent! Check your email.')
    }
    setLoading(false)
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!email || !password) {
      setError('Please enter your email and password.')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }

   // PASSWORD VALIDATION FOR SIGNUP
    if (isSignup && password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    // CONFIRM PASSWORD CHECK
    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    try {
      // SIGN UP
      if (isSignup) {
        const { error: signupError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        options: {
        emailRedirectTo: 'https://YOUR-VERCEL-APP.vercel.app',
      },
        })

        if (signupError) {
          setError(signupError.message)
          setLoading(false)
          return
        }

        alert(
          'Account created successfully! You can now sign in.'
        )

        setIsSignup(false)
        setPassword('')
        setLoading(false)
        return
      }

      // SIGN IN
      const { error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setError('Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Background Effects */}
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(0,212,170,0.12) 0%, transparent 70%)',
        }}
      />

      <div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(130,60,232,0.12) 0%, transparent 70%)',
        }}
      />

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(60,110,232,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,170,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,170,1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="w-full max-w-sm relative animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex mb-4">
            <Image
              src="/Icon.png"
              alt="Spendora"
              width={72}
              height={72}
              className="rounded-2xl"
            />
          </div>

          <h1 className="font-display text-3xl text-[var(--text-primary)] tracking-tight">
            Spendora
          </h1>

          <p
            className="text-sm mt-1.5"
            style={{ color: 'rgba(0,212,170,0.7)' }}
          >
            Track. Budget. Grow.
          </p>
        </div>

        {/* Card */}
        <div
          className="card p-7"
          style={{
            borderColor: 'rgba(0,212,170,0.15)',
            boxShadow:
              '0 0 40px rgba(0,212,170,0.05), 0 0 80px rgba(130,60,232,0.05)',
          }}
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            {isForgotPassword ? 'Reset Password' : isSignup ? 'Create Account' : 'Sign in'}
          </h2>

          {/* FORGOT PASSWORD FORM */}
          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={loading}
                    style={{ borderColor: 'rgba(0,212,170,0.15)' }}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-50 text-white"
                style={{ background: 'linear-gradient(135deg, #00D4AA 0%, #3C6EE8 50%, #823CE8 100%)' }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="mt-3 text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false)
                    setError(null)
                    setSuccessMessage(null)
                  }}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  ← Back to Sign in
                </button>
              </div>
            </form>
          ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            {/* EMAIL */}
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                  style={{
                    borderColor: 'rgba(0,212,170,0.15)',
                  }}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  autoComplete={
                    isSignup
                      ? 'new-password'
                      : 'current-password'
                  }
                  required
                  disabled={loading}
                  style={{
                    borderColor: 'rgba(0,212,170,0.15)',
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
            </div>

        </div>
            </div>

            {/* FORGOT PASSWORD LINK — login only */}
            {!isSignup && (
              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true)
                    setError(null)
                    setSuccessMessage(null)
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* ERROR */}

            {/* CONFIRM PASSWORD — signup only */}
            {isSignup && (
              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />

                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    style={{ borderColor: 'rgba(0,212,170,0.15)' }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
        
           {/* ERROR */}
            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {successMessage && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                {successMessage}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-50 text-white"
              style={{
                background:
                  'linear-gradient(135deg, #00D4AA 0%, #3C6EE8 50%, #823CE8 100%)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>

                  {isSignup
                    ? 'Creating account...'
                    : 'Signing in...'}
                </span>
              ) : isSignup ? (
                'Create Account'
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </form>
          )} {/* end of isForgotPassword conditional */}

          {/* TOGGLE */}
          <div className="mt-5 text-center text-sm">
            {isSignup ? (
              <>
                <span className="text-[var(--text-muted)]">
                  Already have an account?
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(false)
                    setError(null)
                    setConfirmPassword('')
                  }}
                  className="ml-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                <span className="text-[var(--text-muted)]">
                  Don&apos;t have an account?
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(true)
                    setError(null)
                  }}
                  className="ml-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Create one
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-[var(--text-muted)] text-xs mt-6">
          🔒 Secure multi-user authentication enabled
        </p>
      </div>
    </div>
  )
}
