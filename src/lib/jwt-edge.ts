import { jwtVerify } from "jose";

export type JwtUserPayloadEdge = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
};

const secretKey = process.env.JWT_SECRET || "dev-secret-change-me";
const secret = new TextEncoder().encode(secretKey);

export async function verifyJwtOnEdge(
  token: string
): Promise<JwtUserPayloadEdge | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: String(payload.id),
      email: String(payload.email),
      role: (payload.role as "USER" | "ADMIN") ?? "USER",
    };
  } catch {
    return null;
  }
}

