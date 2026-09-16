import { Router } from "express";

import { authenticateUser, authorizePermissions } from "#/middlewares/authentication/auth.js";
import uploadCandidateDocuments from "#/middlewares/file_upload/upload.js";
import {
  createCandidateController,
  updateCandidateController,
  deleteCandidateController,
  getAllCandidatesController,
  getSingleCandidateController,
} from "#/controllers/candidates/candidateController.js";

const router = Router();

router.route("/")
  .post(authenticateUser, uploadCandidateDocuments, createCandidateController)
  .get(authenticateUser, getAllCandidatesController);

router.route("/:id")
  .all(authenticateUser)
  .get(getSingleCandidateController)
  .patch(uploadCandidateDocuments, updateCandidateController)
  .delete(deleteCandidateController);

export default router;
