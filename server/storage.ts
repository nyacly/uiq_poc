import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

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

export async function saveImageDev(file: File): Promise<string> {
  const mimeType = file.type.toLowerCase()
  const extension = SUPPORTED_IMAGE_MIME_TYPES.get(mimeType)

  if (!extension) {
    throw new Error('Unsupported file type')
  }

  if (file.size <= 0) {
    throw new Error('File is empty')
  }

  await mkdir(DEV_STORAGE_DIRECTORY, { recursive: true })

  const fileName = `${randomUUID()}${extension}`
  const absolutePath = path.join(DEV_STORAGE_DIRECTORY, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())

  await writeFile(absolutePath, buffer)

  return `${DEV_STORAGE_ROUTE_PREFIX}/${fileName}`
}
