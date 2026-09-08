import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const EMPTY_CONTACT = {
  name: '',
  company: '',
  role: '',
  where_met: '',
  notes: '',
  priority: 'medium',
}

// One form for both create and edit: pass `contact` to pre-fill for editing, omit for create.
export function ContactForm({ open, onOpenChange, contact, onSubmit }) {
  const isEdit = Boolean(contact)
  const [values, setValues] = useState(() => ({ ...EMPTY_CONTACT, ...contact }))
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  function set(field) {
    return (e) => setValues((v) => ({ ...v, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!values.name.trim()) {
      setError('Name is required.')
      return
    }

    setSaving(true)
    try {
      await onSubmit(values)
      onOpenChange(false)
      setValues(EMPTY_CONTACT)
    } catch (err) {
      setError(err.message || 'Could not save this contact.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setValues({ ...EMPTY_CONTACT, ...contact })
        setError(null)
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit contact' : 'Add a contact'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Update the details for this person.' : 'Keep track of someone you want to stay in touch with.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={values.name} onChange={set('name')} placeholder="Ada Lovelace" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={values.company ?? ''} onChange={set('company')} placeholder="Berkeley Labs" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={values.role ?? ''} onChange={set('role')} placeholder="Software Engineer" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="where_met">Where you met</Label>
                <Input id="where_met" value={values.where_met ?? ''} onChange={set('where_met')} placeholder="Career fair" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={values.priority} onValueChange={(v) => setValues((old) => ({ ...old, priority: v }))}>
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={values.notes ?? ''} onChange={set('notes')} placeholder="What do you want to remember?" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
