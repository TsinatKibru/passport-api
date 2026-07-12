-- Data Migration: Fix Box Status Consistency
-- Date: 2026-07-12
-- Purpose: Apply centralized status computation logic to existing data
-- Related: box-status.util.ts, CRITICAL_FIXES_PROGRESS.md Issue #1

-- ============================================================================
-- STEP 1: Fix boxes with no slot but marked as ACTIVE or FULL
-- ============================================================================
-- Business Rule: Boxes without a slot assignment MUST be INACTIVE
-- These boxes are either new or have been removed from storage

UPDATE movable_boxes 
SET status = 'INACTIVE', 
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slotId" IS NULL 
  AND status != 'INACTIVE';

-- ============================================================================
-- STEP 2: Fix boxes with slots and available space marked as INACTIVE
-- ============================================================================
-- Business Rule: Boxes with slots and vacant space MUST be ACTIVE
-- These boxes are ready to accept passports

UPDATE movable_boxes 
SET status = 'ACTIVE', 
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slotId" IS NOT NULL 
  AND "occupiedCount" < capacity 
  AND status = 'INACTIVE';

-- ============================================================================
-- STEP 3: Fix boxes at capacity not marked as FULL
-- ============================================================================
-- Business Rule: Boxes where occupiedCount >= capacity MUST be FULL
-- These boxes cannot accept more passports

UPDATE movable_boxes 
SET status = 'FULL', 
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "occupiedCount" >= capacity 
  AND status != 'FULL';

-- ============================================================================
-- STEP 4: Fix edge case - boxes marked as FULL but have vacant space
-- ============================================================================
-- Business Rule: Boxes with vacant space cannot be FULL
-- This handles any inconsistent FULL status assignments

UPDATE movable_boxes 
SET status = CASE 
    WHEN "slotId" IS NULL THEN 'INACTIVE'::"BoxStatus"
    ELSE 'ACTIVE'::"BoxStatus"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "occupiedCount" < capacity 
  AND status = 'FULL';

-- ============================================================================
-- VERIFICATION QUERIES (for logging/debugging)
-- ============================================================================
-- These SELECT statements show the results after migration
-- They don't modify data, just provide visibility

-- Summary by status
DO $$
DECLARE
  active_count INT;
  full_count INT;
  inactive_count INT;
  total_count INT;
BEGIN
  SELECT COUNT(*) INTO active_count FROM movable_boxes WHERE status = 'ACTIVE';
  SELECT COUNT(*) INTO full_count FROM movable_boxes WHERE status = 'FULL';
  SELECT COUNT(*) INTO inactive_count FROM movable_boxes WHERE status = 'INACTIVE';
  SELECT COUNT(*) INTO total_count FROM movable_boxes;
  
  RAISE NOTICE 'Migration Complete - Box Status Summary:';
  RAISE NOTICE '  ACTIVE: % boxes', active_count;
  RAISE NOTICE '  FULL: % boxes', full_count;
  RAISE NOTICE '  INACTIVE: % boxes', inactive_count;
  RAISE NOTICE '  TOTAL: % boxes', total_count;
END $$;