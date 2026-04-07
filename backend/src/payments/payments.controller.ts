import { Controller, Get } from '@nestjs/common';
import { PaymentsService } from './payments.service';
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Get() findAll() { return this.payments.findAll(); }
}
