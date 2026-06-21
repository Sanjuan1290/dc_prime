import express from "express";
import {
  createProofIncomeRequest,
  getProofIncomeRequests,
  updateProofIncomeRequestStatus,
} from "../controllers/proofIncomeRequests.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(auth);

router.get("/proof-income-requests", getProofIncomeRequests);
router.get("/clients/:clientId/proof-income-requests", getProofIncomeRequests);
router.post("/clients/:clientId/proof-income-requests", createProofIncomeRequest);
router.patch("/proof-income-requests/:id/status", updateProofIncomeRequestStatus);

export default router;
