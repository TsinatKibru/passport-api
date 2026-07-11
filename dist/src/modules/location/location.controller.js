"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const location_service_1 = require("./location.service");
const create_room_dto_1 = require("./dto/create-room.dto");
const create_shelf_dto_1 = require("./dto/create-shelf.dto");
const create_row_dto_1 = require("./dto/create-row.dto");
const create_slot_dto_1 = require("./dto/create-slot.dto");
let LocationController = class LocationController {
    locationService;
    constructor(locationService) {
        this.locationService = locationService;
    }
    getRooms() {
        return this.locationService.getRooms();
    }
    createRoom(dto) {
        return this.locationService.createRoom(dto);
    }
    deleteRoom(id) {
        return this.locationService.deleteRoom(id);
    }
    getShelves(roomId) {
        return this.locationService.getShelves(roomId);
    }
    createShelf(dto) {
        return this.locationService.createShelf(dto);
    }
    deleteShelf(id) {
        return this.locationService.deleteShelf(id);
    }
    getRows(shelfId) {
        return this.locationService.getRows(shelfId);
    }
    createRow(dto) {
        return this.locationService.createRow(dto);
    }
    deleteRow(id) {
        return this.locationService.deleteRow(id);
    }
    getSlots(rowId) {
        return this.locationService.getSlots(rowId);
    }
    getSlotByQr(qrCode) {
        return this.locationService.getSlotByQr(qrCode);
    }
    createSlot(dto) {
        return this.locationService.createSlot(dto);
    }
    deleteSlot(id) {
        return this.locationService.deleteSlot(id);
    }
    getLogs(page, limit) {
        return this.locationService.getMovementLogs(page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
    }
};
exports.LocationController = LocationController;
__decorate([
    (0, common_1.Get)('rooms'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "getRooms", null);
__decorate([
    (0, common_1.Post)('rooms'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_room_dto_1.CreateRoomDto]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "createRoom", null);
__decorate([
    (0, common_1.Delete)('rooms/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "deleteRoom", null);
__decorate([
    (0, common_1.Get)('shelves'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Query)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "getShelves", null);
__decorate([
    (0, common_1.Post)('shelves'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_shelf_dto_1.CreateShelfDto]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "createShelf", null);
__decorate([
    (0, common_1.Delete)('shelves/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "deleteShelf", null);
__decorate([
    (0, common_1.Get)('rows'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Query)('shelfId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "getRows", null);
__decorate([
    (0, common_1.Post)('rows'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_row_dto_1.CreateRowDto]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "createRow", null);
__decorate([
    (0, common_1.Delete)('rows/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "deleteRow", null);
__decorate([
    (0, common_1.Get)('slots'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Query)('rowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "getSlots", null);
__decorate([
    (0, common_1.Get)('slots/qr/:qrCode'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('qrCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "getSlotByQr", null);
__decorate([
    (0, common_1.Post)('slots'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_slot_dto_1.CreateSlotDto]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "createSlot", null);
__decorate([
    (0, common_1.Delete)('slots/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "deleteSlot", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "getLogs", null);
exports.LocationController = LocationController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('location'),
    __metadata("design:paramtypes", [location_service_1.LocationService])
], LocationController);
//# sourceMappingURL=location.controller.js.map