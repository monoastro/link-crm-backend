// src/middlewares/upload/candidateDocumentsUpload.js
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import HttpError from '../errors/HttpError.js'
import { StatusCodes } from 'http-status-codes'

const ALLOWED_DOCUMENT_FIELDS = ['photo', 'other']

function ensureUploadPath(folder) {
  const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'documents', folder)
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true })
  }
  return uploadPath
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!ALLOWED_DOCUMENT_FIELDS.includes(file.fieldname)) {
      return cb(new HttpError(`Invalid document field: ${file.fieldname}`, StatusCodes.BAD_REQUEST))
    }
    cb(null, ensureUploadPath(file.fieldname))
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
  },
})

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

function fileFilter(req, file, cb) {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new HttpError('Only jpg, png, webp images and PDF files are allowed', StatusCodes.BAD_REQUEST))
  }
  cb(null, true)
}

const uploadCandidateDocuments = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'other', maxCount: 20 },
  { name: 'photo', maxCount: 1 },
])

export default uploadCandidateDocuments
export { ALLOWED_DOCUMENT_FIELDS }
