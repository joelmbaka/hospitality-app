-- Seed coastal properties in Kenya
-- 1. Insert properties
INSERT INTO properties (name, type, description, location, address, contact_info)
VALUES
  (
    'Diani Beach Resort',
    'resort',
    'Beachfront resort with ocean-view rooms and water-sport facilities',
    '-4.3170,39.5820',                                    -- lat,long
    '{"street":"Diani Beach Rd","city":"Ukunda","county":"Kwale","country":"Kenya"}',
    '{"phone":"+254-713-000001","email":"info@dianiresort.ke"}'
  ),
  (
    'Watamu Ocean View',
    'hotel',
    'Boutique hotel overlooking the Indian Ocean and Watamu Marine Park',
    '-3.3725,40.0020',
    '{"street":"Plot 23 Turtle Bay Rd","city":"Watamu","county":"Kilifi","country":"Kenya"}',
    '{"phone":"+254-715-000002","email":"reservations@watamuview.ke"}'
  ),
  (
    'Lamu Island Retreat',
    'lodging',
    'Traditional Swahili-style guesthouse on Lamu Island’s seafront',
    '-2.2727,40.9020',
    '{"street":"Seafront","city":"Lamu","county":"Lamu","country":"Kenya"}',
    '{"phone":"+254-720-000003","email":"stay@lamuretreat.ke"}'
  );

-- 2. Insert default service types for each property (accommodation & dining)
INSERT INTO service_types (property_id, name, description)
SELECT id, 'accommodation', 'Guest rooms & suites'
FROM properties
WHERE name IN ('Diani Beach Resort','Watamu Ocean View','Lamu Island Retreat');

INSERT INTO service_types (property_id, name, description)
SELECT id, 'dining', 'On-site restaurants & bars'
FROM properties
WHERE name IN ('Diani Beach Resort','Watamu Ocean View','Lamu Island Retreat');