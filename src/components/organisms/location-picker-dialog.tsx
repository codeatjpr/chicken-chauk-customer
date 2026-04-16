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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  LocationSearchMap,
  type LocationSelection,
} from '@/components/organisms/location-search-map'
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
  const [cityInput, setCityInput] = useState(displayLabel)
  const [selectedSpot, setSelectedSpot] = useState<LocationSelection | null>(null)
  const [draftLat, setDraftLat] = useState(latitude)
  const [draftLng, setDraftLng] = useState(longitude)

  const syncFromStore = () => {
    setCityInput(displayLabel || city)
    setSelectedSpot(null)
    setDraftLat(latitude)
    setDraftLng(longitude)
  }

  const handleOpen = (o: boolean) => {
    if (o) syncFromStore()
    onOpenChange(o)
  }

  const save = () => {
    if (!cityInput.trim()) {
      toast.error('Enter a delivery area or city name')
      return
    }
    if (!Number.isFinite(draftLat) || !Number.isFinite(draftLng)) {
      toast.error('Pick a valid delivery location on the map')
      return
    }
    const resolvedCity = selectedSpot?.city?.trim() || cityInput.trim()
    setLocation(resolvedCity, draftLat, draftLng, cityInput.trim())
    toast.success('Location updated')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose delivery area</DialogTitle>
          <DialogDescription>
            Search by city, area, landmark, or pincode, then fine-tune the pin if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="loc-city">Delivery area name</Label>
            <Input
              id="loc-city"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="e.g. Dwarka, Delhi"
            />
            <p className="text-muted-foreground text-xs">
              This is the name shown across the customer app for nearby vendors and delivery search.
            </p>
          </div>
          <LocationSearchMap
            latitude={draftLat}
            longitude={draftLng}
            initialSearchText={cityInput}
            label="Pick your delivery spot"
            description="Search by place, landmark, city, or pincode, or use your current location. You can drag the pin for accuracy."
            onPick={(selection) => {
              setSelectedSpot(selection)
              setDraftLat(selection.latitude)
              setDraftLng(selection.longitude)
              setCityInput(selection.area || selection.city || selection.displayName)
            }}
          />
          {selectedSpot ? (
            <p className="text-muted-foreground text-xs leading-relaxed">
              Selected: <span className="text-foreground font-medium">{selectedSpot.displayName}</span>
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
