import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date added' },
  { value: 'updated_at', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'company', label: 'Company' },
  { value: 'priority', label: 'Priority' },
]

export function SortFilterBar({ filters, onChange }) {
  function update(patch) {
    onChange({ ...filters, ...patch })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <Input
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        placeholder="Search by name…"
        className="sm:max-w-56"
      />

      <Select value={filters.priority || 'all'} onValueChange={(v) => update({ priority: v === 'all' ? '' : v })}>
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Select value={filters.sortBy} onValueChange={(v) => update({ sortBy: v })}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.sortDir} onValueChange={(v) => update({ sortDir: v })}>
          <SelectTrigger className="sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
