CREATE TABLE IF NOT EXISTS garbage_missed_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward TEXT NOT NULL,
  reported_date DATE NOT NULL,
  aadhaar_last4 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ward, reported_date, aadhaar_last4)
);

DELETE FROM garbage_schedules
WHERE truck_id IN (
  SELECT id
  FROM garbage_trucks
  WHERE ward IN (
    'Gandhi Nagar',
    'Bus Stand Area',
    'Kuvempu Nagar',
    'Ashoka Nagar',
    'Vidyanagar',
    'Shivapura',
    'Mandya Town',
    'Kasaba',
    'Doddakere'
  )
);

DELETE FROM garbage_trucks
WHERE ward IN (
  'Gandhi Nagar',
  'Bus Stand Area',
  'Kuvempu Nagar',
  'Ashoka Nagar',
  'Vidyanagar',
  'Shivapura',
  'Mandya Town',
  'Kasaba',
  'Doddakere'
);

WITH seeded_trucks AS (
  INSERT INTO garbage_trucks (name, driver_name, phone, ward, is_active)
  VALUES
    ('KA-11-GC-101', 'Ramesh', '9000000001', 'Gandhi Nagar', true),
    ('KA-11-GC-102', 'Suresh', '9000000002', 'Bus Stand Area', true),
    ('KA-11-GC-103', 'Mahesh', '9000000003', 'Kuvempu Nagar', true),
    ('KA-11-GC-104', 'Prakash', '9000000004', 'Ashoka Nagar', true),
    ('KA-11-GC-105', 'Venkatesh', '9000000005', 'Vidyanagar', true),
    ('KA-11-GC-106', 'Ravi', '9000000006', 'Shivapura', true),
    ('KA-11-GC-107', 'Kiran', '9000000007', 'Mandya Town', true),
    ('KA-11-GC-108', 'Manjunath', '9000000008', 'Kasaba', true),
    ('KA-11-GC-109', 'Lokesh', '9000000009', 'Doddakere', true)
  RETURNING id, ward
)
INSERT INTO garbage_schedules (truck_id, ward, day_of_week, visit_time, notes)
SELECT
  st.id,
  st.ward,
  seeded.day_of_week,
  seeded.visit_time,
  seeded.notes
FROM seeded_trucks st
JOIN (
  VALUES
    ('Gandhi Nagar', 1, TIME '06:30', 'Morning collection round'),
    ('Gandhi Nagar', 3, TIME '06:30', 'Morning collection round'),
    ('Gandhi Nagar', 6, TIME '06:30', 'Morning collection round'),
    ('Bus Stand Area', 2, TIME '17:30', 'Evening collection round'),
    ('Bus Stand Area', 4, TIME '17:30', 'Evening collection round'),
    ('Bus Stand Area', 6, TIME '17:30', 'Evening collection round'),
    ('Kuvempu Nagar', 1, TIME '07:00', 'Morning collection round'),
    ('Kuvempu Nagar', 4, TIME '07:00', 'Morning collection round'),
    ('Ashoka Nagar', 3, TIME '18:00', 'Evening collection round'),
    ('Ashoka Nagar', 5, TIME '18:00', 'Evening collection round'),
    ('Vidyanagar', 2, TIME '06:00', 'Morning collection round'),
    ('Vidyanagar', 5, TIME '06:00', 'Morning collection round'),
    ('Vidyanagar', 0, TIME '06:00', 'Morning collection round'),
    ('Shivapura', 1, TIME '17:00', 'Evening collection round'),
    ('Shivapura', 3, TIME '17:00', 'Evening collection round'),
    ('Shivapura', 5, TIME '17:00', 'Evening collection round'),
    ('Mandya Town', 2, TIME '06:30', 'Morning collection round'),
    ('Mandya Town', 4, TIME '06:30', 'Morning collection round'),
    ('Kasaba', 3, TIME '07:30', 'Morning collection round'),
    ('Kasaba', 6, TIME '07:30', 'Morning collection round'),
    ('Doddakere', 4, TIME '17:30', 'Evening collection round'),
    ('Doddakere', 0, TIME '17:30', 'Evening collection round')
) AS seeded(ward, day_of_week, visit_time, notes)
  ON seeded.ward = st.ward;
