import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import HttpError from "#/middlewares/errors/HttpError.js";
import {
  findUserById,
  findUserByUsername,
  createUser,
  deleteUser,
  findAllUsers,
  updateUser,
} from "./userQueries.js";
import { createUserSchema, updateUserSchema } from "./userValidator.js";
import { comparator } from "#/utils/patcher.js";
import { emptyObject } from "#/utils/objectutils.js";
import { parseBody } from "#/utils/parse.js";

export async function createUserController(req, res) {
  const data = parseBody(createUserSchema, req.body);

  // Check if username already exists
  const existingUser = await findUserByUsername(data.username);
  if (existingUser) {
    throw new HttpError(
      `Username "${data.username}" already exists`,
      StatusCodes.CONFLICT,
    );
  }

  if (data.role === "admin") {
    throw new HttpError(
      "Cannot create a user with admin role",
      StatusCodes.FORBIDDEN,
    );
  }

  // Hash the password before storing it
  const hashedPassword = await bcrypt.hash(data.password, 10);
  data.password = hashedPassword;

  const user = await createUser(data);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "User created successfully",
    user,
  });
}

//===================================================================

export async function updateUserController(req, res) {
  const { id } = req.params;
  const data = parseBody(updateUserSchema, req.body);

  if (emptyObject(data)) {
    throw new HttpError("No valid fields to update", StatusCodes.BAD_REQUEST);
  }

  const existingUser = await findUserById(id);
  if (!existingUser) {
    throw new HttpError("User not found", StatusCodes.NOT_FOUND);
  }

  if (existingUser.role === "admin") {
    throw new HttpError(
      "Cannot update an admin user",
      StatusCodes.FORBIDDEN,
    );
  }

  if (data.role === "admin") {
    throw new HttpError(
      "Cannot promote a user to admin",
      StatusCodes.FORBIDDEN,
    );
  }

  const changes = comparator(existingUser, data);

  const filteredUser = {
    id: existingUser.id,
    username: existingUser.username,
    role: existingUser.role,
    createdAt: existingUser.createdAt,
  };

  const updatedUser = emptyObject(changes) ? filteredUser : await updateUser(id, changes);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "User updated successfully",
    user: updatedUser,
  });
}

//===================================================================
export async function getAllUsersController(req, res) {
  const { query, page, pageSize, role } = req.query;
  const result = await findAllUsers({ query, page, pageSize, role });
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Users fetched successfully",
    ...result,
  });
}

//===================================================================
export async function getSingleUserController(req, res) {
  const { id } = req.params;
  const user = await findUserById(id);
  if (!user) {
    throw new HttpError("User not found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({
    success: true,
    message: "User fetched successfully",
    item: user,
  });
}

//===================================================================
export async function deleteUserController(req, res) {
  const { id } = req.params;
  const existingUser = await findUserById(id);
  if (!existingUser) {
    throw new HttpError("User not found", StatusCodes.NOT_FOUND);
  }
  if (existingUser.role === "admin") {
    throw new HttpError(
      "Cannot delete an admin user",
      StatusCodes.FORBIDDEN,
    );
  }
  await deleteUser(id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "User deleted successfully",
  });
}
