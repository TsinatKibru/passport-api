import { Module } from '@nestjs/common';
import { LocationValidationService } from '../../common/services/location-validation.service';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';

@Module({
  controllers: [LocationController],
  providers: [LocationService, LocationValidationService],
  exports: [LocationService],
})
export class LocationModule {}

