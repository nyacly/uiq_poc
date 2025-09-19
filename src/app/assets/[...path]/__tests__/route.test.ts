import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { GET as assetRoute } from '../route'
import { DEV_STORAGE_DIRECTORY } from '@server/storage'

describe('GET /assets/[...path]', () => {
  const createdFiles: string[] = []

  afterEach(async () => {
    for (const filePath of createdFiles.splice(0, createdFiles.length)) {
      await fs.rm(filePath, { force: true })
    }
  })

  it('returns 404 for missing files', async () => {
    const response = await assetRoute(new Request('http://localhost/assets/missing'), {
      params: { path: ['missing-file.png'] },
    })

    expect(response.status).toBe(404)
  })

  it('prevents path traversal attempts', async () => {
    const response = await assetRoute(new Request('http://localhost/assets/../secret'), {
      params: { path: ['..', 'secret.png'] },
    })

    expect(response.status).toBe(404)
  })

  it('serves stored images with correct headers', async () => {
    await fs.mkdir(DEV_STORAGE_DIRECTORY, { recursive: true })

    const fileName = `${randomUUID()}.png`
    const absolutePath = path.join(DEV_STORAGE_DIRECTORY, fileName)
    const contents = Buffer.from('test-image-bytes')

    await fs.writeFile(absolutePath, contents)
    createdFiles.push(absolutePath)

    const response = await assetRoute(new Request(`http://localhost/assets/${fileName}`), {
      params: { path: [fileName] },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')

    const responseBuffer = Buffer.from(await response.arrayBuffer())
    expect(responseBuffer.equals(contents)).toBe(true)
  })
})
