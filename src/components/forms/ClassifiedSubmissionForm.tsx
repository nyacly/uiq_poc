'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEventHandler } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { uploadImageViaApi } from '@/lib/uploads'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRateLimitNotice } from '@/components/notifications/RateLimitProvider'

const classifiedFormSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(255),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be 2000 characters or fewer'),
  category: z
    .string()
    .trim()
    .max(120, 'Category must be 120 characters or fewer')
    .optional()
    .or(z.literal('')),
  type: z.enum(['offer', 'request']).default('offer'),
  price: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      'Enter a valid price',
    ),
  currency: z
    .string()
    .trim()
    .length(3, 'Currency must be a 3 letter code')
    .default('AUD'),
  location: z.string().trim().min(2, 'Location is required').max(255),
  contactName: z
    .string()
    .trim()
    .max(120, 'Contact name must be 120 characters or fewer')
    .optional()
    .or(z.literal('')),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || /\S+@\S+\.\S+/.test(value), 'Enter a valid email address'),
  contactPhone: z
    .string()
    .trim()
    .max(64, 'Contact phone must be 64 characters or fewer')
    .optional()
    .or(z.literal('')),
})

export type ClassifiedFormValues = z.infer<typeof classifiedFormSchema>

type UploadedImage = {
  name: string
  url: string
  previewUrl: string
}

const MAX_IMAGES = 5

const getPreviewUrl = (url: string) => {
  if (/^(https?:|blob:|data:)/i.test(url)) {
    return url
  }

  if (typeof window !== 'undefined') {
    try {
      return new URL(url, window.location.origin).toString()
    } catch {
      return url
    }
  }

  return url
}

export function ClassifiedSubmissionForm() {
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { showNotice } = useRateLimitNotice()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ClassifiedFormValues>({
    resolver: zodResolver(classifiedFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      type: 'offer',
      price: '',
      currency: 'AUD',
      location: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
    },
  })

  const latestImagesRef = useRef<UploadedImage[]>([])

  useEffect(() => {
    latestImagesRef.current = uploadedImages
  }, [uploadedImages])

  useEffect(() => {
    return () => {
      for (const image of latestImagesRef.current) {
        URL.revokeObjectURL(image.previewUrl)
      }
    }
  }, [])

  const remainingImageSlots = useMemo(() => MAX_IMAGES - uploadedImages.length, [uploadedImages.length])

  const handleUpload: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0 || remainingImageSlots <= 0) {
      return
    }

    setUploadError(null)
    const filesToUpload = files.slice(0, remainingImageSlots)
    setIsUploading(true)

    for (const file of filesToUpload) {
      try {
        const url = await uploadImageViaApi(file)
        const previewUrl = URL.createObjectURL(file)
        setUploadedImages((previous) => [
          ...previous,
          {
            name: file.name,
            url,
            previewUrl,
          },
        ])
      } catch (error) {
        console.error('Failed to upload image', error)
        const message =
          error instanceof Error ? error.message : 'Failed to upload image. Please try again.'
        setUploadError(message)
        break
      }
    }

    setIsUploading(false)
    event.target.value = ''
  }

  const removeImage = (index: number) => {
    setUploadedImages((previous) => {
      const next = [...previous]
      const [removed] = next.splice(index, 1)
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl)
      }
      return next
    })
  }

  const onSubmit = async (values: ClassifiedFormValues) => {
    setIsSubmitting(true)
    setSubmitMessage(null)
    setSubmitError(null)

    const payload: Record<string, unknown> = {
      title: values.title.trim(),
      description: values.description.trim(),
      type: values.type,
      currency: values.currency.trim().toUpperCase(),
      location: values.location.trim(),
      status: 'draft',
    }

    if (values.category && values.category.trim().length > 0) {
      payload.category = values.category.trim()
    }

    if (values.price && values.price.trim().length > 0) {
      const numericPrice = Number(values.price)
      if (!Number.isNaN(numericPrice)) {
        payload.price = Number(numericPrice.toFixed(2))
      }
    }

    const contactInfo: Record<string, string> = {}
    if (values.contactName && values.contactName.trim().length > 0) {
      contactInfo.Name = values.contactName.trim()
    }
    if (values.contactEmail && values.contactEmail.trim().length > 0) {
      contactInfo.Email = values.contactEmail.trim()
    }
    if (values.contactPhone && values.contactPhone.trim().length > 0) {
      contactInfo.Phone = values.contactPhone.trim()
    }

    if (Object.keys(contactInfo).length > 0) {
      payload.contactInfo = contactInfo
    }

    if (uploadedImages.length > 0) {
      payload.imageUrls = uploadedImages.map((image) => image.url)
    }

    try {
      const response = await fetch('/api/classifieds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const text = await response.text()
      let data: unknown = null
      try {
        data = text.length > 0 ? JSON.parse(text) : null
      } catch {
        data = null
      }

      if (response.status === 429) {
        showNotice('classifieds')
        setSubmitError(
          'Free members can publish two classifieds each month. Upgrade to Plus for unlimited listings and faster approvals.',
        )
        return
      }

      if (!response.ok) {
        const message =
          data && typeof data === 'object' && data !== null && 'error' in data
            ? String((data as Record<string, unknown>).error)
            : 'Failed to submit listing'
        throw new Error(message)
      }

      setSubmitMessage('Listing submitted for review. You can find it in your dashboard once moderation is complete.')
      reset()
      for (const image of uploadedImages) {
        URL.revokeObjectURL(image.previewUrl)
      }
      setUploadedImages([])
    } catch (error) {
      console.error('Failed to submit listing', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit listing')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentType = watch('type')

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Share a listing with the UiQ network</h2>
          <p className="text-gray-600 mt-2">
            Housing, jobs, cultural experiences, and items find new homes faster when shared within community.
          </p>
        </div>
        <Button type="button" size="lg" onClick={() => setShowForm((previous) => !previous)}>
          {showForm ? 'Hide listing form' : 'Post a new listing'}
        </Button>
      </div>

      {showForm && (
        <form
          className="mt-8 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="classified-title">
                Listing title
              </label>
              <Input id="classified-title" placeholder="e.g. Sunny room in West End" {...register('title')} />
              {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="classified-type">
                Listing type
              </label>
              <select
                id="classified-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('type')}
              >
                <option value="offer">Offering something</option>
                <option value="request">Looking for something</option>
              </select>
              {currentType === 'offer' ? (
                <p className="text-xs text-gray-500">Offers appear publicly once approved by moderators.</p>
              ) : (
                <p className="text-xs text-gray-500">Requests help you connect privately with community members.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="classified-description">
              Description
            </label>
            <textarea
              id="classified-description"
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Describe what you are offering or looking for. Include condition, timeframe, or expectations."
              {...register('description')}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="classified-category">
                Category
              </label>
              <Input
                id="classified-category"
                placeholder="e.g. Housing, Transport, Catering"
                {...register('category')}
              />
              {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="classified-location">
                Location
              </label>
              <Input id="classified-location" placeholder="Suburb, City" {...register('location')} />
              {errors.location && <p className="text-sm text-red-600">{errors.location.message}</p>}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[2fr,1fr,1fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="classified-price">
                Price (optional)
              </label>
              <Input id="classified-price" placeholder="e.g. 120" {...register('price')} />
              {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="classified-currency">
                Currency
              </label>
              <Input id="classified-currency" placeholder="AUD" maxLength={3} {...register('currency')} />
              {errors.currency && <p className="text-sm text-red-600">{errors.currency.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="classified-contact-name">
                Contact name (optional)
              </label>
              <Input id="classified-contact-name" placeholder="Community Member" {...register('contactName')} />
              {errors.contactName && <p className="text-sm text-red-600">{errors.contactName.message}</p>}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="classified-contact-email">
                Contact email (optional)
              </label>
              <Input id="classified-contact-email" placeholder="you@example.com" {...register('contactEmail')} />
              {errors.contactEmail && <p className="text-sm text-red-600">{errors.contactEmail.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="classified-contact-phone">
                Contact phone (optional)
              </label>
              <Input id="classified-contact-phone" placeholder="04xx xxx xxx" {...register('contactPhone')} />
              {errors.contactPhone && <p className="text-sm text-red-600">{errors.contactPhone.message}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Upload photos (max {MAX_IMAGES})</p>
                <p className="text-xs text-gray-500">
                  Use clear photos that represent the item or space. JPEG, PNG, WebP, GIF, SVG, and AVIF are supported.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-primary-400">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                  disabled={isUploading || remainingImageSlots <= 0}
                />
                {isUploading ? 'Uploading…' : 'Add photos'}
              </label>
            </div>

            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

            {uploadedImages.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {uploadedImages.map((image, index) => (
                  <div key={image.url} className="relative overflow-hidden rounded-lg border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getPreviewUrl(image.previewUrl ?? image.url)}
                      alt={image.name}
                      className="h-32 w-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-gray-600 shadow"
                      onClick={() => removeImage(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {remainingImageSlots <= 0 && (
              <p className="text-xs text-gray-500">Maximum number of photos reached.</p>
            )}
          </div>

          {submitMessage && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {submitMessage}
            </div>
          )}

          {submitError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setUploadedImages((previous) => {
                  for (const image of previous) {
                    URL.revokeObjectURL(image.previewUrl)
                  }
                  return []
                })
                setSubmitError(null)
                setSubmitMessage(null)
              }}
            >
              Reset form
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Submit listing
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
