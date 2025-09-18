import { z } from 'zod'

import {
  db,
  reports,
  reportTargetTypes,
  type Report,
} from '@/lib/db'
import { HttpError } from '@server/auth'

const MAX_REASON_LENGTH = 64
const MIN_REASON_LENGTH = 3
const MAX_DETAILS_LENGTH = 2000

export const reportCreateSchema = z
  .object({
    targetType: z.enum(reportTargetTypes),
    targetId: z.string().uuid(),
    reason: z
      .string()
      .trim()
      .min(MIN_REASON_LENGTH, 'Please provide a reason for the report')
      .max(
        MAX_REASON_LENGTH,
        `Reason must be ${MAX_REASON_LENGTH} characters or fewer`,
      ),
    details: z
      .string()
      .trim()
      .min(1, 'Additional details cannot be empty')
      .max(
        MAX_DETAILS_LENGTH,
        `Details must be ${MAX_DETAILS_LENGTH} characters or fewer`,
      )
      .optional(),
  })
  .strict()

export type ReportCreateInput = z.infer<typeof reportCreateSchema>

export type ReportCreateParams = ReportCreateInput & {
  reporterId: string
}

export type SerializedReport = ReturnType<typeof serializeReport>

export function serializeReport(report: Report) {
  return {
    id: report.id,
    reporterId: report.reporterId,
    targetType: report.targetType,
    targetId: report.targetId,
    reason: report.reason,
    status: report.status,
    details: report.details ?? null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  }
}

export async function createReport(params: ReportCreateParams) {
  const now = new Date()

  const [created] = await db
    .insert(reports)
    .values({
      reporterId: params.reporterId,
      targetType: params.targetType,
      targetId: params.targetId,
      reason: params.reason,
      status: 'open',
      ...(params.details ? { details: params.details } : {}),
      updatedAt: now,
    })
    .returning()

  if (!created) {
    throw new HttpError(500, 'Failed to persist report')
  }

  return created
}
