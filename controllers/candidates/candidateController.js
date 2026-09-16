// src/modules/candidates/candidateController.js
import { StatusCodes } from "http-status-codes";
import HttpError from "#/middlewares/errors/HttpError.js";
import {
  findCandidateById,
  createCandidate,
  deleteCandidate,
  findAllCandidates,
  updateCandidate,
  upsertCandidateDocuments,
} from "./candidateQueries.js";
import { createCandidateSchema, updateCandidateSchema } from "./candidateValidator.js";
import { comparator } from "#/utils/patcher.js";
import { emptyObject } from "#/utils/objectutils.js";
import { parseBody } from "#/utils/parse.js";
import { ALLOWED_DOCUMENT_FIELDS } from "#/middlewares/file_upload/upload.js";

function buildDocumentsFromFiles(files) {
  if (!files) return [];

  const docs = [];

  for (const type of ALLOWED_DOCUMENT_FIELDS) {
    const file = files[type]?.[0];
    if (!file) continue;

    const fileType = file.mimetype === "application/pdf" ? "pdf" : "image";
    const url = `/uploads/documents/${type}/${file.filename}`;

    docs.push({ type, fileType, url });
  }

  return docs;
}

//===================================================================

export async function createCandidateController(req, res) {
  const data = parseBody(createCandidateSchema, req.body);

  const documents = buildDocumentsFromFiles(req.files);

  const candidate = await createCandidate({ ...data, documents });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Candidate created successfully",
    candidate,
  });
}

//===================================================================

export async function updateCandidateController(req, res) {
  const { id } = req.params;
  const data = parseBody(updateCandidateSchema, req.body);
  const newDocuments = buildDocumentsFromFiles(req.files);

  if (emptyObject(data) && !newDocuments.length) {
    throw new HttpError("No valid fields to update", StatusCodes.BAD_REQUEST);
  }

  const existingCandidate = await findCandidateById(id);
  if (!existingCandidate) {
    throw new HttpError("Candidate not found", StatusCodes.NOT_FOUND);
  }

  const changes = comparator(existingCandidate, data);

  if (!emptyObject(changes)) {
    await updateCandidate(id, changes);
  }

  if (newDocuments.length) {
    await upsertCandidateDocuments(id, newDocuments);
  }

  // Re-fetch so the response always reflects the true current state —
  // both the candidate columns and the full, merged documents list.
  const updatedCandidate = await findCandidateById(id);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Candidate updated successfully",
    candidate: updatedCandidate,
  });
}

//===================================================================

export async function getAllCandidatesController(req, res) {
  const { query, page, pageSize, appliedCountry } = req.query;
  const result = await findAllCandidates({ query, page, pageSize, appliedCountry });
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Candidates fetched successfully",
    ...result,
  });
}

//===================================================================

export async function getSingleCandidateController(req, res) {
  const { id } = req.params;
  const candidate = await findCandidateById(id);
  if (!candidate) {
    throw new HttpError("Candidate not found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Candidate fetched successfully",
    item: candidate,
  });
}

//===================================================================

export async function deleteCandidateController(req, res) {
  const { id } = req.params;
  const existingCandidate = await findCandidateById(id);
  if (!existingCandidate) {
    throw new HttpError("Candidate not found", StatusCodes.NOT_FOUND);
  }
  await deleteCandidate(id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Candidate deleted successfully",
  });
}
