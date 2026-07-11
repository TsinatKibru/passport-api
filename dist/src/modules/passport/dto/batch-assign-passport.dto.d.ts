export declare class BatchAssignPassportDto {
    passportIds: string[];
    boxId: string;
    slotQrCode?: string;
    overrideLocation?: boolean;
    action: 'PASSPORT_ASSIGNED' | 'PASSPORT_RETURNED';
}
