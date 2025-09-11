/**
 * User verification system for phone and email
 * UiQ Community Platform - Spam/Scam Protection
 */

import { db, userVerifications, users } from './db'
import { eq, and, gt } from 'drizzle-orm'
import crypto from 'crypto'
import twilio from 'twilio'

interface VerificationResult {
  success: boolean
  message: string
  expiresAt?: Date
}

interface VerifyCodeResult {
  success: boolean
  message: string
  isVerified?: boolean
}

// Generate a secure 6-digit OTP code
export function generateOTPCode(): string {
  return crypto.randomInt(100000, 999999).toString()
}

// Create email verification
export async function createEmailVerification(
  userId: string, 
  email: string
): Promise<VerificationResult> {
  try {
    const code = generateOTPCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Deactivate any existing email verifications for this user
    await db
      .update(userVerifications)
      .set({ isActive: false })
      .where(
        and(
          eq(userVerifications.userId, userId),
          eq(userVerifications.type, 'email'),
          eq(userVerifications.isActive, true)
        )
      )

    // Create new verification
    await db.insert(userVerifications).values({
      userId,
      type: 'email',
      value: email,
      code,
      expiresAt,
      attempts: 0,
      isActive: true
    })

    // TODO: Send email with verification code
    // This would integrate with an email service like SendGrid or AWS SES
    console.log(`Email verification code for ${email}: ${code}`)

    return {
      success: true,
      message: 'Verification code sent to your email',
      expiresAt
    }
  } catch (error) {
    console.error('Error creating email verification:', error)
    return {
      success: false,
      message: 'Failed to create email verification'
    }
  }
}

// Create phone verification using Twilio
export async function createPhoneVerification(
  userId: string, 
  phoneNumber: string
): Promise<VerificationResult> {
  try {
    const code = generateOTPCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Deactivate any existing phone verifications for this user
    await db
      .update(userVerifications)
      .set({ isActive: false })
      .where(
        and(
          eq(userVerifications.userId, userId),
          eq(userVerifications.type, 'phone'),
          eq(userVerifications.isActive, true)
        )
      )

    // Create new verification
    await db.insert(userVerifications).values({
      userId,
      type: 'phone',
      value: phoneNumber,
      code,
      expiresAt,
      attempts: 0,
      isActive: true
    })

    // Send SMS using Twilio (will be implemented below)
    const smsResult = await sendVerificationSMS(phoneNumber, code)
    if (!smsResult.success) {
      return {
        success: false,
        message: smsResult.message
      }
    }

    return {
      success: true,
      message: 'Verification code sent to your phone',
      expiresAt
    }
  } catch (error) {
    console.error('Error creating phone verification:', error)
    return {
      success: false,
      message: 'Failed to create phone verification'
    }
  }
}

// Send SMS verification code using Twilio
export async function sendVerificationSMS(
  phoneNumber: string, 
  code: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Import Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    const message = `Your UiQ verification code is: ${code}. This code expires in 15 minutes.`

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    })

    return {
      success: true,
      message: 'SMS sent successfully'
    }
  } catch (error) {
    console.error('Error sending SMS:', error)
    return {
      success: false,
      message: 'Failed to send SMS verification'
    }
  }
}

// Verify code for email or phone
export async function verifyCode(
  userId: string,
  type: 'email' | 'phone',
  code: string
): Promise<VerifyCodeResult> {
  try {
    // Find active verification
    const verification = await db
      .select()
      .from(userVerifications)
      .where(
        and(
          eq(userVerifications.userId, userId),
          eq(userVerifications.type, type),
          eq(userVerifications.isActive, true),
          gt(userVerifications.expiresAt, new Date())
        )
      )
      .limit(1)

    if (!verification.length) {
      return {
        success: false,
        message: 'No active verification found or code has expired'
      }
    }

    const activeVerification = verification[0]

    // Check attempt limit (max 3 attempts)
    if (activeVerification.attempts >= 3) {
      await db
        .update(userVerifications)
        .set({ isActive: false })
        .where(eq(userVerifications.id, activeVerification.id))

      return {
        success: false,
        message: 'Too many failed attempts. Please request a new code.'
      }
    }

    // Increment attempts
    await db
      .update(userVerifications)
      .set({ attempts: activeVerification.attempts + 1 })
      .where(eq(userVerifications.id, activeVerification.id))

    // Check if code matches
    if (activeVerification.code !== code) {
      return {
        success: false,
        message: 'Invalid verification code'
      }
    }

    // Mark as verified
    await db
      .update(userVerifications)
      .set({ 
        verifiedAt: new Date(),
        isActive: false 
      })
      .where(eq(userVerifications.id, activeVerification.id))

    // Update user verification status
    if (type === 'email') {
      await db
        .update(users)
        .set({ 
          email: activeVerification.value,
          isVerified: true 
        })
        .where(eq(users.id, userId))
    } else if (type === 'phone') {
      await db
        .update(users)
        .set({ 
          phone: activeVerification.value,
          isVerified: true 
        })
        .where(eq(users.id, userId))
    }

    return {
      success: true,
      message: 'Verification successful',
      isVerified: true
    }
  } catch (error) {
    console.error('Error verifying code:', error)
    return {
      success: false,
      message: 'Failed to verify code'
    }
  }
}

// Check if user has verified email or phone
export async function getUserVerificationStatus(userId: string): Promise<{
  emailVerified: boolean
  phoneVerified: boolean
  email?: string
  phone?: string
}> {
  try {
    const user = await db
      .select({
        email: users.email,
        phone: users.phone,
        isVerified: users.isVerified
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user.length) {
      return {
        emailVerified: false,
        phoneVerified: false
      }
    }

    const userData = user[0]

    const emailVerified = !!userData.email && userData.isVerified
    const phoneVerified = !!userData.phone && userData.isVerified

    return {
      emailVerified,
      phoneVerified,
      email: userData.email || undefined,
      phone: userData.phone || undefined
    }
  } catch (error) {
    console.error('Error checking verification status:', error)
    return {
      emailVerified: false,
      phoneVerified: false
    }
  }
}

// Resend verification code
export async function resendVerificationCode(
  userId: string,
  type: 'email' | 'phone'
): Promise<VerificationResult> {
  try {
    // Get user's email or phone
    const user = await db
      .select({
        email: users.email,
        phone: users.phone
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user.length) {
      return {
        success: false,
        message: 'User not found'
      }
    }

    const userData = user[0]

    if (type === 'email' && userData.email) {
      return await createEmailVerification(userId, userData.email)
    } else if (type === 'phone' && userData.phone) {
      return await createPhoneVerification(userId, userData.phone)
    } else {
      return {
        success: false,
        message: `No ${type} found for this user`
      }
    }
  } catch (error) {
    console.error('Error resending verification code:', error)
    return {
      success: false,
      message: 'Failed to resend verification code'
    }
  }
}