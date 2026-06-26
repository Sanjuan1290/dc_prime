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
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/clients', getClients)
router.get('/clients/:id', getClient)
router.post('/clients', createClient)
router.patch('/clients/:id', updateClient)
router.patch('/clients/:id/profile', updateClientProfile)
router.put('/clients/:id/co-buyers', replaceClientCoBuyers)
router.put('/clients/:id/employment-details', replaceClientEmploymentDetails)

router.delete('/clients/:id', deleteClient)

export default router

