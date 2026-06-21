import { roundMoney, safeNumber } from "../money.js";

export const calculateReservationBalance = ({
  totalContractPrice,
  reservationFee,
}) => {
  return roundMoney(Math.max(safeNumber(totalContractPrice) - safeNumber(reservationFee), 0));
};

export const calculateDownpaymentAmount = ({
  totalContractPrice,
  downpaymentRate,
}) => {
  return roundMoney(safeNumber(totalContractPrice) * (safeNumber(downpaymentRate) / 100));
};

export const calculateSpotDownpaymentBalance = ({
  downpaymentAmount,
  reservationFee,
}) => {
  return roundMoney(Math.max(safeNumber(downpaymentAmount) - safeNumber(reservationFee), 0));
};

export const calculateInstallmentPrincipalBalance = ({
  totalContractPrice,
  reservationFee,
  downpaymentPaid,
}) => {
  return roundMoney(
    Math.max(
      safeNumber(totalContractPrice) - safeNumber(reservationFee) - safeNumber(downpaymentPaid),
      0,
    ),
  );
};

export const calculateMonthlyAmortization = ({
  principalBalance,
  termMonths,
}) => {
  const months = safeNumber(termMonths);
  if (months <= 0) return 0;

  return roundMoney(safeNumber(principalBalance) / months);
};

export const calculateRunningBalance = ({
  previousRunningBalance,
  verifiedPaymentApplied,
}) => {
  return roundMoney(
    Math.max(safeNumber(previousRunningBalance) - safeNumber(verifiedPaymentApplied), 0),
  );
};
