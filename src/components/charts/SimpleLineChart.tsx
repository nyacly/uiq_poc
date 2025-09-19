'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

type DataPoint = {
  label: string
  value: number
}

export interface SimpleLineChartProps {
  data: DataPoint[]
  className?: string
}

function buildPolylinePoints(data: DataPoint[]) {
  if (data.length === 0) {
    return ''
  }

  const maxValue = Math.max(...data.map((point) => point.value), 1)
  const width = data.length === 1 ? 1 : data.length - 1

  return data
    .map((point, index) => {
      const x = (index / width) * 100
      const scaled = maxValue === 0 ? 0 : point.value / maxValue
      const y = 100 - scaled * 100
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

function SimpleLineChartComponent({ data, className }: SimpleLineChartProps) {
  const points = buildPolylinePoints(data)
  const maxValue = Math.max(...data.map((point) => point.value), 1)

  return (
    <div className={cn('w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm', className)}>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-gray-900">Weekly page views</p>
        <span className="text-xs text-gray-500">Last {data.length} weeks</span>
      </div>
      <div className="mt-4">
        <svg
          viewBox={`0 0 100 100`}
          preserveAspectRatio="none"
          className="h-40 w-full text-primary-600"
          role="img"
          aria-hidden={false}
        >
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-gray-600">
        {data.map((point) => (
          <div key={point.label} className="min-w-0">
            <p className="truncate font-medium text-gray-800">{point.value}</p>
            <p className="truncate text-gray-500">{point.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500">Peak: {maxValue} views/week</p>
    </div>
  )
}

export const SimpleLineChart = memo(SimpleLineChartComponent)
