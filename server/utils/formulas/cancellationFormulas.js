import { roundMoney, safeNumber } from "../money.js";

export const calculateForfeitedAmount = ({ totalPaid, refundAmount }) => {
  return roundMoney(Math.max(safeNumber(totalPaid) - safeNumber(refundAmount), 0));
};

export const calculateCancellationSettlement = ({
  refundAmount,
  forfeitedAmount,
}) => {
  return roundMoney(safeNumber(refundAmount) + safeNumber(forfeitedAmount));
};

export const isClearForResaleReady = ({
  cancellationResult,
  refundAmount,
  forfeitedAmount,
  approvedBy,
  settlementDate,
}) => {
  const hasSettlementAmount =
    (refundAmount !== null && refundAmount !== undefined) ||
    (forfeitedAmount !== null && forfeitedAmount !== undefined);

  return Boolean(
    cancellationResult &&
      hasSettlementAmount &&
      approvedBy &&
      settlementDate,
  );
};
