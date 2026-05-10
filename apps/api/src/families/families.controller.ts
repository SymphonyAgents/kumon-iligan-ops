import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthedRequest } from '../auth/auth.types.js';
import { FamiliesService } from './families.service.js';
import { CreateFamilyDto } from './dto/create-family.dto.js';
import { UpdateFamilyDto } from './dto/update-family.dto.js';
import { QueryFamiliesDto } from './dto/query-families.dto.js';

@Controller('families')
@UseGuards(AuthGuard)
export class FamiliesController {
  constructor(private readonly families: FamiliesService) {}

  @Get()
  findAll(@Query() query: QueryFamiliesDto, @Req() req: AuthedRequest) {
    return this.families.findAll(query, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.families.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() dto: CreateFamilyDto, @Req() req: AuthedRequest) {
    return this.families.create(dto, req.user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFamilyDto,
    @Req() req: AuthedRequest,
  ) {
    return this.families.update(id, dto, req.user.id);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.families.softDelete(id, req.user.id);
  }
}
