import express from 'express'
import {
  getProjects,
  getProject,
  getProjectDocumentRequirements,
  updateProjectDocumentRequirements,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projects.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/projects', auth, getProjects)
router.get('/projects/:id', auth, getProject)
router.get('/projects/:id/document-requirements', auth, getProjectDocumentRequirements)
router.put('/projects/:id/document-requirements', auth, updateProjectDocumentRequirements)
router.post('/projects', auth, createProject)
router.patch('/projects/:id', auth, updateProject)

router.delete('/projects/:id', auth, deleteProject)

export default router

