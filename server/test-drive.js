import dotenv from 'dotenv'
import { google } from 'googleapis'
import { Readable } from 'stream'

dotenv.config()

const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/drive'],
})

const drive = google.drive({
  version: 'v3',
  auth,
})

const bufferToStream = (buffer) => {
  const readable = new Readable()
  readable.push(buffer)
  readable.push(null)
  return readable
}

const run = async () => {
  try {
    const fileContent = Buffer.from(
      `Google Drive upload test from localhost.\nCreated at: ${new Date().toISOString()}`
    )

    const response = await drive.files.create({
      requestBody: {
        name: `dc-prime-drive-test-${Date.now()}.txt`,
        parents: [process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID],
        mimeType: 'text/plain',
      },
      media: {
        mimeType: 'text/plain',
        body: bufferToStream(fileContent),
      },
      fields: 'id, name, webViewLink',
    })

    console.log('Google Drive working.')
    console.log('File:', response.data)
  } catch (error) {
    console.error('Google Drive test failed:')
    console.error(error.response?.data || error)
  }
}

run()
