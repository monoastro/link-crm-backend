import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";

export function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: "access",
    },
    env.JWT_SECRET,
    { expiresIn: "30d" },
  );
}


export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.JWT_SECRET);

  if (payload.tokenType !== "access") {
    throw new Error("Invalid token type");
  }

  return payload;
}
