export async function uploadImageViaApi(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/uploads', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  const text = await response.text()
  let payload: unknown

  try {
    payload = text.length > 0 ? JSON.parse(text) : null
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? String((payload as Record<string, unknown>).error)
        : 'Failed to upload image'
    throw new Error(message)
  }

  if (!payload || typeof payload !== 'object' || payload === null || !('url' in payload)) {
    throw new Error('Upload API returned an unexpected response')
  }

  const url = (payload as { url: unknown }).url
  if (typeof url !== 'string' || url.trim().length === 0) {
    throw new Error('Upload API returned an invalid URL')
  }

  return url
}
