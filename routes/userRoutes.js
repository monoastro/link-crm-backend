import { Router } from "express";

import { authenticateUser, authorizePermissions } from "#/middlewares/authentication/auth.js";
import { 
  createUserController,
  updateUserController,
  deleteUserController,
  getAllUsersController,
  getSingleUserController,
} from "#/controllers/users/userController.js";

const router = Router();

router.route("/")
  .post(authenticateUser, authorizePermissions("admin"), createUserController)
  .get(authenticateUser, authorizePermissions("admin"), getAllUsersController);

router.route("/:id")
  .all(authenticateUser, authorizePermissions("admin"))
  .get(getSingleUserController)
  .patch(updateUserController)
  .delete(deleteUserController);


export default router;

