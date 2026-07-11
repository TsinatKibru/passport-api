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
import { BoxService } from './box.service';
import { LocationService } from '../location/location.service';
import { CreateBoxDto } from './dto/create-box.dto';
import { MoveBoxDto } from './dto/move-box.dto';

@Controller('boxes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BoxController {
  constructor(
    private readonly boxService: BoxService,
    private readonly locationService: LocationService,
  ) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateBoxDto) {
    return this.boxService.create(dto);
  }

  @Get()
  @Roles('ADMIN')
  findAll(
    @Query('status') status?: 'ACTIVE' | 'FULL' | 'INACTIVE',
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.boxService.findAll(
      status,
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('available')
  getAvailable(@Query('neededSpaces') neededSpaces?: string) {
    const spaces = neededSpaces ? parseInt(neededSpaces, 10) : 1;
    return this.locationService.getAvailableBoxes(spaces);
  }

  @Get('qr/:qrCode')
  findByQr(@Param('qrCode') qrCode: string) {
    return this.boxService.findByQr(qrCode);
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.boxService.findOne(id);
  }

  @Post(':id/move')
  move(
    @Param('id') id: string,
    @Body() dto: MoveBoxDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.locationService.moveBox(id, dto.slotId, user.sub);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.boxService.remove(id);
  }
}
