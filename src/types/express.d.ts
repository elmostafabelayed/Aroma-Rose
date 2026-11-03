export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: 'admin' | 'staff';
  full_name: string;
  is_active: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

