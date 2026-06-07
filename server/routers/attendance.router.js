import express from 'express'
import {
  getAttendance,
  getAttendanceRecord,
  getAttendanceByEmployee,
  getEmployeeAttendanceSummary,
  createAttendance,
  createDefaultAttendance,
  generateTodayAttendance,
  updateAttendance
} from '../controllers/attendance.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/attendance', auth, getAttendance)

router.post('/attendance/default', auth, createDefaultAttendance)
router.post('/attendance/generate-today', auth, generateTodayAttendance)

router.get('/attendance/:id', auth, getAttendanceRecord)
router.post('/attendance', auth, createAttendance)
router.patch('/attendance/:id', auth, updateAttendance)

router.get(
  '/employees/:employeeId/attendance-summary',
  auth,
  getEmployeeAttendanceSummary
)

router.get('/employees/:employeeId/attendance', auth, getAttendanceByEmployee)

export default router