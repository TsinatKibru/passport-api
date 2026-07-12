import { computeBoxStatus } from './box-status.util';

describe('computeBoxStatus', () => {
  describe('INACTIVE status', () => {
    it('should return INACTIVE when slotId is null', () => {
      expect(computeBoxStatus(null, 0, 10)).toBe('INACTIVE');
    });

    it('should return INACTIVE when slotId is undefined', () => {
      expect(computeBoxStatus(undefined, 0, 10)).toBe('INACTIVE');
    });

    it('should return INACTIVE even if box has passports but no slot', () => {
      expect(computeBoxStatus(null, 5, 10)).toBe('INACTIVE');
    });
  });

  describe('FULL status', () => {
    it('should return FULL when at capacity', () => {
      expect(computeBoxStatus('slot-123', 10, 10)).toBe('FULL');
    });

    it('should return FULL when over capacity (edge case)', () => {
      expect(computeBoxStatus('slot-123', 11, 10)).toBe('FULL');
    });
  });

  describe('ACTIVE status', () => {
    it('should return ACTIVE when box has slot and space', () => {
      expect(computeBoxStatus('slot-123', 5, 10)).toBe('ACTIVE');
    });

    it('should return ACTIVE when box is empty but has slot', () => {
      expect(computeBoxStatus('slot-123', 0, 10)).toBe('ACTIVE');
    });

    it('should return ACTIVE when box has one space left', () => {
      expect(computeBoxStatus('slot-123', 9, 10)).toBe('ACTIVE');
    });
  });

  describe('edge cases', () => {
    it('should handle zero capacity correctly', () => {
      expect(computeBoxStatus('slot-123', 0, 0)).toBe('FULL');
    });

    it('should handle large capacity values', () => {
      expect(computeBoxStatus('slot-123', 50, 100)).toBe('ACTIVE');
    });

    it('should be consistent across multiple calls with same inputs', () => {
      const result1 = computeBoxStatus('slot-123', 5, 10);
      const result2 = computeBoxStatus('slot-123', 5, 10);
      expect(result1).toBe(result2);
    });
  });
});
