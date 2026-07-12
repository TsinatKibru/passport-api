/**
 * Location Path Utility
 * 
 * Single source of truth for building human-readable location paths.
 * Used across all services to ensure consistent formatting.
 */

/**
 * Slot with all nested relations needed for location path
 */
interface SlotWithRelations {
  name: string;
  row: {
    name: string;
    shelf: {
      name: string;
      room: {
        name: string;
      };
    };
  };
}

/**
 * Build a human-readable location path from a slot with nested relations.
 * 
 * Format: "Room Name / Shelf Name / Row Name / Slot Name"
 * 
 * @param slot - Slot object with nested room, shelf, and row relations
 * @returns Formatted location string
 * 
 * @example
 * buildLocationPath(slot) // "Room A / Shelf 01 / Row A / Slot 1"
 * buildLocationPath(null) // "Unassigned"
 * buildLocationPath(undefined) // "Unassigned"
 */
export function buildLocationPath(slot: SlotWithRelations | null | undefined): string {
  if (!slot) {
    return 'Unassigned';
  }

  return `${slot.row.shelf.room.name} / ${slot.row.shelf.name} / ${slot.row.name} / ${slot.name}`;
}
