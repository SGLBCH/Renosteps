import { useAuth } from './AuthProvider';
import backend from '~backend/client';
import { useMemo } from 'react';

// Returns the backend client with authentication
export function useBackend() {
  const { token } = useAuth();
  
  return useMemo(() => {
    if (!token) {
      return backend;
    }
    
    return backend.with({
      auth: async () => ({
        authorization: `Bearer ${token}`,
      }),
    });
  }, [token]);
}
