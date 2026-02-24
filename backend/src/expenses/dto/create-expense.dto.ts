export class CreateExpenseDto {
  dateKey: string; // ISO date YYYY-MM-DD
  category?: string;
  note?: string;
  amount: string; // numeric as string
}
