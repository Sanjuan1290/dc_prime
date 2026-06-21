import { calculatePercentage, roundMoney, safeNumber, toMoney } from "../money.js";

export const calculateLotNetSellingPrice = ({ lotAreaSqm, pricePerSqm }) => {
  return roundMoney(safeNumber(lotAreaSqm) * safeNumber(pricePerSqm));
};

export const calculatePackageNetSellingPrice = ({ packagePrice }) => {
  return toMoney(packagePrice);
};

export const calculateManualNetSellingPrice = ({
  lotPrice,
  housePrice,
  manualNetSellingPrice,
}) => {
  const manualValue = toMoney(manualNetSellingPrice);
  if (manualValue > 0) return manualValue;

  return roundMoney(safeNumber(lotPrice) + safeNumber(housePrice));
};

export const calculateHouseOnlyNetSellingPrice = ({ housePrice }) => {
  return toMoney(housePrice);
};

export const calculateLegalMiscFee = ({ netSellingPrice, legalMiscRate }) => {
  return calculatePercentage(netSellingPrice, legalMiscRate);
};

export const calculateTotalContractPrice = ({
  netSellingPrice,
  legalMiscFee,
}) => {
  return roundMoney(safeNumber(netSellingPrice) + safeNumber(legalMiscFee));
};

export const calculateListingPricing = ({
  propertyType = "lot",
  pricingMethod = "area_based",
  lotAreaSqm,
  pricePerSqm,
  lotPrice,
  housePrice,
  packagePrice,
  manualNetSellingPrice,
  legalMiscRate,
}) => {
  let netSellingPrice = 0;

  if (propertyType === "house_only") {
    netSellingPrice = calculateHouseOnlyNetSellingPrice({ housePrice });
  } else if (pricingMethod === "package_price") {
    netSellingPrice = calculatePackageNetSellingPrice({ packagePrice });
  } else if (pricingMethod === "manual") {
    netSellingPrice = calculateManualNetSellingPrice({
      lotPrice,
      housePrice,
      manualNetSellingPrice,
    });
  } else {
    netSellingPrice = calculateLotNetSellingPrice({ lotAreaSqm, pricePerSqm });
  }

  const legalMiscFee = calculateLegalMiscFee({
    netSellingPrice,
    legalMiscRate,
  });

  return {
    netSellingPrice,
    legalMiscRate: roundMoney(safeNumber(legalMiscRate)),
    legalMiscFee,
    totalContractPrice: calculateTotalContractPrice({
      netSellingPrice,
      legalMiscFee,
    }),
  };
};
