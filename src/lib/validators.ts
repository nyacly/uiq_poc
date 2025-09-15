import { z } from 'zod'

export const createBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  category: z.string().min(1, 'Category is required'),
  competenceTags: z.string().optional(),
  certifications: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  whatsappLink: z.string().url().optional().or(z.literal('')),
  serviceRadiusKm: z.number().min(1).max(100).default(15)
})

export const createReviewSchema = z.object({
  businessId: z.string().min(1),
  rating: z.number().min(1).max(5),
  text: z.string().min(10, 'Review must be at least 10 characters').max(500),
  photos: z.string().optional()
})

export const createEventSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(100),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  venue: z.string().min(1, 'Venue is required'),
  priceCents: z.number().min(0).default(0)
})

export const createAnnouncementSchema = z.object({
  type: z.enum(['BEREAVEMENT', 'WEDDING', 'BIRTH', 'ACHIEVEMENT', 'NOTICE']),
  title: z.string().min(1, 'Title is required').max(100),
  body: z.string().min(10, 'Body must be at least 10 characters').max(2000),
  photos: z.string().optional(),
  contributionMode: z.enum(['LINKOUT', 'MANAGED']).default('LINKOUT'),
  contributionLinks: z.string().optional(),
  ceremonyTimeline: z.string().optional()
})

export const createListingSchema = z.object({
  type: z.enum(['sale', 'housing', 'gig']),
  title: z.string().min(1, 'Title is required').max(100),
  priceCents: z.number().min(0),
  currency: z.string().default('AUD'),
  condition: z.string().min(1, 'Condition is required'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  location: z.string().min(1, 'Location is required'),
  photos: z.string().optional()
})

export const createMessageSchema = z.object({
  threadId: z.string().min(1),
  body: z.string().min(1, 'Message cannot be empty').max(1000)
})

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().optional(),
  location: z.string().optional(),
  whatsappLink: z.string().url().optional().or(z.literal('')),
  avatarUrl: z.string().url().optional().or(z.literal(''))
})

export const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

