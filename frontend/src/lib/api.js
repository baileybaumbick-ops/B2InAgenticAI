import { authClient } from './authClient'

// Fetches a fresh session immediately before each call rather than caching the access
// token in component state — Better Auth session tokens are short-lived (~15 min) and
// this gives the SDK a chance to transparently refresh an expiring one.
async function authHeader() {
  const { data } = await authClient.getSession()
  const token = data?.session?.token
  if (!token) throw new Error('Not signed in.')
  return { Authorization: `Bearer ${token}` }
}

async function request(path, options = {}) {
  const headers = await authHeader()
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...options.headers,
    },
  })

  if (res.status === 204) return null

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status}).`)
  }
  return body
}

export function listContacts({ sortBy = 'created_at', sortDir = 'desc', priority, company, search } = {}) {
  const params = new URLSearchParams({ sortBy, sortDir })
  if (priority) params.set('priority', priority)
  if (company) params.set('company', company)
  if (search) params.set('search', search)
  return request(`/contacts?${params.toString()}`)
}

export function createContact(payload) {
  return request('/contacts', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateContact(id, payload) {
  return request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteContact(id) {
  return request(`/contacts/${id}`, { method: 'DELETE' })
}
