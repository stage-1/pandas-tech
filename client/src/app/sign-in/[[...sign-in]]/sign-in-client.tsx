'use client'

import { useSignIn, useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field-error'
import dynamic from 'next/dynamic'

const DenimBg = dynamic(() => import('./denim-bg').then(m => m.DenimBg), { ssr: false })

const DEV = process.env.NODE_ENV === 'development'
const log = (...args: unknown[]) => { if (DEV) console.log('[sign-in]', ...args) }

const PASSCODE_HASH = 'a4a578c2a9b5837b1a605542df190453d4bb830482ae63cc26931f7aa6263134'

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormValues = z.input<typeof schema>

export function SignInClient() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const { signIn, fetchStatus } = useSignIn()
  const [formError, setFormError] = useState<string | null>(null)
  const [showBypass, setShowBypass] = useState(false)
  const [bypassInput, setBypassInput] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      log('already signed in — redirecting to /dashboard')
      window.location.assign('/dashboard')
    }
  }, [authLoaded, isSignedIn])

  if (!authLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fef9ef 0%, #fde4b0 45%, #f5a855 75%, #e8773a 100%)' }}>
        <span className="text-sm text-white/50">Loading…</span>
      </div>
    )
  }

  if (isSignedIn) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fef9ef 0%, #fde4b0 45%, #f5a855 75%, #e8773a 100%)' }}>
        <span className="text-sm text-white/50">Opening dashboard…</span>
      </div>
    )
  }

  async function onSubmit(values: FormValues) {
    setFormError(null)
    log('submit — email:', values.email)

    const { error } = await signIn.password({ emailAddress: values.email, password: values.password })

    if (error) {
      log('password error:', JSON.stringify(error))
      const param = (error as { meta?: { paramName?: string } }).meta?.paramName
      if (param === 'identifier' || param === 'email_address') {
        setError('email', { message: error.message })
      } else if (param === 'password') {
        setError('password', { message: error.message })
      } else {
        setFormError(error.message ?? 'Something went wrong. Please try again.')
      }
      return
    }

    log('password ok — status:', signIn.status)

    if (signIn.status === 'complete') {
      const { error: finalizeError } = await signIn.finalize({
        navigate: ({ decorateUrl }) => window.location.assign(decorateUrl('/dashboard')),
      })
      if (finalizeError) {
        log('finalize error:', finalizeError)
        setFormError(finalizeError.message ?? 'Sign-in could not be completed. Please try again.')
      }
    } else {
      log('unexpected status after password:', signIn.status)
      setFormError('Sign-in could not be completed. Please try again.')
    }
  }

  async function onGoogleSignIn() {
    log('initiating google oauth')
    const { error } = await signIn.sso({
      strategy: 'oauth_google',
      redirectUrl: '/dashboard',
      redirectCallbackUrl: '/sso-callback',
    })
    if (error) {
      log('google oauth error:', error)
      setFormError('Google sign-in failed. Please try again.')
    }
  }

  async function onBypassKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const hash = await sha256(bypassInput)
    log('bypass attempt — hash:', hash)
    if (hash === PASSCODE_HASH) {
      log('bypass correct — redirecting to /dashboard')
      window.location.assign('/dashboard')
    } else {
      log('bypass wrong — redirecting to maze')
      window.location.assign('https://maze.toys/mazes/mini/daily/')
    }
  }

  return (
    <>
      {/* Base gradient — fixed, lowest layer */}
      <div className="fixed inset-0" style={{ background: 'linear-gradient(135deg, #fef9ef 0%, #fde4b0 45%, #f5a855 75%, #e8773a 100%)', zIndex: 0 }} />
      {/* Three.js canvas — z:1, 50% opacity, above gradient */}
      <DenimBg />
      {/* Card layer — z:2, above canvas */}
      <div
        className="relative min-h-screen flex items-center justify-center px-8 lg:px-4"
        style={{ zIndex: 2 }}
      >
      <div className="relative w-full max-w-sm">
      <Card
        className="w-full border-white/8 text-white"
        style={{
          background: 'rgba(10, 18, 40, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <CardHeader className="items-center text-center">
          {/* Panda SVG — white only */}
          <svg
            width="52"
            height="52"
            viewBox="0 0 100 100"
            fill="white"
            aria-hidden
            className="mb-1 mx-auto"
          >
            {/* Ears */}
            <circle cx="22" cy="22" r="16" />
            <circle cx="78" cy="22" r="16" />
            {/* Head */}
            <circle cx="50" cy="52" r="36" />
            {/* Eye patches */}
            <ellipse cx="35" cy="46" rx="11" ry="10" fill="#0a1228" />
            <ellipse cx="65" cy="46" rx="11" ry="10" fill="#0a1228" />
            {/* Eyes */}
            <circle cx="35" cy="46" r="5" />
            <circle cx="65" cy="46" r="5" />
            {/* Nose */}
            <ellipse cx="50" cy="60" rx="7" ry="5" fill="#0a1228" />
          </svg>
          <CardTitle className="text-white text-lg">Sign in</CardTitle>
        </CardHeader>

        <CardContent className="text-center">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-blue-400 focus-visible:ring-blue-400/20"
                {...register('email')}
              />
              <FieldError message={errors.email?.message} />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-blue-400 focus-visible:ring-blue-400/20"
                {...register('password')}
              />
              <FieldError message={errors.password?.message} />
            </div>

            {formError && (
              <p className="text-xs text-red-400 -mt-1">{formError}</p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || fetchStatus === 'fetching'}
              className="w-full bg-red-600 hover:bg-red-500 text-white border-0 h-10 sm:h-9 font-bold sm:font-semibold"
            >
              {isSubmitting || fetchStatus === 'fetching' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 text-xs text-white/30" style={{ background: 'rgba(10,18,40,0.85)' }}>
                or
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white h-10 sm:h-9 font-bold sm:font-semibold"
            onClick={onGoogleSignIn}
          >
            Continue with Google
          </Button>
        </CardContent>

        <CardFooter className="justify-center border-t border-white/8 bg-transparent">
          <p className="text-xs text-white/30">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <a
            href="?clerk=1"
            tabIndex={-1}
            aria-label="Clerk sign-in"
            className="opacity-20 hover:opacity-60 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M21.47 20.829a.614.614 0 0 1-.57.171l-3.118-.685a.624.624 0 0 1-.31-.168 7.51 7.51 0 0 0-5.463-2.312 7.51 7.51 0 0 0-5.462 2.312.624.624 0 0 1-.311.168l-3.118.685a.614.614 0 0 1-.57-.171.59.59 0 0 1-.114-.572l1.093-3.083a.603.603 0 0 1 .183-.271A11.93 11.93 0 0 1 12.01 14c3.078 0 5.878 1.16 7.979 3.072.088.08.15.183.183.271l1.093 3.083a.59.59 0 0 1-.115.572v.001ZM12.009 12.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Z" fill="currentColor" className="text-white"/>
            </svg>
          </a>
          <button
            type="button"
            onClick={() => { setShowBypass(v => !v); setBypassInput('') }}
            className="text-base opacity-20 hover:opacity-60 transition-opacity select-none cursor-default"
            tabIndex={-1}
            aria-hidden
          >
            🐼
          </button>
          {showBypass && (
            <input
              autoFocus
              type="password"
              value={bypassInput}
              onChange={e => setBypassInput(e.target.value)}
              onKeyDown={onBypassKey}
              className="absolute bottom-7 right-0 w-28 text-xs px-2 py-1 rounded bg-black/70 border border-white/10 text-white outline-none"
              placeholder="••••••••"
            />
          )}
        </div>
      </div>
      </div>
    </>
  )
}
