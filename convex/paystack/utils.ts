"use node";

const VALID_PAYSTACK_IPS = [
  "52.31.139.75",
  "52.49.173.169",
  "52.214.14.220",
];

export const isValidPaystackIP = (pfIp: string | null): boolean => {
  if (!pfIp) return false;
  return VALID_PAYSTACK_IPS.includes(pfIp);
};