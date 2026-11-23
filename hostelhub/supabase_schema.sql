-- ==============================================================================
-- HostelHub – Supabase Database Schema & Cloud Storage Setup
-- ==============================================================================
-- Run this entire script in your Supabase Project -> SQL Editor to initialize:
-- 1. Tables: rooms, students, complaints
-- 2. Foreign key relations and constraints
-- 3. Row Level Security (RLS) policies
-- 4. Supabase Storage bucket for file attachments
-- 5. Seed data for immediate live testing
-- ==============================================================================

-- 1. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
    id TEXT PRIMARY KEY,
    room_number TEXT UNIQUE NOT NULL,
    floor INTEGER NOT NULL DEFAULT 1,
    room_type TEXT NOT NULL DEFAULT 'Single' CHECK (room_type IN ('Single', 'Double', 'Triple', 'Deluxe')),
    capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity >= 1),
    occupied_beds INTEGER NOT NULL DEFAULT 0 CHECK (occupied_beds >= 0),
    monthly_rent NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Full', 'Maintenance')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    room_number TEXT REFERENCES public.rooms(room_number) ON UPDATE CASCADE ON DELETE SET NULL,
    admission_date DATE DEFAULT CURRENT_DATE,
    emergency_contact TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. COMPLAINTS & MAINTENANCE TABLE
CREATE TABLE IF NOT EXISTS public.complaints (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other' CHECK (category IN ('Plumbing', 'Electrical', 'Internet', 'Cleaning', 'Furniture', 'Other')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    room_number TEXT,
    student_name TEXT,
    student_email TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Resolved')),
    attachment_url TEXT,
    resolution_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    resolved_at TIMESTAMPTZ
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated and anonymous users
CREATE POLICY "Allow public read access on rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow all mutations on rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow all mutations on students" ON public.students FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on complaints" ON public.complaints FOR SELECT USING (true);
CREATE POLICY "Allow all mutations on complaints" ON public.complaints FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- STORAGE BUCKET: hostel-attachments
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('hostel-attachments', 'hostel-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: Allow uploads and downloads from public
CREATE POLICY "Public Access for Hostel Attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'hostel-attachments');

CREATE POLICY "Public Upload for Hostel Attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hostel-attachments');

CREATE POLICY "Public Update for Hostel Attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hostel-attachments');

CREATE POLICY "Public Delete for Hostel Attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'hostel-attachments');

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================
INSERT INTO public.rooms (id, room_number, floor, room_type, capacity, occupied_beds, monthly_rent, status)
VALUES
    ('room-101', '101', 1, 'Single', 1, 1, 350.00, 'Full'),
    ('room-102', '102', 1, 'Double', 2, 2, 220.00, 'Full'),
    ('room-103', '103', 1, 'Triple', 3, 2, 160.00, 'Available'),
    ('room-201', '201', 2, 'Deluxe', 2, 1, 400.00, 'Available'),
    ('room-202', '202', 2, 'Double', 2, 0, 220.00, 'Available'),
    ('room-203', '203', 2, 'Single', 1, 0, 350.00, 'Maintenance')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.students (id, name, email, phone, room_number, admission_date, emergency_contact, status)
VALUES
    ('std-1', 'Ahmed Khan', 'ahmed.khan@student.edu', '+92 300 1234567', '101', '2025-09-01', 'Father (+92 301 9876543)', 'Active'),
    ('std-2', 'Fatima Ali', 'fatima.ali@student.edu', '+92 321 4567890', '102', '2025-09-03', 'Mother (+92 322 8765432)', 'Active'),
    ('std-3', 'Zain Malik', 'zain.malik@student.edu', '+92 333 7890123', '102', '2025-09-05', 'Brother (+92 334 6543210)', 'Active'),
    ('std-4', 'Sara Ahmed', 'sara.ahmed@student.edu', '+92 345 2345678', '103', '2025-09-10', 'Father (+92 346 5432109)', 'Active'),
    ('std-5', 'Bilal Tariq', 'bilal.tariq@student.edu', '+92 312 8765432', '103', '2025-09-12', 'Uncle (+92 313 4321098)', 'Active'),
    ('std-6', 'Alex Morgan', 'alex.morgan@hostelhub.com', '+1 555 0192834', '201', '2025-10-01', 'Parent (+1 555 0192835)', 'Active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.complaints (id, title, description, category, priority, room_number, student_name, student_email, status, attachment_url, resolution_notes)
VALUES
    ('comp-101', 'Bathroom water tap leaking continuously', 'The cold water tap in Room 102 bathroom has a persistent leak causing water waste and floor slipping hazard.', 'Plumbing', 'High', '102', 'Fatima Ali', 'fatima.ali@student.edu', 'In Progress', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80', 'Maintenance staff assigned. Replacement valve ordered.'),
    ('comp-102', 'Ceiling fan making loud grinding noise', 'Ceiling fan in Room 101 vibrates and produces high pitch noise when speed is set above level 2.', 'Electrical', 'Medium', '101', 'Ahmed Khan', 'ahmed.khan@student.edu', 'Pending', 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=800&q=80', ''),
    ('comp-103', 'Wi-Fi router dead in 2nd floor east wing', 'Students in Rooms 201-203 cannot connect to hostel high-speed internet. Access point LED is flashing red.', 'Internet', 'Urgent', '201', 'Alex Morgan', 'alex.morgan@hostelhub.com', 'Pending', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80', ''),
    ('comp-104', 'Study chair leg cracked and unstable', 'Wooden study desk chair broke near rear joint during study session.', 'Furniture', 'Low', '103', 'Bilal Tariq', 'bilal.tariq@student.edu', 'Resolved', 'https://images.unsplash.com/photo-1580481077195-c328ad4f4f7c?auto=format&fit=crop&w=800&q=80', 'Replaced with new ergonomic study chair from hostel inventory.')
ON CONFLICT (id) DO NOTHING;
