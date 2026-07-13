export type FeesSplit = {
  paystack: number;
  integration: number;
  subaccount: number;
};

export type SplitResult = {
  paystackFee: number;
  platformAmount: number;
  merchantAmount: number;
  amountNet: number;
};

// Reads and validates the SPLIT_MAX env var (the R30 commission cap, in cents).
// Returns undefined instead of throwing when missing/invalid — callers on the
// completion path (webhook, poll, sweep) can't surface a user-facing error
// mid-reconciliation, so they fall back to the uncapped estimate rather than
// corrupting the numbers with NaN.
export function getSplitMaxCents(): number | undefined {
  const raw = Number(process.env.SPLIT_MAX);
  return Number.isFinite(raw) && raw > 0 ? raw : undefined;
}

// Computes the commission split to record for a completed payment.
//
// When Paystack's actual fees_split is present, it already reflects real
// settlement exactly — checkout requested a capped transaction_charge, so
// Paystack's own numbers are already correct. Use them as-is.
//
// When fees_split is missing or malformed (the retry/poll path's fallback),
// estimate from the stored commission percentage, but apply the same
// SPLIT_MAX cap requested at checkout. Math.min(x, cap) is safe in both
// directions: a no-op when the uncapped estimate was already under the cap,
// and a correction to match what Paystack actually did when it wasn't.
export function computeSplitFallback(
  amount: number,
  commission: number,
  feesSplit: FeesSplit | undefined,
): SplitResult {
  const paystackFee = feesSplit?.paystack ?? 0;
  const amountNet = amount - paystackFee;

  if (feesSplit) {
    return {
      paystackFee,
      platformAmount: feesSplit.integration,
      merchantAmount: feesSplit.subaccount,
      amountNet,
    };
  }

  const uncappedPlatformAmount = Math.round(amount * (commission / 100));
  const splitMaxCents = getSplitMaxCents();
  const platformAmount =
    splitMaxCents !== undefined
      ? Math.min(uncappedPlatformAmount, splitMaxCents)
      : uncappedPlatformAmount;
  const merchantAmount = amount - platformAmount - paystackFee;

  return { paystackFee, platformAmount, merchantAmount, amountNet };
}
