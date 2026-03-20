import { DefaultSession } from 'next-auth';

/**
 * Extend NextAuth types to include custom properties
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      backendToken: string;
      role: 'customer';
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    role: 'customer';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    backendToken: string;
    role: 'customer';
  }
}
