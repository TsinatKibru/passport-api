-- ============================================================================
-- DATABASE STATUS CHECK REPORT
-- Generated: 2026-07-12
-- Purpose: Comprehensive database health and consistency verification
-- ============================================================================

\echo '============================================================================'
\echo 'PASSPORT TRACK SYSTEM - DATABASE STATUS REPORT'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- 1. BOX STATUS SUMMARY
-- ============================================================================
\echo '1. BOX STATUS SUMMARY'
\echo '--------------------'

SELECT 
  status,
  COUNT(*) as total_boxes,
  ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) as percentage,
  SUM(capacity) as total_capacity,
  SUM("occupiedCount") as total_occupied,
  SUM(capacity - "occupiedCount") as total_vacant
FROM movable_boxes
GROUP BY status
ORDER BY 
  CASE status 
    WHEN 'ACTIVE' THEN 1 
    WHEN 'FULL' THEN 2 
    WHEN 'INACTIVE' THEN 3 
  END;

\echo ''

-- ============================================================================
-- 2. BOX CONSISTENCY CHECKS
-- ============================================================================
\echo '2. BOX CONSISTENCY CHECKS'
\echo '-------------------------'

-- Check 1: Boxes without slots that are not INACTIVE
\echo 'Check 1: Boxes without slots that are not INACTIVE (should be 0):'
SELECT COUNT(*) as inconsistent_boxes
FROM movable_boxes
WHERE "slotId" IS NULL AND status != 'INACTIVE';

-- Check 2: Boxes with slots and space that are INACTIVE
\echo 'Check 2: Boxes with slots and space that are INACTIVE (should be 0):'
SELECT COUNT(*) as inconsistent_boxes
FROM movable_boxes
WHERE "slotId" IS NOT NULL 
  AND "occupiedCount" < capacity 
  AND status = 'INACTIVE';

-- Check 3: Boxes at capacity that are not FULL
\echo 'Check 3: Boxes at capacity that are not FULL (should be 0):'
SELECT COUNT(*) as inconsistent_boxes
FROM movable_boxes
WHERE "occupiedCount" >= capacity AND status != 'FULL';

-- Check 4: Boxes marked FULL with vacant space
\echo 'Check 4: Boxes marked FULL with vacant space (should be 0):'
SELECT COUNT(*) as inconsistent_boxes
FROM movable_boxes
WHERE "occupiedCount" < capacity AND status = 'FULL';

\echo ''

-- ============================================================================
-- 3. PASSPORT STATUS SUMMARY
-- ============================================================================
\echo '3. PASSPORT STATUS SUMMARY'
\echo '--------------------------'

SELECT 
  status,
  COUNT(*) as total_passports,
  ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) as percentage
FROM passports
GROUP BY status
ORDER BY 
  CASE status 
    WHEN 'IN_BOX' THEN 1 
    WHEN 'ISSUED' THEN 2 
  END;

\echo ''

-- ============================================================================
-- 4. PASSPORT CONSISTENCY CHECKS
-- ============================================================================
\echo '4. PASSPORT CONSISTENCY CHECKS'
\echo '-------------------------------'

-- Check 1: Passports marked IN_BOX without a box assignment
\echo 'Check 1: Passports IN_BOX without box assignment (should be 0):'
SELECT COUNT(*) as inconsistent_passports
FROM passports
WHERE status = 'IN_BOX' AND "boxId" IS NULL;

-- Check 2: Passports marked ISSUED with a box assignment
\echo 'Check 2: Passports ISSUED with box assignment (should be 0):'
SELECT COUNT(*) as inconsistent_passports
FROM passports
WHERE status = 'ISSUED' AND "boxId" IS NOT NULL;

\echo ''

-- ============================================================================
-- 5. LOCATION HIERARCHY SUMMARY
-- ============================================================================
\echo '5. LOCATION HIERARCHY SUMMARY'
\echo '-----------------------------'

SELECT 
  (SELECT COUNT(*) FROM rooms) as total_rooms,
  (SELECT COUNT(*) FROM shelves) as total_shelves,
  (SELECT COUNT(*) FROM rows) as total_rows,
  (SELECT COUNT(*) FROM slots) as total_slots;

\echo ''

-- ============================================================================
-- 6. CAPACITY UTILIZATION
-- ============================================================================
\echo '6. CAPACITY UTILIZATION'
\echo '-----------------------'

SELECT 
  SUM(capacity) as total_capacity,
  SUM("occupiedCount") as total_occupied,
  SUM(capacity - "occupiedCount") as total_vacant,
  ROUND(SUM("occupiedCount") * 100.0 / NULLIF(SUM(capacity), 0), 2) as occupancy_rate_percent
FROM movable_boxes;

\echo ''

-- ============================================================================
-- 7. TOP 10 MOST OCCUPIED BOXES
-- ============================================================================
\echo '7. TOP 10 MOST OCCUPIED BOXES'
\echo '------------------------------'

SELECT 
  label,
  "qrCode",
  status,
  "occupiedCount",
  capacity,
  (capacity - "occupiedCount") as vacant,
  ROUND("occupiedCount" * 100.0 / capacity, 2) as occupancy_percent
FROM movable_boxes
WHERE "occupiedCount" > 0
ORDER BY "occupiedCount" DESC, label
LIMIT 10;

\echo ''

-- ============================================================================
-- 8. BOXES WITH ISSUES (if any)
-- ============================================================================
\echo '8. BOXES WITH POTENTIAL ISSUES'
\echo '-------------------------------'

SELECT 
  label,
  "qrCode",
  status,
  "occupiedCount",
  capacity,
  "slotId",
  CASE 
    WHEN "slotId" IS NULL AND status != 'INACTIVE' THEN 'No slot but not INACTIVE'
    WHEN "slotId" IS NOT NULL AND "occupiedCount" < capacity AND status = 'INACTIVE' THEN 'Has slot and space but INACTIVE'
    WHEN "occupiedCount" >= capacity AND status != 'FULL' THEN 'At capacity but not FULL'
    WHEN "occupiedCount" < capacity AND status = 'FULL' THEN 'Has space but marked FULL'
    ELSE 'OK'
  END as issue
FROM movable_boxes
WHERE 
  ("slotId" IS NULL AND status != 'INACTIVE')
  OR ("slotId" IS NOT NULL AND "occupiedCount" < capacity AND status = 'INACTIVE')
  OR ("occupiedCount" >= capacity AND status != 'FULL')
  OR ("occupiedCount" < capacity AND status = 'FULL')
LIMIT 20;

\echo ''

-- ============================================================================
-- 9. RECENT MOVEMENT LOGS
-- ============================================================================
\echo '9. RECENT MOVEMENT LOGS (Last 10)'
\echo '----------------------------------'

SELECT 
  action,
  "fromLocation",
  "toLocation",
  "createdAt",
  COALESCE(notes, '-') as notes
FROM movement_logs
ORDER BY "createdAt" DESC
LIMIT 10;

\echo ''

-- ============================================================================
-- 10. MIGRATION HISTORY
-- ============================================================================
\echo '10. APPLIED MIGRATIONS'
\echo '----------------------'

SELECT 
  migration_name,
  finished_at,
  CASE 
    WHEN rolled_back_at IS NULL THEN 'Applied'
    ELSE 'Rolled Back'
  END as status
FROM _prisma_migrations
ORDER BY finished_at DESC;

\echo ''
\echo '============================================================================'
\echo 'DATABASE STATUS CHECK COMPLETE'
\echo '============================================================================'
