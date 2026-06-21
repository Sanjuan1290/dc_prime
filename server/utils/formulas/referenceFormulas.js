const padSequence = (value, length = 4) => {
  return String(value || 0).padStart(length, "0");
};

export const formatDateCompact = (date = new Date()) => {
  const parsedDate = date instanceof Date ? date : new Date(date);
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
};

export const buildCashReferenceNumber = ({
  prefix = "CASH",
  date = new Date(),
  clientUnitId,
  sequence,
}) => {
  return `${prefix}-${formatDateCompact(date)}-CU${padSequence(clientUnitId)}-${padSequence(sequence)}`;
};

export const buildVoucherNumber = ({
  prefix = "VCH",
  date = new Date(),
  sequence,
}) => {
  return `${prefix}-${formatDateCompact(date)}-${padSequence(sequence)}`;
};
