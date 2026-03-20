import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import jwt from 'jsonwebtoken';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
const AUTH_SESSION_MAX_AGE_HOURS = parseInt(process.env.AUTH_SESSION_MAX_AGE_HOURS || '24', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e password sono richiesti');
        }

        try {
          const response = await fetch(`${BACKEND_URL}/api/customers/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Credenziali non valide');
          }

          const data = await response.json();

          if (!data.success || !data.data) {
            throw new Error(data.message || 'Credenziali non valide');
          }

          const { customer } = data.data;

          if (!customer) {
            throw new Error('Risposta del server non valida');
          }

          return {
            id: customer.id.toString(),
            email: customer.email,
            name: `${customer.firstName} ${customer.lastName}`,
            firstName: customer.firstName,
            lastName: customer.lastName,
            role: 'customer' as const,
          };
        } catch (error) {
          logger.error('Login error:', error);
          throw error;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      // TODO: In a real implementation, implement Google OAuth backend flow
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: AUTH_SESSION_MAX_AGE_HOURS * 60 * 60, // Convert hours to seconds
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const backendToken = jwt.sign(
          {
            userId: user.id,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          },
          JWT_SECRET,
          {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'zenithstore-api',
            audience: 'zenithstore-users',
          } as jwt.SignOptions
        );

        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.backendToken = backendToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.backendToken = token.backendToken as string;
        session.user.role = token.role as 'customer';
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
});
