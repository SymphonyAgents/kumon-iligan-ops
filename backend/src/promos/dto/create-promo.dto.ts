export class CreatePromoDto {
  name: string;
  code: string;
  percent: string; // numeric as string
  dateFrom?: string; // ISO date YYYY-MM-DD
  dateTo?: string;
  isActive?: boolean;
}
