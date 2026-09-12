import multer from 'multer'

import path from 'path'

import fs from 'fs'

import { v4 as uuidv4 } from 'uuid'

import HttpError from '../errors/HttpError.js'

import { StatusCodes } from 'http-status-codes'


const uploadFolders = {


    thumbnail:
        'thumbnails',

    media:
        'media',

}



/*
|--------------------------------------------------------------------------
| Ensure Upload Directory Exists
|--------------------------------------------------------------------------
|
| Automatically creates folders if missing.
|
*/

const ensureUploadPath = (
    folder
) => {

    const uploadPath = path.join(
        process.cwd(),
        'src',
        'public',
        'uploads',
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
    | Dynamically determines upload folder based on field name.
    |
    */

    destination: (
        req,
        file,
        cb
    ) => {

        const folder =
            uploadFolders[
            file.fieldname
            ]

        console.log(folder)

        /*
        |--------------------------------------------------------------------------
        | Reject Unknown Upload Fields
        |--------------------------------------------------------------------------
        |
        | Prevents accidental uploads
        | to undefined destinations.
        |
        */

        if (!folder) {

            return cb(
                new HttpError(
                    `Invalid upload field: ${file.fieldname}`,
                    StatusCodes.BAD_REQUEST
                )
            )
        }

        cb(
            null,
            ensureUploadPath(folder)
        )
    },



    /*
    |--------------------------------------------------------------------------
    | File Naming Strategy
    |--------------------------------------------------------------------------
    |
    | Uses UUID to avoid collisions.
    |
    | Example:
    |   8d3d8f3f-....png
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

        // Use thumbnail_title for article thumbnails if provided
        if (file.fieldname === 'thumbnail' && req.body?.thumbnail_title) {
            const safeName = req.body.thumbnail_title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 80)

            const uniqueName = `${safeName}-${uuidv4().slice(0, 8)}${extension}`
            return cb(null, uniqueName)
        }

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
| Restricts uploads to image formats only.
|
*/

const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
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
                'Only jpg, png and webp images are allowed',
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
| Supports:
|   upload.single()
|   upload.array()
|   upload.fields()
|
*/

const upload = multer({

    storage,

    fileFilter,



    /*
    |--------------------------------------------------------------------------
    | Upload Limits
    |--------------------------------------------------------------------------
    */

    limits: {

        // 5 MB

        fileSize:
            5 * 1024 * 1024
    }
})



export default upload