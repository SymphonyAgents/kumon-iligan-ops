import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { DepositsController } from './deposits.controller';
import { DepositsService } from './deposits.service';

@Module({
  imports: [DbModule],
  controllers: [DepositsController],
  providers: [DepositsService],
})
export class DepositsModule {}
