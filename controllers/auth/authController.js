import { StatusCodes } from "http-status-codes";

import HttpError from "#/middlewares/errors/HttpError.js";
import { env } from "#/config/env.js";
import { loginSchema } from "./authValidator.js";
import { getCurrentUser, loginUser } from "./authQueries.js";
import { parseBody } from "#/utils/parse.js";

const baseCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  signed: true,
};

function setAuthCookies(res, accessToken) {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export async function login(req, res) {
  const data = parseBody(loginSchema, req.body);
  const result = await loginUser(data);

  setAuthCookies(res, result.accessToken);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    user: result.user,
  });
}

export async function logout(req, res) {
  res.clearCookie("accessToken", baseCookieOptions);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Logout successful",
  });
}

export async function me(req, res) {
  const user = await getCurrentUser(req.user.id);

  res.status(StatusCodes.OK).json({
    success: true,
    user,
  });
}

