/**
 * User blocking, banning, and reporting system
 * UiQ Community Platform - User Management for Spam Protection
 */

import { db, users, reports } from './db'
import { eq, and, or, isNull, gt } from 'drizzle-orm'

interface ReportUserRequest {
  reporterId: string
  reportedUserId?: string
  reportedBusinessId?: string
  reportedListingId?: string
  reportedMessageId?: string
  reportedAnnouncementId?: string
  reportedEventId?: string
  reportedReviewId?: string
  type: 'spam' | 'inappropriate' | 'harassment' | 'fake' | 'scam' | 'phishing' | 'violence' | 'hate_speech' | 'other'
  description: string
  evidenceUrls?: string[]
}

// Submit a report
export async function submitReport(request: ReportUserRequest): Promise<{ success: boolean; message: string; reportId?: string }> {
  try {
    // Validate that at least one target is specified
    const hasTarget = !!(
      request.reportedUserId ||
      request.reportedBusinessId ||
      request.reportedListingId ||
      request.reportedMessageId ||
      request.reportedAnnouncementId ||
      request.reportedEventId ||
      request.reportedReviewId
    )

    if (!hasTarget) {
      return {
        success: false,
        message: 'Must specify at least one item to report'
      }
    }

    // Create report
    let targetType: any = 'user';
    let targetId = '';

    if (request.reportedUserId) {
        targetType = 'user';
        targetId = request.reportedUserId;
    } else if (request.reportedBusinessId) {
        targetType = 'business';
        targetId = request.reportedBusinessId;
    } else if (request.reportedListingId) {
        targetType = 'classified'; // 'listing' is not a valid ReportTargetType
        targetId = request.reportedListingId;
    } else if (request.reportedMessageId) {
        targetType = 'message';
        targetId = request.reportedMessageId;
    } else if (request.reportedAnnouncementId) {
        targetType = 'announcement';
        targetId = request.reportedAnnouncementId;
    } else if (request.reportedEventId) {
        targetType = 'event';
        targetId = request.reportedEventId;
    }

    const result = await db.insert(reports).values({
      reporterId: request.reporterId,
      targetId: targetId,
      targetType: targetType,
      reason: request.type,
      details: request.description,
      status: 'pending',
    }).returning({ id: reports.id })

    return {
      success: true,
      message: 'Report submitted successfully',
      reportId: result[0].id
    }
  } catch (error) {
    console.error('Error submitting report:', error)
    return {
      success: false,
      message: 'Failed to submit report'
    }
  }
}

// Get reports for moderation
export async function getReports(
  status?: string,
  limit: number = 50
): Promise<typeof reports.$inferSelect[]> {
  try {
    const conditions = []
    if (status) {
      conditions.push(eq(reports.status, status as any))
    }

    const query = db
      .select()
      .from(reports)
      .orderBy(reports.createdAt)
      .limit(limit)

    if (conditions.length > 0) {
      return await query.where(and(...conditions))
    } else {
      return await query
    }
  } catch (error) {
    console.error('Error fetching reports:', error)
    return []
  }
}

// Resolve a report
export async function resolveReport(
  reportId: string,
  moderatorId: string,
  action: 'resolved' | 'dismissed',
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    await db
      .update(reports)
      .set({
        status: action,
        resolution: notes,
        updatedAt: new Date()
      })
      .where(eq(reports.id, reportId))

    return {
      success: true,
      message: 'Report resolved successfully'
    }
  } catch (error) {
    console.error('Error resolving report:', error)
    return {
      success: false,
      message: 'Failed to resolve report'
    }
  }
}

// Get user's report history
export async function getUserReports(userId: string, limit: number = 20): Promise<typeof reports.$inferSelect[]> {
  try {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.reporterId, userId))
      .orderBy(reports.createdAt)
      .limit(limit)
  } catch (error) {
    console.error('Error fetching user reports:', error)
    return []
  }
}

// Get reports against a user
export async function getReportsAgainstUser(userId: string, limit: number = 20): Promise<typeof reports.$inferSelect[]> {
  try {
    return await db
      .select()
      .from(reports)
      .where(and(eq(reports.targetId, userId), eq(reports.targetType, 'user')))
      .orderBy(reports.createdAt)
      .limit(limit)
  } catch (error) {
    console.error('Error fetching reports against user:', error)
    return []
  }
}