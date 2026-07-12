-- Migration: Update Box Status Logic
-- Set boxes without slot assignment to INACTIVE status
-- Date: 2026-07-12

UPDATE movable_boxes 
SET status = 'INACTIVE' 
WHERE slot_id IS NULL 
AND status != 'FULL';

-- Output affected rows
SELECT 
  COUNT(*) as updated_boxes,
  'Boxes set to INACTIVE (no slot assigned)' as description
FROM movable_boxes 
WHERE slot_id IS NULL AND status = 'INACTIVE';
