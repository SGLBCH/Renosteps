import { useAuth } from './AuthProvider';
import backend from '~backend/client';
import { useMemo } from 'react';
import { backendBaseUrl } from '../config';

// Returns the backend client with authentication and optional baseURL override.
export function useBackend() {
  const { token } = useAuth();
  
  return useMemo(() => {
    // Start with optional base URL override when running outside the Leap runtime.
    const client = backendBaseUrl
      ? backend.with({ baseURL: backendBaseUrl })
      : backend;

    if (!token) {
      return client;
    }
    
    return client.with({
      auth: async () => ({
        authorization: `Bearer ${token}`,
      }),
    });
  }, [token]);
}
