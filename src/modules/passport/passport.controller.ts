import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { PassportService } from './passport.service';
import { LocationService } from '../location/location.service';
import { CreatePassportDto } from './dto/create-passport.dto';
import { AssignPassportDto } from './dto/assign-passport.dto';
import { BatchAssignPassportDto } from './dto/batch-assign-passport.dto';

@Controller('passports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PassportController {
  constructor(
    private readonly passportService: PassportService,
    private readonly locationService: LocationService,
  ) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreatePassportDto) {
    return this.passportService.create(dto);
  }

  @Get()
  @Roles('ADMIN', 'STAFF')
  findAll(
    @Query('status') status?: 'IN_BOX' | 'ISSUED',
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.passportService.findAll(
      status,
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('qr/:qrCode')
  findByQr(@Param('qrCode') qrCode: string) {
    return this.passportService.findByQr(qrCode);
  }

  @Get(':id')
  @Roles('ADMIN', 'STAFF')
  findOne(@Param('id') id: string) {
    return this.passportService.findOne(id);
  }

  @Post('batch-assign')
  batchAssign(
    @Body() dto: BatchAssignPassportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.locationService.batchAssignPassportsToBox(
      dto.passportIds,
      dto.boxId,
      user.sub,
      dto.action,
    );
  }

  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignPassportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.locationService.assignPassportToBox(
      id,
      dto.boxId,
      'PASSPORT_ASSIGNED',
      user.sub,
    );
  }

  @Post(':id/return')
  returnPassport(
    @Param('id') id: string,
    @Body() dto: AssignPassportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.locationService.assignPassportToBox(
      id,
      dto.boxId,
      'PASSPORT_RETURNED',
      user.sub,
    );
  }

  @Post(':id/issue')
  issue(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.locationService.issuePassport(id, user.sub);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.passportService.remove(id);
  }
}
