import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

function PriorityBadge({ priority }) {
  return <Badge className={PRIORITY_STYLES[priority] ?? ''}>{priority}</Badge>
}

export function ContactTable({ contacts, onEdit, onDelete }) {
  return (
    <>
      {/* Desktop: full table */}
      <div className="hidden overflow-x-auto rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Where you met</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.company || '—'}</TableCell>
                <TableCell>{c.role || '—'}</TableCell>
                <TableCell>{c.where_met || '—'}</TableCell>
                <TableCell>
                  <PriorityBadge priority={c.priority} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(c)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(c)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {contacts.map((c) => (
          <div key={c.id} className="rounded-md border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{c.name}</p>
                {c.company && (
                  <p className="text-sm text-muted-foreground">
                    {c.role ? `${c.role} at ${c.company}` : c.company}
                  </p>
                )}
              </div>
              <PriorityBadge priority={c.priority} />
            </div>
            {c.where_met && <p className="mt-2 text-sm text-muted-foreground">Met at {c.where_met}</p>}
            {c.notes && <p className="mt-2 text-sm">{c.notes}</p>}
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(c)}>
                Edit
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-destructive" onClick={() => onDelete(c)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
