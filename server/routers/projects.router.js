import express from 'express'
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projects.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/projects', auth, getProjects)
router.get('/projects/:id', auth, getProject)
router.post('/projects', auth, createProject)
router.patch('/projects/:id', auth, updateProject)

router.delete('/projects/:id', auth, deleteProject)

export default router
