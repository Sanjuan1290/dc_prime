import express from "express";
import {
  getVoucher,
  getVouchers,
  updateVoucherStatus,
} from "../controllers/vouchers.controller.js";
import { auth, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(auth, adminOnly);

router.get("/vouchers", getVouchers);
router.get("/vouchers/:id", getVoucher);
router.patch("/vouchers/:id/status", updateVoucherStatus);

export default router;
