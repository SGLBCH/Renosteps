import { useAuth } from './AuthProvider';
import { useMemo } from 'react';
import { http } from '../lib/http';

// Enhanced backend client with centralized HTTP handling
export function useBackend() {
  const { token } = useAuth();
  
  return useMemo(() => {
    console.group('🔧 Creating Authenticated Backend Client');
    console.log('Has auth token:', !!token);
    
    try {
      if (!token) {
        console.log('ℹ️ No auth token - returning unauthenticated client');
        console.groupEnd();
        return http.raw;
      }
      
      console.log('🔐 Adding authentication to client');
      const authenticatedClient = http.withAuth(token);
      
      console.groupEnd();
      return authenticatedClient.raw;
    } catch (error) {
      console.error('❌ Error creating backend client:', error);
      console.groupEnd();
      
      // Return basic client even if there's an error
      return http.raw;
    }
  }, [token]);
}

// Export the HTTP client for direct use
export { http };
