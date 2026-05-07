'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'

export function AuthLogger() {
  const { user, isLoaded, isSignedIn } = useUser()
  const prevSignedIn = useRef<boolean | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn && user) {
      console.log('[AUTH] Signed in —', {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
      })
    } else {
      console.log('[AUTH] Signed out')
    }
  }, [isLoaded, isSignedIn, user])

  // Log sign-in / sign-out transitions (not the initial load)
  useEffect(() => {
    if (!isLoaded) return
    if (prevSignedIn.current === null) {
      prevSignedIn.current = isSignedIn ?? false
      return
    }
    if (isSignedIn && prevSignedIn.current === false) {
      console.log('[AUTH] → signed in')
    } else if (!isSignedIn && prevSignedIn.current === true) {
      console.log('[AUTH] → signed out')
    }
    prevSignedIn.current = isSignedIn ?? false
  }, [isLoaded, isSignedIn])

  return null
}
