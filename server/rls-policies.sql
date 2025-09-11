-- Row Level Security Policies for Community Platform
-- This file implements comprehensive RLS policies for all user-facing tables

-- Enable RLS on all user-facing tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifieds ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID from session
CREATE OR REPLACE FUNCTION current_user_id() RETURNS text AS $$
  SELECT COALESCE(current_setting('app.user_id', true), '');
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user is admin/moderator
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = current_user_id() 
    AND (users.badges @> '["admin"]' OR users.badges @> '["moderator"]')
  );
$$ LANGUAGE SQL STABLE;

-- USERS TABLE POLICIES
-- Users can view all public profiles but only edit their own
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (
    privacy_settings->>'profile' = 'public' 
    OR id = current_user_id()
    OR is_admin()
  );

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (id = current_user_id());

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (id = current_user_id() OR is_admin())
  WITH CHECK (id = current_user_id() OR is_admin());

CREATE POLICY "users_delete_policy" ON users
  FOR DELETE USING (id = current_user_id() OR is_admin());

-- BUSINESSES TABLE POLICIES  
-- Public view for published businesses, owners can manage their own
CREATE POLICY "businesses_select_policy" ON businesses
  FOR SELECT USING (true); -- All businesses visible for directory

CREATE POLICY "businesses_insert_policy" ON businesses
  FOR INSERT WITH CHECK (owner_id = current_user_id());

CREATE POLICY "businesses_update_policy" ON businesses
  FOR UPDATE USING (owner_id = current_user_id() OR is_admin())
  WITH CHECK (owner_id = current_user_id() OR is_admin());

CREATE POLICY "businesses_delete_policy" ON businesses
  FOR DELETE USING (owner_id = current_user_id() OR is_admin());

-- EVENTS TABLE POLICIES
-- Public events visible to all, private to members only, organizers manage own
CREATE POLICY "events_select_policy" ON events
  FOR SELECT USING (
    is_public = true 
    OR organizer_id = current_user_id()
    OR is_admin()
  );

CREATE POLICY "events_insert_policy" ON events
  FOR INSERT WITH CHECK (organizer_id = current_user_id());

CREATE POLICY "events_update_policy" ON events
  FOR UPDATE USING (organizer_id = current_user_id() OR is_admin())
  WITH CHECK (organizer_id = current_user_id() OR is_admin());

CREATE POLICY "events_delete_policy" ON events
  FOR DELETE USING (organizer_id = current_user_id() OR is_admin());

-- EVENT RSVPS POLICIES
-- Users can only view/manage their own RSVPs, event organizers can view all
CREATE POLICY "event_rsvps_select_policy" ON event_rsvps
  FOR SELECT USING (
    user_id = current_user_id()
    OR EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = current_user_id())
    OR is_admin()
  );

CREATE POLICY "event_rsvps_insert_policy" ON event_rsvps
  FOR INSERT WITH CHECK (user_id = current_user_id());

CREATE POLICY "event_rsvps_update_policy" ON event_rsvps
  FOR UPDATE USING (user_id = current_user_id() OR is_admin())
  WITH CHECK (user_id = current_user_id() OR is_admin());

CREATE POLICY "event_rsvps_delete_policy" ON event_rsvps
  FOR DELETE USING (user_id = current_user_id() OR is_admin());

-- REVIEWS POLICIES
-- Public view for approved reviews, authors manage own reviews
CREATE POLICY "reviews_select_policy" ON reviews
  FOR SELECT USING (
    status = 'approved'
    OR author_id = current_user_id()
    OR is_admin()
  );

CREATE POLICY "reviews_insert_policy" ON reviews
  FOR INSERT WITH CHECK (author_id = current_user_id());

CREATE POLICY "reviews_update_policy" ON reviews
  FOR UPDATE USING (author_id = current_user_id() OR is_admin())
  WITH CHECK (author_id = current_user_id() OR is_admin());

CREATE POLICY "reviews_delete_policy" ON reviews
  FOR DELETE USING (author_id = current_user_id() OR is_admin());

-- ANNOUNCEMENTS POLICIES
-- Published announcements visible to all, authors manage drafts
CREATE POLICY "announcements_select_policy" ON announcements
  FOR SELECT USING (
    status = 'published'
    OR author_id = current_user_id()
    OR is_admin()
  );

CREATE POLICY "announcements_insert_policy" ON announcements
  FOR INSERT WITH CHECK (author_id = current_user_id());

CREATE POLICY "announcements_update_policy" ON announcements
  FOR UPDATE USING (author_id = current_user_id() OR is_admin())
  WITH CHECK (author_id = current_user_id() OR is_admin());

CREATE POLICY "announcements_delete_policy" ON announcements
  FOR DELETE USING (author_id = current_user_id() OR is_admin());

-- CLASSIFIEDS POLICIES
-- Published listings visible to all, owners manage their own
CREATE POLICY "classifieds_select_policy" ON classifieds
  FOR SELECT USING (
    status = 'published'
    OR owner_id = current_user_id()
    OR is_admin()
  );

CREATE POLICY "classifieds_insert_policy" ON classifieds
  FOR INSERT WITH CHECK (owner_id = current_user_id());

CREATE POLICY "classifieds_update_policy" ON classifieds
  FOR UPDATE USING (owner_id = current_user_id() OR is_admin())
  WITH CHECK (owner_id = current_user_id() OR is_admin());

CREATE POLICY "classifieds_delete_policy" ON classifieds
  FOR DELETE USING (owner_id = current_user_id() OR is_admin());

-- MESSAGE THREAD POLICIES  
-- Only participants can access thread messages
CREATE POLICY "message_threads_select_policy" ON message_threads
  FOR SELECT USING (
    participant_ids ? current_user_id()
    OR is_admin()
  );

CREATE POLICY "message_threads_insert_policy" ON message_threads
  FOR INSERT WITH CHECK (participant_ids ? current_user_id());

CREATE POLICY "message_threads_update_policy" ON message_threads
  FOR UPDATE USING (participant_ids ? current_user_id() OR is_admin())
  WITH CHECK (participant_ids ? current_user_id() OR is_admin());

-- MESSAGES POLICIES
-- Only thread participants can access messages
CREATE POLICY "messages_select_policy" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM message_threads mt 
      WHERE mt.id = thread_id 
      AND (mt.participant_ids ? current_user_id() OR is_admin())
    )
  );

CREATE POLICY "messages_insert_policy" ON messages
  FOR INSERT WITH CHECK (
    sender_id = current_user_id()
    AND EXISTS (
      SELECT 1 FROM message_threads mt 
      WHERE mt.id = thread_id 
      AND mt.participant_ids ? current_user_id()
    )
  );

CREATE POLICY "messages_update_policy" ON messages
  FOR UPDATE USING (sender_id = current_user_id() OR is_admin())
  WITH CHECK (sender_id = current_user_id() OR is_admin());

-- SERVICE PROVIDERS POLICIES
-- Public view for verified providers, owners manage own profiles
CREATE POLICY "service_providers_select_policy" ON service_providers
  FOR SELECT USING (
    is_verified = true
    OR user_id = current_user_id()
    OR is_admin()
  );

CREATE POLICY "service_providers_insert_policy" ON service_providers
  FOR INSERT WITH CHECK (user_id = current_user_id());

CREATE POLICY "service_providers_update_policy" ON service_providers
  FOR UPDATE USING (user_id = current_user_id() OR is_admin())
  WITH CHECK (user_id = current_user_id() OR is_admin());

CREATE POLICY "service_providers_delete_policy" ON service_providers
  FOR DELETE USING (user_id = current_user_id() OR is_admin());

-- REPORTS POLICIES
-- Reporters can view their own reports, admins see all
CREATE POLICY "reports_select_policy" ON reports
  FOR SELECT USING (
    reporter_id = current_user_id()
    OR is_admin()
  );

CREATE POLICY "reports_insert_policy" ON reports
  FOR INSERT WITH CHECK (reporter_id = current_user_id());

CREATE POLICY "reports_update_policy" ON reports
  FOR UPDATE USING (is_admin()) -- Only admins can update reports
  WITH CHECK (is_admin());

CREATE POLICY "reports_delete_policy" ON reports
  FOR DELETE USING (is_admin());

-- Grant necessary permissions for web user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO web_anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO web_anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO web_anon;