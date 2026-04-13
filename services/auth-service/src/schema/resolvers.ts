import { AuthService } from '../services/auth.service';
import { AuthenticationError } from '../utils/errors';

export const resolvers = {
  Query: {
    me: async (_root: any, _args: any, context: any) => {
      if (!context.user) return null;
      
      const authService = new AuthService(context.prisma);
      
      // Use mock fallback if DB is offline
      if (!context.request.server.dbConnected) {
        return {
          id: context.user.userId,
          email: context.user.email,
          displayName: 'Demo User',
          role: context.user.role,
        };
      }

      return authService.getProfile(context.user.userId);
    },
    health: async (_root: any, _args: any, context: any) => ({
      status: context.request.server.dbConnected ? 'healthy' : 'degraded (mock mode)',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
    }),
  },
  Mutation: {
    login: async (_root: any, { input }, context: any) => {
      const authService = new AuthService(context.prisma);

      // ─── Mock Mode Logic ──────────────────────────────────────────
      if (!context.request.server.dbConnected) {
        // Allow demo users to log in even without DB
        if (input.email === 'staff@crowdflow.io' && input.password === 'staff_secret_123') {
          return {
            user: { id: 'staff-1', email: input.email, displayName: 'Demo Staff', role: 'STAFF' },
            tokens: { accessToken: 'mock-at', refreshToken: 'mock-rt', expiresIn: 3600, tokenType: 'Bearer' }
          };
        }
        if (input.email === 'fan@stadium.com' && input.password === 'fan_secret_456') {
          return {
            user: { id: 'fan-1', email: input.email, displayName: 'John Fan', role: 'ATTENDEE' },
            tokens: { accessToken: 'mock-at', refreshToken: 'mock-rt', expiresIn: 3600, tokenType: 'Bearer' }
          };
        }
        throw new AuthenticationError('Invalid credentials (MOCK MODE)');
      }

      return authService.login(input);
    },
    register: async (_root: any, { input }, context: any) => {
      if (!context.request.server.dbConnected) {
        throw new Error('Registration is disabled in Mock Mode');
      }
      const authService = new AuthService(context.prisma);
      return authService.register(input);
    },
    logout: async (_root: any, _args: any, context: any) => {
      if (context.user && context.request.server.dbConnected) {
        const authService = new AuthService(context.prisma);
        await authService.logout(context.user.userId);
      }
      return { success: true, message: 'Logged out' };
    },
  },
};
