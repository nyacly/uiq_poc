import { parseMapboxFeature } from '@/lib/geocode'

describe('parseMapboxFeature', () => {
  it('extracts coordinates and suburb from feature context', () => {
    const feature = {
      center: [153.023, -27.468],
      context: [
        { id: 'country.123', text: 'Australia' },
        { id: 'region.456', text: 'Queensland' },
        { id: 'place.789', text: 'Brisbane City' },
      ],
      place_type: ['address'],
    }

    const result = parseMapboxFeature(feature)

    expect(result).toEqual({
      latitude: -27.468,
      longitude: 153.023,
      suburb: 'Brisbane City',
    })
  })

  it('falls back to feature text when locality context is missing', () => {
    const feature = {
      center: [153.1, -27.5],
      place_type: ['locality'],
      text: 'South Brisbane',
    }

    const result = parseMapboxFeature(feature)

    expect(result).toEqual({
      latitude: -27.5,
      longitude: 153.1,
      suburb: 'South Brisbane',
    })
  })

  it('returns null when coordinates are invalid', () => {
    const feature = {
      center: [NaN, NaN],
      place_type: ['locality'],
      text: 'Somewhere',
    }

    expect(parseMapboxFeature(feature)).toBeNull()
  })
})
