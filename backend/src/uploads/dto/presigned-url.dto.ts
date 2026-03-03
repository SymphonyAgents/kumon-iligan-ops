export class PresignedUrlDto {
  txnId: number;
  itemId: number;
  type: 'before' | 'after';
  extension: string;
}
