import express from 'express'
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  getEmployeeRestDays,
  updateEmployeeRestDays
} from '../controllers/employees.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/employees', auth, getEmployees)
router.get('/employees/:id', auth, getEmployee)
router.post('/employees', auth, createEmployee)
router.patch('/employees/:id', auth, updateEmployee)
router.get('/employees/:id/rest-days', auth, getEmployeeRestDays)
router.patch('/employees/:id/rest-days', auth, updateEmployeeRestDays)

export default router
