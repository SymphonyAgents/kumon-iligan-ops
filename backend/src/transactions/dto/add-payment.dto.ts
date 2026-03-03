export class AddPaymentDto {
  method: 'cash' | 'gcash' | 'card' | 'bank_deposit';
  amount: string;
  referenceNumber?: string;
}
