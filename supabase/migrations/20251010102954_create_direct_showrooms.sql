/*
  # Create Direct Showrooms Table

  1. New Tables
    - `direct_showrooms`
      - `id` (uuid, primary key) - Unique identifier for each showroom
      - `name` (text) - Showroom name
      - `code` (text, unique) - Unique showroom code for identification
      - `location` (text) - Physical location/address
      - `city` (text) - City where showroom is located
      - `contact_number` (text) - Primary contact number
      - `email` (text) - Showroom email address
      - `manager_id` (uuid) - Reference to the showroom manager user
      - `status` (text) - Status: active, inactive, suspended
      - `opening_hours` (jsonb) - Store opening hours
      - `target_sales` (numeric) - Monthly sales target
      - `metadata` (jsonb) - Additional showroom information
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `created_by` (uuid) - User who created the record
      
  2. Security
    - Enable RLS on `direct_showrooms` table
    - Add policies for:
      - Admins and MainDirector can read/write all showrooms
      - HeadOfOperations can read all showrooms
      - DirectShowroomManager can read only their assigned showroom
      - DSStaff can read only their assigned showroom
      
  3. Indexes
    - Index on `code` for fast lookups
    - Index on `manager_id` for manager-based queries
    - Index on `status` for filtering active showrooms
*/

-- Create direct_showrooms table
CREATE TABLE IF NOT EXISTS direct_showrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  location text NOT NULL,
  city text NOT NULL,
  contact_number text,
  email text,
  manager_id uuid,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  opening_hours jsonb DEFAULT '{"monday": "9:00-18:00", "tuesday": "9:00-18:00", "wednesday": "9:00-18:00", "thursday": "9:00-18:00", "friday": "9:00-18:00", "saturday": "9:00-18:00", "sunday": "closed"}'::jsonb,
  target_sales numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_direct_showrooms_code ON direct_showrooms(code);
CREATE INDEX IF NOT EXISTS idx_direct_showrooms_manager ON direct_showrooms(manager_id);
CREATE INDEX IF NOT EXISTS idx_direct_showrooms_status ON direct_showrooms(status);
CREATE INDEX IF NOT EXISTS idx_direct_showrooms_city ON direct_showrooms(city);

-- Enable RLS
ALTER TABLE direct_showrooms ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and MainDirector can read all showrooms
CREATE POLICY "Admins and directors can read all showrooms"
  ON direct_showrooms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND (
        raw_app_meta_data->>'role' = 'Admin' OR
        raw_app_meta_data->>'role' = 'MainDirector' OR
        raw_app_meta_data->>'role' = 'HeadOfOperations' OR
        raw_app_meta_data->>'role' = 'ReadOnlyAdmin'
      )
    )
  );

-- Policy: Admins and MainDirector can insert showrooms
CREATE POLICY "Admins and directors can insert showrooms"
  ON direct_showrooms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND (
        raw_app_meta_data->>'role' = 'Admin' OR
        raw_app_meta_data->>'role' = 'MainDirector'
      )
    )
  );

-- Policy: Admins and MainDirector can update showrooms
CREATE POLICY "Admins and directors can update showrooms"
  ON direct_showrooms
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND (
        raw_app_meta_data->>'role' = 'Admin' OR
        raw_app_meta_data->>'role' = 'MainDirector'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND (
        raw_app_meta_data->>'role' = 'Admin' OR
        raw_app_meta_data->>'role' = 'MainDirector'
      )
    )
  );

-- Policy: Showroom managers and staff can read their assigned showroom
CREATE POLICY "Showroom staff can read their showroom"
  ON direct_showrooms
  FOR SELECT
  TO authenticated
  USING (
    manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_app_meta_data->>'showroom_id' = direct_showrooms.id::text
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_direct_showrooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_direct_showrooms_updated_at ON direct_showrooms;
CREATE TRIGGER trigger_update_direct_showrooms_updated_at
  BEFORE UPDATE ON direct_showrooms
  FOR EACH ROW
  EXECUTE FUNCTION update_direct_showrooms_updated_at();
