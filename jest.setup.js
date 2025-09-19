import '@testing-library/jest-dom'

const { TextEncoder, TextDecoder } = require('util')
const { ReadableStream, WritableStream, TransformStream } = require('node:stream/web')

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder
}

if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream
}

if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = WritableStream
}

if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = TransformStream
}

// Polyfill Web Fetch API primitives for Next.js server modules in tests
if (typeof global.Request === 'undefined') {
  const { Request, Response, Headers, FormData, Blob, File, fetch } = require(
    'next/dist/compiled/@edge-runtime/primitives/fetch',
  )

  global.Request = Request
  global.Response = Response
  global.Headers = Headers
  global.FormData = FormData
  global.Blob = Blob
  global.File = File

  if (typeof global.fetch === 'undefined') {
    global.fetch = fetch
  }
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

jest.mock('next-auth', () => ({
  __esModule: true,
  getServerSession: jest.fn().mockResolvedValue(null),
}))

jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: 'credentials', type: 'credentials' })),
}))

jest.mock('next-auth/providers/google', () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: 'google', type: 'oauth' })),
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Setup MSW (Mock Service Worker) for API mocking when available
try {
  const { setupServer } = require('msw/node')
  const { rest } = require('msw')

  const server = setupServer(
    rest.get('/api/health', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json({ status: 'ok' }))
    })
  )

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
} catch (error) {
  console.warn('MSW not available for tests, skipping API mocking setup.')
}