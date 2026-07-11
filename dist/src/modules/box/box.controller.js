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
exports.BoxController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const box_service_1 = require("./box.service");
const location_service_1 = require("../location/location.service");
const create_box_dto_1 = require("./dto/create-box.dto");
const move_box_dto_1 = require("./dto/move-box.dto");
let BoxController = class BoxController {
    boxService;
    locationService;
    constructor(boxService, locationService) {
        this.boxService = boxService;
        this.locationService = locationService;
    }
    create(dto) {
        return this.boxService.create(dto);
    }
    findAll(status, search, page, limit) {
        return this.boxService.findAll(status, search, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 10);
    }
    getAvailable(neededSpaces) {
        const spaces = neededSpaces ? parseInt(neededSpaces, 10) : 1;
        return this.locationService.getAvailableBoxes(spaces);
    }
    findByQr(qrCode) {
        return this.boxService.findByQr(qrCode);
    }
    findOne(id) {
        return this.boxService.findOne(id);
    }
    move(id, dto, user) {
        return this.locationService.moveBox(id, dto.slotId, user.sub);
    }
    remove(id) {
        return this.boxService.remove(id);
    }
};
exports.BoxController = BoxController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_box_dto_1.CreateBoxDto]),
    __metadata("design:returntype", void 0)
], BoxController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], BoxController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('available'),
    __param(0, (0, common_1.Query)('neededSpaces')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BoxController.prototype, "getAvailable", null);
__decorate([
    (0, common_1.Get)('qr/:qrCode'),
    __param(0, (0, common_1.Param)('qrCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BoxController.prototype, "findByQr", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BoxController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/move'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, move_box_dto_1.MoveBoxDto, Object]),
    __metadata("design:returntype", void 0)
], BoxController.prototype, "move", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BoxController.prototype, "remove", null);
exports.BoxController = BoxController = __decorate([
    (0, common_1.Controller)('boxes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [box_service_1.BoxService,
        location_service_1.LocationService])
], BoxController);
//# sourceMappingURL=box.controller.js.map