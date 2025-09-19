'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import type { ServiceProvider } from '@shared/schema'

import { MapModule } from '@/components/ui/MapModule'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

type ProvidersDirectoryClientProps = {
  providers: ServiceProvider[]
  initialFilters?: {
    category?: string
    suburb?: string
  }
}

type ProviderLocation = {
  id: string
  latitude: number
  longitude: number
  name: string
  category: string
  verified: boolean
  address?: string
}

const normaliseFilterValue = (value: string | undefined) => value?.trim() ?? ''

const getMetadataCategory = (provider: ServiceProvider): string | undefined => {
  const metadata = provider.metadata as Record<string, unknown> | null

  if (metadata && typeof metadata === 'object') {
    const category = metadata.category
    if (typeof category === 'string' && category.trim().length > 0) {
      return category.trim()
    }
  }

  return undefined
}

const deriveProviderCategories = (provider: ServiceProvider): string[] => {
  const categories = new Set<string>()
  const metadataCategory = getMetadataCategory(provider)

  if (metadataCategory) {
    categories.add(metadataCategory)
  }

  if (Array.isArray(provider.services)) {
    for (const service of provider.services) {
      if (typeof service === 'string' && service.trim().length > 0) {
        categories.add(service.trim())
      }
    }
  }

  return Array.from(categories)
}

const derivePrimaryCategory = (provider: ServiceProvider) => {
  const categories = deriveProviderCategories(provider)
  return categories[0] ?? 'General'
}

const toNumber = (value: unknown) => {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null
}

export function ProvidersDirectoryClient({ providers, initialFilters }: ProvidersDirectoryClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [categoryFilter, setCategoryFilter] = useState(() => normaliseFilterValue(initialFilters?.category))
  const [suburbFilter, setSuburbFilter] = useState(() => normaliseFilterValue(initialFilters?.suburb))
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)

  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>()
    providers.forEach((provider) => {
      deriveProviderCategories(provider).forEach((category) => categorySet.add(category))
    })
    return Array.from(categorySet).sort((a, b) => a.localeCompare(b))
  }, [providers])

  const availableSuburbs = useMemo(() => {
    const suburbSet = new Set<string>()
    providers.forEach((provider) => {
      if (typeof provider.suburb === 'string' && provider.suburb.trim().length > 0) {
        suburbSet.add(provider.suburb.trim())
      }
    })
    return Array.from(suburbSet).sort((a, b) => a.localeCompare(b))
  }, [providers])

  const filteredProviders = useMemo(() => {
    const categoryValue = categoryFilter.toLowerCase()
    const suburbValue = suburbFilter.toLowerCase()

    return providers.filter((provider) => {
      const matchesCategory = categoryValue.length === 0
        ? true
        : deriveProviderCategories(provider).some((category) => category.toLowerCase() === categoryValue)

      const matchesSuburb = suburbValue.length === 0
        ? true
        : typeof provider.suburb === 'string' && provider.suburb.toLowerCase() === suburbValue

      return matchesCategory && matchesSuburb
    })
  }, [providers, categoryFilter, suburbFilter])

  useEffect(() => {
    if (filteredProviders.length === 0) {
      setSelectedProviderId(null)
      return
    }

    if (!selectedProviderId || !filteredProviders.some((provider) => provider.id === selectedProviderId)) {
      setSelectedProviderId(filteredProviders[0]?.id ?? null)
    }
  }, [filteredProviders, selectedProviderId])

  const syncFiltersToUrl = useCallback(
    (nextCategory: string, nextSuburb: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')

      if (nextCategory.trim().length > 0) {
        params.set('category', nextCategory.trim())
      } else {
        params.delete('category')
      }

      if (nextSuburb.trim().length > 0) {
        params.set('suburb', nextSuburb.trim())
      } else {
        params.delete('suburb')
      }

      const queryString = params.toString()
      router.replace(queryString.length > 0 ? `${pathname}?${queryString}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    syncFiltersToUrl(value, suburbFilter)
  }

  const handleSuburbChange = (value: string) => {
    setSuburbFilter(value)
    syncFiltersToUrl(categoryFilter, value)
  }

  const mapLocations = useMemo<ProviderLocation[]>(() => {
    return filteredProviders
      .map((provider) => {
        const latitude = toNumber(provider.latitude)
        const longitude = toNumber(provider.longitude)

        if (latitude === null || longitude === null) {
          return null
        }

        return {
          id: provider.id,
          latitude,
          longitude,
          name: provider.name,
          category: derivePrimaryCategory(provider),
          verified: provider.isVerified,
          address: provider.baseLocation ?? undefined,
        }
      })
      .filter((location): location is ProviderLocation => location !== null)
  }, [filteredProviders])

  const handleProviderSelect = (providerId: string) => {
    setSelectedProviderId(providerId)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-gray-900">Business directory</h1>
            <p className="mt-2 text-sm text-gray-600">
              Discover Ugandan-owned businesses across Queensland and explore services near you.
            </p>
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto">
            <label className="text-sm font-medium text-gray-700">
              Category
              <Select
                className="mt-1"
                value={categoryFilter}
                onChange={(event) => handleCategoryChange(event.target.value)}
              >
                <option value="">All categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Suburb
              <Select className="mt-1" value={suburbFilter} onChange={(event) => handleSuburbChange(event.target.value)}>
                <option value="">All suburbs</option>
                {availableSuburbs.map((suburb) => (
                  <option key={suburb} value={suburb}>
                    {suburb}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing <span className="font-semibold text-gray-900">{filteredProviders.length}</span> business
                {filteredProviders.length === 1 ? '' : 'es'}
              </span>
              {categoryFilter && <Badge variant="outline">{categoryFilter}</Badge>}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <ul className="max-h-[540px] space-y-2 overflow-y-auto p-3">
              {filteredProviders.map((provider) => {
                const isActive = provider.id === selectedProviderId
                const category = derivePrimaryCategory(provider)

                return (
                  <li key={provider.id}>
                    <button
                      type="button"
                      onClick={() => handleProviderSelect(provider.id)}
                      className={cn(
                        'w-full rounded-xl border p-4 text-left transition',
                        isActive
                          ? 'border-primary-500 bg-primary-50 shadow-md'
                          : 'border-transparent hover:border-primary-200 hover:bg-primary-50/50',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{provider.name}</p>
                          <p className="text-sm text-gray-600">
                            {provider.suburb || provider.baseLocation || 'Location available soon'}
                          </p>
                        </div>
                        {provider.isVerified && <Badge variant="verified">Verified</Badge>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                        <Badge variant="outline">{category}</Badge>
                        {provider.services?.slice(0, 2).map((service) => (
                          <Badge key={service} variant="outline">
                            {service}
                          </Badge>
                        ))}
                      </div>
                      {provider.description && (
                        <p className="mt-3 text-sm text-gray-700 line-clamp-3">{provider.description}</p>
                      )}
                    </button>
                  </li>
                )
              })}

              {filteredProviders.length === 0 && (
                <li className="p-8 text-center text-sm text-gray-600">
                  No businesses found matching the selected filters.
                </li>
              )}
            </ul>
          </div>
        </aside>

        <div className="min-h-[520px] rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
          <div className="h-full min-h-[500px] overflow-hidden rounded-[1.75rem]">
            <MapModule
              locations={mapLocations}
              selectedLocationId={selectedProviderId ?? undefined}
              onLocationSelect={(location) => handleProviderSelect(location.id)}
              className="h-[500px]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
