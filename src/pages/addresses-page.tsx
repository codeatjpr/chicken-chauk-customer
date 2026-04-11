import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Loader2Icon,
  Pencil,
  Star,
  Trash2,
  Plus,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AddAddressDialog } from '@/components/organisms/add-address-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { ROUTES } from '@/constants/routes'
import * as addressesApi from '@/services/addresses.service'
import type { UserAddressDto } from '@/types/address'
import { getApiErrorMessage } from '@/utils/api-error'
import { cn } from '@/lib/utils'

export function AddressesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<UserAddressDto | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: queryKeys.addresses.list,
    queryFn: () => addressesApi.fetchAddresses(),
  })

  const addresses = listQuery.data ?? []

  const defaultMut = useMutation({
    mutationFn: addressesApi.setDefaultAddress,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.addresses.list })
      toast.success('Default address updated')
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'Could not update default')),
  })

  const deleteMut = useMutation({
    mutationFn: addressesApi.deleteAddress,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.addresses.list })
      toast.success('Address removed')
      setDeleteId(null)
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'Could not delete address')),
  })

  const saveMut = useMutation({
    mutationFn: async (p: {
      editing: UserAddressDto | null
      values: Parameters<typeof addressesApi.createAddress>[0]
    }) => {
      if (p.editing) {
        return addressesApi.updateAddress(p.editing.id, {
          label: p.values.label,
          addressLine1: p.values.addressLine1,
          addressLine2: p.values.addressLine2 || null,
          city: p.values.city,
          state: p.values.state,
          pincode: p.values.pincode,
          latitude: p.values.latitude,
          longitude: p.values.longitude,
        })
      }
      return addressesApi.createAddress(p.values)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.addresses.list })
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'Could not save address')),
  })

  const openAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (a: UserAddressDto) => {
    setEditing(a)
    setDialogOpen(true)
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <Link
          to={ROUTES.profile}
          className="text-muted-foreground text-sm hover:underline"
        >
          Account
        </Link>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Saved addresses
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage delivery locations for checkout.
          </p>
        </div>
        <Button type="button" size="sm" className="gap-1" onClick={openAdd}>
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      {listQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="border-border/60 rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">No addresses yet.</p>
          <Button type="button" className="mt-4" onClick={openAdd}>
            Add your first address
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="border-border/80 bg-card rounded-xl border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {a.label}
                    {a.isDefault && (
                      <span className="text-muted-foreground ms-2 text-xs font-normal">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {a.addressLine1}
                    {a.addressLine2 ? `, ${a.addressLine2}` : ''}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {a.city}, {a.state} {a.pincode}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit address"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete address"
                    onClick={() => setDeleteId(a.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {!a.isDefault && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn('mt-3 gap-1')}
                  disabled={defaultMut.isPending}
                  onClick={() => defaultMut.mutate(a.id)}
                >
                  {defaultMut.isPending ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <Star className="size-3.5" />
                  )}
                  Set as default
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <AddAddressDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) setEditing(null)
        }}
        editing={editing}
        onSubmit={async (values) => {
          await saveMut.mutateAsync({
            editing,
            values: {
              ...values,
              isDefault: addresses.length === 0 && !editing,
            },
          })
        }}
      />

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this address?</AlertDialogTitle>
            <AlertDialogDescription>
              You can add it again later from checkout or this screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
            >
              {deleteMut.isPending && (
                <Loader2Icon className="me-2 size-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
