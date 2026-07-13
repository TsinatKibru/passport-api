import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildLocationPath } from '../utils/location.util';

export interface LocationConflict {
  type: 'SLOT_OCCUPIED' | 'BOX_MISMATCH' | 'SAFE_MOVE';
  conflictingBoxId?: string;
  conflictingBoxLabel?: string;
  canOverride: boolean;
  message: string;
  suggestedAction: string;
}

@Injectable()
export class LocationValidationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates if a box can be safely moved to a slot without creating conflicts.
   * 
   * @param boxId The box being moved
   * @param targetSlotId The destination slot
   * @param scannedBoxQr Optional: QR code of physically found box (for verification)
   * @returns LocationConflict analysis with safe override recommendations
   */
  async validateBoxSlotAssignment(
    boxId: string,
    targetSlotId: string,
    scannedBoxQr?: string,
  ): Promise<LocationConflict> {
    // 1. Get the box being moved with current location
    const box = await this.prisma.movableBox.findUnique({
      where: { id: boxId },
      include: {
        slot: { include: { row: { include: { shelf: { include: { room: true } } } } } },
      },
    });

    if (!box) {
      throw new BadRequestException(`Box ${boxId} not found`);
    }

    // 2. Get target slot with current occupant
    const targetSlot = await this.prisma.slot.findUnique({
      where: { id: targetSlotId },
      include: {
        row: { include: { shelf: { include: { room: true } } } },
        boxes: { select: { id: true, label: true, qrCode: true } },
      },
    });

    if (!targetSlot) {
      throw new BadRequestException(`Target slot ${targetSlotId} not found`);
    }

    // 3. If box QR was scanned, verify identity
    if (scannedBoxQr && box.qrCode !== scannedBoxQr) {
      // Different box was found physically
      const physicalBox = await this.prisma.movableBox.findUnique({
        where: { qrCode: scannedBoxQr },
        select: { id: true, label: true, qrCode: true },
      });

      return {
        type: 'BOX_MISMATCH',
        conflictingBoxId: physicalBox?.id,
        conflictingBoxLabel: physicalBox?.label || 'Unknown',
        canOverride: false,
        message: `Expected to find box ${box.label} but physically found ${physicalBox?.label || 'different box'}`,
        suggestedAction: 'Use the physically found box or search for the correct box',
      };
    }

    // 4. Check if target slot is occupied by different box
    const occupyingBox = targetSlot.boxes?.[0];
    if (occupyingBox && occupyingBox.id !== boxId) {
      return {
        type: 'SLOT_OCCUPIED',
        conflictingBoxId: occupyingBox.id,
        conflictingBoxLabel: occupyingBox.label,
        canOverride: false,
        message: `Target slot is occupied by box ${occupyingBox.label}`,
        suggestedAction: 'Choose a different slot or move the occupying box first',
      };
    }

    // 5. Safe to move - no conflicts
    const fromLocation = buildLocationPath(box.slot);
    const toLocation = buildLocationPath(targetSlot);

    return {
      type: 'SAFE_MOVE',
      canOverride: true,
      message: `Safe to move ${box.label} from ${fromLocation} to ${toLocation}`,
      suggestedAction: 'Proceed with location update',
    };
  }

  /**
   * Validates complete passport return operation with both box and slot verification.
   * 
   * @param selectedBoxId The box chosen from UI
   * @param scannedBoxQr QR code of physically found box
   * @param scannedSlotQr QR code of physical slot location
   * @returns Complete validation result with recommended actions
   */
  async validatePassportReturn(
    selectedBoxId: string,
    scannedBoxQr: string,
    scannedSlotQr: string,
  ): Promise<{
    isValid: boolean;
    selectedBox: any;
    physicalBox: any;
    physicalSlot: any;
    conflicts: LocationConflict[];
    recommendedAction: 'PROCEED' | 'USE_PHYSICAL_BOX' | 'SEARCH_SELECTED_BOX' | 'RESOLVE_CONFLICTS';
    message: string;
  }> {
    // 1. Get selected box details
    const selectedBox = await this.prisma.movableBox.findUnique({
      where: { id: selectedBoxId },
      include: {
        slot: { include: { row: { include: { shelf: { include: { room: true } } } } } },
      },
    });

    if (!selectedBox) {
      throw new BadRequestException(`Selected box ${selectedBoxId} not found`);
    }

    // 2. Get physically scanned box
    const physicalBox = await this.prisma.movableBox.findUnique({
      where: { qrCode: scannedBoxQr },
      include: {
        slot: { include: { row: { include: { shelf: { include: { room: true } } } } } },
      },
    });

    if (!physicalBox) {
      throw new BadRequestException(`Scanned box with QR ${scannedBoxQr} not found`);
    }

    // 3. Get physical slot
    const physicalSlot = await this.prisma.slot.findUnique({
      where: { qrCode: scannedSlotQr },
      include: {
        row: { include: { shelf: { include: { room: true } } } },
        boxes: { select: { id: true, label: true, qrCode: true } },
      },
    });

    if (!physicalSlot) {
      throw new BadRequestException(`Scanned slot with QR ${scannedSlotQr} not found`);
    }

    // 4. Analyze scenarios
    const conflicts: LocationConflict[] = [];
    let recommendedAction: 'PROCEED' | 'USE_PHYSICAL_BOX' | 'SEARCH_SELECTED_BOX' | 'RESOLVE_CONFLICTS';
    let message: string;
    let isValid: boolean;

    if (selectedBox.id === physicalBox.id) {
      // Same box found - check if location matches
      if (selectedBox.slotId === physicalSlot.id) {
        // Perfect match - selected box at expected location
        recommendedAction = 'PROCEED';
        message = `Perfect match: ${selectedBox.label} found at expected location`;
        isValid = true;
      } else {
        // Same box, different location - validate safe move
        const locationConflict = await this.validateBoxSlotAssignment(
          selectedBox.id,
          physicalSlot.id,
          scannedBoxQr,
        );
        conflicts.push(locationConflict);

        if (locationConflict.canOverride) {
          recommendedAction = 'PROCEED';
          message = `${selectedBox.label} moved to new location - safe to update`;
          isValid = true;
        } else {
          recommendedAction = 'RESOLVE_CONFLICTS';
          message = locationConflict.message;
          isValid = false;
        }
      }
    } else {
      // Different box found - offer alternatives
      const physicalBoxLocation = buildLocationPath(physicalBox.slot);
      const selectedBoxLocation = buildLocationPath(selectedBox.slot);
      
      recommendedAction = 'USE_PHYSICAL_BOX';
      message = `Found ${physicalBox.label} instead of ${selectedBox.label}. ` +
               `${selectedBox.label} should be at ${selectedBoxLocation}`;
      isValid = false;

      conflicts.push({
        type: 'BOX_MISMATCH',
        conflictingBoxId: physicalBox.id,
        conflictingBoxLabel: physicalBox.label,
        canOverride: false,
        message: `Box mismatch: expected ${selectedBox.label}, found ${physicalBox.label}`,
        suggestedAction: `Use ${physicalBox.label} if it has sufficient capacity, or search for ${selectedBox.label}`,
      });
    }

    return {
      isValid,
      selectedBox,
      physicalBox,
      physicalSlot,
      conflicts,
      recommendedAction,
      message,
    };
  }
}