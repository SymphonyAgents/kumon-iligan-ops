export class UpdateServiceDto {
  name?: string;
  type?: 'primary' | 'add_on';
  price?: string;
  isActive?: boolean;
}
