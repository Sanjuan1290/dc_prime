import express from 'express'
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/clients.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/clients', auth, getClients)
router.get('/clients/:id', auth, getClient)
router.post('/clients', auth, createClient)
router.patch('/clients/:id', auth, updateClient)

router.delete('/clients/:id', auth, deleteClient)

export default router
