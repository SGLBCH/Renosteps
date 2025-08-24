import { useAuth } from './AuthProvider';
import backend from '~backend/client';
import { useMemo } from 'react';
import { backendBaseUrl } from '../config';

// Enhanced backend client with detailed error handling and resilience
export function useBackend() {
  const { token } = useAuth();
  
  return useMemo(() => {
    console.group('🔧 Creating Authenticated Backend Client');
    console.log('Backend base URL:', backendBaseUrl);
    console.log('Has auth token:', !!token);
    console.log('Current origin:', window.location.origin);
    
    // Start with optional base URL override when running outside the Leap runtime.
    let client;
    
    try {
      if (backendBaseUrl) {
        console.log('✅ Using custom backend URL configuration');
        client = backend.with({ 
          baseURL: backendBaseUrl,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          // Add timeout and retry configuration
          timeout: 15000, // 15 second timeout
        });
      } else {
        console.log('✅ Using default backend configuration');
        client = backend;
      }

      if (!token) {
        console.log('ℹ️ No auth token - returning unauthenticated client');
        console.groupEnd();
        return client;
      }
      
      console.log('🔐 Adding authentication to client');
      const authenticatedClient = client.with({
        auth: async () => {
          console.log('🎫 Providing auth token for request');
          return {
            authorization: `Bearer ${token}`,
          };
        },
      });
      
      console.groupEnd();
      return authenticatedClient;
    } catch (error) {
      console.error('❌ Error creating backend client:', error);
      console.groupEnd();
      
      // Return a basic client even if there's an error
      return backend;
    }
  }, [token]);
}
