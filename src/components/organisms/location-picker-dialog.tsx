import { MapPin } from 'lucide-react'
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
  const { city, latitude, longitude, setLocation } = useLocationStore()
  const [cityInput, setCityInput] = useState(city)
  const [latInput, setLatInput] = useState(String(latitude))
  const [lngInput, setLngInput] = useState(String(longitude))

  const syncFromStore = () => {
    setCityInput(city)
    setLatInput(String(latitude))
    setLngInput(String(longitude))
  }

  const handleOpen = (o: boolean) => {
    if (o) syncFromStore()
    onOpenChange(o)
  }

  const save = () => {
    const lat = Number.parseFloat(latInput)
    const lng = Number.parseFloat(lngInput)
    if (!cityInput.trim()) {
      toast.error('Enter a city name')
      return
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error('Invalid coordinates')
      return
    }
    setLocation(cityInput.trim(), lat, lng)
    toast.success('Location updated')
    onOpenChange(false)
  }

  const detect = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatInput(String(pos.coords.latitude))
        setLngInput(String(pos.coords.longitude))
        toast.message('Coordinates updated — adjust city name if needed')
      },
      () => toast.error('Could not read your location'),
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delivery area</DialogTitle>
          <DialogDescription>
            Set your city and coordinates for nearby vendors and search.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="loc-city">City</Label>
            <Input
              id="loc-city"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Delhi"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="loc-lat">Latitude</Label>
              <Input
                id="loc-lat"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-lng">Longitude</Label>
              <Input
                id="loc-lng"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                inputMode="decimal"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={detect}
          >
            <MapPin className="size-4" />
            Use my location (GPS)
          </Button>
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
