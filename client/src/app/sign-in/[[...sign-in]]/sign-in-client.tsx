'use client'

import { useSignIn, useAuth } from '@clerk/nextjs'
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

const DEV = process.env.NODE_ENV === 'development'
const log = (...args: unknown[]) => { if (DEV) console.log('[sign-in]', ...args) }

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormValues = z.input<typeof schema>

export function SignInClient() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      log('already signed in, redirecting to /dashboard')
      window.location.assign('/dashboard')
    }
  }, [authLoaded, isSignedIn])

  if (!authLoaded || !signInLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a2744 0%, #2e4a8a 50%, #1e3a6e 100%)' }}>
        <span className="text-sm text-white/50">Loading…</span>
      </div>
    )
  }

  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a2744 0%, #2e4a8a 50%, #1e3a6e 100%)' }}>
        <span className="text-sm text-white/50">Opening dashboard…</span>
      </div>
    )
  }

  async function onSubmit(values: FormValues) {
    if (!signIn) return
    setFormError(null)
    log('submit', values.email)
    try {
      const result = await signIn.create({
        identifier: values.email,
        password: values.password,
        strategy: 'password',
      })
      log('create result status:', result.status)
      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId })
        log('session active, redirecting')
        window.location.assign('/dashboard')
      } else {
        log('unexpected status:', result.status)
        setFormError('Sign-in could not be completed. Please try again.')
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { code: string; message: string; meta?: { paramName?: string } }[] }
      log('clerk error:', clerkErr?.errors)
      if (clerkErr?.errors?.length) {
        for (const e of clerkErr.errors) {
          const param = e.meta?.paramName
          if (param === 'identifier' || param === 'email_address') {
            setError('email', { message: e.message })
          } else if (param === 'password') {
            setError('password', { message: e.message })
          } else {
            setFormError(e.message)
          }
        }
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    }
  }

  async function onGoogleSignIn() {
    if (!signIn) return
    log('initiating google oauth')
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      })
    } catch (err) {
      log('google oauth error:', err)
      setFormError('Google sign-in failed. Please try again.')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #1a2744 0%, #2e4a8a 50%, #1e3a6e 100%)' }}
    >
      <Card
        className="w-full max-w-sm border-white/8 text-white"
        style={{
          background: 'rgba(10, 18, 40, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <CardHeader>
          <CardTitle className="text-white text-lg">Sign in</CardTitle>
          <CardDescription className="text-white/50">
            Enter your email and password to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white border-0"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
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
            className="w-full border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
            onClick={onGoogleSignIn}
          >
            Continue with Google
          </Button>
        </CardContent>

        <CardFooter className="justify-center border-t border-white/8 bg-transparent">
          <p className="text-xs text-white/30">
            Don&apos;t have an account?{' '}
            <a href="/sign-up" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
              Sign up
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
