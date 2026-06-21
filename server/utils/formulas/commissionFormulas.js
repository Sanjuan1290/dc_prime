import { calculatePercentage, minMoney, roundMoney, safeNumber } from "../money.js";

export const calculateGrossCommission = ({ commissionBase, rate }) => {
  return calculatePercentage(commissionBase, rate);
};

export const calculateGroupCommissionPool = ({ commissionBase, poolRate }) => {
  return calculatePercentage(commissionBase, poolRate);
};

export const calculateGrossReleaseAmount = ({
  grossCommission,
  milestonePercentage,
}) => {
  return calculatePercentage(grossCommission, milestonePercentage);
};

export const calculateRetentionAmount = ({ grossCommission, retentionRate }) => {
  return calculatePercentage(grossCommission, retentionRate);
};

export const calculateReleaseNetAmount = ({
  grossReleaseAmount,
  cashAdvanceDeduction,
}) => {
  return roundMoney(
    Math.max(safeNumber(grossReleaseAmount) - safeNumber(cashAdvanceDeduction), 0),
  );
};

export const calculateCashAdvanceBalance = ({
  approvedCashAdvance,
  totalDeductions,
}) => {
  return roundMoney(
    Math.max(safeNumber(approvedCashAdvance) - safeNumber(totalDeductions), 0),
  );
};

export const calculateCashAdvanceDeduction = ({
  releaseAmount,
  remainingCashAdvanceBalance,
}) => {
  return minMoney(releaseAmount, remainingCashAdvanceBalance);
};
