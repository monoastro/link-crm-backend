import { StatusCodes } from "http-status-codes";
import HttpError from "#/middlewares/errors/HttpError.js";
import {
  findCandidateById,
  createCandidate,
  deleteCandidate,
  findAllCandidates,
  updateCandidate,
} from "./candidateQueries.js";
import { createCandidateSchema, updateCandidateSchema } from "./candidateValidator.js";
import { comparator } from "#/utils/patcher.js";
import { emptyObject } from "#/utils/objectutils.js";
import { parseBody } from "#/utils/parse.js";

export async function createCandidateController(req, res) {
  const data = parseBody(createCandidateSchema, req.body);

  const candidate = await createCandidate(data);

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

  if (emptyObject(data)) {
    throw new HttpError("No valid fields to update", StatusCodes.BAD_REQUEST);
  }

  const existingCandidate = await findCandidateById(id);
  if (!existingCandidate) {
    throw new HttpError("Candidate not found", StatusCodes.NOT_FOUND);
  }

  const changes = comparator(existingCandidate, data);

  const updatedCandidate = emptyObject(changes)
    ? existingCandidate
    : await updateCandidate(id, changes);

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
