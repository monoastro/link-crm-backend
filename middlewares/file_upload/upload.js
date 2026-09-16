// src/middlewares/upload/candidateDocumentsUpload.js
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import HttpError from '../errors/HttpError.js'
import { StatusCodes } from 'http-status-codes'

/*
|--------------------------------------------------------------------------
| Allowed Document Types
|--------------------------------------------------------------------------
|
| Must match the documentTypeEnum values in the schema.
| Each value here is both:
|   - the exact field name the frontend uploads under
|     e.g. <input type="file" name="visa" />  ->  req.files.visa
|   - the subfolder name the file gets saved into
|     e.g. src/public/uploads/documents/visa/<uuid>.pdf
|
*/

const ALLOWED_DOCUMENT_FIELDS = [
    'passport',
    'visa',
    'citizenship',
    'medical',
    'offer_letter',
    'ticket',
    'photo',
    'cv',
    'other',
]



/*
|--------------------------------------------------------------------------
| Ensure Upload Directory Exists
|--------------------------------------------------------------------------
*/

const ensureUploadPath = (
    folder
) => {

    const uploadPath = path.join(
        process.cwd(),
        'src',
        'public',
        'uploads',
        'documents',
        folder
    )

    if (
        !fs.existsSync(uploadPath)
    ) {

        console.log(`making folder... ${uploadPath}`)

        fs.mkdirSync(
            uploadPath,
            {
                recursive: true
            }
        )
    }

    return uploadPath
}



/*
|--------------------------------------------------------------------------
| Multer Storage Configuration
|--------------------------------------------------------------------------
*/

const storage = multer.diskStorage({

    /*
    |--------------------------------------------------------------------------
    | Destination Resolver
    |--------------------------------------------------------------------------
    |
    | Each document type gets its own subfolder, named after the field:
    |   documents/visa/
    |   documents/passport/
    |   documents/citizenship/
    |   ...
    |
    */

    destination: (
        req,
        file,
        cb
    ) => {

        if (
            !ALLOWED_DOCUMENT_FIELDS.includes(
                file.fieldname
            )
        ) {

            return cb(
                new HttpError(
                    `Invalid document field: ${file.fieldname}`,
                    StatusCodes.BAD_REQUEST
                )
            )
        }

        cb(
            null,
            ensureUploadPath(file.fieldname)
        )
    },



    /*
    |--------------------------------------------------------------------------
    | File Naming Strategy
    |--------------------------------------------------------------------------
    |
    | <uuid>.<ext>
    |
    | Folder already tells us the type, so the filename itself
    | doesn't need the fieldname prefix anymore.
    |
    | Example:
    |   documents/visa/8d3d8f3f-....pdf
    |
    */

    filename: (
        req,
        file,
        cb
    ) => {

        const extension =
            path.extname(
                file.originalname
            )

        const uniqueName =
            `${uuidv4()}${extension}`

        cb(
            null,
            uniqueName
        )
    }
})



/*
|--------------------------------------------------------------------------
| Allowed File Types
|--------------------------------------------------------------------------
|
| Candidate documents support images and PDFs only.
|
*/

const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
]



/*
|--------------------------------------------------------------------------
| File Filter
|--------------------------------------------------------------------------
*/

const fileFilter = (
    req,
    file,
    cb
) => {

    if (
        !allowedMimeTypes.includes(
            file.mimetype
        )
    ) {

        return cb(
            new HttpError(
                'Only jpg, png, webp images and PDF files are allowed',
                StatusCodes.BAD_REQUEST
            )
        )
    }

    cb(null, true)
}



/*
|--------------------------------------------------------------------------
| Multer Upload Middleware
|--------------------------------------------------------------------------
|
| One optional file per document type field, e.g.:
|   uploadCandidateDocuments.fields([
|     { name: 'passport', maxCount: 1 },
|     { name: 'visa', maxCount: 1 },
|     ...
|   ])
|
| maxCount: 1 per field enforces "no two visas in a single request"
| at the multer level, in addition to the DB unique constraint.
|
*/

const uploadCandidateDocuments = multer({

    storage,

    fileFilter,

    limits: {

        // 10 MB — PDFs tend to be larger than images
        fileSize:
            10 * 1024 * 1024
    }

}).fields(
    ALLOWED_DOCUMENT_FIELDS.map((field) => ({
        name: field,
        maxCount: 1,
    }))
)



export default uploadCandidateDocuments
export { ALLOWED_DOCUMENT_FIELDS }
