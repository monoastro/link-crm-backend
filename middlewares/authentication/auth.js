import { StatusCodes } from "http-status-codes";

import HttpError from "../errors/HttpError.js";
import { verifyAccessToken } from "./jwt.js";

export function authenticateUser(req, res, next) {
    const token = req.signedCookies.accessToken;

    if (!token) {
        throw new HttpError(
            "Authentication required",
            StatusCodes.UNAUTHORIZED,
        );
    }

    try {
        const payload = verifyAccessToken(token);

        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };

        next();
    } catch {
        throw new HttpError(
            "Invalid or expired access token",
            StatusCodes.UNAUTHORIZED,
        );
    }
}

export async function optionalAuthenticateUser(req, res, next) {
    const token = req.signedCookies?.accessToken;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const payload = verifyAccessToken(token);

        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };

        next();
    } catch {
        req.user = null;
        next();
    }
}

export function authorizePermissions(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new HttpError(
                "You are not authorized to visit this route",
                StatusCodes.FORBIDDEN,
            );
        }

        next();
    };
}
