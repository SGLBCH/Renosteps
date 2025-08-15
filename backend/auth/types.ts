export interface User {
  id: number;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    createdAt: Date;
  };
}

export interface MessageResponse {
  message: string;
}
