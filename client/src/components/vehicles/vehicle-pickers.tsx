'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronsUpDown, Check } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'

export function VehiclePicker({
  options,
  value,
  onChange,
  placeholder,
  id,
  disabled,
}: {
  options: string[]
  value: string | null | undefined
  onChange: (v: string | null) => void
  placeholder: string
  id?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () =>
      search
        ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
        : options,
    [options, search],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        id={id}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !value && 'text-muted-foreground',
        )}
      >
        {value ?? placeholder}
        <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--anchor-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Buscar…`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {filtered.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => {
                    onChange(opt === value ? null : opt)
                    setSearch('')
                    setOpen(false)
                  }}
                >
                  {opt}
                  <Check
                    className={cn('ml-auto size-4', value === opt ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function CustomerPicker({
  value,
  onChange,
  initialName,
}: {
  value: string | null | undefined
  onChange: (id: string | null) => void
  initialName?: string | null
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedName, setSelectedName] = useState<string | null>(initialName ?? null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data: customers } = trpc.vehicles.customers.useQuery(
    { search: debouncedSearch || undefined },
    { enabled: open },
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        id="customer_picker"
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          !value && 'text-muted-foreground',
        )}
      >
        {selectedName ?? 'Seleccionar cliente'}
        <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--anchor-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar cliente…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {customers?.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    if (c.id === value) {
                      onChange(null)
                      setSelectedName(null)
                    } else {
                      onChange(c.id)
                      setSelectedName(c.name)
                    }
                    setOpen(false)
                  }}
                >
                  {c.name}
                  <Check
                    className={cn(
                      'ml-auto size-4',
                      value === c.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
