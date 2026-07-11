"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = __importStar(require("bcryptjs"));
require("dotenv/config");
async function main() {
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({ adapter });
    console.log('🌱 Starting database seed...');
    await prisma.movementLog.deleteMany({});
    await prisma.passport.deleteMany({});
    await prisma.movableBox.deleteMany({});
    await prisma.slot.deleteMany({});
    await prisma.row.deleteMany({});
    await prisma.shelf.deleteMany({});
    await prisma.room.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('🧹 Cleaned existing database tables');
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('adminpass', salt);
    const staffPasswordHash = await bcrypt.hash('staffpass', salt);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@passport-track.com',
            name: 'Admin User',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
        },
    });
    const staff = await prisma.user.create({
        data: {
            email: 'staff@passport-track.com',
            name: 'Staff Member',
            passwordHash: staffPasswordHash,
            role: 'STAFF',
        },
    });
    console.log('👤 Created users:');
    console.log(`   - Admin: ${admin.email} (password: adminpass)`);
    console.log(`   - Staff: ${staff.email} (password: staffpass)`);
    const room = await prisma.room.create({
        data: {
            name: 'Room A',
            qrCode: 'ROOM-A',
        },
    });
    const shelf = await prisma.shelf.create({
        data: {
            name: 'Shelf 01',
            qrCode: 'SHELF-01',
            position: 1,
            roomId: room.id,
        },
    });
    const row = await prisma.row.create({
        data: {
            name: 'Row A',
            qrCode: 'ROW-A',
            position: 1,
            shelfId: shelf.id,
        },
    });
    const slotsData = [
        { name: 'Slot 1', qrCode: 'SLOT-A1', position: 1 },
        { name: 'Slot 2', qrCode: 'SLOT-A2', position: 2 },
        { name: 'Slot 3', qrCode: 'SLOT-A3', position: 3 },
        { name: 'Slot 4', qrCode: 'SLOT-A4', position: 4 },
        { name: 'Slot 5', qrCode: 'SLOT-A5', position: 5 },
    ];
    const slots = [];
    for (const item of slotsData) {
        const s = await prisma.slot.create({
            data: {
                name: item.name,
                qrCode: item.qrCode,
                position: item.position,
                rowId: row.id,
            },
        });
        slots.push(s);
    }
    console.log(`📦 Created Room -> Shelf -> Row with ${slots.length} Slots`);
    const box1 = await prisma.movableBox.create({
        data: {
            qrCode: 'BOX-MB-0001',
            label: 'MB-0001',
            capacity: 10,
            occupiedCount: 2,
            status: 'ACTIVE',
            slotId: slots[0].id,
        },
    });
    const box2 = await prisma.movableBox.create({
        data: {
            qrCode: 'BOX-MB-0002',
            label: 'MB-0002',
            capacity: 10,
            occupiedCount: 0,
            status: 'ACTIVE',
            slotId: slots[1].id,
        },
    });
    console.log('📦 Created Movable Boxes:');
    console.log(`   - Box ${box1.label} (QR: ${box1.qrCode}) placed in Slot 1`);
    console.log(`   - Box ${box2.label} (QR: ${box2.qrCode}) placed in Slot 2`);
    const p1 = await prisma.passport.create({
        data: {
            qrCode: 'PPT-0001',
            holderName: 'Alice Smith',
            holderIdNo: 'ID-8822001',
            status: 'ISSUED',
        },
    });
    const p2 = await prisma.passport.create({
        data: {
            qrCode: 'PPT-0002',
            holderName: 'Bob Jones',
            holderIdNo: 'ID-9922002',
            status: 'IN_BOX',
            boxId: box1.id,
        },
    });
    const p3 = await prisma.passport.create({
        data: {
            qrCode: 'PPT-0003',
            holderName: 'Charlie Brown',
            holderIdNo: 'ID-1033003',
            status: 'IN_BOX',
            boxId: box1.id,
        },
    });
    const p4 = await prisma.passport.create({
        data: {
            qrCode: 'PPT-0004',
            holderName: 'Diana Prince',
            holderIdNo: 'ID-2044004',
            status: 'ISSUED',
        },
    });
    const p5 = await prisma.passport.create({
        data: {
            qrCode: 'PPT-0005',
            holderName: 'Evan Wright',
            holderIdNo: 'ID-3055005',
            status: 'ISSUED',
        },
    });
    console.log('🛂 Created Passports:');
    console.log(`   - ${p1.holderName} (QR: ${p1.qrCode}): ISSUED`);
    console.log(`   - ${p2.holderName} (QR: ${p2.qrCode}): IN_BOX (MB-0001)`);
    console.log(`   - ${p3.holderName} (QR: ${p3.qrCode}): IN_BOX (MB-0001)`);
    console.log(`   - ${p4.holderName} (QR: ${p4.qrCode}): ISSUED`);
    console.log(`   - ${p5.holderName} (QR: ${p5.qrCode}): ISSUED`);
    const slot1Path = 'Room A / Shelf 01 / Row A / Slot 1';
    await prisma.movementLog.createMany({
        data: [
            {
                action: 'PASSPORT_RETURNED',
                fromLocation: null,
                toLocation: slot1Path,
                passportId: p2.id,
                boxId: box1.id,
                userId: admin.id,
            },
            {
                action: 'PASSPORT_RETURNED',
                fromLocation: null,
                toLocation: slot1Path,
                passportId: p3.id,
                boxId: box1.id,
                userId: admin.id,
            },
        ],
    });
    console.log('✅ Database seeded successfully!');
    await pool.end();
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map