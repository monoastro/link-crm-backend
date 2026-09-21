// src/modules/companies/companyController.js
import { StatusCodes } from "http-status-codes";
import HttpError from "#/middlewares/errors/HttpError.js";
import {
  findCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  findAllCompanies,
} from "./companyQueries.js";
import { createCompanySchema, updateCompanySchema } from "./companyValidator.js";
import { comparator } from "#/utils/patcher.js";
import { emptyObject } from "#/utils/objectutils.js";
import { parseBody } from "#/utils/parse.js";

export async function createCompanyController(req, res) {
  const data = parseBody(createCompanySchema, req.body);

  if (data.parentCompanyId) {
    const parent = await findCompanyById(data.parentCompanyId);
    if (!parent) {
      throw new HttpError("Parent company not found", StatusCodes.BAD_REQUEST);
    }
  }

  const company = await createCompany(data);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Company created successfully",
    company,
  });
}

//===================================================================

export async function updateCompanyController(req, res) {
  const { id } = req.params;
  const data = parseBody(updateCompanySchema, req.body);

  if (emptyObject(data)) {
    throw new HttpError("No valid fields to update", StatusCodes.BAD_REQUEST);
  }

  const existingCompany = await findCompanyById(id);
  if (!existingCompany) {
    throw new HttpError("Company not found", StatusCodes.NOT_FOUND);
  }

  if (data.parentCompanyId) {
    if (data.parentCompanyId === id) {
      throw new HttpError("A company cannot be its own parent", StatusCodes.BAD_REQUEST);
    }

    const parent = await findCompanyById(data.parentCompanyId);
    if (!parent) {
      throw new HttpError("Parent company not found", StatusCodes.BAD_REQUEST);
    }
  }

  const changes = comparator(existingCompany, data);

  const updatedCompany = emptyObject(changes)
    ? existingCompany
    : await updateCompany(id, changes);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Company updated successfully",
    company: updatedCompany,
  });
}

//===================================================================

export async function getAllCompaniesController(req, res) {
  const { query, page, pageSize } = req.query;
  const result = await findAllCompanies({ query, page, pageSize });
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Companies fetched successfully",
    ...result,
  });
}

//===================================================================

export async function getSingleCompanyController(req, res) {
  const { id } = req.params;
  const company = await findCompanyById(id);
  if (!company) {
    throw new HttpError("Company not found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Company fetched successfully",
    item: company,
  });
}

//===================================================================

export async function deleteCompanyController(req, res) {
  const { id } = req.params;
  const existingCompany = await findCompanyById(id);
  if (!existingCompany) {
    throw new HttpError("Company not found", StatusCodes.NOT_FOUND);
  }
  await deleteCompany(id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Company deleted successfully",
  });
}
