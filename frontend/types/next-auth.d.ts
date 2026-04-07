import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      userType: string;
      status: string;
      branchId: number | null;
      fullName: string | null;
      nickname: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    userType?: string;
    status?: string;
    branchId?: number | null;
    fullName?: string | null;
    nickname?: string | null;
  }
}
