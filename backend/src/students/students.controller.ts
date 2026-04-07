import { Controller, Get } from '@nestjs/common';
import { StudentsService } from './students.service';
@Controller('students')
export class StudentsController {
  constructor(private readonly students: StudentsService) {}
  @Get() findAll() { return this.students.findAll(); }
}
