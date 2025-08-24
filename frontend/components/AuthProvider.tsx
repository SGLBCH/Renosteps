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

// Enhanced error analysis function with more detailed registration error detection
function analyzeConnectionError(error: any, operation: string): string {
  console.group(`🔍 Connection Error Analysis - ${operation}`);
  console.log('Raw error:', error);
  console.log('Error type:', typeof error);
  console.log('Error constructor:', error?.constructor?.name);
  console.log('Error message:', error?.message);
  console.log('Error stack:', error?.stack);
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
    stack: error?.stack || 'No stack trace',
    status: error?.status || error?.statusCode || 'No status',
    response: error?.response || 'No response data'
  };

  // Check for specific registration-related errors first
  if (operation === 'registration') {
    console.log('🔍 Analyzing registration-specific errors...');
    
    // Check if it's a validation error from the backend
    if (error?.message?.includes('validation') || error?.message?.includes('invalid')) {
      console.log('❌ VALIDATION ERROR: Registration data validation failed');
      console.groupEnd();
      return `VALIDATION_ERROR: ${error.message}. Please check your email and password format.`;
    }
    
    // Check if it's a duplicate email error
    if (error?.message?.includes('already exists') || error?.message?.includes('duplicate') || error?.message?.includes('unique')) {
      console.log('❌ DUPLICATE ERROR: Email already registered');
      console.groupEnd();
      return `DUPLICATE_ERROR: An account with this email already exists. Please try logging in instead.`;
    }
    
    // Check if it's a database connection error
    if (error?.message?.includes('database') || error?.message?.includes('connection') || error?.message?.includes('ECONNREFUSED')) {
      console.log('❌ DATABASE ERROR: Backend database connection failed');
      console.groupEnd();
      return `DATABASE_ERROR: Backend database is not accessible. The service may be starting up or experiencing issues.`;
    }
    
    // Check if it's a JWT secret configuration error
    if (error?.message?.includes('JWT') || error?.message?.includes('secret') || error?.message?.includes('token')) {
      console.log('❌ JWT CONFIG ERROR: JWT secret not configured');
      console.groupEnd();
      return `JWT_CONFIG_ERROR: Authentication service is not properly configured. JWT secret may be missing.`;
    }
    
    // Check if it's a backend service not running error
    if (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
      console.log('❌ SERVICE ERROR: Backend service not running');
      console.groupEnd();
      return `SERVICE_ERROR: Backend service is not running. Please ensure the Encore backend is started with 'encore run'.`;
    }
  }

  // Network-level errors
  if (error instanceof TypeError) {
    if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
      console.log('❌ NETWORK ERROR: Failed to fetch - likely CORS or network connectivity issue');
      console.log('Possible causes:');
      console.log('1. Backend server is not running (try: encore run)');
      console.log('2. CORS configuration issue');
      console.log('3. Network connectivity problem');
      console.log('4. Incorrect backend URL');
      console.groupEnd();
      return `NETWORK_ERROR: Cannot connect to backend server. Please ensure the backend is running with 'encore run' and check your network connection.`;
    }
    
    if (error.message.includes('NetworkError') || error.message.includes('network')) {
      console.log('❌ NETWORK ERROR: General network issue');
      console.groupEnd();
      return `NETWORK_ERROR: Network connectivity issue during ${operation}. Check your internet connection.`;
    }
    
    if (error.message.includes('Load failed')) {
      console.log('❌ LOAD ERROR: Resource loading failed');
      console.log('This often indicates:');
      console.log('1. Backend service is not running');
      console.log('2. Backend compilation errors');
      console.log('3. Database connection issues');
      console.log('4. Missing environment variables or secrets');
      console.groupEnd();
      return `LOAD_ERROR: Backend service failed to load. Please ensure 'encore run' is running and check the backend logs for any compilation or startup errors.`;
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
        return `HTTP_404: API endpoint not found. Check if backend route exists and the service is running properly.`;
      case 500:
        console.log('Internal server error - backend issue');
        console.groupEnd();
        return `HTTP_500: Backend server error during ${operation}. Check backend logs for database or configuration issues.`;
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
  console.log('🔧 Debugging suggestions:');
  console.log('1. Check if backend is running: encore run');
  console.log('2. Check backend logs for compilation errors');
  console.log('3. Verify JWT_SECRET is set in Encore secrets (or using default for development)');
  console.log('4. Check database connection');
  console.log('5. Verify CORS configuration');
  console.groupEnd();
  
  return `UNKNOWN_ERROR: ${error.message || 'Unknown error'} during ${operation}. Please ensure the backend is running with 'encore run' and check the console for details.`;
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
      console.log('Password length:', password.length);
      
      // Pre-flight validation
      if (!email || !email.trim()) {
        throw new Error('VALIDATION_ERROR: Email is required');
      }
      
      if (!password || password.length < 8) {
        throw new Error('VALIDATION_ERROR: Password must be at least 8 characters long');
      }
      
      const baseClient = createBackendClient();
      console.log('✅ Backend client created');
      
      console.log('📡 Making registration request...');
      const startTime = performance.now();
      
      // Add a timeout to the request with more detailed error handling
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT: Registration request timed out after 30 seconds. Backend may not be running.')), 30000)
      );
      
      let response;
      try {
        response = await Promise.race([
          baseClient.auth.register({ email, password }),
          timeoutPromise
        ]);
      } catch (requestError) {
        console.log('❌ Registration request failed:', requestError);
        
        // Check if it's a network error that might indicate backend is not running
        if (requestError instanceof TypeError && requestError.message.includes('Failed to fetch')) {
          throw new Error('NETWORK_ERROR: Cannot connect to backend. Please ensure the backend is running with "encore run".');
        }
        
        // Re-throw the original error for further analysis
        throw requestError;
      }
      
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
      console.log('Error details for debugging:');
      console.log('- Error type:', typeof error);
      console.log('- Error constructor:', error?.constructor?.name);
      console.log('- Error message:', error?.message);
      console.log('- Error stack:', error?.stack);
      
      const errorMessage = analyzeConnectionError(error, 'registration');
      console.log('Final error message:', errorMessage);
      console.log('🔧 Next steps to debug:');
      console.log('1. Check if backend is running: encore run');
      console.log('2. Check backend terminal for error messages');
      console.log('3. Verify JWT_SECRET is configured in Encore secrets (or using default for development)');
      console.log('4. Check database connection');
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
