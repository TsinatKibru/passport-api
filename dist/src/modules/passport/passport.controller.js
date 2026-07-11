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
exports.PassportController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const passport_service_1 = require("./passport.service");
const location_service_1 = require("../location/location.service");
const create_passport_dto_1 = require("./dto/create-passport.dto");
const assign_passport_dto_1 = require("./dto/assign-passport.dto");
const batch_assign_passport_dto_1 = require("./dto/batch-assign-passport.dto");
let PassportController = class PassportController {
    passportService;
    locationService;
    constructor(passportService, locationService) {
        this.passportService = passportService;
        this.locationService = locationService;
    }
    create(dto) {
        return this.passportService.create(dto);
    }
    findAll(status, search, page, limit) {
        return this.passportService.findAll(status, search, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 10);
    }
    findByQr(qrCode) {
        return this.passportService.findByQr(qrCode);
    }
    findOne(id) {
        return this.passportService.findOne(id);
    }
    batchAssign(dto, user) {
        return this.locationService.batchAssignPassportsToBox(dto.passportIds, dto.boxId, dto.slotQrCode, dto.overrideLocation ?? false, user.sub, dto.action);
    }
    assign(id, dto, user) {
        return this.locationService.assignPassportToBox(id, dto.boxId, 'PASSPORT_ASSIGNED', user.sub, dto.slotQrCode, dto.overrideLocation ?? false);
    }
    returnPassport(id, dto, user) {
        return this.locationService.assignPassportToBox(id, dto.boxId, 'PASSPORT_RETURNED', user.sub, dto.slotQrCode, dto.overrideLocation ?? false);
    }
    issue(id, user) {
        return this.locationService.issuePassport(id, user.sub);
    }
    remove(id) {
        return this.passportService.remove(id);
    }
};
exports.PassportController = PassportController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_passport_dto_1.CreatePassportDto]),
    __metadata("design:returntype", void 0)
], PassportController.prototype, "create", null);
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
], PassportController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('qr/:qrCode'),
    __param(0, (0, common_1.Param)('qrCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PassportController.prototype, "findByQr", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PassportController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('batch-assign'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [batch_assign_passport_dto_1.BatchAssignPassportDto, Object]),
    __metadata("design:returntype", void 0)
], PassportController.prototype, "batchAssign", null);
__decorate([
    (0, common_1.Post)(':id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_passport_dto_1.AssignPassportDto, Object]),
    __metadata("design:returntype", void 0)
], PassportController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)(':id/return'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_passport_dto_1.AssignPassportDto, Object]),
    __metadata("design:returntype", void 0)
], PassportController.prototype, "returnPassport", null);
__decorate([
    (0, common_1.Post)(':id/issue'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PassportController.prototype, "issue", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PassportController.prototype, "remove", null);
exports.PassportController = PassportController = __decorate([
    (0, common_1.Controller)('passports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [passport_service_1.PassportService,
        location_service_1.LocationService])
], PassportController);
//# sourceMappingURL=passport.controller.js.map