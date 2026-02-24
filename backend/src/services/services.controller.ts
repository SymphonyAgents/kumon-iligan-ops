import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // Public — POS reads service catalog
  @Get()
  findAll(@Query('active') active?: string) {
    return this.servicesService.findAll(active === '1' || active === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id);
  }

  // Admin-only mutations
  @UseGuards(SupabaseAuthGuard)
  @Post()
  create(@Body() dto: CreateServiceDto, @Req() req: any) {
    return this.servicesService.create(dto, req.user?.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
    @Req() req: any,
  ) {
    return this.servicesService.update(id, dto, req.user?.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.servicesService.remove(id, req.user?.id);
  }
}
