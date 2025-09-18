import { and, asc, eq, gt, ne, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'

import {
  conversations,
  db,
  messages,
  participants,
  users,
  type Conversation,
  type Message,
  type Participant,
} from '@/lib/db'
import type { SessionUser } from '@server/auth'
import { ForbiddenError, HttpError } from '@server/auth'

type MinimalUser = Pick<SessionUser, 'id' | 'role'>

type ConversationMetadata = Record<string, unknown>

type TransactionLike = typeof db

const MAX_MESSAGE_LENGTH = 5000
const MAX_SUBJECT_LENGTH = 255
const CONTEXT_TYPE_MAX_LENGTH = 64
const CONTEXT_REFERENCE_MAX_LENGTH = 255

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const conversationContextSchema = z
  .object({
    type: z.string().trim().min(1).max(CONTEXT_TYPE_MAX_LENGTH),
    entityId: z.string().uuid().optional(),
    reference: z.string().trim().min(1).max(CONTEXT_REFERENCE_MAX_LENGTH).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict()

export const startConversationSchema = z.object({
  targetUserId: z.string().uuid(),
  subject: z.string().trim().min(1).max(MAX_SUBJECT_LENGTH).optional(),
  context: conversationContextSchema.optional(),
  firstMessage: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
})

export const messageCreateSchema = z.object({
  body: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
})

export type StartConversationInput = z.infer<typeof startConversationSchema>
export type MessageCreateInput = z.infer<typeof messageCreateSchema>

export type ConversationWithMessages = {
  conversation: Conversation
  messages: Message[]
  participant: Participant | null
  unreadCount: number
}

export type StartConversationResult = {
  conversation: Conversation
  participants: Participant[]
  message: Message
  unreadCount: number
}

export type MessageCreationResult = {
  conversation: Conversation
  message: Message
  unreadCount: number
}

export type ConversationContext = z.infer<typeof conversationContextSchema>

export function serializeConversation(conversation: Conversation) {
  const rawMetadata = conversation.metadata as ConversationMetadata | null
  const rawContext = rawMetadata?.context

  const context = isPlainRecord(rawContext) ? (rawContext as ConversationContext) : null

  return {
    id: conversation.id,
    createdBy: conversation.createdBy,
    topic: conversation.topic,
    isGroup: conversation.isGroup,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    context,
  }
}

export function serializeMessage(message: Message) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    type: message.type,
    status: message.status,
    body: message.body,
    attachments: message.attachments,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    deliveredAt: message.deliveredAt ? message.deliveredAt.toISOString() : null,
    readAt: message.readAt ? message.readAt.toISOString() : null,
  }
}

export async function startConversation(
  input: StartConversationInput,
  user: MinimalUser,
): Promise<StartConversationResult> {
  if (input.targetUserId === user.id) {
    throw new HttpError(400, 'Cannot start a conversation with yourself')
  }

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, input.targetUserId))
    .limit(1)

  if (!target) {
    throw new HttpError(404, 'Target user not found')
  }

  const now = new Date()

  const { conversation, participants: insertedParticipants, message } = await db.transaction(
    async (tx) => {
      const conversationMetadata: ConversationMetadata = input.context
        ? { context: input.context }
        : {}

      const [createdConversation] = await tx
        .insert(conversations)
        .values({
          createdBy: user.id,
          topic: input.subject ?? null,
          isGroup: false,
          ...(Object.keys(conversationMetadata).length > 0
            ? { metadata: conversationMetadata }
            : {}),
        })
        .returning()

      const participantRows = await tx
        .insert(participants)
        .values([
          {
            conversationId: createdConversation.id,
            userId: user.id,
            role: 'member',
            lastReadAt: now,
          },
          {
            conversationId: createdConversation.id,
            userId: target.id,
            role: 'member',
            lastReadAt: null,
          },
        ])
        .returning()

      const [createdMessage] = await tx
        .insert(messages)
        .values({
          conversationId: createdConversation.id,
          senderId: user.id,
          body: input.firstMessage,
          type: 'text',
          status: 'sent',
          attachments: [],
        })
        .returning()

      await tx
        .update(conversations)
        .set({ updatedAt: now })
        .where(eq(conversations.id, createdConversation.id))

      return {
        conversation: createdConversation,
        participants: participantRows,
        message: createdMessage,
      }
    },
  )

  return {
    conversation,
    participants: insertedParticipants,
    message,
    unreadCount: 0,
  }
}

export async function getConversationMessages(
  conversationId: string,
  user: MinimalUser,
): Promise<ConversationWithMessages> {
  const conversation = await loadConversation(conversationId)

  let participant = await findParticipant(conversationId, user.id)

  if (!participant && user.role !== 'admin') {
    throw new ForbiddenError('You do not have access to this conversation')
  }

  const messageRecords = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))

  const unreadCount = participant
    ? await calculateUnreadCount(db, conversationId, user.id, participant.lastReadAt)
    : 0

  return {
    conversation,
    participant,
    messages: messageRecords,
    unreadCount,
  }
}

export async function addMessageToConversation(
  conversationId: string,
  input: MessageCreateInput,
  user: MinimalUser,
): Promise<MessageCreationResult> {
  const conversation = await loadConversation(conversationId)

  let participant = await findParticipant(conversationId, user.id)

  if (!participant && user.role !== 'admin') {
    throw new ForbiddenError('You do not have access to this conversation')
  }

  const now = new Date()

  const { message } = await db.transaction(async (tx) => {
    const [createdMessage] = await tx
      .insert(messages)
      .values({
        conversationId,
        senderId: user.id,
        body: input.body,
        type: 'text',
        status: 'sent',
        attachments: [],
      })
      .returning()

    await tx
      .update(conversations)
      .set({ updatedAt: now })
      .where(eq(conversations.id, conversationId))

    if (participant) {
      await tx
        .update(participants)
        .set({ lastReadAt: now })
        .where(
          and(
            eq(participants.conversationId, conversationId),
            eq(participants.userId, user.id),
          ),
        )

      participant = { ...participant, lastReadAt: now }
    }

    return { message: createdMessage }
  })

  const unreadCount = participant
    ? await calculateUnreadCount(db, conversationId, user.id, participant.lastReadAt)
    : 0

  return {
    conversation,
    message,
    unreadCount,
  }
}

async function loadConversation(conversationId: string) {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1)

  if (!conversation) {
    throw new HttpError(404, 'Conversation not found')
  }

  return conversation
}

async function findParticipant(conversationId: string, userId: string) {
  const [participant] = await db
    .select()
    .from(participants)
    .where(and(eq(participants.conversationId, conversationId), eq(participants.userId, userId)))
    .limit(1)

  return participant ?? null
}

async function calculateUnreadCount(
  executor: TransactionLike,
  conversationId: string,
  userId: string,
  lastReadAt: Date | null,
) {
  const conditions: SQL[] = [
    eq(messages.conversationId, conversationId),
    ne(messages.senderId, userId),
  ]

  if (lastReadAt) {
    conditions.push(gt(messages.createdAt, lastReadAt))
  }

  const whereClause =
    conditions.length === 1
      ? conditions[0]
      : conditions.length > 1
        ? and(...conditions)
        : undefined

  const query = executor.select({ count: sql<number>`count(*)` }).from(messages)

  const [result] = whereClause ? await query.where(whereClause) : await query

  return Number(result?.count ?? 0)
}
