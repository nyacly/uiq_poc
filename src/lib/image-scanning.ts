/**
 * Image content scanning system
 * UiQ Community Platform - NSFW and inappropriate content detection
 */

import { db, imageScanResults, auditLogs } from './db'
import { eq } from 'drizzle-orm'

interface ImageScanResult {
  isNsfw: boolean
  isInappropriate: boolean
  confidence: number
  flaggedCategories: string[]
  scanProvider: string
  status: 'pending' | 'approved' | 'rejected' | 'flagged' | 'removed'
}

interface ScanImageRequest {
  imageUrl: string
  contentType: 'business' | 'listing' | 'message' | 'review' | 'announcement' | 'event' | 'user_profile'
  contentId: string
  userId?: string
}

// Basic image scanning using URL analysis and filename patterns
export async function scanImageContent(request: ScanImageRequest): Promise<ImageScanResult> {
  try {
    const result = await performBasicImageScan(request.imageUrl)
    
    // Store scan results in database
    await db.insert(imageScanResults).values({
      imageUrl: request.imageUrl,
      contentType: request.contentType,
      contentId: request.contentId,
      scanProvider: 'internal',
      scanResults: result,
      isNsfw: result.isNsfw,
      isInappropriate: result.isInappropriate,
      confidence: result.confidence,
      flaggedCategories: result.flaggedCategories,
      status: result.isNsfw || result.isInappropriate ? 'flagged' : 'approved'
    })

    // Create audit log if content is flagged
    if (result.isNsfw || result.isInappropriate) {
      await db.insert(auditLogs).values({
        userId: request.userId || null,
        action: 'flag',
        resourceType: 'image_scan',
        resourceId: request.contentId,
        metadata: {
          imageUrl: request.imageUrl,
          contentType: request.contentType,
          scanResult: result,
          autoFlagged: true
        }
      })
    }

    return result
  } catch (error) {
    console.error('Error scanning image:', error)
    
    // Return safe default on error
    return {
      isNsfw: false,
      isInappropriate: false,
      confidence: 0,
      flaggedCategories: [],
      scanProvider: 'internal',
      status: 'pending'
    }
  }
}

// Basic image scanning using URL patterns and filename analysis
async function performBasicImageScan(imageUrl: string): Promise<ImageScanResult> {
  const suspiciousPatterns = [
    // NSFW filename patterns
    /\b(adult|xxx|porn|nude|naked|sex|explicit)\b/i,
    /\b(nsfw|18\+|mature|bikini|lingerie)\b/i,
    
    // Inappropriate business content patterns
    /\b(scam|fake|fraud|pyramid|mlm)\b/i,
    /\b(weapon|drug|illegal|stolen)\b/i,
    
    // Spam image patterns
    /\b(money|cash|profit|earn|investment)\b/i,
    /\b(winner|lottery|prize|urgent|claim)\b/i
  ]

  let isNsfw = false
  let isInappropriate = false
  const flaggedCategories: string[] = []
  let confidence = 0

  // Check URL and filename for suspicious patterns
  const urlLower = imageUrl.toLowerCase()
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(urlLower)) {
      if (pattern.source.includes('adult|xxx|porn|nude|naked|sex|explicit|nsfw|18')) {
        isNsfw = true
        flaggedCategories.push('nsfw')
        confidence = Math.max(confidence, 0.8)
      } else if (pattern.source.includes('scam|fake|fraud|pyramid|mlm|weapon|drug|illegal')) {
        isInappropriate = true
        flaggedCategories.push('inappropriate_business')
        confidence = Math.max(confidence, 0.7)
      } else if (pattern.source.includes('money|cash|profit|earn|investment|winner|lottery')) {
        isInappropriate = true
        flaggedCategories.push('spam_content')
        confidence = Math.max(confidence, 0.6)
      }
    }
  }

  // Check for suspicious file extensions or hosting patterns
  if (urlLower.includes('temp') || urlLower.includes('cache') || urlLower.includes('random')) {
    isInappropriate = true
    flaggedCategories.push('suspicious_source')
    confidence = Math.max(confidence, 0.5)
  }

  return {
    isNsfw,
    isInappropriate,
    confidence,
    flaggedCategories,
    scanProvider: 'internal',
    status: (isNsfw || isInappropriate) ? 'flagged' : 'approved'
  }
}

// Enhanced image scanning with external services (placeholder for future implementation)
export async function scanImageWithExternalService(
  imageUrl: string,
  provider: 'aws_rekognition' | 'google_vision' | 'azure_cognitive'
): Promise<ImageScanResult> {
  // This is a placeholder for external service integration
  // In production, you would integrate with services like:
  // - AWS Rekognition for content moderation
  // - Google Cloud Vision API
  // - Azure Cognitive Services
  
  console.log(`External image scanning with ${provider} not implemented yet`)
  
  // Fall back to basic scanning
  return performBasicImageScan(imageUrl)
}

// Batch scan multiple images
export async function batchScanImages(requests: ScanImageRequest[]): Promise<ImageScanResult[]> {
  const results: ImageScanResult[] = []
  
  for (const request of requests) {
    try {
      const result = await scanImageContent(request)
      results.push(result)
      
      // Add small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Error scanning image ${request.imageUrl}:`, error)
      results.push({
        isNsfw: false,
        isInappropriate: false,
        confidence: 0,
        flaggedCategories: [],
        scanProvider: 'internal',
        status: 'pending'
      })
    }
  }
  
  return results
}

// Get scan results for content
export async function getImageScanResults(
  contentType: string,
  contentId: string
): Promise<any[]> {
  try {
    return await db
      .select()
      .from(imageScanResults)
      .where(
        eq(imageScanResults.contentType, contentType as any) &&
        eq(imageScanResults.contentId, contentId)
      )
      .orderBy(imageScanResults.createdAt)
  } catch (error) {
    console.error('Error fetching image scan results:', error)
    return []
  }
}

// Approve flagged image
export async function approveImageScan(
  scanId: string,
  moderatorId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    await db
      .update(imageScanResults)
      .set({
        status: 'approved',
        moderatorId,
        moderatorNotes: notes,
        resolvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(imageScanResults.id, scanId))

    // Create audit log
    await db.insert(auditLogs).values({
      userId: moderatorId,
      action: 'moderate',
      resourceType: 'image_scan',
      resourceId: scanId,
      metadata: {
        action: 'approve',
        notes
      }
    })

    return {
      success: true,
      message: 'Image approved successfully'
    }
  } catch (error) {
    console.error('Error approving image scan:', error)
    return {
      success: false,
      message: 'Failed to approve image'
    }
  }
}

// Reject flagged image
export async function rejectImageScan(
  scanId: string,
  moderatorId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    await db
      .update(imageScanResults)
      .set({
        status: 'rejected',
        moderatorId,
        moderatorNotes: notes,
        resolvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(imageScanResults.id, scanId))

    // Create audit log
    await db.insert(auditLogs).values({
      userId: moderatorId,
      action: 'moderate',
      resourceType: 'image_scan',
      resourceId: scanId,
      metadata: {
        action: 'reject',
        notes
      }
    })

    return {
      success: true,
      message: 'Image rejected successfully'
    }
  } catch (error) {
    console.error('Error rejecting image scan:', error)
    return {
      success: false,
      message: 'Failed to reject image'
    }
  }
}

// Get pending image scans for moderation
export async function getPendingImageScans(limit: number = 50): Promise<any[]> {
  try {
    return await db
      .select()
      .from(imageScanResults)
      .where(eq(imageScanResults.status, 'flagged'))
      .orderBy(imageScanResults.createdAt)
      .limit(limit)
  } catch (error) {
    console.error('Error fetching pending image scans:', error)
    return []
  }
}

// Helper function to validate image URL
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()
    
    // Check for common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
    const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext))
    
    // Check for common image hosting domains
    const trustedDomains = [
      'imgur.com',
      'cloudinary.com',
      'amazonaws.com',
      'googleusercontent.com',
      'facebook.com',
      'fbcdn.net'
    ]
    
    const isTrustedDomain = trustedDomains.some(domain => 
      urlObj.hostname.includes(domain)
    )
    
    return (urlObj.protocol === 'https:' || urlObj.protocol === 'http:') && 
           (hasImageExtension || isTrustedDomain)
  } catch (error) {
    return false
  }
}

// Extract images from content for scanning
export function extractImageUrlsFromContent(content: string): string[] {
  const imageUrls: string[] = []
  
  // Regex to find image URLs in text
  const urlRegex = /https?:\/\/[^\s<>"]+?\.(jpg|jpeg|png|gif|webp|svg|bmp)(?:\?[^\s<>"]*)?/gi
  const matches = content.match(urlRegex)
  
  if (matches) {
    for (const url of matches) {
      if (isValidImageUrl(url)) {
        imageUrls.push(url)
      }
    }
  }
  
  return [...new Set(imageUrls)] // Remove duplicates
}