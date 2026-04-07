import { Controller, Get } from '@nestjs/common';
import { FamiliesService } from './families.service';
@Controller('families')
export class FamiliesController {
  constructor(private readonly families: FamiliesService) {}
  @Get() findAll() { return this.families.findAll(); }
}
