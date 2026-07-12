import { buildLocationPath } from './location.util';

describe('buildLocationPath', () => {
  const mockSlot = {
    name: 'Slot 1',
    row: {
      name: 'Row A',
      shelf: {
        name: 'Shelf 01',
        room: {
          name: 'Room A',
        },
      },
    },
  };

  describe('valid slot', () => {
    it('should build correct path for valid slot', () => {
      expect(buildLocationPath(mockSlot)).toBe('Room A / Shelf 01 / Row A / Slot 1');
    });

    it('should handle different room names', () => {
      const slot = {
        ...mockSlot,
        row: {
          ...mockSlot.row,
          shelf: {
            ...mockSlot.row.shelf,
            room: { name: 'Storage Room B' },
          },
        },
      };
      expect(buildLocationPath(slot)).toBe('Storage Room B / Shelf 01 / Row A / Slot 1');
    });

    it('should handle numeric names', () => {
      const slot = {
        name: '99',
        row: {
          name: '3',
          shelf: {
            name: '2',
            room: { name: '1' },
          },
        },
      };
      expect(buildLocationPath(slot)).toBe('1 / 2 / 3 / 99');
    });
  });

  describe('null/undefined handling', () => {
    it('should return "Unassigned" for null slot', () => {
      expect(buildLocationPath(null)).toBe('Unassigned');
    });

    it('should return "Unassigned" for undefined slot', () => {
      expect(buildLocationPath(undefined)).toBe('Unassigned');
    });
  });

  describe('consistency', () => {
    it('should return same result for same input', () => {
      const result1 = buildLocationPath(mockSlot);
      const result2 = buildLocationPath(mockSlot);
      expect(result1).toBe(result2);
    });
  });
});
