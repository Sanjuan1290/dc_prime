import express from 'express'
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  getClientUnitDocuments,
  createChecklistForClientUnit,
  updateClientDocumentStatus,
  applyExistingReusableDocuments,
  getClientUnitDocumentStatus
} from '../controllers/documents.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/documents', auth, getDocuments)
router.get('/documents/:id', auth, getDocument)
router.post('/documents', auth, createDocument)
router.patch('/documents/:id', auth, updateDocument)

router.get('/client-units/:clientUnitId/documents', auth, getClientUnitDocuments)
router.post('/client-units/:clientUnitId/documents/create-checklist', auth, createChecklistForClientUnit)
router.post('/client-units/:clientUnitId/documents/apply-existing', auth, applyExistingReusableDocuments)
router.get('/client-units/:clientUnitId/document-status', auth, getClientUnitDocumentStatus)
router.patch('/client-documents/:id/status', auth, updateClientDocumentStatus)

export default router
