import { z } from 'zod'

export const mapboxContextSchema = z.object({
  id: z.string(),
  text: z.string().optional(),
})

export const mapboxFeatureSchema = z.object({
  center: z.tuple([z.number(), z.number()]).optional(),
  geometry: z
    .object({
      coordinates: z.array(z.number()).min(2).optional(),
    })
    .optional(),
  place_type: z.array(z.string()).optional(),
  text: z.string().optional(),
  context: z.array(mapboxContextSchema).optional(),
})

export type MapboxFeature = z.infer<typeof mapboxFeatureSchema>

const mapboxResponseSchema = z.object({
  features: z.array(mapboxFeatureSchema),
})

export type GeocodeResult = {
  latitude: number
  longitude: number
  suburb?: string
}

const findContextValue = (
  contexts: MapboxFeature['context'] | undefined,
  prefixes: string[],
) => {
  if (!Array.isArray(contexts)) {
    return undefined
  }

  for (const prefix of prefixes) {
    const entry = contexts.find((context) => context.id.startsWith(`${prefix}.`))
    if (entry && entry.text && entry.text.trim().length > 0) {
      return entry.text.trim()
    }
  }

  return undefined
}

export const parseMapboxFeature = (feature: MapboxFeature): GeocodeResult | null => {
  const coordinates = feature.center ?? feature.geometry?.coordinates

  if (!coordinates || coordinates.length < 2) {
    return null
  }

  const [longitude, latitude] = coordinates

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  const suburbFromContext = findContextValue(feature.context, [
    'locality',
    'place',
    'neighborhood',
    'district',
    'postcode',
  ])

  let suburb = suburbFromContext

  if (!suburb) {
    const placeTypes = feature.place_type ?? []
    if (placeTypes.some((type) => ['place', 'locality', 'neighborhood'].includes(type))) {
      suburb = feature.text?.trim()
    }
  }

  return {
    latitude,
    longitude,
    suburb: suburb && suburb.length > 0 ? suburb : undefined,
  }
}

export async function geocodeAddress(
  address: string,
  token: string,
  fetcher: typeof fetch = fetch,
): Promise<GeocodeResult | null> {
  const trimmed = address.trim()

  if (trimmed.length === 0) {
    return null
  }

  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`)
  url.searchParams.set('access_token', token)
  url.searchParams.set('limit', '1')
  url.searchParams.set('language', 'en')
  url.searchParams.set('country', 'au')

  try {
    const response = await fetcher(url.toString(), {
      headers: {
        accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.warn('Mapbox geocoding request failed', response.status)
      return null
    }

    const payload = await response.json()
    const parsed = mapboxResponseSchema.safeParse(payload)

    if (!parsed.success || parsed.data.features.length === 0) {
      return null
    }

    const feature = parsed.data.features[0]
    return parseMapboxFeature(feature)
  } catch (error) {
    console.error('Failed to geocode address', error)
    return null
  }
}
