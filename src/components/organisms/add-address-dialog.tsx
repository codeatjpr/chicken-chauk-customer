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
import { LocationSearchMap } from '@/components/organisms/location-search-map'
import type { LocationSelection } from '@/types/location'
import type { UserAddressDto } from '@/types/address'
import { useLocationStore } from '@/stores/location-store'
import { getApiErrorMessage } from '@/utils/api-error'
import { encodePlusCode } from '@/lib/plus-code'

const schema = z.object({
  label: z.enum(['HOME', 'WORK', 'OTHER']),
  addressLine1: z.string().min(5, 'Enter full address').max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, '6-digit pincode'),
  latitude: z.number().refine(Number.isFinite, 'Invalid latitude'),
  longitude: z.number().refine(Number.isFinite, 'Invalid longitude'),
  mapFormattedAddress: z.string().max(500).optional(),
  plusCode: z.string().max(32).optional(),
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
      mapFormattedAddress: '',
      plusCode: '',
    },
  })

  const locationSummary = useWatch({ control: form.control, name: 'city' })
  const latitudeValue = useWatch({ control: form.control, name: 'latitude' })
  const longitudeValue = useWatch({ control: form.control, name: 'longitude' })
  const mapFormattedWatch = useWatch({ control: form.control, name: 'mapFormattedAddress' })
  const plusCodeWatch = useWatch({ control: form.control, name: 'plusCode' })

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
        mapFormattedAddress: editing.mapFormattedAddress ?? '',
        plusCode: editing.plusCode ?? '',
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
        mapFormattedAddress: '',
        plusCode: '',
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
    const mapText = selection.displayName?.trim() ?? ''
    form.setValue('mapFormattedAddress', mapText, { shouldValidate: true, shouldDirty: true })
    const pc = selection.plusCode?.trim() || encodePlusCode(selection.latitude, selection.longitude)
    form.setValue('plusCode', pc, { shouldValidate: true, shouldDirty: true })
    if (selection.addressLine1) {
      form.setValue('addressLine1', selection.addressLine1, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
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
    toast.message('Location updated')
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
          <DialogDescription className="sr-only">
            Search or use GPS to fill your address
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
            <Input
              id="addr-line1"
              placeholder="Flat no., building or society, street, area, nearby landmark…"
              autoComplete="street-address"
              {...form.register('addressLine1')}
            />
            {form.formState.errors.addressLine1 && (
              <p className="text-destructive text-xs">
                {form.formState.errors.addressLine1.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="addr-line2">Address line 2 (optional)</Label>
            <Input
              id="addr-line2"
              placeholder="Apartment, floor, wing, or extra directions (optional)"
              autoComplete="address-line2"
              {...form.register('addressLine2')}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="addr-city">City</Label>
              <Input
                id="addr-city"
                placeholder="e.g. Bengaluru"
                autoComplete="address-level2"
                {...form.register('city')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-state">State</Label>
              <Input
                id="addr-state"
                placeholder="e.g. Karnataka"
                autoComplete="address-level1"
                {...form.register('state')}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addr-pin">Pincode</Label>
            <Input
              id="addr-pin"
              placeholder="6-digit PIN code"
              inputMode="numeric"
              autoComplete="postal-code"
              {...form.register('pincode')}
              maxLength={6}
            />
            {form.formState.errors.pincode && (
              <p className="text-destructive text-xs">
                {form.formState.errors.pincode.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <LocationSearchMap
              key={editing?.id ?? 'new-address'}
              embedded
              searchPlaceholder="Search building, area, or street to place the pin…"
              latitude={latitudeValue}
              longitude={longitudeValue}
              initialSearchText={locationSummary}
              initialSelectedSummary={
                editing
                  ? [
                      editing.addressLine1,
                      editing.addressLine2,
                      `${editing.city}, ${editing.state} ${editing.pincode}`,
                    ]
                      .filter(Boolean)
                      .join(', ')
                  : undefined
              }
              onPick={applyPickedLocation}
            />
            {(mapFormattedWatch || plusCodeWatch) && (
              <div className="border-border/70 bg-muted/30 rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Selected map location
                </p>
                {plusCodeWatch ? (
                  <p className="text-foreground mt-1 font-mono text-xs">{plusCodeWatch}</p>
                ) : null}
                {mapFormattedWatch ? (
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {mapFormattedWatch}
                  </p>
                ) : null}
              </div>
            )}
            {(form.formState.errors.latitude || form.formState.errors.longitude) && (
              <p className="text-destructive text-xs">
                Set a location with search or GPS first.
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
