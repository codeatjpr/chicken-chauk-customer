// Open Location Code (Plus Code) for map pins — https://github.com/google/open-location-code
import * as OLC from 'open-location-code'

const Encoder = (
  OLC as unknown as {
    OpenLocationCode: new () => { encode: (lat: number, lng: number, len?: number) => string }
  }
).OpenLocationCode
const encoder = new Encoder()

/** ~2.8m precision (11-char code) */
export function encodePlusCode(latitude: number, longitude: number): string {
  return encoder.encode(latitude, longitude, 11)
}
