import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  DEV_STORAGE_DIRECTORY,
  getMimeTypeFromExtension,
} from '@server/storage'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: { path: string[] | string } },
) {
  const segments = Array.isArray(context.params.path)
    ? context.params.path
    : [context.params.path]

  if (segments.length === 0) {
    return new NextResponse('Not found', { status: 404 })
  }

  const requestedPath = path.join(...segments)
  const absolutePath = path.resolve(DEV_STORAGE_DIRECTORY, requestedPath)
  const relativePath = path.relative(DEV_STORAGE_DIRECTORY, absolutePath)

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const data = await readFile(absolutePath)
    const extension = path.extname(absolutePath)
    const contentType = getMimeTypeFromExtension(extension) ?? 'application/octet-stream'

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new NextResponse('Not found', { status: 404 })
    }

    console.error('Failed to serve stored asset', error)
    return new NextResponse('Failed to serve asset', { status: 500 })
  }
}
