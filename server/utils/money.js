export const safeNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export const roundMoney = (value) => {
  return Number(safeNumber(value).toFixed(2));
};

export const toMoney = (value) => {
  return roundMoney(Math.max(safeNumber(value), 0));
};

export const calculatePercentage = (base, rate) => {
  return roundMoney(safeNumber(base) * (safeNumber(rate) / 100));
};

export const minMoney = (a, b) => {
  return roundMoney(Math.min(toMoney(a), toMoney(b)));
};
