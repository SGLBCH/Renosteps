import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { http } from '../lib/http';

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
    const verifyAndSetUser = async () => {
      const savedToken = localStorage.getItem('authToken');
      if (savedToken) {
        setToken(savedToken);
        try {
          console.log('🔍 Verifying existing token...');
          
          // Check if backend is healthy first
          const isHealthy = await http.isBackendHealthy();
          if (!isHealthy) {
            console.log('❌ Backend not available - clearing token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setToken(null);
            setUser(null);
            setLoading(false);
            return;
          }
          
          const authenticatedClient = http.withAuth(savedToken);
          const userProfile = await http.request(
            () => authenticatedClient.raw.auth.me(),
            'token verification'
          );
          
          console.log('✅ Token verification successful');
          setUser({
            id: userProfile.id.toString(),
            email: userProfile.email,
          });
        } catch (error) {
          console.error('❌ Token verification failed:', error);
          
          // Only clear token if it's actually invalid, not if backend is down
          if (error instanceof Error && (
            error.message.includes('Unauthorized') || 
            error.message.includes('401') ||
            error.message.includes('invalid token')
          )) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setToken(null);
            setUser(null);
          } else {
            // Backend might be down, keep token for when it comes back up
            console.log('⚠️ Keeping token - backend may be temporarily unavailable');
          }
        }
      }
      setLoading(false);
    };

    verifyAndSetUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.group('🔐 Login Process Started');
      console.log('Email:', email);
      
      const response = await http.request(
        () => http.raw.auth.login({ email, password }),
        'login'
      );
      
      console.log('✅ Login successful');
      console.groupEnd();
      
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
      console.group('❌ Login Failed');
      console.error('Login error:', error);
      console.groupEnd();
      
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      toast({
        title: 'Login Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      console.group('📝 Registration Process Started');
      console.log('Email:', email);
      console.log('Password length:', password.length);
      
      // Pre-flight validation
      if (!email || !email.trim()) {
        throw new Error('Email is required');
      }
      
      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      const response = await http.request(
        () => http.raw.auth.register({ email, password }),
        'registration'
      );
      
      console.log('✅ Registration successful');
      console.groupEnd();
      
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
      console.group('❌ Registration Failed');
      console.error('Registration error:', error);
      console.groupEnd();
      
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      toast({
        title: 'Registration Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user');
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
