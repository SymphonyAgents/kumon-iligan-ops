import { Controller, Get } from '@nestjs/common';
import { PaymentPeriodsService } from './payment-periods.service';
@Controller('payment-periods')
export class PaymentPeriodsController {
  constructor(private readonly paymentPeriods: PaymentPeriodsService) {}
  @Get() findAll() { return this.paymentPeriods.findAll(); }
}
