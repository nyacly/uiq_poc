// UiQ Community Platform - Database Schema
// Updated to match actual database structure exactly
// Using integration blueprints: javascript_log_in_with_replit, javascript_database

import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
  numeric,
} from "drizzle-orm/pg-core";

// Session storage table for Replit Auth (MANDATORY - do not modify)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums - Updated to match database exactly
export const businessPlanEnum = pgEnum("business_plan", ["Basic", "Standard", "Premium"]);
export const businessStatusEnum = pgEnum("business_status", ["draft", "review", "published"]);
export const membershipTierEnum = pgEnum("membership_tier", ["free", "plus", "family"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "inactive", "trialing", "past_due", "canceled", "unpaid"]);
export const announcementTypeEnum = pgEnum("announcement_type", ["general", "bereavement", "urgent", "celebration"]);
export const eventVisibilityEnum = pgEnum("event_visibility", ["public", "members", "private"]);
export const reportTypeEnum = pgEnum("report_type", ["spam", "inappropriate", "harassment", "fake", "other"]);
export const moderationStatusEnum = pgEnum("moderation_status", ["pending", "approved", "rejected", "flagged", "removed"]);
export const verificationType = pgEnum("verification_type", ["email", "phone", "manual"]);
export const auditActionEnum = pgEnum("audit_action", ["create", "update", "delete", "login", "logout", "verify", "flag", "moderate", "block", "unblock"]);
export const contentTypeEnum = pgEnum("content_type", ["business", "listing", "message", "review", "announcement", "event", "user_profile"]);
export const opportunityTypeEnum = pgEnum("opportunity_type", ["scholarship", "job", "grant", "program", "volunteer"]);
export const listingTypeEnum = pgEnum("listing_type", ["for_sale", "housing", "roommate", "service", "wanted"]);
export const categoryTypeEnum = pgEnum("category_type", ["business", "event", "listing", "announcement", "cause", "program", "opportunity"]);
export const causeStatusEnum = pgEnum("cause_status", ["draft", "active", "completed", "paused", "cancelled"]);
export const causeTypeEnum = pgEnum("cause_type", ["fundraising", "awareness", "volunteer", "donation", "community_support"]);
export const uploadStatusEnum = pgEnum("upload_status", ["uploading", "processing", "completed", "failed", "deleted"]);
export const uploadTypeEnum = pgEnum("upload_type", ["image", "document", "video", "audio", "other"]);

// Users - Updated to match database structure exactly
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  first_name: varchar("first_name"),
  last_name: varchar("last_name"),
  profile_image_url: varchar("profile_image_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  membership_tier: varchar("membership_tier").default("basic"),
  membership_expires_at: timestamp("membership_expires_at"),
  is_verified: boolean("is_verified").default(false),
  bio: text("bio"),
  location: varchar("location"),
  phone: varchar("phone"),
  privacy_settings: jsonb("privacy_settings").default('{"contact": "members", "profile": "public"}'),
  slug: varchar("slug").unique(),
  avatar: varchar("avatar"),
  whatsapp_link: varchar("whatsapp_link"),
  badges: jsonb("badges").default('[]'),
  name: varchar("name"),
}, (table) => [
  index("users_slug_idx").on(table.slug),
  index("users_email_idx").on(table.email),
]);

// Businesses - Updated to match database structure exactly
export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  owner_id: varchar("owner_id"),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  subscription_tier: businessPlanEnum("subscription_tier").default("Basic"),
  is_verified: boolean("is_verified").default(false),
  email: varchar("email"),
  phone: varchar("phone"),
  website: varchar("website"),
  address: text("address"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  hours: jsonb("hours"),
  images: jsonb("images"),
  tags: jsonb("tags"),
  average_rating: numeric("average_rating").default("0"),
  review_count: integer("review_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  slug: varchar("slug"),
  service_radius_km: integer("service_radius_km").default(10),
  certifications: jsonb("certifications").default('[]'),
  contact_methods: jsonb("contact_methods"),
}, (table) => [
  index("businesses_slug_idx").on(table.slug),
  index("businesses_owner_idx").on(table.owner_id),
  index("businesses_category_idx").on(table.category),
]);

// Events - Updated to match database structure exactly
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizer_id: varchar("organizer_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  start_date_time: timestamp("start_date_time").notNull(),
  end_date_time: timestamp("end_date_time"),
  location: varchar("location"),
  address: text("address"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  max_attendees: integer("max_attendees"),
  current_attendees: integer("current_attendees").default(0),
  is_public: boolean("is_public").default(true),
  requires_rsvp: boolean("requires_rsvp").default(true),
  image_url: varchar("image_url"),
  external_url: varchar("external_url"),
  tags: jsonb("tags"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  slug: varchar("slug"),
  price_cents: integer("price_cents").default(0),
  rsvp_limit: integer("rsvp_limit"),
  photos: jsonb("photos").default('[]'),
}, (table) => [
  index("events_slug_idx").on(table.slug),
  index("events_organizer_idx").on(table.organizer_id),
  index("events_start_idx").on(table.start_date_time),
]);

// Event RSVPs
export const event_rsvps = pgTable("event_rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  event_id: varchar("event_id").references(() => events.id).notNull(),
  user_id: varchar("user_id").references(() => users.id).notNull(),
  status: varchar("status").notNull().default("attending"),
  created_at: timestamp("created_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  business_id: varchar("business_id").references(() => businesses.id).notNull(),
  author_id: varchar("author_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  text: text("text"),
  photos: jsonb("photos").default('[]'),
  status: varchar("status").default("pending"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("reviews_business_idx").on(table.business_id),
  index("reviews_author_idx").on(table.author_id),
]);

// Announcements
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: announcementTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  slug: varchar("slug").unique().notNull(),
  body: text("body").notNull(),
  photos: jsonb("photos").default('[]'),
  author_id: varchar("author_id").references(() => users.id).notNull(),
  ceremony_timeline: jsonb("ceremony_timeline").default('[]'),
  contribution_mode: varchar("contribution_mode").default("linkout"),
  contribution_links: jsonb("contribution_links").default('[]'),
  status: businessStatusEnum("status").default("draft"),
  verified: boolean("verified").default(false),
  featured: boolean("featured").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("announcements_slug_idx").on(table.slug),
  index("announcements_type_idx").on(table.type),
  index("announcements_author_idx").on(table.author_id),
]);

// Programs
export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").unique().notNull(),
  org: varchar("org").notNull(),
  eligibility: text("eligibility"),
  deadline_at: timestamp("deadline_at"),
  apply_url: varchar("apply_url"),
  description: text("description"),
  tags: jsonb("tags").default('[]'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("programs_slug_idx").on(table.slug),
  index("programs_deadline_idx").on(table.deadline_at),
]);

// Opportunities
export const opportunities = pgTable("opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  type: opportunityTypeEnum("type").notNull(),
  location: varchar("location"),
  deadline_at: timestamp("deadline_at"),
  description: text("description").notNull(),
  apply_url: varchar("apply_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("opportunities_type_idx").on(table.type),
  index("opportunities_deadline_idx").on(table.deadline_at),
]);

// Classifieds - Updated to match database table name
export const classifieds = pgTable("classifieds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: listingTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  slug: varchar("slug").unique().notNull(),
  price_cents: integer("price_cents"),
  currency: varchar("currency").default("AUD"),
  condition: varchar("condition"),
  photos: jsonb("photos").default('[]'),
  description: text("description").notNull(),
  location: varchar("location"),
  geo: jsonb("geo"),
  owner_id: varchar("owner_id").references(() => users.id).notNull(),
  status: businessStatusEnum("status").default("published"),
  boosted_until: timestamp("boosted_until"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("classifieds_slug_idx").on(table.slug),
  index("classifieds_type_idx").on(table.type),
  index("classifieds_owner_idx").on(table.owner_id),
]);

// Pages
export const pages = pgTable("pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").unique().notNull(),
  body: text("body").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("pages_slug_idx").on(table.slug),
]);

// Service Providers
export const service_providers = pgTable("service_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").references(() => users.id).notNull(),
  business_name: varchar("business_name"),
  services: jsonb("services").notNull(),
  competence_tags: jsonb("competence_tags").notNull(),
  qualifications: jsonb("qualifications"),
  coverage_radius: integer("coverage_radius").default(10),
  base_location: varchar("base_location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  is_verified: boolean("is_verified").default(false),
  average_rating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  review_count: integer("review_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Message Threads
export const message_threads = pgTable("message_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant_ids: jsonb("participant_ids").notNull(),
  business_id: varchar("business_id").references(() => businesses.id),
  listing_id: varchar("listing_id").references(() => classifieds.id),
  subject: varchar("subject"),
  last_message_at: timestamp("last_message_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  thread_id: varchar("thread_id").references(() => message_threads.id).notNull(),
  sender_id: varchar("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  attachments: jsonb("attachments"),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

// Community Groups
export const community_groups = pgTable("community_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  whatsapp_invite_link: varchar("whatsapp_invite_link"),
  admin_id: varchar("admin_id").references(() => users.id).notNull(),
  member_count: integer("member_count").default(0),
  is_public: boolean("is_public").default(true),
  tags: jsonb("tags"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Reports
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporter_id: varchar("reporter_id").references(() => users.id).notNull(),
  reported_user_id: varchar("reported_user_id").references(() => users.id),
  reported_business_id: varchar("reported_business_id").references(() => businesses.id),
  reported_listing_id: varchar("reported_listing_id").references(() => classifieds.id),
  reported_message_id: varchar("reported_message_id").references(() => messages.id),
  reported_announcement_id: varchar("reported_announcement_id").references(() => announcements.id),
  reported_event_id: varchar("reported_event_id").references(() => events.id),
  reported_review_id: varchar("reported_review_id").references(() => reviews.id),
  type: reportTypeEnum("type").notNull(),
  description: text("description").notNull(),
  status: moderationStatusEnum("status").default("pending"),
  moderator_id: varchar("moderator_id").references(() => users.id),
  moderator_notes: text("moderator_notes"),
  moderator_action: varchar("moderator_action"),
  auto_flagged: boolean("auto_flagged").default(false),
  flagged_keywords: jsonb("flagged_keywords").default('[]'),
  evidence_urls: jsonb("evidence_urls").default('[]'),
  priority: varchar("priority").default("medium"),
  resolved_at: timestamp("resolved_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("reports_status_idx").on(table.status),
  index("reports_priority_idx").on(table.priority),
  index("reports_auto_flagged_idx").on(table.auto_flagged),
]);

// Subscription Plans
export const subscription_plans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").unique().notNull(),
  plan_type: varchar("plan_type").notNull(),
  description: text("description").notNull(),
  price_cents: integer("price_cents").notNull(),
  billing_period: varchar("billing_period").notNull().default("monthly"),
  currency: varchar("currency").notNull().default("AUD"),
  features: jsonb("features").notNull().default('[]'),
  is_popular: boolean("is_popular").default(false),
  is_active: boolean("is_active").default(true),
  display_order: integer("display_order").default(0),
  button_text: varchar("button_text").default("Get Started"),
  button_style: varchar("button_style").default("primary"),
  max_usage: jsonb("max_usage"),
  stripe_price_id: varchar("stripe_price_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("subscription_plans_slug_idx").on(table.slug),
  index("subscription_plans_type_idx").on(table.plan_type),
  index("subscription_plans_active_idx").on(table.is_active),
]);

// MISSING TABLES - Adding all missing tables from database

// Memberships - User membership management
export const memberships = pgTable("memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull(),
  tier: membershipTierEnum("tier").notNull(),
  status: varchar("status").notNull().default("active"),
  start_date: timestamp("start_date").defaultNow(),
  end_date: timestamp("end_date"),
  auto_renew: boolean("auto_renew").default(true),
  stripe_subscription_id: varchar("stripe_subscription_id"),
  granted_by: varchar("granted_by"),
  metadata: jsonb("metadata").default('{}'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("memberships_user_idx").on(table.user_id),
  index("memberships_tier_idx").on(table.tier),
  index("memberships_status_idx").on(table.status),
]);

// Business Subscriptions - Business subscription management
export const business_subscriptions = pgTable("business_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  business_id: varchar("business_id").notNull(),
  plan: businessPlanEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  start_date: timestamp("start_date").defaultNow(),
  end_date: timestamp("end_date"),
  auto_renew: boolean("auto_renew").default(true),
  stripe_subscription_id: varchar("stripe_subscription_id"),
  features: jsonb("features").default('[]'),
  limits: jsonb("limits").default('{}'),
  usage: jsonb("usage").default('{}'),
  last_billing_date: timestamp("last_billing_date"),
  next_billing_date: timestamp("next_billing_date"),
  metadata: jsonb("metadata").default('{}'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("business_subscriptions_business_idx").on(table.business_id),
  index("business_subscriptions_plan_idx").on(table.plan),
  index("business_subscriptions_status_idx").on(table.status),
]);

// Categories - Categorization system
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull(),
  type: categoryTypeEnum("type").notNull(),
  parent_id: varchar("parent_id"),
  description: text("description"),
  icon: varchar("icon"),
  color: varchar("color"),
  sort_order: integer("sort_order").default(0),
  is_active: boolean("is_active").default(true),
  is_system_category: boolean("is_system_category").default(false),
  metadata: jsonb("metadata").default('{}'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("categories_slug_idx").on(table.slug),
  index("categories_type_idx").on(table.type),
  index("categories_parent_idx").on(table.parent_id),
]);

// Causes - Fundraising/cause functionality
export const causes = pgTable("causes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull(),
  type: causeTypeEnum("type").notNull(),
  status: causeStatusEnum("status").default("draft"),
  description: text("description").notNull(),
  organizer: varchar("organizer").notNull(),
  organizer_id: varchar("organizer_id"),
  target_amount: integer("target_amount"),
  raised_amount: integer("raised_amount").default(0),
  currency: varchar("currency").default("AUD"),
  start_date: timestamp("start_date"),
  end_date: timestamp("end_date"),
  beneficiary: varchar("beneficiary"),
  photos: jsonb("photos").default('[]'),
  donation_url: varchar("donation_url"),
  update_feed: jsonb("update_feed").default('[]'),
  tags: jsonb("tags").default('[]'),
  featured: boolean("featured").default(false),
  verified: boolean("verified").default(false),
  total_supporters: integer("total_supporters").default(0),
  visibility: eventVisibilityEnum("visibility").default("public"),
  metadata: jsonb("metadata").default('{}'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("causes_slug_idx").on(table.slug),
  index("causes_type_idx").on(table.type),
  index("causes_status_idx").on(table.status),
  index("causes_organizer_idx").on(table.organizer_id),
]);

// Uploads - File management system
export const uploads = pgTable("uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  file_name: varchar("file_name").notNull(),
  original_name: varchar("original_name").notNull(),
  file_type: uploadTypeEnum("file_type").notNull(),
  mime_type: varchar("mime_type").notNull(),
  file_size: integer("file_size").notNull(),
  url: varchar("url").notNull(),
  thumbnail_url: varchar("thumbnail_url"),
  uploader_id: varchar("uploader_id").notNull(),
  related_type: varchar("related_type"),
  related_id: varchar("related_id"),
  status: uploadStatusEnum("status").default("uploading"),
  processed_at: timestamp("processed_at"),
  expires_at: timestamp("expires_at"),
  is_public: boolean("is_public").default(true),
  download_count: integer("download_count").default(0),
  metadata: jsonb("metadata").default('{}'),
  moderation_status: moderationStatusEnum("moderation_status").default("pending"),
  moderated_at: timestamp("moderated_at"),
  moderator_id: varchar("moderator_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("uploads_uploader_idx").on(table.uploader_id),
  index("uploads_type_idx").on(table.file_type),
  index("uploads_status_idx").on(table.status),
  index("uploads_related_idx").on(table.related_type, table.related_id),
]);

// Audit Logs - System audit trail
export const audit_logs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id"),
  action: auditActionEnum("action").notNull(),
  resource_type: contentTypeEnum("resource_type").notNull(),
  resource_id: varchar("resource_id"),
  details: jsonb("details").default('{}'),
  ip_address: varchar("ip_address"),
  user_agent: text("user_agent"),
  session_id: varchar("session_id"),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  index("audit_logs_user_idx").on(table.user_id),
  index("audit_logs_action_idx").on(table.action),
  index("audit_logs_resource_idx").on(table.resource_type, table.resource_id),
  index("audit_logs_created_idx").on(table.created_at),
]);

// Stripe Integration Tables

// Stripe Products
export const stripe_products = pgTable("stripe_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stripe_product_id: varchar("stripe_product_id").notNull().unique(),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(),
  tier: varchar("tier"),
  features: jsonb("features").default('[]'),
  is_active: boolean("is_active").default(true),
  display_order: integer("display_order").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("stripe_products_stripe_id_idx").on(table.stripe_product_id),
  index("stripe_products_type_idx").on(table.type),
]);

// Stripe Prices
export const stripe_prices = pgTable("stripe_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stripe_price_id: varchar("stripe_price_id").notNull().unique(),
  stripe_product_id: varchar("stripe_product_id").references(() => stripe_products.stripe_product_id).notNull(),
  amount: integer("amount").notNull(),
  currency: varchar("currency").default("aud"),
  interval: varchar("interval"),
  interval_count: integer("interval_count").default(1),
  trial_period_days: integer("trial_period_days"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("stripe_prices_stripe_id_idx").on(table.stripe_price_id),
  index("stripe_prices_product_idx").on(table.stripe_product_id),
]);

// Stripe Customers
export const stripe_customers = pgTable("stripe_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").references(() => users.id),
  business_id: varchar("business_id").references(() => businesses.id),
  stripe_customer_id: varchar("stripe_customer_id").notNull().unique(),
  email: varchar("email"),
  name: varchar("name"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("stripe_customers_stripe_id_idx").on(table.stripe_customer_id),
  index("stripe_customers_user_idx").on(table.user_id),
  index("stripe_customers_business_idx").on(table.business_id),
]);

// Stripe Subscriptions
export const stripe_subscriptions = pgTable("stripe_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stripe_subscription_id: varchar("stripe_subscription_id").notNull().unique(),
  stripe_customer_id: varchar("stripe_customer_id").references(() => stripe_customers.stripe_customer_id).notNull(),
  stripe_price_id: varchar("stripe_price_id").references(() => stripe_prices.stripe_price_id).notNull(),
  status: varchar("status").notNull(),
  current_period_start: timestamp("current_period_start"),
  current_period_end: timestamp("current_period_end"),
  cancel_at_period_end: boolean("cancel_at_period_end").default(false),
  canceled_at: timestamp("canceled_at"),
  trial_start: timestamp("trial_start"),
  trial_end: timestamp("trial_end"),
  metadata: jsonb("metadata").default('{}'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("stripe_subscriptions_stripe_id_idx").on(table.stripe_subscription_id),
  index("stripe_subscriptions_customer_idx").on(table.stripe_customer_id),
  index("stripe_subscriptions_status_idx").on(table.status),
]);

// Stripe Payments
export const stripe_payments = pgTable("stripe_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stripe_payment_intent_id: varchar("stripe_payment_intent_id").notNull().unique(),
  stripe_customer_id: varchar("stripe_customer_id").references(() => stripe_customers.stripe_customer_id),
  amount: integer("amount").notNull(),
  currency: varchar("currency").default("aud"),
  status: varchar("status").notNull(),
  payment_method_id: varchar("payment_method_id"),
  subscription_id: varchar("subscription_id").references(() => stripe_subscriptions.stripe_subscription_id),
  description: text("description"),
  receipt_url: varchar("receipt_url"),
  metadata: jsonb("metadata").default('{}'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("stripe_payments_intent_id_idx").on(table.stripe_payment_intent_id),
  index("stripe_payments_customer_idx").on(table.stripe_customer_id),
  index("stripe_payments_status_idx").on(table.status),
]);

// Stripe Webhook Events
export const stripe_webhook_events = pgTable("stripe_webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stripe_event_id: varchar("stripe_event_id").notNull().unique(),
  event_type: varchar("event_type").notNull(),
  processed: boolean("processed").default(false),
  processing_error: text("processing_error"),
  attempts: integer("attempts").default(0),
  event_data: jsonb("event_data").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  processed_at: timestamp("processed_at"),
}, (table) => [
  index("stripe_webhook_events_stripe_id_idx").on(table.stripe_event_id),
  index("stripe_webhook_events_type_idx").on(table.event_type),
  index("stripe_webhook_events_processed_idx").on(table.processed),
]);

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;
export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;
export type Classified = typeof classifieds.$inferSelect;
export type InsertClassified = typeof classifieds.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type InsertPage = typeof pages.$inferInsert;
export type ServiceProvider = typeof service_providers.$inferSelect;
export type MessageThread = typeof message_threads.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type CommunityGroup = typeof community_groups.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = typeof memberships.$inferInsert;
export type BusinessSubscription = typeof business_subscriptions.$inferSelect;
export type InsertBusinessSubscription = typeof business_subscriptions.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Cause = typeof causes.$inferSelect;
export type InsertCause = typeof causes.$inferInsert;
export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

// Export aliases for backward compatibility with existing imports
export const subscriptionPlans = subscription_plans;
export const eventRsvps = event_rsvps;
export const serviceProviders = service_providers;
export const messageThreads = message_threads;
export const communityGroups = community_groups;
export const auditLogs = audit_logs;
export const businessSubscriptions = business_subscriptions;
export const stripeProducts = stripe_products;
export const stripePrices = stripe_prices;
export const stripeCustomers = stripe_customers;
export const stripeSubscriptions = stripe_subscriptions;
export const stripePayments = stripe_payments;
export const stripeWebhookEvents = stripe_webhook_events;

// Additional type exports with camelCase names for backward compatibility
export type SubscriptionPlan = typeof subscription_plans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscription_plans.$inferInsert;