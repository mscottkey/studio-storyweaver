
'use client';

import { createContext, useContext, ReactNode } from 'react';

// This is a mock user object. In a real app, this would come from your auth provider.
const mockUser = {
  uid: 'mock-user-123',
  email: 'parent@example.com',
  displayName: 'Mock Parent',
};


interface AuthContextType {
  user: typeof mockUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // We're providing the mock user directly.
  const value = {
    user: mockUser,
    loading: false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
