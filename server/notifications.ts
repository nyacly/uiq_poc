import { and, asc, eq, gte, lt } from 'drizzle-orm'
import { Resend } from 'resend'
import { z } from 'zod'

import {
  businesses,
  db,
  events,
  opportunities,
  profiles,
  users,
} from '@/lib/db'
import {
  notificationDigestFrequencies,
  type NotificationDigestFrequency,
} from '@shared/schema'

const defaultPrefs = {
  email: true,
  sms: false,
  digest: 'weekly' as NotificationDigestFrequency,
}

export const notificationPreferenceSchema = z
  .object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    digest: z.enum(notificationDigestFrequencies).default('weekly'),
  })
  .strict()

export const notificationPreferenceUpdateSchema = notificationPreferenceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one preference must be provided',
  })

export type NotificationPreferences = z.infer<typeof notificationPreferenceSchema>
export type NotificationPreferenceUpdateInput = z.infer<
  typeof notificationPreferenceUpdateSchema
>

type UserNotificationContext = {
  id: string
  email: string | null
  displayName: string | null
  preferences: NotificationPreferences
}

function normalisePreferences(value: unknown): NotificationPreferences {
  if (!value || typeof value !== 'object') {
    return { ...defaultPrefs }
  }

  const parsed = notificationPreferenceSchema.safeParse({
    ...defaultPrefs,
    ...(value as Record<string, unknown>),
  })

  if (!parsed.success) {
    return { ...defaultPrefs }
  }

  return parsed.data
}

async function loadUserNotificationContext(
  userId: string,
): Promise<UserNotificationContext | null> {
  const [record] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: profiles.displayName,
      prefs: profiles.notificationPrefs,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1)

  if (!record) {
    return null
  }

  return {
    id: record.id,
    email: record.email,
    displayName: record.displayName,
    preferences: normalisePreferences(record.prefs),
  }
}

export async function getNotificationPreferences(userId: string) {
  const context = await loadUserNotificationContext(userId)

  if (!context) {
    throw new Error('User not found')
  }

  return context.preferences
}

export async function updateNotificationPreferences(
  userId: string,
  input: NotificationPreferenceUpdateInput,
) {
  const payload = notificationPreferenceUpdateSchema.parse(input)

  const context = await loadUserNotificationContext(userId)

  if (!context) {
    throw new Error('User not found')
  }

  const next = { ...context.preferences, ...payload }
  const [updated] = await db
    .update(profiles)
    .set({ notificationPrefs: next, updatedAt: new Date() })
    .where(eq(profiles.userId, userId))
    .returning({ prefs: profiles.notificationPrefs })

  if (!updated) {
    throw new Error('Failed to update notification preferences')
  }

  return normalisePreferences(updated.prefs)
}

const resendApiKey = process.env.RESEND_API_KEY
const fromAddress =
  process.env.NOTIFICATIONS_FROM_EMAIL || 'UiQ Community <no-reply@example.com>'
let resendClient: Resend | null = null

if (resendApiKey) {
  resendClient = new Resend(resendApiKey)
}

const smsEnabled =
  String(process.env.ENABLE_SMS ?? '')
    .toLowerCase()
    .split(',')
    .some((value) => value === 'true' || value === '1' || value === 'yes')

let twilioClient: any | null = null

async function getTwilioClient(): Promise<any | null> {
  if (!smsEnabled) {
    return null
  }

  if (twilioClient) {
    return twilioClient
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    console.warn('SMS notifications enabled but Twilio credentials missing.')
    return null
  }

  const twilioModule = await import('twilio')
  twilioClient = new twilioModule.Twilio(accountSid, authToken)
  return twilioClient
}

const htmlEscapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] ?? char)
}

function getBaseUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ]

  const base = candidates.find((entry) => entry && entry.trim().length > 0)

  return (base ?? 'http://localhost:3000').replace(/\/$/, '')
}

export function buildAbsoluteUrl(pathname: string) {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${getBaseUrl()}${path}`
}

type DigestItem = {
  title: string
  description?: string | null
  url?: string | null
  meta?: string | null
}

type EmailTemplatePayload =
  | ({
      template: 'rsvpConfirmation'
      eventTitle: string
      eventStartAt: string | Date
      eventLocation?: string | null
      rsvpStatus: string
      guestCount: number
      eventUrl?: string | null
    } & Record<string, unknown>)
  | ({
      template: 'newMessage'
      senderName: string
      messagePreview: string
      conversationUrl?: string | null
      conversationSubject?: string | null
    } & Record<string, unknown>)
  | ({
      template: 'adminAction'
      action: 'approved' | 'takedown'
      entityType: string
      entityTitle: string
      manageUrl?: string | null
      note?: string | null
    } & Record<string, unknown>)
  | ({
      template: 'digest'
      periodLabel: string
      events: DigestItem[]
      opportunities: DigestItem[]
      businesses: DigestItem[]
    } & Record<string, unknown>)

type EmailRenderResult = {
  html: string
  text: string
}

function renderEmailTemplate(
  payload: EmailTemplatePayload,
  options: { recipientName: string },
): EmailRenderResult {
  const greeting = `Hi ${escapeHtml(options.recipientName)},`

  if (payload.template === 'rsvpConfirmation') {
    const startAt =
      typeof payload.eventStartAt === 'string'
        ? payload.eventStartAt
        : payload.eventStartAt.toISOString()

    const body = [
      `<p>Your RSVP for <strong>${escapeHtml(payload.eventTitle)}</strong> is confirmed.</p>`,
      `<p><strong>Status:</strong> ${escapeHtml(payload.rsvpStatus)}</p>`,
      `<p><strong>Guests:</strong> ${payload.guestCount}</p>`,
      `<p><strong>Starts:</strong> ${escapeHtml(new Date(startAt).toLocaleString())}</p>`,
    ]

    if (payload.eventLocation) {
      body.push(`<p><strong>Location:</strong> ${escapeHtml(payload.eventLocation)}</p>`)
    }

    if (payload.eventUrl) {
      const url = escapeHtml(payload.eventUrl)
      body.push(`<p><a href="${url}">View event details</a></p>`)
    }

    const html = `
      <div>
        <p>${greeting}</p>
        ${body.join('\n')}
        <p>We look forward to seeing you there!</p>
      </div>
    `

    const textParts = [
      greeting,
      `Your RSVP for ${payload.eventTitle} is confirmed.`,
      `Status: ${payload.rsvpStatus}`,
      `Guests: ${payload.guestCount}`,
      `Starts: ${new Date(startAt).toLocaleString()}`,
    ]

    if (payload.eventLocation) {
      textParts.push(`Location: ${payload.eventLocation}`)
    }

    if (payload.eventUrl) {
      textParts.push(`View event details: ${payload.eventUrl}`)
    }

    textParts.push('We look forward to seeing you there!')

    return { html, text: textParts.join('\n') }
  }

  if (payload.template === 'newMessage') {
    const lines = [
      `<p>${greeting}</p>`,
      `<p>You have a new message from <strong>${escapeHtml(payload.senderName)}</strong>.</p>`,
      `<blockquote>${escapeHtml(payload.messagePreview)}</blockquote>`,
    ]

    if (payload.conversationSubject) {
      lines.splice(
        2,
        0,
        `<p><strong>Subject:</strong> ${escapeHtml(payload.conversationSubject)}</p>`,
      )
    }

    if (payload.conversationUrl) {
      const url = escapeHtml(payload.conversationUrl)
      lines.push(`<p><a href="${url}">Open conversation</a></p>`)
    }

    lines.push('<p>Reply when you have a moment.</p>')

    const html = `<div>${lines.join('\n')}</div>`
    const text = [
      greeting,
      `You have a new message from ${payload.senderName}.`,
      payload.conversationSubject
        ? `Subject: ${payload.conversationSubject}`
        : undefined,
      `Message: ${payload.messagePreview}`,
      payload.conversationUrl
        ? `Open conversation: ${payload.conversationUrl}`
        : undefined,
      'Reply when you have a moment.',
    ]
      .filter((entry): entry is string => Boolean(entry))
      .join('\n')

    return { html, text }
  }

  if (payload.template === 'adminAction') {
    const actionLabel =
      payload.action === 'approved' ? 'approved' : 'taken down for review'
    const lines = [
      `<p>${greeting}</p>`,
      `<p>Your ${escapeHtml(payload.entityType)} "${escapeHtml(payload.entityTitle)}" was ${actionLabel}.</p>`,
    ]

    if (payload.note) {
      lines.push(`<p>Note: ${escapeHtml(payload.note)}</p>`)
    }

    if (payload.manageUrl) {
      const url = escapeHtml(payload.manageUrl)
      lines.push(`<p><a href="${url}">View details</a></p>`)
    }

    lines.push('<p>Thanks for contributing to the community.</p>')

    const html = `<div>${lines.join('\n')}</div>`
    const text = [
      greeting,
      `Your ${payload.entityType} "${payload.entityTitle}" was ${actionLabel}.`,
      payload.note ? `Note: ${payload.note}` : undefined,
      payload.manageUrl ? `View details: ${payload.manageUrl}` : undefined,
      'Thanks for contributing to the community.',
    ]
      .filter((entry): entry is string => Boolean(entry))
      .join('\n')

    return { html, text }
  }

  const sections: Array<{ title: string; items: DigestItem[] }> = [
    { title: 'Upcoming events', items: payload.events },
    { title: 'New opportunities', items: payload.opportunities },
    { title: 'New businesses', items: payload.businesses },
  ]

  const htmlSections = sections
    .map((section) => {
      const items = section.items
        .map((item) => {
          const parts = [`<strong>${escapeHtml(item.title)}</strong>`]

          if (item.meta) {
            parts.push(`<span>${escapeHtml(item.meta)}</span>`)
          }

          if (item.description) {
            parts.push(`<p>${escapeHtml(item.description)}</p>`)
          }

          if (item.url) {
            parts.push(
              `<p><a href="${escapeHtml(item.url)}">View details</a></p>`,
            )
          }

          return `<li>${parts.join(' ')}</li>`
        })
        .join('\n')

      return `
        <section>
          <h3>${escapeHtml(section.title)}</h3>
          <ul>${items}</ul>
        </section>
      `
    })
    .join('\n')

  const textSections = sections
    .map((section) => {
      const items = section.items
        .map((item) => {
          return [
            `• ${item.title}`,
            item.meta ? `  ${item.meta}` : undefined,
            item.description ? `  ${item.description}` : undefined,
            item.url ? `  ${item.url}` : undefined,
          ]
            .filter((entry): entry is string => Boolean(entry))
            .join('\n')
        })
        .join('\n')

      return `${section.title}\n${items}`
    })
    .join('\n\n')

  const html = `
    <div>
      <p>${greeting}</p>
      <p>Here is your ${escapeHtml(payload.periodLabel)} digest from UiQ.</p>
      ${htmlSections}
      <p>Thanks for being part of the community!</p>
    </div>
  `

  const text = [
    greeting,
    `Here is your ${payload.periodLabel} digest from UiQ.`,
    textSections,
    'Thanks for being part of the community!',
  ].join('\n\n')

  return { html, text }
}

export async function notifyEmail(
  userId: string,
  subject: string,
  template: EmailTemplatePayload,
) {
  const context = await loadUserNotificationContext(userId)

  if (!context || !context.email) {
    return false
  }

  if (!context.preferences.email) {
    return false
  }

  const { html, text } = renderEmailTemplate(template, {
    recipientName: context.displayName ?? context.email,
  })

  if (!resendClient) {
    console.info(
      `[notifications] Email to ${context.email} (${subject})\n${text}`,
    )
    return true
  }

  try {
    await resendClient.emails.send({
      from: fromAddress,
      to: context.email,
      subject,
      html,
      text,
    })
    return true
  } catch (error) {
    console.error('Failed to send email notification', error)
    return false
  }
}

export async function notifySms(phone: string, message: string) {
  if (!smsEnabled) {
    return false
  }

  if (!phone) {
    return false
  }

  try {
    const client = await getTwilioClient()

    if (!client) {
      console.info(`[notifications] SMS to ${phone}: ${message}`)
      return false
    }

    const from = process.env.TWILIO_PHONE_NUMBER

    if (!from) {
      console.warn('Twilio phone number missing; skipping SMS send')
      return false
    }

    await client.messages.create({
      body: message,
      to: phone,
      from,
    })

    return true
  } catch (error) {
    console.error('Failed to send SMS notification', error)
    return false
  }
}

export async function runWeeklyDigestJob(referenceDate = new Date()) {
  const start = new Date(referenceDate)
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [eventRows, opportunityRows, businessRows] = await Promise.all([
    db
      .select({
        id: events.id,
        title: events.title,
        startAt: events.startAt,
        location: events.locationName,
      })
      .from(events)
      .where(
        and(
          eq(events.status, 'published'),
          gte(events.startAt, start),
          lt(events.startAt, end),
        ),
      )
      .orderBy(asc(events.startAt))
      .limit(10),
    db
      .select({
        id: opportunities.id,
        title: opportunities.title,
        status: opportunities.status,
        closesAt: opportunities.closesAt,
        type: opportunities.type,
      })
      .from(opportunities)
      .where(eq(opportunities.status, 'open'))
      .orderBy(asc(opportunities.closesAt))
      .limit(10),
    db
      .select({
        id: businesses.id,
        name: businesses.name,
        createdAt: businesses.createdAt,
      })
      .from(businesses)
      .where(eq(businesses.status, 'published'))
      .orderBy(asc(businesses.createdAt))
      .limit(10),
  ])

  const eventsDigest: DigestItem[] = eventRows.length
    ? eventRows.map((event) => ({
        title: event.title,
        meta: event.startAt.toLocaleString(),
        description: event.location ?? null,
        url: buildAbsoluteUrl(`/events/${event.id}`),
      }))
    : [
        {
          title: 'Community meetup',
          description: 'Example event to show how the digest looks.',
          meta: new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleString(),
          url: buildAbsoluteUrl('/events'),
        },
      ]

  const opportunitiesDigest: DigestItem[] = opportunityRows.length
    ? opportunityRows.map((opportunity) => ({
        title: opportunity.title,
        meta:
          opportunity.closesAt?.toLocaleDateString() ??
          `Status: ${opportunity.status}`,
        description: `Type: ${opportunity.type}`,
        url: buildAbsoluteUrl(`/opportunities/${opportunity.id}`),
      }))
    : [
        {
          title: 'Volunteer spotlight',
          description: 'Example opportunity so the digest has content.',
          meta: 'Apply by next week',
          url: buildAbsoluteUrl('/opportunities'),
        },
      ]

  const businessDigest: DigestItem[] = businessRows.length
    ? businessRows.map((business) => ({
        title: business.name,
        meta: `Joined ${business.createdAt.toLocaleDateString()}`,
        url: buildAbsoluteUrl(`/businesses/${business.id}`),
      }))
    : [
        {
          title: 'Sample local business',
          description: 'A placeholder listing to illustrate the digest.',
          meta: 'Joined this week',
          url: buildAbsoluteUrl('/businesses'),
        },
      ]

  const recipients = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: profiles.displayName,
      prefs: profiles.notificationPrefs,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))

  let checked = 0
  let sent = 0
  let skipped = 0

  for (const recipient of recipients) {
    checked += 1
    const prefs = normalisePreferences(recipient.prefs)

    if (!recipient.email || !prefs.email || prefs.digest !== 'weekly') {
      skipped += 1
      continue
    }

    const result = await notifyEmail(recipient.id, 'Your weekly UiQ digest', {
      template: 'digest',
      periodLabel: 'weekly',
      events: eventsDigest,
      opportunities: opportunitiesDigest,
      businesses: businessDigest,
    })

    if (result) {
      sent += 1
    } else {
      skipped += 1
    }
  }

  return {
    checked,
    sent,
    skipped,
    events: eventsDigest.length,
    opportunities: opportunitiesDigest.length,
    businesses: businessDigest.length,
  }
}

export type EmailPayload = EmailTemplatePayload
export type DigestJobResult = Awaited<ReturnType<typeof runWeeklyDigestJob>>
