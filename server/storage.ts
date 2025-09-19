import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const SUPABASE_BUCKET = 'public'
const SUPABASE_FOLDER = 'uiq'

export const DEV_STORAGE_DIRECTORY = path.join(process.cwd(), 'attached_assets')
export const DEV_STORAGE_ROUTE_PREFIX = '/assets'

const MIME_EXTENSION_MAP = new Map([
  ['image/jpeg', '.jpg'],
  ['image/jpg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/svg+xml', '.svg'],
  ['image/avif', '.avif'],
])

const EXTENSION_MIME_MAP = new Map<string, string>()
for (const [mime, extension] of MIME_EXTENSION_MAP) {
  if (!EXTENSION_MIME_MAP.has(extension)) {
    EXTENSION_MIME_MAP.set(extension, mime)
  }
}

export const SUPPORTED_IMAGE_MIME_TYPES = MIME_EXTENSION_MAP

export function getMimeTypeFromExtension(extension: string): string | undefined {
  return EXTENSION_MIME_MAP.get(extension.toLowerCase())
}

const resolveImageMetadata = (file: File) => {
  const mimeType = file.type.toLowerCase()
  const extension = SUPPORTED_IMAGE_MIME_TYPES.get(mimeType)

  if (!extension) {
    throw new Error('Unsupported file type')
  }

  if (file.size <= 0) {
    throw new Error('File is empty')
  }

  return { extension, mimeType }
}

export async function saveImageDev(file: File): Promise<string> {
  const { extension } = resolveImageMetadata(file)

  await mkdir(DEV_STORAGE_DIRECTORY, { recursive: true })

  const fileName = `${randomUUID()}${extension}`
  const absolutePath = path.join(DEV_STORAGE_DIRECTORY, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())

  await writeFile(absolutePath, buffer)

  return `${DEV_STORAGE_ROUTE_PREFIX}/${fileName}`
}

const hasSupabaseAccessKey =
  (typeof process.env.SUPABASE_SERVICE_ROLE_KEY === 'string' &&
    process.env.SUPABASE_SERVICE_ROLE_KEY.trim().length > 0) ||
  (typeof process.env.SUPABASE_ANON_KEY === 'string' &&
    process.env.SUPABASE_ANON_KEY.trim().length > 0)

const isSupabaseConfigured =
  process.env.NODE_ENV === 'production' &&
  typeof process.env.SUPABASE_URL === 'string' &&
  process.env.SUPABASE_URL.trim().length > 0 &&
  hasSupabaseAccessKey

async function saveImageSupabase(file: File): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase storage is not configured')
  }

  const { extension, mimeType } = resolveImageMetadata(file)
  const fileName = `${randomUUID()}${extension}`
  const objectPath = `${SUPABASE_FOLDER}/${fileName}`
  const uploadUrl = `${process.env.SUPABASE_URL!.replace(/\/$/, '')}/storage/v1/object/${encodeURIComponent(
    SUPABASE_BUCKET,
  )}/${objectPath}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const accessToken =
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim().length > 0
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.SUPABASE_ANON_KEY!

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': mimeType,
      'x-upsert': 'false',
    },
    body: buffer,
  })

  const text = await response.text()
  let payload: unknown

  try {
    payload = text.length > 0 ? JSON.parse(text) : null
  } catch {
    payload = null
  }

  if (!response.ok) {
    const errorMessage =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as Record<string, unknown>).message)
        : 'Failed to upload image to Supabase'
    throw new Error(errorMessage)
  }

  const publicUrl = `${process.env.SUPABASE_URL!.replace(/\/$/, '')}/storage/v1/object/public/${encodeURIComponent(
    SUPABASE_BUCKET,
  )}/${objectPath}`

  return publicUrl
}

export async function saveImage(file: File): Promise<string> {
  if (isSupabaseConfigured) {
    return saveImageSupabase(file)
  }

  return saveImageDev(file)
}
