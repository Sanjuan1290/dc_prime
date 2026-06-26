import dotenv from 'dotenv'
import {
  GOOGLE_DRIVE_NOT_CONFIGURED_MESSAGE,
  isGoogleDriveConfigured,
  uploadFileToDrive,
} from './lib/googleDrive.js'

dotenv.config()

const run = async () => {
  if (!isGoogleDriveConfigured()) {
    console.log(GOOGLE_DRIVE_NOT_CONFIGURED_MESSAGE)
    return
  }

  try {
    const fileContent = Buffer.from(
      `Google Drive upload test from localhost.\nCreated at: ${new Date().toISOString()}`
    )

    const file = await uploadFileToDrive({
      buffer: fileContent,
      fileName: `dc-prime-drive-test-${Date.now()}.txt`,
      mimeType: 'text/plain',
      parentFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    })

    console.log('Google Drive working.')
    console.log('File:', file)
  } catch (error) {
    console.error('Google Drive test failed:')
    console.error(error.response?.data || error.message || error)
  }
}

run()

