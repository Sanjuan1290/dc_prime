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
} from '../controllers/documents.controller.js'
import { auth } from '../middlewares/auth.middleware.js'
import multer from 'multer'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})



router.get('/document-templates', auth, getDocumentTemplates)
router.get('/document-templates/:id', auth, getDocumentTemplate)
router.post('/document-templates', auth, createDocumentTemplate)
router.patch('/document-templates/:id', auth, updateDocumentTemplate)
router.delete('/document-templates/:id', auth, deleteDocumentTemplate)

router.get('/documents', auth, getDocuments)
router.get('/documents/:id', auth, getDocument)
router.post('/documents', auth, createDocument)
router.patch('/documents/:id', auth, updateDocument)

router.get('/client-units/:clientUnitId/documents', auth, getClientUnitDocuments)
router.get('/client-units/:clientUnitId/document-status', auth, getClientUnitDocumentStatus)
router.get('/client-units/:clientUnitId/documents/download-pdf', auth, downloadClientUnitDocumentsPdf)
router.post('/client-units/:clientUnitId/documents/checklist', auth, createChecklistForClientUnit)
router.post('/client-units/:clientUnitId/documents/apply-existing', auth, applyExistingReusableDocuments)

router.patch('/client-documents/:id/status', auth, updateClientDocumentStatus)
router.patch('/client-documents/:id/upload', auth, upload.single('file'), uploadClientDocumentFile)
router.get('/client-documents/:id/file', auth, openClientDocumentFile)

router.delete('/documents/:id', auth, deleteDocument)

export default router

