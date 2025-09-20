/**
 * Content moderation system with keyword flagging
 * UiQ Community Platform - Spam/Scam Protection
 */

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


