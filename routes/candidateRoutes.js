import { Router } from "express";

import { authenticateUser, authorizePermissions } from "#/middlewares/authentication/auth.js";
import {
  createCandidateController,
  updateCandidateController,
  deleteCandidateController,
  getAllCandidatesController,
  getSingleCandidateController,
} from "#/controllers/candidates/candidateController.js";

const router = Router();

router.route("/")
  .post(authenticateUser , createCandidateController)
  .get(authenticateUser,  getAllCandidatesController);

router.route("/:id")
  .all(authenticateUser)
  .get(getSingleCandidateController)
  .patch(updateCandidateController)
  .delete(deleteCandidateController);

export default router;
