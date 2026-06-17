import express from 'express'
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  getEmployeeRestDays,
  updateEmployeeRestDays
} from '../controllers/employees.controller.js'
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/employees', getEmployees)
router.get('/employees/:id', getEmployee)
router.post('/employees', createEmployee)
router.patch('/employees/:id', updateEmployee)
router.get('/employees/:id/rest-days', getEmployeeRestDays)
router.patch('/employees/:id/rest-days', updateEmployeeRestDays)

export default router
