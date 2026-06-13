import { google } from 'googleapis'

const requiredEnv = (name) => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is missing in .env`)
  return value
}

const getPrivateKey = () => {
  const rawKey = requiredEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')
  return rawKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n')
}

export const getDriveClient = () => {
  const auth = new google.auth.JWT({
    email: requiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    key: getPrivateKey(),
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  return google.drive({ version: 'v3', auth })
}

const escapeDriveName = (name = '') => String(name).replace(/'/g, "\\'")

export const safeDriveName = (value = 'file') => {
  return String(value || 'file')
    .trim()
    .replace(/[\\/:*?"<>|#%{}~&]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 120) || 'file'
}

export const createDriveFolderIfMissing = async ({ name, parentFolderId }) => {
  const drive = getDriveClient()
  const folderName = safeDriveName(name)
  const safeName = escapeDriveName(folderName)
  const safeParent = escapeDriveName(parentFolderId)

  const existing = await drive.files.list({
    q: `name='${safeName}' and '${safeParent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id,name,webViewLink)',
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  })

  if (existing.data.files?.length) return existing.data.files[0]

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id,name,webViewLink',
    supportsAllDrives: true,
  })

  return created.data
}

export const uploadFileToDrive = async ({ buffer, fileName, mimeType, parentFolderId }) => {
  const drive = getDriveClient()
  const { Readable } = await import('stream')
  const stream = Readable.from(buffer)

  try {
    const response = await drive.files.create({
      requestBody: {
        name: safeDriveName(fileName),
        parents: [parentFolderId],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id,name,mimeType,size,webViewLink,webContentLink',
      supportsAllDrives: true,
    })

    return response.data
  } catch (error) {
    const message = error?.response?.data?.error?.message || error.message
    throw new Error(
      `Google Drive upload failed. Make sure the root folder is inside a Shared Drive and shared with the service account. Details: ${message}`
    )
  }
}

export const getDriveFileBuffer = async (fileId) => {
  const drive = getDriveClient()
  const response = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' }
  )

  return Buffer.from(response.data)
}

export const deleteDriveFile = async (fileId) => {
  if (!fileId) return
  const drive = getDriveClient()
  await drive.files.delete({ fileId, supportsAllDrives: true })
}
