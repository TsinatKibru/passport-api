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
import { LocationService } from './location.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { CreateRowDto } from './dto/create-row.dto';
import { CreateSlotDto } from './dto/create-slot.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // ─────────────────────────────────────────────────────────────
  // ROOMS
  // ─────────────────────────────────────────────────────────────

  /** GET /api/location/rooms — list all rooms */
  @Get('rooms')
  @Roles('ADMIN', 'STAFF')
  getRooms() {
    return this.locationService.getRooms();
  }

  /** POST /api/location/rooms — create a room (ADMIN only) */
  @Post('rooms')
  @Roles('ADMIN')
  createRoom(@Body() dto: CreateRoomDto) {
    return this.locationService.createRoom(dto);
  }

  /** DELETE /api/location/rooms/:id — delete a room (ADMIN only) */
  @Delete('rooms/:id')
  @Roles('ADMIN')
  deleteRoom(@Param('id') id: string) {
    return this.locationService.deleteRoom(id);
  }

  // ─────────────────────────────────────────────────────────────
  // SHELVES
  // ─────────────────────────────────────────────────────────────

  /** GET /api/location/shelves?roomId= — list shelves, optionally filtered by room */
  @Get('shelves')
  @Roles('ADMIN', 'STAFF')
  getShelves(@Query('roomId') roomId?: string) {
    return this.locationService.getShelves(roomId);
  }

  /** POST /api/location/shelves — create a shelf */
  @Post('shelves')
  @Roles('ADMIN')
  createShelf(@Body() dto: CreateShelfDto) {
    return this.locationService.createShelf(dto);
  }

  /** DELETE /api/location/shelves/:id */
  @Delete('shelves/:id')
  @Roles('ADMIN')
  deleteShelf(@Param('id') id: string) {
    return this.locationService.deleteShelf(id);
  }

  // ─────────────────────────────────────────────────────────────
  // ROWS
  // ─────────────────────────────────────────────────────────────

  /** GET /api/location/rows?shelfId= — list rows, optionally filtered by shelf */
  @Get('rows')
  @Roles('ADMIN', 'STAFF')
  getRows(@Query('shelfId') shelfId?: string) {
    return this.locationService.getRows(shelfId);
  }

  /** POST /api/location/rows — create a row */
  @Post('rows')
  @Roles('ADMIN')
  createRow(@Body() dto: CreateRowDto) {
    return this.locationService.createRow(dto);
  }

  /** DELETE /api/location/rows/:id */
  @Delete('rows/:id')
  @Roles('ADMIN')
  deleteRow(@Param('id') id: string) {
    return this.locationService.deleteRow(id);
  }

  // ─────────────────────────────────────────────────────────────
  // SLOTS
  // ─────────────────────────────────────────────────────────────

  /** GET /api/location/slots?rowId=&page=&limit=&search= — list slots with pagination and search */
  @Get('slots')
  @Roles('ADMIN', 'STAFF')
  getSlots(
    @Query('rowId') rowId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.locationService.getSlots(
      rowId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
      search,
    );
  }

  /** GET /api/location/slots/qr/:qrCode — look up a slot by QR code (mobile scan) */
  @Get('slots/qr/:qrCode')
  @Roles('ADMIN', 'STAFF')
  getSlotByQr(@Param('qrCode') qrCode: string) {
    return this.locationService.getSlotByQr(qrCode);
  }

  /** POST /api/location/slots — create a slot */
  @Post('slots')
  @Roles('ADMIN')
  createSlot(@Body() dto: CreateSlotDto) {
    return this.locationService.createSlot(dto);
  }

  /** DELETE /api/location/slots/:id */
  @Delete('slots/:id')
  @Roles('ADMIN')
  deleteSlot(@Param('id') id: string) {
    return this.locationService.deleteSlot(id);
  }

  // ─────────────────────────────────────────────────────────────
  // AUDIT LOGS
  // ─────────────────────────────────────────────────────────────

  /** GET /api/location/logs — paginated movement logs */
  @Get('logs')
  @Roles('ADMIN', 'STAFF')
  getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.locationService.getMovementLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}

