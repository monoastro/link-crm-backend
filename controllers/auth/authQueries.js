import { eq } from "drizzle-orm";

import { db } from "#/config/db.js";
import { users } from "#/schema/index.js";
import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";

import HttpError from "#/middlewares/errors/HttpError.js";
import {
  createAccessToken,
} from "#/middlewares/authentication/jwt.js";

export async function findUserByUsername(username) {
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return user;
}

export async function findUserById(id) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  };
}

//================================================================================================================

export async function loginUser(data) {
  const user = await findUserByUsername(data.username);

  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    throw new HttpError("Invalid email or password", StatusCodes.UNAUTHORIZED);
  }

  return {
    user: publicUser(user),
    accessToken: createAccessToken(user),
  };
}

//================================================================================================================

//================================================================================================================

export async function getCurrentUser(id) {
  const user = await findUserById(id);

  if (!user) {
    throw new HttpError("User not found", StatusCodes.NOT_FOUND);
  }

  return publicUser(user);
}

