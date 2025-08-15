import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { verifyToken } from "./jwt";

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string;
}

const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    if (!data.authorization) {
      throw APIError.unauthenticated("missing authorization header");
    }

    const token = data.authorization.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const payload = await verifyToken(token);
      
      return {
        userID: payload.userId.toString(),
        email: payload.email,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err);
    }
  }
);

// Configure the API gateway to use the auth handler
export const gw = new Gateway({ authHandler: auth });
