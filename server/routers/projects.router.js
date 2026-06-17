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
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/projects', getProjects)
router.get('/projects/:id', getProject)
router.get('/projects/:id/document-requirements', getProjectDocumentRequirements)
router.put('/projects/:id/document-requirements', updateProjectDocumentRequirements)
router.post('/projects', createProject)
router.patch('/projects/:id', updateProject)

router.delete('/projects/:id', deleteProject)

export default router
