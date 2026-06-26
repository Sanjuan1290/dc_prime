import { v2 as cloudinary } from 'cloudinary'

export const CLOUDINARY_NOT_CONFIGURED_MESSAGE =
  'Cloudinary storage is not configured yet. Add Cloudinary credentials in .env.'

export const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  )
}

export const createCloudinaryNotConfiguredError = () => {
  const error = new Error(CLOUDINARY_NOT_CONFIGURED_MESSAGE)
  error.status = 503
  error.code = 'CLOUDINARY_NOT_CONFIGURED'
  return error
}

export const configureCloudinary = () => {
  if (!isCloudinaryConfigured()) {
    throw createCloudinaryNotConfiguredError()
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })

  return cloudinary
}

export const safeCloudinaryPathPart = (value = 'file') => {
  return String(value || 'file')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'file'
}

export const getCloudinaryBaseFolder = () => {
  return process.env.CLOUDINARY_UPLOAD_FOLDER || 'dc-prime'
}

export const getClientDocumentFolder = (documentRow) => {
  const envFolder = process.env.NODE_ENV === 'production' ? 'production' : 'development'
  const clientFolder = `client-${documentRow.client_id}-${safeCloudinaryPathPart(documentRow.client_name)}`
  const unitFolder = safeCloudinaryPathPart(documentRow.unit_id)
  const documentFolder = safeCloudinaryPathPart(documentRow.document_name)

  return [
    getCloudinaryBaseFolder(),
    envFolder,
    'clients',
    clientFolder,
    'units',
    unitFolder,
    'documents',
    documentFolder,
  ].join('/')
}

export const uploadBufferToCloudinary = ({ buffer, fileName, mimeType, folder }) => {
  const client = configureCloudinary()

  return new Promise((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        filename_override: fileName,
        context: {
          original_file_name: fileName,
          mime_type: mimeType,
        },
      },
      (error, result) => {
        if (error) return reject(error)
        return resolve(result)
      }
    )

    uploadStream.end(buffer)
  })
}

export const deleteCloudinaryAsset = async ({ publicId, resourceType = 'image' }) => {
  if (!publicId) return null

  const client = configureCloudinary()
  return client.uploader.destroy(publicId, {
    resource_type: resourceType || 'image',
    invalidate: true,
  })
}
