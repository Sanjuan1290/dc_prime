import express from 'express'
import {
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
} from '../controllers/documents.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/documents', auth, getDocuments)
router.get('/documents/:id', auth, getDocument)
router.post('/documents', auth, createDocument)
router.patch('/documents/:id', auth, updateDocument)

router.get('/client-units/:clientUnitId/documents', auth, getClientUnitDocuments)
router.get('/client-units/:clientUnitId/document-status', auth, getClientUnitDocumentStatus)
router.post('/client-units/:clientUnitId/documents/checklist', auth, createChecklistForClientUnit)
router.post('/client-units/:clientUnitId/documents/apply-existing', auth, applyExistingReusableDocuments)

router.patch('/client-documents/:id/status', auth, updateClientDocumentStatus)

router.delete('/documents/:id', auth, deleteDocument)

export default router
