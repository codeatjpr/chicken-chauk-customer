import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
import {
  LocationSearchMap,
  type LocationSelection,
} from '@/components/organisms/location-search-map'
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
  latitude: z.number().refine(Number.isFinite, 'Invalid latitude'),
  longitude: z.number().refine(Number.isFinite, 'Invalid longitude'),
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

  const form = useForm<AddAddressFormValues>({
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

  const locationSummary = useWatch({ control: form.control, name: 'city' })
  const latitudeValue = useWatch({ control: form.control, name: 'latitude' })
  const longitudeValue = useWatch({ control: form.control, name: 'longitude' })

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

  const applyPickedLocation = (selection: LocationSelection) => {
    form.setValue('latitude', selection.latitude, { shouldValidate: true, shouldDirty: true })
    form.setValue('longitude', selection.longitude, { shouldValidate: true, shouldDirty: true })
    if (selection.city) {
      form.setValue('city', selection.city, { shouldValidate: true, shouldDirty: true })
    }
    if (selection.state) {
      form.setValue('state', selection.state, { shouldValidate: true, shouldDirty: true })
    }
    if (selection.pincode) {
      form.setValue('pincode', selection.pincode.slice(0, 6), {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
    toast.message('Location updated on the map')
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit delivery address' : 'Add delivery address'}
          </DialogTitle>
          <DialogDescription>
            Search for the place, adjust the pin if needed, and save a delivery-ready address.
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
          <div className="space-y-3">
            <LocationSearchMap
              latitude={latitudeValue}
              longitude={longitudeValue}
              initialSearchText={locationSummary}
              label="Pin delivery location"
              description="Search by area, landmark, city, or pincode, or use your current location. Drag the pin if the spot needs adjustment."
              onPick={applyPickedLocation}
            />
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-2">
              <p className="text-sm font-medium">Delivery pin is ready</p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {form.getValues('city') || defaultCity || city
                  ? `Using ${form.getValues('city') || defaultCity || city} for delivery matching.`
                  : 'Search or place the pin to confirm the delivery spot.'}
              </p>
            </div>
            {(form.formState.errors.latitude || form.formState.errors.longitude) && (
              <p className="text-destructive text-xs">
                Select a valid location on the map before saving.
              </p>
            )}
          </div>
          <input type="hidden" {...form.register('latitude', { valueAsNumber: true })} />
          <input type="hidden" {...form.register('longitude', { valueAsNumber: true })} />
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
