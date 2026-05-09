'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronsUpDown, Check, UserPlus } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { CreateCustomerDialog } from './create-customer-dialog'

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
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data: customers } = trpc.vehicles.customers.useQuery(
    { search: debouncedSearch || undefined },
    { enabled: open },
  )

  function openCreate() {
    setOpen(false)
    setCreateOpen(true)
  }

  function handleCreated(id: string, name: string) {
    onChange(id)
    setSelectedName(name)
    setCreateOpen(false)
  }

  return (
    <>
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
            <div className="flex items-center border-b">
              <CommandInput
                placeholder="Buscar cliente…"
                value={search}
                onValueChange={setSearch}
                className="flex-1 border-0 focus:ring-0"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mr-1 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={openCreate}
                title="Crear cliente"
              >
                <UserPlus className="size-3.5" />
              </Button>
            </div>
            <CommandList>
              <CommandEmpty>
                <span className="text-muted-foreground">Sin resultados.</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-7 gap-1.5 text-xs"
                  onClick={openCreate}
                >
                  <UserPlus className="size-3" />
                  Crear cliente
                </Button>
              </CommandEmpty>
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

      <CreateCustomerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </>
  )
}
