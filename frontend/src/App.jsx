import { useCallback, useEffect, useState } from 'react'
import { authClient } from '@/lib/authClient'
import { listContacts, createContact, updateContact, deleteContact } from '@/lib/api'
import { AuthForm } from '@/components/AuthForm'
import { ContactForm } from '@/components/ContactForm'
import { ContactTable } from '@/components/ContactTable'
import { SortFilterBar } from '@/components/SortFilterBar'
import { Button } from '@/components/ui/button'

const DEFAULT_FILTERS = { sortBy: 'created_at', sortDir: 'desc', priority: '', search: '' }

function Dashboard({ user, onSignOut }) {
  const [contacts, setContacts] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [formOpen, setFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState(null)

  const refresh = useCallback(async () => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const data = await listContacts(filters)
      setContacts(data)
      setStatus('ready')
    } catch (err) {
      setErrorMessage(err.message || 'Could not load your contacts.')
      setStatus('error')
    }
  }, [filters])

  useEffect(() => {
    refresh()
  }, [refresh])

  function openCreate() {
    setEditingContact(null)
    setFormOpen(true)
  }

  function openEdit(contact) {
    setEditingContact(contact)
    setFormOpen(true)
  }

  async function handleSubmit(values) {
    if (editingContact) {
      await updateContact(editingContact.id, values)
    } else {
      await createContact(values)
    }
    await refresh()
  }

  async function handleDelete(contact) {
    if (!window.confirm(`Delete ${contact.name}? This cannot be undone.`)) return
    try {
      await deleteContact(contact.id)
      await refresh()
    } catch (err) {
      alert(err.message || 'Could not delete this contact.')
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Networking Tracker</h1>
          <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
        </div>
        <Button variant="outline" onClick={onSignOut}>
          Sign out
        </Button>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SortFilterBar filters={filters} onChange={setFilters} />
        <Button onClick={openCreate} className="sm:shrink-0">
          Add contact
        </Button>
      </div>

      {status === 'loading' && <p className="py-12 text-center text-muted-foreground">Loading your contacts…</p>}

      {status === 'error' && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
          <Button variant="link" className="ml-2 h-auto p-0 text-destructive" onClick={refresh}>
            Try again
          </Button>
        </div>
      )}

      {status === 'ready' && contacts.length === 0 && (
        <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
          <p>No contacts yet.</p>
          <p className="text-sm">Add the first person you want to stay in touch with.</p>
        </div>
      )}

      {status === 'ready' && contacts.length > 0 && (
        <ContactTable contacts={contacts} onEdit={openEdit} onDelete={handleDelete} />
      )}

      <ContactForm
        key={editingContact?.id ?? 'new'}
        open={formOpen}
        onOpenChange={setFormOpen}
        contact={editingContact}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  const checkSession = useCallback(async () => {
    const { data } = await authClient.getSession()
    setSession(data?.session && data?.user ? data : null)
    setCheckingSession(false)
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  async function handleSignOut() {
    await authClient.signOut()
    setSession(null)
  }

  if (checkingSession) {
    return <div className="flex min-h-svh items-center justify-center text-muted-foreground">Loading…</div>
  }

  if (!session) {
    return <AuthForm onSignedIn={checkSession} />
  }

  return <Dashboard user={session.user} onSignOut={handleSignOut} />
}
