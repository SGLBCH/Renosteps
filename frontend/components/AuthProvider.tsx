import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      
      // Verify the token by calling the /auth/me endpoint
      const verifyToken = async () => {
        try {
          const authenticatedBackend = backend.with({
            auth: async () => ({
              authorization: `Bearer ${savedToken}`,
            }),
          });
          
          const userProfile = await authenticatedBackend.auth.me();
          setUser({
            id: userProfile.id.toString(),
            email: userProfile.email,
          });
        } catch (error) {
          console.error('Token verification failed:', error);
          // Clear invalid token
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          setToken(null);
          setUser(null);
        }
      };
      
      verifyToken();
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await backend.auth.login({ email, password });
      
      setToken(response.token);
      setUser({
        id: response.user.id.toString(),
        email: response.user.email,
      });
      
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('authUser', JSON.stringify({
        id: response.user.id.toString(),
        email: response.user.email,
      }));

      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed';
      if (error instanceof Error) {
        if (error.message.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await backend.auth.register({ email, password });
      
      setToken(response.token);
      setUser({
        id: response.user.id.toString(),
        email: response.user.email,
      });
      
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('authUser', JSON.stringify({
        id: response.user.id.toString(),
        email: response.user.email,
      }));

      toast({
        title: 'Success',
        description: 'Account created successfully',
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed';
      if (error instanceof Error) {
        if (error.message.includes('User with this email already exists')) {
          errorMessage = 'An account with this email already exists';
        } else if (error.message.includes('Invalid email format')) {
          errorMessage = 'Please enter a valid email address';
        } else if (error.message.includes('Password must be at least 8 characters')) {
          errorMessage = 'Password must be at least 8 characters long';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    
    toast({
      title: 'Success',
      description: 'Logged out successfully',
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
