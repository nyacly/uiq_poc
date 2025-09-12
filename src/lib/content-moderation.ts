/**
 * Content moderation system with keyword flagging
 * UiQ Community Platform - Spam/Scam Protection
 */

import { db, moderationRules, flaggedContent, auditLogs } from './db'
import { eq, and } from 'drizzle-orm'

interface ModerationResult {
  isAllowed: boolean
  flaggedKeywords: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  action: 'allow' | 'flag' | 'block' | 'auto_remove'
  ruleId?: string
  message?: string
}

interface ContentItem {
  id: string
  type: 'business' | 'listing' | 'message' | 'review' | 'announcement' | 'event' | 'user_profile'
  text: string
  userId?: string
}

interface ModerationRule {
  id: string;
  name: string;
  description: string | null;
  keywords: string[];
  contentTypes: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'allow' | 'flag' | 'block' | 'auto_remove';
  isActive: boolean;
  caseSensitive: boolean;
  wholeWordOnly: boolean;
  regex: string | null;
  exemptRoles: string[] | null;
  createdAt: Date;
  updatedAt: Date | null;
}

// Default spam/scam keywords and patterns
export const DEFAULT_SPAM_KEYWORDS = [
  // Scam/fraud indicators
  'guaranteed money', 'quick money', 'easy money', 'make money fast',
  'get rich quick', 'work from home', 'no experience needed',
  'urgent response required', 'limited time offer', 'act now',
  'congratulations you have won', 'you have been selected',
  'wire transfer', 'western union', 'money gram', 'bitcoin payment',
  
  // Phishing indicators
  'verify your account', 'account suspended', 'click here now',
  'update payment info', 'confirm identity', 'security alert',
  
  // Adult content
  'xxx', 'adult services', 'escort', 'massage parlor',
  
  // Fake business indicators
  'investment opportunity', 'pyramid scheme', 'multi level marketing',
  'recruiting agents', 'be your own boss', 'financial freedom',
  
  // Suspicious contact methods
  'whatsapp only', 'telegram only', 'signal only', 'encrypted chat',
  'offshore account', 'cryptocurrency only', 'cash only deals',
  
  // Common scam phrases
  'nigerian prince', 'inheritance claim', 'lottery winner',
  'tax refund', 'government grant', 'free money',
  'debt consolidation', 'credit repair', 'loan approved'
]

export const HATE_SPEECH_KEYWORDS = [
  // Basic hate speech detection (extend as needed)
  'hate', 'racist', 'discrimination', 'bigot', 'supremacist'
  // Note: This is a basic list - production systems should use more sophisticated detection
]

export const VIOLENCE_KEYWORDS = [
  'violence', 'threat', 'harm', 'kill', 'hurt', 'attack', 'weapon'
]

// Initialize default moderation rules
export async function initializeDefaultModerationRules(): Promise<void> {
  try {
    // Check if rules already exist
    const existingRules = await db
      .select()
      .from(moderationRules)
      .limit(1)

    if (existingRules.length > 0) {
      console.log('Moderation rules already initialized')
      return
    }

    // Create default rules
    const defaultRules = [
      {
        name: 'Spam/Scam Detection',
        description: 'Detects common spam and scam patterns',
        keywords: DEFAULT_SPAM_KEYWORDS,
        contentTypes: ['business', 'listing', 'message', 'review', 'announcement'],
        severity: 'high' as const,
        action: 'flag' as const,
        isActive: true,
        caseSensitive: false,
        wholeWordOnly: false
      },
      {
        name: 'Hate Speech Detection',
        description: 'Detects hate speech and discriminatory content',
        keywords: HATE_SPEECH_KEYWORDS,
        contentTypes: ['business', 'listing', 'message', 'review', 'announcement', 'user_profile'],
        severity: 'critical' as const,
        action: 'auto_remove' as const,
        isActive: true,
        caseSensitive: false,
        wholeWordOnly: true
      },
      {
        name: 'Violence Detection',
        description: 'Detects violent threats and content',
        keywords: VIOLENCE_KEYWORDS,
        contentTypes: ['business', 'listing', 'message', 'review', 'announcement'],
        severity: 'critical' as const,
        action: 'flag' as const,
        isActive: true,
        caseSensitive: false,
        wholeWordOnly: true
      }
    ]

    for (const rule of defaultRules) {
      await db.insert(moderationRules).values(rule)
    }

    console.log('Default moderation rules initialized')
  } catch (error) {
    console.error('Error initializing moderation rules:', error)
  }
}

// Check content against moderation rules
export async function moderateContent(content: ContentItem): Promise<ModerationResult> {
  try {
    // Get active moderation rules for this content type
    const rules = await db
      .select()
      .from(moderationRules)
      .where(
        and(
          eq(moderationRules.isActive, true)
        )
      )

    const applicableRules = rules.filter(rule => {
      const contentTypes = Array.isArray(rule.contentTypes) ? rule.contentTypes : []
      return contentTypes.includes(content.type)
    })

    if (applicableRules.length === 0) {
      return {
        isAllowed: true,
        flaggedKeywords: [],
        severity: 'low',
        action: 'allow'
      }
    }

    const flaggedKeywords: string[] = []
    let highestSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low'
    let finalAction: 'allow' | 'flag' | 'block' | 'auto_remove' = 'allow'
    let triggeredRule: ModerationRule | null = null

    const contentText = content.text.toLowerCase()

    for (const rule of applicableRules) {
      const keywords = Array.isArray(rule.keywords) ? rule.keywords : []
      
      for (const keyword of keywords) {
        const keywordLower = rule.caseSensitive ? keyword : keyword.toLowerCase()
        const searchText = rule.caseSensitive ? content.text : contentText

        let isMatch = false

        if (rule.regex) {
          // Use regex pattern if provided
          try {
            const regexFlags = rule.caseSensitive ? 'g' : 'gi'
            const regex = new RegExp(rule.regex, regexFlags)
            isMatch = regex.test(searchText)
          } catch (error) {
            console.error('Invalid regex pattern:', rule.regex, error)
            continue
          }
        } else if (rule.wholeWordOnly) {
          // Whole word matching
          const wordRegex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, rule.caseSensitive ? 'g' : 'gi')
          isMatch = wordRegex.test(searchText)
        } else {
          // Simple substring matching
          isMatch = searchText.includes(keywordLower)
        }

        if (isMatch && !flaggedKeywords.includes(keyword)) {
          flaggedKeywords.push(keyword)
          
          // Update severity and action based on rule priority
          const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 }
          if (severityLevels[rule.severity as keyof typeof severityLevels] > severityLevels[highestSeverity]) {
            highestSeverity = rule.severity as any
            finalAction = rule.action as any
            triggeredRule = rule
          }
        }
      }
    }

    const isAllowed = finalAction === 'allow' || finalAction === 'flag'

    // Log flagged content if keywords were found
    if (flaggedKeywords.length > 0 && triggeredRule) {
      await logFlaggedContent(content, triggeredRule, flaggedKeywords, highestSeverity)
    }

    return {
      isAllowed,
      flaggedKeywords,
      severity: highestSeverity,
      action: finalAction,
      ruleId: triggeredRule?.id,
      message: flaggedKeywords.length > 0 
        ? `Content flagged for: ${flaggedKeywords.join(', ')}` 
        : undefined
    }
  } catch (error) {
    console.error('Error moderating content:', error)
    // Fail open - allow content if moderation fails
    return {
      isAllowed: true,
      flaggedKeywords: [],
      severity: 'low',
      action: 'allow',
      message: 'Moderation check failed'
    }
  }
}

// Log flagged content for review
async function logFlaggedContent(
  content: ContentItem,
  rule: ModerationRule,
  flaggedKeywords: string[],
  severity: string
): Promise<void> {
  try {
    await db.insert(flaggedContent).values({
      contentType: content.type,
      contentId: content.id,
      contentText: content.text,
      userId: content.userId || null,
      ruleId: rule.id,
      flaggedKeywords,
      severity,
      status: 'pending',
      autoFlagged: true
    })

    // Also create audit log entry
    await db.insert(auditLogs).values({
      userId: content.userId || null,
      action: 'flag',
      resourceType: 'flagged_content',
      resourceId: content.id,
      metadata: {
        contentType: content.type,
        ruleId: rule.id,
        flaggedKeywords,
        severity,
        autoFlagged: true
      }
    })
  } catch (error) {
    console.error('Error logging flagged content:', error)
  }
}

// Get moderation rules (for admin interface)
export async function getModerationRules(): Promise<ModerationRule[]> {
  try {
    return await db
      .select()
      .from(moderationRules)
      .orderBy(moderationRules.severity, moderationRules.name)
  } catch (error) {
    console.error('Error fetching moderation rules:', error)
    return []
  }
}

// Create custom moderation rule
export async function createModerationRule(ruleData: {
  name: string
  description?: string
  keywords: string[]
  contentTypes: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  action: 'flag' | 'block' | 'auto_remove'
  caseSensitive?: boolean
  wholeWordOnly?: boolean
  regex?: string
  exemptRoles?: string[]
}): Promise<{ success: boolean; message: string; ruleId?: string }> {
  try {
    const result = await db.insert(moderationRules).values({
      ...ruleData,
      isActive: true,
      caseSensitive: ruleData.caseSensitive ?? false,
      wholeWordOnly: ruleData.wholeWordOnly ?? true,
      exemptRoles: ruleData.exemptRoles ?? []
    }).returning({ id: moderationRules.id })

    return {
      success: true,
      message: 'Moderation rule created successfully',
      ruleId: result[0].id
    }
  } catch (error) {
    console.error('Error creating moderation rule:', error)
    return {
      success: false,
      message: 'Failed to create moderation rule'
    }
  }
}

// Update moderation rule
export async function updateModerationRule(
  ruleId: string,
  updates: Partial<ModerationRule>
): Promise<{ success: boolean; message: string }> {
  try {
    await db
      .update(moderationRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(moderationRules.id, ruleId))

    return {
      success: true,
      message: 'Moderation rule updated successfully'
    }
  } catch (error) {
    console.error('Error updating moderation rule:', error)
    return {
      success: false,
      message: 'Failed to update moderation rule'
    }
  }
}

// Delete moderation rule
export async function deleteModerationRule(ruleId: string): Promise<{ success: boolean; message: string }> {
  try {
    await db
      .delete(moderationRules)
      .where(eq(moderationRules.id, ruleId))

    return {
      success: true,
      message: 'Moderation rule deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting moderation rule:', error)
    return {
      success: false,
      message: 'Failed to delete moderation rule'
    }
  }
}

// Get flagged content for moderation queue
export async function getFlaggedContent(
  status?: 'pending' | 'approved' | 'rejected' | 'flagged' | 'removed',
  limit: number = 50
): Promise<typeof flaggedContent.$inferSelect[]> {
  try {
    const conditions = []
    if (status) {
      conditions.push(eq(flaggedContent.status, status))
    }

    const query = db
      .select()
      .from(flaggedContent)
      .orderBy(flaggedContent.createdAt)
      .limit(limit)

    if (conditions.length > 0) {
      return await query.where(and(...conditions))
    } else {
      return await query
    }
  } catch (error) {
    console.error('Error fetching flagged content:', error)
    return []
  }
}

// Approve flagged content
export async function approveFlaggedContent(
  flaggedId: string,
  moderatorId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    await db
      .update(flaggedContent)
      .set({
        status: 'approved',
        moderatorId,
        moderatorNotes: notes,
        resolvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(flaggedContent.id, flaggedId))

    // Create audit log
    await db.insert(auditLogs).values({
      userId: moderatorId,
      action: 'moderate',
      resourceType: 'flagged_content',
      resourceId: flaggedId,
      metadata: {
        action: 'approve',
        notes
      }
    })

    return {
      success: true,
      message: 'Content approved successfully'
    }
  } catch (error) {
    console.error('Error approving flagged content:', error)
    return {
      success: false,
      message: 'Failed to approve content'
    }
  }
}

// Reject flagged content
export async function rejectFlaggedContent(
  flaggedId: string,
  moderatorId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    await db
      .update(flaggedContent)
      .set({
        status: 'rejected',
        moderatorId,
        moderatorNotes: notes,
        resolvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(flaggedContent.id, flaggedId))

    // Create audit log
    await db.insert(auditLogs).values({
      userId: moderatorId,
      action: 'moderate',
      resourceType: 'flagged_content',
      resourceId: flaggedId,
      metadata: {
        action: 'reject',
        notes
      }
    })

    return {
      success: true,
      message: 'Content rejected successfully'
    }
  } catch (error) {
    console.error('Error rejecting flagged content:', error)
    return {
      success: false,
      message: 'Failed to reject content'
    }
  }
}