export class CreateServiceDto {
  name: string;
  type: 'primary' | 'add_on';
  price: string; // numeric as string to preserve precision
  isActive?: boolean;
}
