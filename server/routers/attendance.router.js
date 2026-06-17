import express from 'express'
import {
  getAttendance,
  getAttendanceRecord,
  getAttendanceByEmployee,
  getEmployeeAttendanceSummary,
  createAttendance,
  createDefaultAttendance,
  createBulkDefaultAttendance,
  generateTodayAttendance,
  updateAttendance
} from '../controllers/attendance.controller.js'
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/attendance', getAttendance)

router.post('/attendance/default', createDefaultAttendance)
router.post('/attendance/default/bulk', createBulkDefaultAttendance)
router.post('/attendance/generate-today', generateTodayAttendance)

router.get('/attendance/:id', getAttendanceRecord)
router.post('/attendance', createAttendance)
router.patch('/attendance/:id', updateAttendance)

router.get(
  '/employees/:employeeId/attendance-summary',
  getEmployeeAttendanceSummary
)

router.get('/employees/:employeeId/attendance', getAttendanceByEmployee)

export default router
