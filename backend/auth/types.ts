// User object returned to clients (without sensitive data)
export interface User {
  id: number;
  email: string;
  createdAt: Date;
}

// Request body for user registration
export interface RegisterRequest {
  email: string;
  password: string;
}

// Request body for user login
export interface LoginRequest {
  email: string;
  password: string;
}

// Response for successful authentication (register/login)
export interface AuthResponse {
  token: string;
  user: User;
}

// Auth data stored in request context after JWT verification
export interface AuthData {
  userID: string;
  email: string;
}
