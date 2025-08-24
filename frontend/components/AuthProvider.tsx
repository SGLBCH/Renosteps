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

// Enhanced error analysis function
function analyzeConnectionError(error: any, operation: string): string {
  console.group(`🔍 Connection Error Analysis - ${operation}`);
  console.log('Raw error:', error);
  console.log('Error type:', typeof error);
  console.log('Error constructor:', error?.constructor?.name);
  console.log('Backend URL config:', backendBaseUrl);
  console.log('Current location:', window.location.href);
  console.log('User agent:', navigator.userAgent);
  
  let errorDetails = {
    operation,
    timestamp: new Date().toISOString(),
    url: backendBaseUrl || 'default',
    location: window.location.href,
    errorType: error?.constructor?.name || 'Unknown',
    message: error?.message || 'No message',
    stack: error?.stack || 'No stack trace'
  };

  // Network-level errors
  if (error instanceof TypeError) {
    if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
      console.log('❌ NETWORK ERROR: Failed to fetch - likely CORS or network connectivity issue');
      console.log('Possible causes:');
      console.log('1. Backend server is not running');
      console.log('2. CORS configuration issue');
      console.log('3. Network connectivity problem');
      console.log('4. Incorrect backend URL');
      console.groupEnd();
      return `NETWORK_ERROR: Cannot connect to backend server at ${backendBaseUrl || 'default URL'}. Check if backend is running and CORS is configured correctly.`;
    }
    
    if (error.message.includes('NetworkError') || error.message.includes('network')) {
      console.log('❌ NETWORK ERROR: General network issue');
      console.groupEnd();
      return `NETWORK_ERROR: Network connectivity issue during ${operation}. Check your internet connection.`;
    }
  }

  // CORS-specific errors
  if (error.message.includes('CORS') || error.message.includes('cors')) {
    console.log('❌ CORS ERROR: Cross-origin request blocked');
    console.log('Backend URL:', backendBaseUrl);
    console.log('Frontend URL:', window.location.origin);
    console.groupEnd();
    return `CORS_ERROR: Cross-origin request blocked. Backend CORS configuration needs to allow origin: ${window.location.origin}`;
  }

  // HTTP status errors
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    console.log(`❌ HTTP ERROR: Status ${status}`);
    
    switch (status) {
      case 404:
        console.log('Endpoint not found - check API URL and route');
        console.groupEnd();
        return `HTTP_404: API endpoint not found. Check if backend route exists: ${backendBaseUrl}/auth/${operation}`;
      case 500:
        console.log('Internal server error - backend issue');
        console.groupEnd();
        return `HTTP_500: Backend server error during ${operation}. Check backend logs.`;
      case 502:
      case 503:
      case 504:
        console.log('Backend server unavailable');
        console.groupEnd();
        return `HTTP_${status}: Backend server unavailable. Server may be down or overloaded.`;
      default:
        console.groupEnd();
        return `HTTP_${status}: Server returned error status ${status} during ${operation}.`;
    }
  }

  // Timeout errors
  if (error.message.includes('timeout') || error.message.includes('Timeout')) {
    console.log('❌ TIMEOUT ERROR: Request timed out');
    console.groupEnd();
    return `TIMEOUT_ERROR: Request timed out during ${operation}. Backend may be slow or unresponsive.`;
  }

  // JSON parsing errors
  if (error.message.includes('JSON') || error.message.includes('parse')) {
    console.log('❌ PARSE ERROR: Invalid JSON response');
    console.groupEnd();
    return `PARSE_ERROR: Invalid response format from backend during ${operation}. Backend may be returning HTML instead of JSON.`;
  }

  // Authentication-specific errors
  if (error.message.includes('Unauthorized') || error.message.includes('401')) {
    console.log('❌ AUTH ERROR: Unauthorized');
    console.groupEnd();
    return `AUTH_ERROR: Invalid credentials provided during ${operation}.`;
  }

  if (error.message.includes('already exists') || error.message.includes('duplicate')) {
    console.log('❌ VALIDATION ERROR: Duplicate data');
    console.groupEnd();
    return `VALIDATION_ERROR: Account with this email already exists.`;
  }

  // Generic error with detailed info
  console.log('❌ UNKNOWN ERROR: Unhandled error type');
  console.log('Full error details:', errorDetails);
  console.groupEnd();
  
  return `UNKNOWN_ERROR: ${error.message || 'Unknown error'} during ${operation}. Check console for details.`;
}

// Enhanced backend client factory
function createBackendClient() {
  console.group('🔧 Backend Client Configuration');
  console.log('Backend base URL:', backendBaseUrl);
  console.log('Current origin:', window.location.origin);
  console.log('Environment detection:');
  console.log('- Is localhost:', window.location.hostname === 'localhost');
  console.log('- Is renosteps.app:', window.location.hostname === 'renosteps.app');
  console.log('- Hostname:', window.location.hostname);
  
  let client;
  
  if (backendBaseUrl) {
    console.log('✅ Using custom backend URL:', backendBaseUrl);
    client = backend.with({ 
      baseURL: backendBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  } else {
    console.log('✅ Using default backend configuration');
    client = backend;
  }
  
  console.groupEnd();
  return client;
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
          const baseClient = createBackendClient();
          const authenticatedBackend = baseClient.with({
            auth: async () => ({
              authorization: `Bearer ${savedToken}`,
            }),
          });
          
          const userProfile = await authenticatedBackend.auth.me();
          console.log('✅ Token verification successful');
          setUser({
            id: userProfile.id.toString(),
            email: userProfile.email,
          });
        } catch (error) {
          console.error('❌ Token verification failed:', error);
          const errorMessage = analyzeConnectionError(error, 'token_verification');
          console.log('Analyzed error:', errorMessage);
          
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
      console.group('🔐 Login Process Started');
      console.log('Email:', email);
      console.log('Backend URL:', backendBaseUrl);
      
      const baseClient = createBackendClient();
      console.log('✅ Backend client created');
      
      console.log('📡 Making login request...');
      const startTime = performance.now();
      
      const response = await baseClient.auth.login({ email, password });
      
      const endTime = performance.now();
      console.log(`✅ Login request completed in ${(endTime - startTime).toFixed(2)}ms`);
      console.log('Response received:', { 
        hasToken: !!response.token, 
        hasUser: !!response.user,
        userEmail: response.user?.email 
      });
      
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

      console.log('✅ Login successful - user data saved');
      console.groupEnd();

      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
    } catch (error) {
      console.group('❌ Login Failed');
      console.error('Raw login error:', error);
      
      const errorMessage = analyzeConnectionError(error, 'login');
      console.log('Final error message:', errorMessage);
      console.groupEnd();
      
      toast({
        title: 'Login Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      console.group('📝 Registration Process Started');
      console.log('Email:', email);
      console.log('Backend URL:', backendBaseUrl);
      
      const baseClient = createBackendClient();
      console.log('✅ Backend client created');
      
      console.log('📡 Making registration request...');
      const startTime = performance.now();
      
      // Add a timeout to the request
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT: Registration request timed out after 30 seconds')), 30000)
      );
      
      const response = await Promise.race([
        baseClient.auth.register({ email, password }),
        timeoutPromise
      ]);
      
      const endTime = performance.now();
      console.log(`✅ Registration request completed in ${(endTime - startTime).toFixed(2)}ms`);
      console.log('Response received:', { 
        hasToken: !!response.token, 
        hasUser: !!response.user,
        userEmail: response.user?.email 
      });
      
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

      console.log('✅ Registration successful - user data saved');
      console.groupEnd();

      toast({
        title: 'Success',
        description: 'Account created successfully',
      });
    } catch (error) {
      console.group('❌ Registration Failed');
      console.error('Raw registration error:', error);
      
      const errorMessage = analyzeConnectionError(error, 'registration');
      console.log('Final error message:', errorMessage);
      console.groupEnd();
      
      toast({
        title: 'Registration Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
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
