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

  // vacancies are diffed/persisted separately in updateCompany() — don't run them
  // through the generic scalar-field comparator, which isn't array-diff-aware
  const { vacancies: vacancyPayloads, ...companyFields } = data;

  if (vacancyPayloads) {
    const existingCodes = new Set(existingCompany.vacancies.map((v) => v.code));
    const unknownCodes = vacancyPayloads
      .filter((v) => v.code)
      .filter((v) => !existingCodes.has(v.code));

    if (unknownCodes.length) {
      throw new HttpError(
        `Unknown vacancy code(s) for this company: ${unknownCodes.map((v) => v.code).join(", ")}`,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  const changes = comparator(existingCompany, companyFields);

  const hasChanges = !emptyObject(changes) || Boolean(vacancyPayloads);

  const updatedCompany = hasChanges
    ? await updateCompany(id, { ...changes, ...(vacancyPayloads ? { vacancies: vacancyPayloads } : {}) })
    : existingCompany;

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
