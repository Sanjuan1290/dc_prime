import express from 'express'
import {
  getDocumentTemplates,
  getDocumentTemplate,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate,
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getClientUnitDocuments,
  createChecklistForClientUnit,
  updateClientDocumentStatus,
  applyExistingReusableDocuments,
  getClientUnitDocumentStatus,
  uploadClientDocumentFile,
  openClientDocumentFile,
  downloadClientUnitDocumentsPdf,
  openClientDocumentUploadedFile,
  deleteClientDocumentUploadedFile,
} from '../controllers/documents.controller.js'
import { auth, adminOnly } from '../middlewares/auth.middleware.js'
import multer from 'multer'

const router = express.Router()

const DOCUMENT_UPLOAD_ERROR_MESSAGE =
  'Unsupported file type. Upload JPG or PNG images only.'

const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
])

const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
])

const rejectUnsupportedDocument = () => {
  const error = new Error(DOCUMENT_UPLOAD_ERROR_MESSAGE)
  error.status = 400
  error.code = 'UNSUPPORTED_DOCUMENT_TYPE'
  return error
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = (file.originalname.split('.').pop() || '').toLowerCase()

    if (
      ALLOWED_DOCUMENT_MIME_TYPES.has(file.mimetype) &&
      ALLOWED_DOCUMENT_EXTENSIONS.has(extension)
    ) {
      cb(null, true)
      return
    }

    cb(rejectUnsupportedDocument())
  },
})

router.use(auth, adminOnly)

router.get('/document-templates', getDocumentTemplates)
router.get('/document-templates/:id', getDocumentTemplate)
router.post('/document-templates', createDocumentTemplate)
router.patch('/document-templates/:id', updateDocumentTemplate)
router.delete('/document-templates/:id', deleteDocumentTemplate)

router.get('/documents', getDocuments)
router.get('/documents/:id', getDocument)
router.post('/documents', createDocument)
router.patch('/documents/:id', updateDocument)

router.get('/client-units/:clientUnitId/documents', getClientUnitDocuments)
router.get('/client-units/:clientUnitId/document-status', getClientUnitDocumentStatus)
router.get('/client-units/:clientUnitId/documents/download-pdf', downloadClientUnitDocumentsPdf)
router.post('/client-units/:clientUnitId/documents/checklist', createChecklistForClientUnit)
router.post('/client-units/:clientUnitId/documents/apply-existing', applyExistingReusableDocuments)

router.patch('/client-documents/:id/status', updateClientDocumentStatus)
router.patch('/client-documents/:id/upload', upload.fields([{ name: 'files', maxCount: 10 }, { name: 'file', maxCount: 1 }]), uploadClientDocumentFile)
router.get('/client-documents/:id/file', openClientDocumentFile)
router.get('/client-document-files/:fileId/file', openClientDocumentUploadedFile)
router.delete('/client-document-files/:fileId', deleteClientDocumentUploadedFile)

router.delete('/documents/:id', deleteDocument)

export default router
