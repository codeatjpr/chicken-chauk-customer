import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LocationSearchMap } from '@/components/organisms/location-search-map'
import { formatShortCoordLabel } from '@/lib/location-label'
import type { LocationSelection } from '@/types/location'
import { useLocationStore } from '@/stores/location-store'
import { toast } from 'sonner'

type LocationPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LocationPickerDialog({
  open,
  onOpenChange,
}: LocationPickerDialogProps) {
  const { city, displayLabel, latitude, longitude, setLocation } = useLocationStore()
  /** Remount search when the dialog opens so field / list state does not carry over. */
  const [sessionKey, setSessionKey] = useState(0)

  const handleOpen = (o: boolean) => {
    if (o) setSessionKey((k) => k + 1)
    onOpenChange(o)
  }

  const applyAndClose = (selection: LocationSelection) => {
    if (!Number.isFinite(selection.latitude) || !Number.isFinite(selection.longitude)) {
      toast.error('Search or use current location')
      return
    }
    const cityForApi = selection.city?.trim() || city
    const labelForHeader =
      selection.displayName?.trim() ||
      displayLabel.trim() ||
      cityForApi ||
      formatShortCoordLabel(selection.latitude, selection.longitude)
    setLocation(cityForApi, selection.latitude, selection.longitude, labelForHeader)
    toast.success('Location updated')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[400px]">
        <DialogHeader className="shrink-0 border-b border-zinc-100/90 px-4 pt-4 pb-3 sm:px-5">
          <DialogTitle className="text-base font-semibold tracking-tight">Your location</DialogTitle>
          <DialogDescription className="sr-only">
            Search for an address or use your current location. Choosing a result saves it
            automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 sm:px-5">
          <LocationSearchMap
            key={sessionKey}
            embedded
            latitude={latitude}
            longitude={longitude}
            initialSearchText=""
            initialSelectedSummary={displayLabel || undefined}
            onPick={applyAndClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
