import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthedRequest } from '../auth/auth.types.js';
import { StudentsService } from './students.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { ChangeStudentStatusDto } from './dto/change-student-status.dto.js';
import { AssignTeacherDto } from './dto/assign-teacher.dto.js';
import { QueryStudentsDto } from './dto/query-students.dto.js';

@Controller('students')
@UseGuards(AuthGuard)
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get()
  findAll(@Query() query: QueryStudentsDto, @Req() req: AuthedRequest) {
    return this.students.findAll(query, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.students.findOne(id, req.user.id);
  }

  @Post()
  enroll(@Body() dto: CreateStudentDto, @Req() req: AuthedRequest) {
    return this.students.enroll(dto, req.user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @Req() req: AuthedRequest,
  ) {
    return this.students.update(id, dto, req.user.id);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStudentStatusDto,
    @Req() req: AuthedRequest,
  ) {
    return this.students.changeStatus(id, dto, req.user.id);
  }

  @Post(':id/assign-teacher')
  assignTeacher(
    @Param('id') id: string,
    @Body() dto: AssignTeacherDto,
    @Req() req: AuthedRequest,
  ) {
    return this.students.assignTeacher(id, dto, req.user.id);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.students.softDelete(id, req.user.id);
  }
}
