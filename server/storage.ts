// Storage implementation for Community Platform
// Using integration blueprints: javascript_log_in_with_replit, javascript_database

import {
  users,
  businesses,
  service_providers,
  events,
  event_rsvps,
  announcements,
  opportunities,
  classifieds,
  message_threads,
  messages,
  reviews,
  community_groups,
  reports,
  type User,
  type InsertUser,
  type Business,
  type InsertBusiness,
  type ServiceProvider,
  type Event,
  type InsertEvent,
} from "@shared/schema";
import { db, setUserSession, createSessionDb } from "./db";
import { eq, and, ilike, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (MANDATORY for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;
  
  // Business Directory operations
  getBusinesses(filters?: {
    category?: string;
    location?: string;
    verified?: boolean;
    tier?: string;
  }): Promise<Business[]>;
  getBusiness(id: string): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, updates: Partial<InsertBusiness>): Promise<Business>;
  
  // Service Provider operations
  getServiceProviders(filters?: {
    services?: string[];
    location?: string;
    radius?: number;
  }): Promise<ServiceProvider[]>;
  getServiceProvider(id: string): Promise<ServiceProvider | undefined>;
  createServiceProvider(provider: Partial<ServiceProvider>): Promise<ServiceProvider>;
  
  // Event operations
  getEvents(filters?: {
    category?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  rsvpToEvent(eventId: string, userId: string, status: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private userId: string | null = null;
  
  constructor(userId: string | null = null) {
    this.userId = userId;
  }
  
  // Set current user context for RLS policies
  private async ensureUserContext() {
    if (this.userId) {
      await setUserSession(this.userId);
    }
  }
  
  // User operations (MANDATORY for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    await this.ensureUserContext();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    await this.ensureUserContext();
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updated_at: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Business Directory operations
  async getBusinesses(filters?: {
    category?: string;
    location?: string;
    verified?: boolean;
    tier?: string;
  }): Promise<Business[]> {
    await this.ensureUserContext();
    
    const conditions = [];
    if (filters?.category) {
      conditions.push(eq(businesses.category, filters.category));
    }
    if (filters?.verified !== undefined) {
      conditions.push(eq(businesses.isVerified, filters.verified));
    }
    if (filters?.tier) {
      conditions.push(eq(businesses.subscriptionTier, filters.tier as any));
    }
    if (filters?.location) {
      conditions.push(ilike(businesses.address, `%${filters.location}%`));
    }
    
    let query = db.select().from(businesses);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }

  async getBusiness(id: string): Promise<Business | undefined> {
    await this.ensureUserContext();
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    await this.ensureUserContext();
    const [newBusiness] = await db
      .insert(businesses)
      .values(business)
      .returning();
    return newBusiness;
  }

  async updateBusiness(id: string, updates: Partial<InsertBusiness>): Promise<Business> {
    await this.ensureUserContext();
    const [updatedBusiness] = await db
      .update(businesses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning();
    return updatedBusiness;
  }

  // Service Provider operations
  async getServiceProviders(filters?: {
    services?: string[];
    location?: string;
    radius?: number;
  }): Promise<ServiceProvider[]> {
    await this.ensureUserContext();
    
    const conditions = [];
    if (filters?.location) {
      conditions.push(ilike(service_providers.base_location, `%${filters.location}%`));
    }
    
    let query = db.select().from(service_providers);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }

  async getServiceProvider(id: string): Promise<ServiceProvider | undefined> {
    await this.ensureUserContext();
    const [provider] = await db.select().from(service_providers).where(eq(service_providers.id, id));
    return provider;
  }

  async createServiceProvider(provider: Partial<ServiceProvider>): Promise<ServiceProvider> {
    await this.ensureUserContext();
    const [newProvider] = await db
      .insert(service_providers)
      .values(provider)
      .returning();
    return newProvider;
  }

  // Event operations
  async getEvents(filters?: {
    category?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Event[]> {
    await this.ensureUserContext();
    
    const conditions = [];
    if (filters?.category) {
      conditions.push(eq(events.category, filters.category));
    }
    if (filters?.startDate) {
      conditions.push(sql`${events.startDateTime} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${events.startDateTime} <= ${filters.endDate}`);
    }
    
    let query = db.select().from(events);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }

  async getEvent(id: string): Promise<Event | undefined> {
    await this.ensureUserContext();
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    await this.ensureUserContext();
    const [newEvent] = await db
      .insert(events)
      .values(event)
      .returning();
    return newEvent;
  }

  async rsvpToEvent(eventId: string, userId: string, status: string): Promise<void> {
    await this.ensureUserContext();
    await db
      .insert(event_rsvps)
      .values({
        eventId,
        userId,
        status,
      })
      .onConflictDoUpdate({
        target: [event_rsvps.event_id, event_rsvps.user_id],
        set: { status },
      });
  }
}

export const storage = new DatabaseStorage();

// Factory function to create storage with user context
export function createStorageWithUser(userId: string | null): DatabaseStorage {
  return new DatabaseStorage(userId);
}