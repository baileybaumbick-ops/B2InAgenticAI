import { createAuthClient } from '@neondatabase/neon-js/auth'

export const authClient = createAuthClient(import.meta.env.NEXT_PUBLIC_NEON_AUTH_URL)
