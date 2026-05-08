import { SignIn } from '@clerk/nextjs'
import { SignInClient } from './sign-in-client'

export default async function Page({ searchParams }: { searchParams: Promise<{ clerk?: string }> }) {
  const { clerk } = await searchParams
  if (clerk) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a2744 0%, #2e4a8a 50%, #1e3a6e 100%)' }}>
        <SignIn />
      </div>
    )
  }
  return <SignInClient />
}
