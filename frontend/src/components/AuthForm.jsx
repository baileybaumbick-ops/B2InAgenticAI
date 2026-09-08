import { useState } from 'react'
import { authClient } from '@/lib/authClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AuthForm({ onSignedIn }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ email, password, name: name || email.split('@')[0] })
        : await authClient.signIn.email({ email, password })

      if (result.error) {
        setError(result.error.message || 'Something went wrong. Please try again.')
        return
      }
      onSignedIn()
    } catch {
      setError('Could not reach the auth service. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{isSignUp ? 'Create an account' : 'Sign in'}</CardTitle>
          <CardDescription>
            {isSignUp ? 'Start tracking your Berkeley network.' : 'Welcome back to your networking tracker.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@berkeley.edu"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? 'Please wait…' : isSignUp ? 'Sign up' : 'Sign in'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setError(null)
              setIsSignUp((v) => !v)
            }}
            className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
