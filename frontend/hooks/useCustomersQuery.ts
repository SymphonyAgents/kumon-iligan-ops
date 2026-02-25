'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCustomerByPhoneQuery(phone: string) {
  return useQuery({
    queryKey: ['customer-by-phone', phone],
    queryFn: () => api.customers.findByPhone(phone),
    enabled: phone.length >= 7,
    staleTime: 60 * 1000,
    retry: false,
  });
}
