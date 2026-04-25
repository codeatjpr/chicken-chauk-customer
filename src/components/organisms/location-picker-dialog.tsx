import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  const [selectedSpot, setSelectedSpot] = useState<LocationSelection | null>(null)
  const [draftLat, setDraftLat] = useState(latitude)
  const [draftLng, setDraftLng] = useState(longitude)

  const syncFromStore = () => {
    setSelectedSpot(null)
    setDraftLat(latitude)
    setDraftLng(longitude)
  }

  const handleOpen = (o: boolean) => {
    if (o) syncFromStore()
    onOpenChange(o)
  }

  const save = () => {
    if (!Number.isFinite(draftLat) || !Number.isFinite(draftLng)) {
      toast.error('Search or use current location')
      return
    }
    const cityForApi = selectedSpot?.city?.trim() || city
    const labelForHeader =
      selectedSpot?.displayName?.trim() ||
      displayLabel.trim() ||
      cityForApi ||
      formatShortCoordLabel(draftLat, draftLng)
    setLocation(cityForApi, draftLat, draftLng, labelForHeader)
    toast.success('Location updated')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[400px]">
        <DialogHeader className="border-border shrink-0 px-4 pt-4 pb-3 sm:px-5">
          <DialogTitle className="text-base font-semibold">Your location</DialogTitle>
          <DialogDescription className="sr-only">
            Search for an address or use your current location
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 sm:px-5">
          <LocationSearchMap
            embedded
            latitude={draftLat}
            longitude={draftLng}
            initialSearchText=""
            initialSelectedSummary={displayLabel || undefined}
            onPick={(selection) => {
              setSelectedSpot(selection)
              setDraftLat(selection.latitude)
              setDraftLng(selection.longitude)
            }}
          />
        </div>
        <DialogFooter className="border-border mt-0 shrink-0 gap-2 border-t px-4 py-3 sm:px-5">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
