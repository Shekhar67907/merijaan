-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prescription_no TEXT UNIQUE NOT NULL,
    reference_no TEXT,
    class TEXT,
    prescribed_by TEXT NOT NULL,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    title TEXT,
    age TEXT,
    gender TEXT,
    customer_code TEXT,
    birth_day DATE,
    marriage_anniversary DATE,
    address TEXT,
    city TEXT,
    state TEXT,
    pin_code TEXT,
    phone_landline TEXT,
    mobile_no TEXT,
    email TEXT,
    ipd TEXT,
    retest_after DATE,
    others TEXT,
    balance_lens BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Eye prescriptions table
CREATE TABLE IF NOT EXISTS eye_prescriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    eye_type TEXT NOT NULL,
    vision_type TEXT NOT NULL,
    sph TEXT,
    cyl TEXT,
    ax TEXT,
    add_power TEXT,
    vn TEXT,
    rpd TEXT,
    lpd TEXT,
    spherical_equivalent TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Prescription remarks table
CREATE TABLE IF NOT EXISTS prescription_remarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    for_constant_use BOOLEAN DEFAULT FALSE,
    for_distance_vision_only BOOLEAN DEFAULT FALSE,
    for_near_vision_only BOOLEAN DEFAULT FALSE,
    separate_glasses BOOLEAN DEFAULT FALSE,
    bi_focal_lenses BOOLEAN DEFAULT FALSE,
    progressive_lenses BOOLEAN DEFAULT FALSE,
    anti_reflection_lenses BOOLEAN DEFAULT FALSE,
    anti_radiation_lenses BOOLEAN DEFAULT FALSE,
    under_corrected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescription_no ON prescriptions(prescription_no);
CREATE INDEX IF NOT EXISTS idx_prescriptions_reference_no ON prescriptions(reference_no);
CREATE INDEX IF NOT EXISTS idx_prescriptions_name ON prescriptions(name);
CREATE INDEX IF NOT EXISTS idx_prescriptions_mobile_no ON prescriptions(mobile_no);
CREATE INDEX IF NOT EXISTS idx_eye_prescriptions_prescription_id ON eye_prescriptions(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_remarks_prescription_id ON prescription_remarks(prescription_id);

-- Enable RLS but make it permissive for testing
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE eye_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_remarks ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for testing
CREATE POLICY "Allow all operations on prescriptions"
ON prescriptions FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on eye_prescriptions"
ON eye_prescriptions FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on prescription_remarks"
ON prescription_remarks FOR ALL
TO public
USING (true)
WITH CHECK (true); 