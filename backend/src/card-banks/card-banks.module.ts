import { Module } from '@nestjs/common';
import { CardBanksController } from './card-banks.controller';
import { CardBanksService } from './card-banks.service';
import { DbModule } from '../db/db.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [DbModule, AuthModule, UsersModule],
  controllers: [CardBanksController],
  providers: [CardBanksService],
  exports: [CardBanksService],
})
export class CardBanksModule {}
