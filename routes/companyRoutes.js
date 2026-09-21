// src/modules/companies/companyRoutes.js
import { Router } from "express";

import { authenticateUser } from "#/middlewares/authentication/auth.js";
import {
  createCompanyController,
  updateCompanyController,
  deleteCompanyController,
  getAllCompaniesController,
  getSingleCompanyController,
} from "#/controllers/companies/companyController.js";

const router = Router();

router.route("/")
  .post(authenticateUser, createCompanyController)
  .get(authenticateUser, getAllCompaniesController);

router.route("/:id")
  .all(authenticateUser)
  .get(getSingleCompanyController)
  .patch(updateCompanyController)
  .delete(deleteCompanyController);

export default router;
