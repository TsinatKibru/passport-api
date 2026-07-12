/**
 * Box Status Computation Utility
 * 
 * Single source of truth for box status logic.
 * Used across all services to ensure consistency.
 * 
 * Business Rules:
 * - INACTIVE: Box is not assigned to any slot (no physical location)
 * - FULL: Box is at maximum capacity (cannot accept more passports)
 * - ACTIVE: Box has a slot and has available space
 */

export type BoxStatus = 'ACTIVE' | 'FULL' | 'INACTIVE';

/**
 * Compute the correct box status based on slot assignment and capacity.
 * 
 * @param slotId - Current slot ID (null if unassigned)
 * @param occupiedCount - Number of passports currently in the box
 * @param capacity - Maximum capacity of the box
 * @returns The computed box status
 * 
 * @example
 * computeBoxStatus(null, 0, 10) // 'INACTIVE' - no slot
 * computeBoxStatus('slot-123', 10, 10) // 'FULL' - at capacity
 * computeBoxStatus('slot-123', 5, 10) // 'ACTIVE' - has space
 */
export function computeBoxStatus(
  slotId: string | null | undefined,
  occupiedCount: number,
  capacity: number,
): BoxStatus {
  // Rule 1: No slot = INACTIVE (not placed in physical location)
  if (!slotId) {
    return 'INACTIVE';
  }

  // Rule 2: At capacity = FULL (cannot accept more passports)
  if (occupiedCount >= capacity) {
    return 'FULL';
  }

  // Rule 3: Has slot and space = ACTIVE (ready to receive passports)
  return 'ACTIVE';
}
