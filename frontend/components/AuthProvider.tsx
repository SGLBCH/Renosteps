import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import { backendBaseUrl } from '../config';

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

  // Helper to get a backend client with proper configuration
  function getClient() {
    console.log('Backend base URL:', backendBaseUrl);
    
    if (backendBaseUrl) {
      return backend.with({ 
        baseURL: backendBaseUrl,
        // Add headers for CORS
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
    
    return backend;
  }

  // Check for existing token on mount
  useEffect(() => {
    const verifyAndSetUser = async () => {
      const savedToken = localStorage.getItem('authToken');
      if (savedToken) {
        setToken(savedToken);
        try {
          const baseClient = getClient();
          const authenticatedBackend = baseClient.with({
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
      }
      setLoading(false);
    };

    verifyAndSetUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Starting login process...');
      const baseClient = getClient();
      console.log('Backend client configured, making login request...');
      
      const response = await baseClient.auth.login({ email, password });
      console.log('Login successful:', response);
      
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
        const msg = error.message || '';
        console.log('Error message:', msg);
        
        if (msg.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password';
        } else if (msg.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('load failed')) {
          errorMessage = 'Could not connect to the server. Please check your internet connection and try again.';
        } else if (msg.toLowerCase().includes('cors')) {
          errorMessage = 'Server configuration error. Please contact support.';
        } else {
          errorMessage = msg;
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
      console.log('Starting registration process...');
      console.log('Using backend URL:', backendBaseUrl);
      
      const baseClient = getClient();
      console.log('Backend client configured, making registration request...');
      
      // Add a timeout to the request
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );
      
      const response = await Promise.race([
        baseClient.auth.register({ email, password }),
        timeoutPromise
      ]);
      
      console.log('Registration successful:', response);
      
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
        const msg = error.message || '';
        console.log('Error message:', msg);
        
        if (msg.includes('already exists')) {
          errorMessage = 'An account with this email already exists';
        } else if (msg.toLowerCase().includes('invalid email')) {
          errorMessage = 'Please enter a valid email address';
        } else if (msg.includes('Password must be at least 8 characters')) {
          errorMessage = 'Password must be at least 8 characters long';
        } else if (msg.includes('timeout') || msg.includes('Request timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('load failed')) {
          errorMessage = 'Could not connect to the server. Please check your internet connection and try again.';
        } else if (msg.toLowerCase().includes('cors')) {
          errorMessage = 'Server configuration error. Please contact support.';
        } else if (msg.toLowerCase().includes('not found') || msg.includes('404')) {
          errorMessage = 'Registration service not available. Please try again later.';
        } else {
          errorMessage = msg;
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
