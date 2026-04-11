import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserAddressDto } from '@/types/address'
import { useLocationStore } from '@/stores/location-store'
import { getApiErrorMessage } from '@/utils/api-error'

const schema = z.object({
  label: z.enum(['HOME', 'WORK', 'OTHER']),
  addressLine1: z.string().min(5, 'Enter full address').max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, '6-digit pincode'),
  latitude: z.coerce.number().refine(Number.isFinite, 'Invalid latitude'),
  longitude: z.coerce.number().refine(Number.isFinite, 'Invalid longitude'),
})

export type AddAddressFormValues = z.infer<typeof schema>

type AddAddressDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCity?: string
  /** When set, form is prefilled for editing an existing saved address. */
  editing?: UserAddressDto | null
  onSubmit: (values: AddAddressFormValues) => Promise<void>
}

export function AddAddressDialog({
  open,
  onOpenChange,
  defaultCity,
  editing,
  onSubmit,
}: AddAddressDialogProps) {
  const { city, latitude, longitude } = useLocationStore()

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      label: 'HOME' as const,
      addressLine1: '',
      addressLine2: '',
      city: defaultCity ?? city,
      state: '',
      pincode: '',
      latitude,
      longitude,
    },
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({
        label: editing.label,
        addressLine1: editing.addressLine1,
        addressLine2: editing.addressLine2 ?? '',
        city: editing.city,
        state: editing.state,
        pincode: editing.pincode,
        latitude: editing.latitude,
        longitude: editing.longitude,
      })
    } else {
      form.reset({
        label: 'HOME',
        addressLine1: '',
        addressLine2: '',
        city: defaultCity ?? city,
        state: '',
        pincode: '',
        latitude,
        longitude,
      })
    }
  }, [
    open,
    editing?.id,
    editing,
    defaultCity,
    city,
    latitude,
    longitude,
    form,
  ])

  const detect = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue('latitude', pos.coords.latitude)
        form.setValue('longitude', pos.coords.longitude)
        toast.message('GPS coordinates applied')
      },
      () => toast.error('Could not read your location'),
    )
  }

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values)
      toast.success(editing ? 'Address updated' : 'Address saved')
      onOpenChange(false)
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not save address'))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit delivery address' : 'Add delivery address'}
          </DialogTitle>
          <DialogDescription>
            We deliver to this location. Pin on the map is used for distance
            checks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="addr-label">Label</Label>
            <select
              id="addr-label"
              className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm"
              {...form.register('label')}
            >
              <option value="HOME">Home</option>
              <option value="WORK">Work</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addr-line1">Address line 1</Label>
            <Input id="addr-line1" {...form.register('addressLine1')} />
            {form.formState.errors.addressLine1 && (
              <p className="text-destructive text-xs">
                {form.formState.errors.addressLine1.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="addr-line2">Address line 2 (optional)</Label>
            <Input id="addr-line2" {...form.register('addressLine2')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="addr-city">City</Label>
              <Input id="addr-city" {...form.register('city')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-state">State</Label>
              <Input id="addr-state" {...form.register('state')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addr-pin">Pincode</Label>
            <Input id="addr-pin" {...form.register('pincode')} maxLength={6} />
            {form.formState.errors.pincode && (
              <p className="text-destructive text-xs">
                {form.formState.errors.pincode.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="addr-lat">Latitude</Label>
              <Input
                id="addr-lat"
                type="number"
                step="any"
                {...form.register('latitude', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-lng">Longitude</Label>
              <Input
                id="addr-lng"
                type="number"
                step="any"
                {...form.register('longitude', { valueAsNumber: true })}
              />
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={detect}>
            <MapPin className="size-4" />
            Use GPS for coordinates
          </Button>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Save address
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
