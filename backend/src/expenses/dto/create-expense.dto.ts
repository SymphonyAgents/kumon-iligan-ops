export class CreateExpenseDto {
  dateKey: string; // ISO date YYYY-MM-DD
  category?: string;
  note?: string;
  method: string; // cash | gcash | card | bank_deposit (required)
  amount: string; // numeric as string
}
