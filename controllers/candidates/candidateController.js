// src/modules/candidates/candidateController.js
import { StatusCodes } from "http-status-codes";
import HttpError from "#/middlewares/errors/HttpError.js";
import {
  findCandidateById,
  createCandidate,
  deleteCandidate,
  findAllCandidates,
  updateCandidate,
  syncOtherDocuments,
} from "./candidateQueries.js";
import { createCandidateSchema, updateCandidateSchema } from "./candidateValidator.js";
import { comparator } from "#/utils/patcher.js";
import { emptyObject } from "#/utils/objectutils.js";
import { parseBody } from "#/utils/parse.js";

const ROLES_THAT_OWN_DOCUMENTS = ["admin", "frontdesk"];

function canEditDocuments(role) {
  return ROLES_THAT_OWN_DOCUMENTS.includes(role);
}

function buildOtherDocumentsFromFiles(files) {
  const rawFiles = normalizeToArray(files?.other);
  const photoFile = normalizeToArray(files?.photo)

  const otherFiles = rawFiles.map((file) => ({
    type: "other",
    fileType: file.mimetype === "application/pdf" ? "pdf" : "image",
    url: `/uploads/documents/other/${file.filename}`,
  }));

  const photoFiles = photoFile.map((file) => ({
    type: "photo",
    fileType: file.mimetype === "application/pdf" ? "pdf" : "image",
    url: `/uploads/documents/photo/${file.filename}`,
  }));

  const allFiles = [...otherFiles, ...photoFiles];

  return allFiles;
}

function normalizeToArray(value) {
  if (value === undefined || value === null || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

//===================================================================

export async function createCandidateController(req, res) {
  const data = parseBody(createCandidateSchema, req.body);
  const documents = buildOtherDocumentsFromFiles(req.files);

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
  const canTouchDocuments = canEditDocuments(req.user?.role);

  if (emptyObject(data) && !canTouchDocuments) {
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

  if (canTouchDocuments) {
    const newDocuments = buildOtherDocumentsFromFiles(req.files);
    const keepUrls = normalizeToArray(req.body.other_existing);
    await syncOtherDocuments(id, keepUrls, newDocuments);
  }

  const updatedCandidate = await findCandidateById(id);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Candidate updated successfully",
    candidate: updatedCandidate,
  });
}

//===================================================================

export async function getAllCandidatesController(req, res) {
  const result = await findAllCandidates(req.query);

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
