'use client'

import { useState, type ChangeEventHandler } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { uploadImageViaApi } from '@/lib/uploads'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const businessFormSchema = z.object({
  name: z.string().trim().min(2, 'Business name is required').max(255),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be 2000 characters or fewer'),
  services: z
    .string()
    .trim()
    .max(500, 'Services description must be 500 characters or fewer')
    .optional()
    .or(z.literal('')),
  baseLocation: z.string().trim().min(2, 'Base location is required').max(255),
  suburb: z
    .string()
    .trim()
    .max(120, 'Suburb must be 120 characters or fewer')
    .optional()
    .or(z.literal('')),
  state: z
    .string()
    .trim()
    .max(120, 'State must be 120 characters or fewer')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(32, 'Phone number must be 32 characters or fewer')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || /\S+@\S+\.\S+/.test(value), 'Enter a valid email address'),
  website: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || /^https?:\/\//i.test(value), 'Website must be a valid URL'),
  whatsapp: z
    .string()
    .trim()
    .max(64, 'WhatsApp link must be 64 characters or fewer')
    .optional()
    .or(z.literal('')),
})

export type BusinessFormValues = z.infer<typeof businessFormSchema>

type UploadedImage = {
  url: string
  name: string
}

export function BusinessSubmissionForm() {
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [logo, setLogo] = useState<UploadedImage | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      name: '',
      description: '',
      services: '',
      baseLocation: '',
      suburb: '',
      state: '',
      phone: '',
      email: '',
      website: '',
      whatsapp: '',
    },
  })

  const handleLogoUpload: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploadError(null)
    setIsUploadingLogo(true)

    try {
      const url = await uploadImageViaApi(file)
      setLogo({ url, name: file.name })
    } catch (error) {
      console.error('Failed to upload logo', error)
      const message = error instanceof Error ? error.message : 'Failed to upload logo. Please try again.'
      setUploadError(message)
    } finally {
      setIsUploadingLogo(false)
      event.target.value = ''
    }
  }

  const onSubmit = async (values: BusinessFormValues) => {
    setIsSubmitting(true)
    setSubmitMessage(null)
    setSubmitError(null)

    const payload: Record<string, unknown> = {
      name: values.name.trim(),
      description: values.description.trim(),
      baseLocation: values.baseLocation.trim(),
    }

    if (values.services && values.services.trim().length > 0) {
      const services = values.services
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
      if (services.length > 0) {
        payload.services = services
      }
    }

    if (values.suburb && values.suburb.trim().length > 0) {
      payload.suburb = values.suburb.trim()
    }

    if (values.state && values.state.trim().length > 0) {
      payload.state = values.state.trim()
    }

    if (values.phone && values.phone.trim().length > 0) {
      payload.phone = values.phone.trim()
    }

    if (values.email && values.email.trim().length > 0) {
      payload.email = values.email.trim()
    }

    if (values.website && values.website.trim().length > 0) {
      payload.website = values.website.trim()
    }

    if (values.whatsapp && values.whatsapp.trim().length > 0) {
      payload.whatsapp = values.whatsapp.trim()
    }

    if (logo) {
      payload.metadata = {
        logoUrl: logo.url,
      }
    }

    try {
      const response = await fetch('/api/providers', {
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

      if (!response.ok) {
        const message =
          data && typeof data === 'object' && data !== null && 'error' in data
            ? String((data as Record<string, unknown>).error)
            : 'Failed to submit business listing'
        throw new Error(message)
      }

      setSubmitMessage('Thanks for submitting your business. Our moderators will verify the details shortly.')
      reset()
      setLogo(null)
    } catch (error) {
      console.error('Failed to submit business', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit business')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Add your business to the directory</h2>
          <p className="text-gray-600 mt-2">
            Verified listings help community members discover services faster. Submit your details for moderator review.
          </p>
        </div>
        <Button type="button" size="lg" onClick={() => setShowForm((previous) => !previous)}>
          {showForm ? 'Hide business form' : 'List your business'}
        </Button>
      </div>

      {showForm && (
        <form
          className="mt-8 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="business-name">
                Business name
              </label>
              <Input id="business-name" placeholder="e.g. Kampala Catering" {...register('name')} />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="business-services">
                Services offered (comma separated)
              </label>
              <Input
                id="business-services"
                placeholder="Catering, Event staffing, Traditional cuisine"
                {...register('services')}
              />
              {errors.services && <p className="text-sm text-red-600">{errors.services.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="business-description">
              Description
            </label>
            <textarea
              id="business-description"
              className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Tell the community about your services, experience, and what makes you unique."
              {...register('description')}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="business-base-location">
                Base location
              </label>
              <Input
                id="business-base-location"
                placeholder="City or region"
                {...register('baseLocation')}
              />
              {errors.baseLocation && <p className="text-sm text-red-600">{errors.baseLocation.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="business-suburb">
                Suburb (optional)
              </label>
              <Input id="business-suburb" placeholder="e.g. South Brisbane" {...register('suburb')} />
              {errors.suburb && <p className="text-sm text-red-600">{errors.suburb.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="business-state">
                State (optional)
              </label>
              <Input id="business-state" placeholder="QLD" maxLength={120} {...register('state')} />
              {errors.state && <p className="text-sm text-red-600">{errors.state.message}</p>}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="business-phone">
                Phone (optional)
              </label>
              <Input id="business-phone" placeholder="04xx xxx xxx" {...register('phone')} />
              {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="business-email">
                Email (optional)
              </label>
              <Input id="business-email" placeholder="hello@example.com" {...register('email')} />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="business-website">
                Website (optional)
              </label>
              <Input id="business-website" placeholder="https://" {...register('website')} />
              {errors.website && <p className="text-sm text-red-600">{errors.website.message}</p>}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="business-whatsapp">
                WhatsApp link (optional)
              </label>
              <Input id="business-whatsapp" placeholder="https://wa.me/" {...register('whatsapp')} />
              {errors.whatsapp && <p className="text-sm text-red-600">{errors.whatsapp.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Business logo or cover photo (optional)
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-primary-400">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={isUploadingLogo}
                />
                {isUploadingLogo ? 'Uploading…' : logo ? 'Replace image' : 'Upload image'}
              </label>
              {logo && (
                <p className="text-xs text-gray-500">Uploaded image: {logo.name}</p>
              )}
              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
            </div>
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
                setLogo(null)
                setSubmitError(null)
                setSubmitMessage(null)
              }}
            >
              Reset form
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Submit business
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
