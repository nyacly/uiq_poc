/**
 * User blocking, banning, and reporting system
 * UiQ Community Platform - User Management for Spam Protection
 */

import { db, users, userBlocks, userBans, reports, auditLogs } from './db'
import { eq, and, or, isNull, gt } from 'drizzle-orm'

interface BlockUserRequest {
  blockerId: string
  blockedUserId: string
  reason?: string
}

interface BanUserRequest {
  userId: string
  moderatorId: string
  reason: string
  banType: 'temporary' | 'permanent' | 'shadow'
  expiresAt?: Date
}

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

// Block a user
export async function blockUser(request: BlockUserRequest): Promise<{ success: boolean; message: string }> {
  try {
    // Check if already blocked
    const existingBlock = await db
      .select()
      .from(userBlocks)
      .where(
        and(
          eq(userBlocks.blockerId, request.blockerId),
          eq(userBlocks.blockedUserId, request.blockedUserId),
          eq(userBlocks.isActive, true)
        )
      )
      .limit(1)

    if (existingBlock.length > 0) {
      return {
        success: false,
        message: 'User is already blocked'
      }
    }

    // Create block entry
    await db.insert(userBlocks).values({
      blockerId: request.blockerId,
      blockedUserId: request.blockedUserId,
      reason: request.reason,
      isActive: true
    })

    // Create audit log
    await db.insert(auditLogs).values({
      userId: request.blockerId,
      action: 'block',
      resourceType: 'user',
      resourceId: request.blockedUserId,
      metadata: {
        reason: request.reason,
        blockType: 'user_block'
      }
    })

    return {
      success: true,
      message: 'User blocked successfully'
    }
  } catch (error) {
    console.error('Error blocking user:', error)
    return {
      success: false,
      message: 'Failed to block user'
    }
  }
}

// Unblock a user
export async function unblockUser(blockerId: string, blockedUserId: string): Promise<{ success: boolean; message: string }> {
  try {
    await db
      .update(userBlocks)
      .set({ isActive: false })
      .where(
        and(
          eq(userBlocks.blockerId, blockerId),
          eq(userBlocks.blockedUserId, blockedUserId),
          eq(userBlocks.isActive, true)
        )
      )

    // Create audit log
    await db.insert(auditLogs).values({
      userId: blockerId,
      action: 'unblock',
      resourceType: 'user',
      resourceId: blockedUserId,
      metadata: {
        blockType: 'user_unblock'
      }
    })

    return {
      success: true,
      message: 'User unblocked successfully'
    }
  } catch (error) {
    console.error('Error unblocking user:', error)
    return {
      success: false,
      message: 'Failed to unblock user'
    }
  }
}

// Check if user is blocked
export async function isUserBlocked(blockerId: string, blockedUserId: string): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(userBlocks)
      .where(
        and(
          eq(userBlocks.blockerId, blockerId),
          eq(userBlocks.blockedUserId, blockedUserId),
          eq(userBlocks.isActive, true)
        )
      )
      .limit(1)

    return result.length > 0
  } catch (error) {
    console.error('Error checking if user is blocked:', error)
    return false
  }
}

// Get blocked users for a user
export async function getBlockedUsers(userId: string): Promise<{
    blockId: string;
    blockedUserId: string;
    reason: string | null;
    createdAt: Date;
    blockedUser: {
        id: string;
        name: string | null;
        avatar: string | null;
    } | null;
}[]> {
  try {
    return await db
      .select({
        blockId: userBlocks.id,
        blockedUserId: userBlocks.blockedUserId,
        reason: userBlocks.reason,
        createdAt: userBlocks.createdAt,
        blockedUser: {
          id: users.id,
          name: users.name,
          avatar: users.avatar
        }
      })
      .from(userBlocks)
      .leftJoin(users, eq(userBlocks.blockedUserId, users.id))
      .where(
        and(
          eq(userBlocks.blockerId, userId),
          eq(userBlocks.isActive, true)
        )
      )
      .orderBy(userBlocks.createdAt)
  } catch (error) {
    console.error('Error fetching blocked users:', error)
    return []
  }
}

// Ban a user (admin function)
export async function banUser(request: BanUserRequest): Promise<{ success: boolean; message: string }> {
  try {
    // Check if user is already banned
    const existingBan = await db
      .select()
      .from(userBans)
      .where(
        and(
          eq(userBans.userId, request.userId),
          eq(userBans.isActive, true)
        )
      )
      .limit(1)

    if (existingBan.length > 0) {
      return {
        success: false,
        message: 'User is already banned'
      }
    }

    // Create ban entry
    await db.insert(userBans).values({
      userId: request.userId,
      moderatorId: request.moderatorId,
      reason: request.reason,
      banType: request.banType,
      expiresAt: request.expiresAt,
      isActive: true
    })

    // Create audit log
    await db.insert(auditLogs).values({
      userId: request.moderatorId,
      action: 'ban',
      resourceType: 'user',
      resourceId: request.userId,
      metadata: {
        reason: request.reason,
        banType: request.banType,
        expiresAt: request.expiresAt?.toISOString()
      }
    })

    return {
      success: true,
      message: 'User banned successfully'
    }
  } catch (error) {
    console.error('Error banning user:', error)
    return {
      success: false,
      message: 'Failed to ban user'
    }
  }
}

// Unban a user (admin function)
export async function unbanUser(userId: string, moderatorId: string): Promise<{ success: boolean; message: string }> {
  try {
    await db
      .update(userBans)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userBans.userId, userId),
          eq(userBans.isActive, true)
        )
      )

    // Create audit log
    await db.insert(auditLogs).values({
      userId: moderatorId,
      action: 'unban',
      resourceType: 'user',
      resourceId: userId,
      metadata: {
        action: 'unban'
      }
    })

    return {
      success: true,
      message: 'User unbanned successfully'
    }
  } catch (error) {
    console.error('Error unbanning user:', error)
    return {
      success: false,
      message: 'Failed to unban user'
    }
  }
}

// Check if user is banned
export async function isUserBanned(userId: string): Promise<{
  isBanned: boolean
  banType?: string
  reason?: string
  expiresAt?: Date
}> {
  try {
    const now = new Date()
    
    const ban = await db
      .select()
      .from(userBans)
      .where(
        and(
          eq(userBans.userId, userId),
          eq(userBans.isActive, true),
          or(
            isNull(userBans.expiresAt),
            gt(userBans.expiresAt, now)
          )
        )
      )
      .limit(1)

    if (ban.length === 0) {
      return { isBanned: false }
    }

    const banData = ban[0]
    return {
      isBanned: true,
      banType: banData.banType,
      reason: banData.reason,
      expiresAt: banData.expiresAt || undefined
    }
  } catch (error) {
    console.error('Error checking if user is banned:', error)
    return { isBanned: false }
  }
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

    // Determine priority based on report type
    let priority = 'medium'
    if (['harassment', 'violence', 'hate_speech', 'phishing'].includes(request.type)) {
      priority = 'high'
    } else if (['scam', 'fake'].includes(request.type)) {
      priority = 'high'
    } else if (request.type === 'spam') {
      priority = 'low'
    }

    // Create report
    const result = await db.insert(reports).values({
      reporterId: request.reporterId,
      reportedUserId: request.reportedUserId,
      reportedBusinessId: request.reportedBusinessId,
      reportedListingId: request.reportedListingId,
      reportedMessageId: request.reportedMessageId,
      reportedAnnouncementId: request.reportedAnnouncementId,
      reportedEventId: request.reportedEventId,
      reportedReviewId: request.reportedReviewId,
      type: request.type,
      description: request.description,
      status: 'pending',
      autoFlagged: false,
      evidenceUrls: request.evidenceUrls || [],
      priority
    }).returning({ id: reports.id })

    // Create audit log
    await db.insert(auditLogs).values({
      userId: request.reporterId,
      action: 'create',
      resourceType: 'report',
      resourceId: result[0].id,
      metadata: {
        reportType: request.type,
        priority,
        description: request.description
      }
    })

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
  priority?: string,
  limit: number = 50
): Promise<typeof reports.$inferSelect[]> {
  try {
    const conditions = []
    if (status) {
      conditions.push(eq(reports.status, status))
    }
    if (priority) {
      conditions.push(eq(reports.priority, priority))
    }

    const query = db
      .select()
      .from(reports)
      .orderBy(reports.priority, reports.createdAt)
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
  action: 'approved' | 'rejected' | 'resolved',
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    await db
      .update(reports)
      .set({
        status: action,
        moderatorId,
        moderatorNotes: notes,
        moderatorAction: action,
        resolvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(reports.id, reportId))

    // Create audit log
    await db.insert(auditLogs).values({
      userId: moderatorId,
      action: 'moderate',
      resourceType: 'report',
      resourceId: reportId,
      metadata: {
        action,
        notes
      }
    })

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
      .where(eq(reports.reportedUserId, userId))
      .orderBy(reports.createdAt)
      .limit(limit)
  } catch (error) {
    console.error('Error fetching reports against user:', error)
    return []
  }
}