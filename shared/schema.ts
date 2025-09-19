import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoles = ["member", "business_owner", "moderator", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const userStatuses = ["active", "inactive", "suspended"] as const;
export type UserStatus = (typeof userStatuses)[number];

export const businessStatuses = ["draft", "review", "published", "archived"] as const;
export type BusinessStatus = (typeof businessStatuses)[number];

export const businessPlans = ["basic", "standard", "premium"] as const;
export type BusinessPlan = (typeof businessPlans)[number];

export const reviewStatuses = ["pending", "published", "removed"] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

export const eventVisibilities = ["public", "members", "private"] as const;
export type EventVisibility = (typeof eventVisibilities)[number];

export const eventStatuses = ["draft", "published", "cancelled"] as const;
export type EventStatus = (typeof eventStatuses)[number];

export const rsvpStatuses = ["pending", "confirmed", "waitlisted", "cancelled"] as const;
export type RsvpStatus = (typeof rsvpStatuses)[number];

export const announcementTypes = ["general", "bereavement", "urgent", "celebration"] as const;
export type AnnouncementType = (typeof announcementTypes)[number];

export const announcementAudiences = ["public", "members", "admins"] as const;
export type AnnouncementAudience = (typeof announcementAudiences)[number];

export const programStatuses = ["draft", "published", "archived"] as const;
export type ProgramStatus = (typeof programStatuses)[number];

export const opportunityTypes = ["scholarship", "job", "grant", "volunteer", "fellowship"] as const;
export type OpportunityType = (typeof opportunityTypes)[number];

export const opportunityStatuses = ["draft", "open", "closed"] as const;
export type OpportunityStatus = (typeof opportunityStatuses)[number];

export const classifiedTypes = ["offer", "request"] as const;
export type ClassifiedType = (typeof classifiedTypes)[number];

export const classifiedStatuses = ["draft", "published", "archived"] as const;
export type ClassifiedStatus = (typeof classifiedStatuses)[number];

export const participantRoles = ["member", "moderator"] as const;
export type ParticipantRole = (typeof participantRoles)[number];

export const messageTypes = ["text", "image", "file", "system"] as const;
export type MessageType = (typeof messageTypes)[number];

export const messageStatuses = ["sent", "delivered", "read"] as const;
export type MessageStatus = (typeof messageStatuses)[number];

export const reportTargetTypes = [
  "user",
  "business",
  "event",
  "announcement",
  "classified",
  "message",
] as const;
export type ReportTargetType = (typeof reportTargetTypes)[number];

export const reportStatuses = [
  "open",
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
] as const;
export type ReportStatus = (typeof reportStatuses)[number];

export const subscriptionStatuses = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export const membershipTiers = ["FREE", "PLUS", "FAMILY"] as const;
export type MembershipTier = (typeof membershipTiers)[number];

export const subscriptionPlans = membershipTiers;
export type SubscriptionPlan = (typeof subscriptionPlans)[number];

export const usageScopes = ["global", "user", "business"] as const;
export type UsageScope = (typeof usageScopes)[number];

export const notificationDigestFrequencies = [
  "off",
  "daily",
  "weekly",
  "monthly",
] as const;
export type NotificationDigestFrequency =
  (typeof notificationDigestFrequencies)[number];

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 32 })
      .notNull()
      .default("member")
      .$type<UserRole>(),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("active")
      .$type<UserStatus>(),
    membershipTier: varchar("membership_tier", { length: 32 })
      .notNull()
      .default("FREE")
      .$type<MembershipTier>(),
    passwordHash: varchar("password_hash", { length: 255 }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
  },
  (table) => ({
    usersEmailKey: uniqueIndex("users_email_key").on(table.email),
    usersRoleIdx: index("users_role_idx").on(table.role),
    usersStatusIdx: index("users_status_idx").on(table.status),
    usersStripeCustomerIdx: index("users_stripe_customer_idx").on(
      table.stripeCustomerId,
    ),
    usersMembershipTierCheck: check(
      "users_membership_tier_check",
      sql`${table.membershipTier} in ('FREE', 'PLUS', 'FAMILY')`,
    ),
    usersRoleCheck: check(
      "users_role_check",
      sql`${table.role} in ('member', 'business_owner', 'moderator', 'admin')`,
    ),
    usersStatusCheck: check(
      "users_status_check",
      sql`${table.status} in ('active', 'inactive', 'suspended')`,
    ),
  }),
);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    pronouns: varchar("pronouns", { length: 80 }),
    bio: text("bio"),
    avatarUrl: varchar("avatar_url", { length: 512 }),
    location: varchar("location", { length: 255 }),
    websiteUrl: varchar("website_url", { length: 512 }),
    socialLinks: jsonb("social_links").default(sql`'[]'::jsonb`).notNull(),
    preferences: jsonb("preferences").default(sql`'{}'::jsonb`).notNull(),
    notificationPrefs: jsonb("notification_prefs")
      .default(sql`'{"email":true,"sms":false,"digest":"weekly"}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    profilesUserIdx: uniqueIndex("profiles_user_id_key").on(table.userId),
    profilesDisplayNameIdx: index("profiles_display_name_idx").on(
      table.displayName,
    ),
  }),
);

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 120 }).notNull(),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("draft")
      .$type<BusinessStatus>(),
    plan: varchar("plan", { length: 32 })
      .notNull()
      .default("basic")
      .$type<BusinessPlan>(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 32 }),
    website: varchar("website", { length: 512 }),
    addressLine1: varchar("address_line1", { length: 255 }),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 120 }),
    state: varchar("state", { length: 120 }),
    postalCode: varchar("postal_code", { length: 32 }),
    country: varchar("country", { length: 120 }),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    tags: jsonb("tags").default(sql`'[]'::jsonb`).notNull(),
    hours: jsonb("hours").default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    businessesSlugKey: uniqueIndex("businesses_slug_key").on(table.slug),
    businessesOwnerIdx: index("businesses_owner_idx").on(table.ownerId),
    businessesCategoryIdx: index("businesses_category_idx").on(table.category),
    businessesStatusIdx: index("businesses_status_idx").on(table.status),
    businessesStatusCheck: check(
      "businesses_status_check",
      sql`${table.status} in ('draft', 'review', 'published', 'archived')`,
    ),
    businessesPlanCheck: check(
      "businesses_plan_check",
      sql`${table.plan} in ('basic', 'standard', 'premium')`,
    ),
  }),
);

export const businessReviews = pgTable(
  "business_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: varchar("title", { length: 255 }),
    body: text("body"),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("pending")
      .$type<ReviewStatus>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
  },
  (table) => ({
    businessReviewsBusinessIdx: index("business_reviews_business_idx").on(
      table.businessId,
    ),
    businessReviewsAuthorIdx: index("business_reviews_author_idx").on(
      table.authorId,
    ),
    businessReviewsUniqueReviewer: uniqueIndex(
      "business_reviews_unique_reviewer",
    ).on(table.businessId, table.authorId),
    businessReviewsStatusCheck: check(
      "business_reviews_status_check",
      sql`${table.status} in ('pending', 'published', 'removed')`,
    ),
    businessReviewsRatingCheck: check(
      "business_reviews_rating_check",
      sql`${table.rating} between 1 and 5`,
    ),
  }),
);

export const serviceProviders = pgTable(
  "service_providers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    services: jsonb("services").default(sql`'[]'::jsonb`).notNull(),
    baseLocation: varchar("base_location", { length: 255 }),
    suburb: varchar("suburb", { length: 120 }),
    state: varchar("state", { length: 120 }),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    phone: varchar("phone", { length: 32 }),
    email: varchar("email", { length: 255 }),
    website: varchar("website", { length: 512 }),
    whatsapp: varchar("whatsapp", { length: 64 }),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    serviceProvidersSlugKey: uniqueIndex("service_providers_slug_key").on(
      table.slug,
    ),
    serviceProvidersUserIdx: index("service_providers_user_idx").on(
      table.userId,
    ),
    serviceProvidersNameIdx: index("service_providers_name_idx").on(
      table.name,
    ),
    serviceProvidersSuburbIdx: index("service_providers_suburb_idx").on(
      table.suburb,
    ),
  }),
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizerId: uuid("organizer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid("business_id").references(() => businesses.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    category: varchar("category", { length: 120 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("draft")
      .$type<EventStatus>(),
    visibility: varchar("visibility", { length: 32 })
      .notNull()
      .default("public")
      .$type<EventVisibility>(),
    capacity: integer("capacity"),
    rsvpDeadline: timestamp("rsvp_deadline", { withTimezone: true }),
    locationName: varchar("location_name", { length: 255 }),
    address: text("address"),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    tags: jsonb("tags").default(sql`'[]'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    eventsOrganizerIdx: index("events_organizer_idx").on(table.organizerId),
    eventsBusinessIdx: index("events_business_idx").on(table.businessId),
    eventsStartIdx: index("events_start_idx").on(table.startAt),
    eventsCategoryIdx: index("events_category_idx").on(table.category),
    eventsStatusIdx: index("events_status_idx").on(table.status),
    eventsVisibilityCheck: check(
      "events_visibility_check",
      sql`${table.visibility} in ('public', 'members', 'private')`,
    ),
    eventsStatusCheck: check(
      "events_status_check",
      sql`${table.status} in ('draft', 'published', 'cancelled')`,
    ),
  }),
);

export const rsvps = pgTable(
  "rsvps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("pending")
      .$type<RsvpStatus>(),
    guestCount: integer("guest_count").notNull().default(1),
    respondedAt: timestamp("responded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    notes: text("notes"),
  },
  (table) => ({
    rsvpsUniqueAttendee: uniqueIndex("rsvps_unique_attendee").on(
      table.eventId,
      table.userId,
    ),
    rsvpsStatusIdx: index("rsvps_status_idx").on(table.status),
    rsvpsStatusCheck: check(
      "rsvps_status_check",
      sql`${table.status} in ('pending', 'confirmed', 'waitlisted', 'cancelled')`,
    ),
  }),
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    type: varchar("type", { length: 32 })
      .notNull()
      .default("general")
      .$type<AnnouncementType>(),
    audience: varchar("audience", { length: 32 })
      .notNull()
      .default("public")
      .$type<AnnouncementAudience>(),
    isApproved: boolean("is_approved")
      .notNull()
      .default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    attachments: jsonb("attachments").default(sql`'[]'::jsonb`).notNull(),
    extra: jsonb("extra").default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    announcementsAuthorIdx: index("announcements_author_idx").on(
      table.authorId,
    ),
    announcementsPublishedIdx: index("announcements_published_idx").on(
      table.publishedAt,
    ),
    announcementsTypeIdx: index("announcements_type_idx").on(table.type),
    announcementsTypeCheck: check(
      "announcements_type_check",
      sql`${table.type} in ('general', 'bereavement', 'urgent', 'celebration')`,
    ),
    announcementsAudienceCheck: check(
      "announcements_audience_check",
      sql`${table.audience} in ('public', 'members', 'admins')`,
    ),
  }),
);

export const programs = pgTable(
  "programs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid("business_id").references(() => businesses.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    summary: varchar("summary", { length: 512 }),
    description: text("description"),
    category: varchar("category", { length: 120 }),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("draft")
      .$type<ProgramStatus>(),
    startAt: timestamp("start_at", { withTimezone: true }),
    endAt: timestamp("end_at", { withTimezone: true }),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    programsOwnerIdx: index("programs_owner_idx").on(table.ownerId),
    programsBusinessIdx: index("programs_business_idx").on(table.businessId),
    programsStatusIdx: index("programs_status_idx").on(table.status),
    programsStatusCheck: check(
      "programs_status_check",
      sql`${table.status} in ('draft', 'published', 'archived')`,
    ),
  }),
);

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    programId: uuid("program_id").references(() => programs.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    type: varchar("type", { length: 32 })
      .notNull()
      .default("job")
      .$type<OpportunityType>(),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("draft")
      .$type<OpportunityStatus>(),
    location: varchar("location", { length: 255 }),
    isRemote: boolean("is_remote").notNull().default(false),
    applicationUrl: varchar("application_url", { length: 512 }),
    compensation: varchar("compensation", { length: 255 }),
    postedAt: timestamp("posted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
  },
  (table) => ({
    opportunitiesOwnerIdx: index("opportunities_owner_idx").on(table.ownerId),
    opportunitiesProgramIdx: index("opportunities_program_idx").on(
      table.programId,
    ),
    opportunitiesTypeIdx: index("opportunities_type_idx").on(table.type),
    opportunitiesStatusIdx: index("opportunities_status_idx").on(table.status),
    opportunitiesTypeCheck: check(
      "opportunities_type_check",
      sql`${table.type} in ('scholarship', 'job', 'grant', 'volunteer', 'fellowship')`,
    ),
    opportunitiesStatusCheck: check(
      "opportunities_status_check",
      sql`${table.status} in ('draft', 'open', 'closed')`,
    ),
  }),
);

export const classifieds = pgTable(
  "classifieds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    type: varchar("type", { length: 32 })
      .notNull()
      .default("offer")
      .$type<ClassifiedType>(),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("draft")
      .$type<ClassifiedStatus>(),
    category: varchar("category", { length: 120 }),
    price: numeric("price", { precision: 12, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("USD"),
    location: varchar("location", { length: 255 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    contactInfo: jsonb("contact_info").default(sql`'{}'::jsonb`).notNull(),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    classifiedsOwnerIdx: index("classifieds_owner_idx").on(table.ownerId),
    classifiedsStatusIdx: index("classifieds_status_idx").on(table.status),
    classifiedsTypeIdx: index("classifieds_type_idx").on(table.type),
    classifiedsStatusCheck: check(
      "classifieds_status_check",
      sql`${table.status} in ('draft', 'published', 'archived')`,
    ),
    classifiedsTypeCheck: check(
      "classifieds_type_check",
      sql`${table.type} in ('offer', 'request')`,
    ),
  }),
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topic: varchar("topic", { length: 255 }),
    isGroup: boolean("is_group").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
  },
  (table) => ({
    conversationsCreatorIdx: index("conversations_created_by_idx").on(
      table.createdBy,
    ),
  }),
);

export const participants = pgTable(
  "participants",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 32 })
      .notNull()
      .default("member")
      .$type<ParticipantRole>(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
  },
  (table) => ({
    participantsPk: primaryKey({
      name: "participants_pkey",
      columns: [table.conversationId, table.userId],
    }),
    participantsUserIdx: index("participants_user_idx").on(table.userId),
    participantsRoleCheck: check(
      "participants_role_check",
      sql`${table.role} in ('member', 'moderator')`,
    ),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 })
      .notNull()
      .default("text")
      .$type<MessageType>(),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("sent")
      .$type<MessageStatus>(),
    body: text("body").notNull(),
    attachments: jsonb("attachments").default(sql`'[]'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => ({
    messagesConversationIdx: index("messages_conversation_idx").on(
      table.conversationId,
    ),
    messagesSenderIdx: index("messages_sender_idx").on(table.senderId),
    messagesCreatedIdx: index("messages_created_idx").on(table.createdAt),
    messagesTypeCheck: check(
      "messages_type_check",
      sql`${table.type} in ('text', 'image', 'file', 'system')`,
    ),
    messagesStatusCheck: check(
      "messages_status_check",
      sql`${table.status} in ('sent', 'delivered', 'read')`,
    ),
  }),
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: varchar("target_type", { length: 32 })
      .notNull()
      .$type<ReportTargetType>(),
    targetId: uuid("target_id").notNull(),
    reason: varchar("reason", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("open")
      .$type<ReportStatus>(),
    details: text("details"),
    resolution: text("resolution"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
  },
  (table) => ({
    reportsReporterIdx: index("reports_reporter_idx").on(table.reporterId),
    reportsTargetIdx: index("reports_target_idx").on(
      table.targetType,
      table.targetId,
    ),
    reportsStatusIdx: index("reports_status_idx").on(table.status),
    reportsTargetCheck: check(
      "reports_target_check",
      sql`${table.targetType} in ('user', 'business', 'event', 'announcement', 'classified', 'message')`,
    ),
    reportsStatusCheck: check(
      "reports_status_check",
      sql`${table.status} in ('open', 'pending', 'reviewing', 'resolved', 'dismissed')`,
    ),
  }),
);

export const usage = pgTable(
  "usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scope: varchar("scope", { length: 32 })
      .notNull()
      .default("global")
      .$type<UsageScope>(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    businessId: uuid("business_id").references(() => businesses.id, {
      onDelete: "set null",
    }),
    feature: varchar("feature", { length: 120 }).notNull(),
    action: varchar("action", { length: 120 }).notNull(),
    count: integer("count").notNull().default(0),
    windowStart: timestamp("window_start", { withTimezone: true })
      .notNull(),
    windowEnd: timestamp("window_end", { withTimezone: true }).notNull(),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    usageScopeIdx: index("usage_scope_idx").on(table.scope),
    usageWindowIdx: index("usage_window_idx").on(table.windowStart),
    usageUniqueWindow: uniqueIndex("usage_unique_window").on(
      table.scope,
      table.userId,
      table.businessId,
      table.feature,
      table.action,
      table.windowStart,
    ),
    usageScopeCheck: check(
      "usage_scope_check",
      sql`${table.scope} in ('global', 'user', 'business')`,
    ),
  }),
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: varchar("kind", { length: 64 }).notNull(),
    path: varchar("path", { length: 512 }).notNull(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    analyticsEventsKindIdx: index("analytics_events_kind_idx").on(table.kind),
    analyticsEventsPathIdx: index("analytics_events_path_idx").on(table.path),
    analyticsEventsCreatedIdx: index("analytics_events_created_idx").on(
      table.createdAt,
    ),
  }),
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid("business_id").references(() => businesses.id, {
      onDelete: "set null",
    }),
    currentTier: varchar("current_tier", { length: 32 })
      .notNull()
      .default("FREE")
      .$type<SubscriptionPlan>(),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("active")
      .$type<SubscriptionStatus>(),
    provider: varchar("provider", { length: 64 }).notNull(),
    providerCustomerId: varchar("provider_customer_id", { length: 255 }),
    providerSubscriptionId: varchar("provider_subscription_id", {
      length: 255,
    }),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
    }).notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true })
      .notNull(),
    cancelAt: timestamp("cancel_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
  },
  (table) => ({
    subscriptionsUserIdx: index("subscriptions_user_idx").on(table.userId),
    subscriptionsBusinessIdx: index("subscriptions_business_idx").on(
      table.businessId,
    ),
    subscriptionsStatusIdx: index("subscriptions_status_idx").on(
      table.status,
    ),
    subscriptionsPlanCheck: check(
      "subscriptions_plan_check",
      sql`${table.currentTier} in ('FREE', 'PLUS', 'FAMILY')`,
    ),
    subscriptionsStatusCheck: check(
      "subscriptions_status_check",
      sql`${table.status} in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')`,
    ),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
export type BusinessReview = typeof businessReviews.$inferSelect;
export type NewBusinessReview = typeof businessReviews.$inferInsert;
export type ServiceProvider = typeof serviceProviders.$inferSelect;
export type NewServiceProvider = typeof serviceProviders.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Rsvp = typeof rsvps.$inferSelect;
export type NewRsvp = typeof rsvps.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type Program = typeof programs.$inferSelect;
export type NewProgram = typeof programs.$inferInsert;
export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
export type Classified = typeof classifieds.$inferSelect;
export type NewClassified = typeof classifieds.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type Usage = typeof usage.$inferSelect;
export type NewUsage = typeof usage.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type InsertUser = NewUser;
export type InsertProfile = NewProfile;
export type InsertBusiness = NewBusiness;
export type InsertBusinessReview = NewBusinessReview;
export type InsertServiceProvider = NewServiceProvider;
export type InsertEvent = NewEvent;
export type InsertRsvp = NewRsvp;
export type InsertAnnouncement = NewAnnouncement;
export type InsertProgram = NewProgram;
export type InsertOpportunity = NewOpportunity;
export type InsertClassified = NewClassified;
export type InsertConversation = NewConversation;
export type InsertParticipant = NewParticipant;
export type InsertMessage = NewMessage;
export type InsertReport = NewReport;
export type InsertUsage = NewUsage;
export type InsertAnalyticsEvent = NewAnalyticsEvent;
export type InsertSubscription = NewSubscription;
