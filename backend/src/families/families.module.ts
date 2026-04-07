import { Module } from '@nestjs/common';
import { FamiliesController } from './families.controller';
import { FamiliesService } from './families.service';
import { DbModule } from '../db/db.module';
@Module({ imports: [DbModule], controllers: [FamiliesController], providers: [FamiliesService], exports: [FamiliesService] })
export class FamiliesModule {}
