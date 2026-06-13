import express from 'express'
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  updateClientProfile,
  replaceClientCoBuyers,
  replaceClientEmploymentDetails,
  deleteClient
} from '../controllers/clients.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/clients', auth, getClients)
router.get('/clients/:id', auth, getClient)
router.post('/clients', auth, createClient)
router.patch('/clients/:id', auth, updateClient)
router.patch('/clients/:id/profile', auth, updateClientProfile)
router.put('/clients/:id/co-buyers', auth, replaceClientCoBuyers)
router.put('/clients/:id/employment-details', auth, replaceClientEmploymentDetails)

router.delete('/clients/:id', auth, deleteClient)

export default router
