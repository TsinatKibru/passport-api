import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { LocationModule } from './modules/location/location.module';
import { PassportModule } from './modules/passport/passport.module';
import { BoxModule } from './modules/box/box.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    LocationModule,
    PassportModule,
    BoxModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
