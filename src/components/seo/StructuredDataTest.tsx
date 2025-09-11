'use client'

import { useEffect, useState } from 'react'

interface StructuredDataTestProps {
  testId?: string
  showInDev?: boolean
}

interface StructuredDataItem {
  type: string
  data: any
  element: HTMLScriptElement
  isValid: boolean
  errors: string[]
}

export function StructuredDataTest({ testId, showInDev = false }: StructuredDataTestProps) {
  const [structuredData, setStructuredData] = useState<StructuredDataItem[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only run in development mode or when showInDev is true
    if (process.env.NODE_ENV !== 'development' && !showInDev) return

    const scanStructuredData = () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      const items: StructuredDataItem[] = []

      scripts.forEach((script) => {
        try {
          const content = script.textContent || script.innerHTML
          const data = JSON.parse(content)
          const isArray = Array.isArray(data)
          const schemas = isArray ? data : [data]

          schemas.forEach((schema: any) => {
            const errors: string[] = []
            let isValid = true

            // Basic validation
            if (!schema['@context']) {
              errors.push('Missing @context')
              isValid = false
            }
            if (!schema['@type']) {
              errors.push('Missing @type')
              isValid = false
            }

            // Type-specific validation
            if (schema['@type'] === 'LocalBusiness') {
              if (!schema.name) errors.push('LocalBusiness missing name')
              if (!schema.address) errors.push('LocalBusiness missing address')
            }

            if (schema['@type'] === 'Event') {
              if (!schema.name) errors.push('Event missing name')
              if (!schema.startDate) errors.push('Event missing startDate')
              if (!schema.location) errors.push('Event missing location')
            }

            if (schema['@type'] === 'Product') {
              if (!schema.name) errors.push('Product missing name')
              if (!schema.offers) errors.push('Product missing offers')
            }

            if (errors.length > 0) isValid = false

            items.push({
              type: schema['@type'] || 'Unknown',
              data: schema,
              element: script as HTMLScriptElement,
              isValid,
              errors
            })
          })
        } catch (error) {
          items.push({
            type: 'Invalid JSON',
            data: null,
            element: script as HTMLScriptElement,
            isValid: false,
            errors: ['Failed to parse JSON: ' + (error as Error).message]
          })
        }
      })

      setStructuredData(items)
    }

    // Initial scan
    scanStructuredData()

    // Re-scan when DOM changes (for dynamic content)
    const observer = new MutationObserver(scanStructuredData)
    observer.observe(document.head, { childList: true, subtree: true })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [showInDev])

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV !== 'development' && !showInDev) {
    return null
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors text-sm"
          data-testid="structured-data-toggle"
        >
          📊 Schema ({structuredData.length})
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl max-w-md max-h-96 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Structured Data Test</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <div className="p-4 overflow-y-auto max-h-80">
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            Found {structuredData.length} schema(s)
          </div>
          <div className="flex gap-2 text-xs">
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded">
              Valid: {structuredData.filter(item => item.isValid).length}
            </div>
            <div className="bg-red-100 text-red-800 px-2 py-1 rounded">
              Invalid: {structuredData.filter(item => !item.isValid).length}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {structuredData.map((item, index) => (
            <div
              key={index}
              className={`border rounded-lg p-3 ${
                item.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
              data-testid={`schema-item-${index}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{item.type}</span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    item.isValid
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.isValid ? 'Valid' : 'Invalid'}
                </span>
              </div>

              {item.errors.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-medium text-red-700 mb-1">Issues:</div>
                  <ul className="text-xs text-red-600 space-y-1">
                    {item.errors.map((error, errorIndex) => (
                      <li key={errorIndex}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.data && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    View Data
                  </summary>
                  <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(item.data, null, 2)}
                  </pre>
                </details>
              )}

              {/* Test buttons */}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    const url = `https://search.google.com/test/rich-results?url=${encodeURIComponent(window.location.href)}`
                    window.open(url, '_blank')
                  }}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                >
                  Test in Google
                </button>
                <button
                  onClick={() => {
                    const url = `https://validator.schema.org/#url=${encodeURIComponent(window.location.href)}`
                    window.open(url, '_blank')
                  }}
                  className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                >
                  Schema.org Validator
                </button>
              </div>
            </div>
          ))}
        </div>

        {structuredData.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-sm">No structured data found</div>
            <div className="text-xs mt-1">Add JSON-LD scripts to test them here</div>
          </div>
        )}
      </div>
    </div>
  )
}