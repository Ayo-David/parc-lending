import { Decimal } from "decimal.js";

export type ServicingRoundingMode = "HALF_EVEN" | "HALF_UP" | "DOWN";
export interface InterestAccrualResult {
  unroundedMinor: string;
  amountMinor: bigint;
}

const rounding = {
  HALF_EVEN: Decimal.ROUND_HALF_EVEN,
  HALF_UP: Decimal.ROUND_HALF_UP,
  DOWN: Decimal.ROUND_DOWN,
} as const;

export function calculateInterestAccrual(input: {
  openingPrincipalMinor: bigint;
  annualRate: string;
  dayCountNumerator: number;
  dayCountDenominator: number;
  roundingMode: ServicingRoundingMode;
}): InterestAccrualResult {
  if (
    input.openingPrincipalMinor < 0n ||
    input.dayCountNumerator <= 0 ||
    input.dayCountDenominator <= 0
  )
    throw new Error("Invalid interest-accrual inputs");
  const rate = new Decimal(input.annualRate);
  if (rate.isNegative()) throw new Error("Annual rate cannot be negative");
  const unrounded = new Decimal(input.openingPrincipalMinor.toString())
    .mul(rate)
    .div(100)
    .mul(input.dayCountNumerator)
    .div(input.dayCountDenominator);
  return {
    unroundedMinor: unrounded
      .toDecimalPlaces(12, Decimal.ROUND_HALF_EVEN)
      .toFixed(12),
    amountMinor: BigInt(
      unrounded.toDecimalPlaces(0, rounding[input.roundingMode]).toFixed(0),
    ),
  };
}

export function calculateDaysPastDue(input: {
  assessmentDate: string;
  dueDate: string;
  gracePeriodDays: number;
  remainingAmountMinor: bigint;
}): number {
  if (input.gracePeriodDays < 0)
    throw new Error("Grace period cannot be negative");
  if (input.remainingAmountMinor <= 0n) return 0;
  const assessment = parseDate(input.assessmentDate);
  const due = parseDate(input.dueDate);
  const elapsed = Math.floor((assessment - due) / 86_400_000);
  return Math.max(0, elapsed - input.gracePeriodDays);
}

export function selectDelinquencyBucket(
  daysPastDue: number,
  buckets: readonly { code: string; minimumDpd: number }[],
): string {
  if (daysPastDue < 0 || buckets.length === 0)
    throw new Error("Invalid delinquency policy");
  const eligible = [...buckets]
    .sort((a, b) => a.minimumDpd - b.minimumDpd)
    .filter((bucket) => bucket.minimumDpd <= daysPastDue);
  if (!eligible.length)
    throw new Error("Delinquency policy must include a zero-DPD bucket");
  return eligible.at(-1)!.code;
}

export function calculatePenalty(input: {
  type: "FIXED" | "PERCENTAGE";
  basisAmountMinor: bigint;
  rate?: string;
  fixedAmountMinor?: bigint;
  cumulativeBeforeMinor: bigint;
  capAmountMinor?: bigint;
  roundingMode: ServicingRoundingMode;
  compounds: false;
}): { unroundedMinor: string; amountMinor: bigint } {
  if (input.compounds !== false)
    throw new Error("Compounding penalties are disabled");
  if (input.basisAmountMinor < 0n || input.cumulativeBeforeMinor < 0n)
    throw new Error("Penalty values cannot be negative");
  const raw =
    input.type === "FIXED"
      ? new Decimal(
          input.fixedAmountMinor?.toString() ??
            (() => {
              throw new Error("Fixed penalty amount is required");
            })(),
        )
      : new Decimal(input.basisAmountMinor.toString())
          .mul(
            input.rate ??
              (() => {
                throw new Error("Penalty rate is required");
              })(),
          )
          .div(100);
  const rounded = BigInt(
    raw.toDecimalPlaces(0, rounding[input.roundingMode]).toFixed(0),
  );
  const remainingCap =
    input.capAmountMinor === undefined
      ? rounded
      : input.capAmountMinor > input.cumulativeBeforeMinor
        ? input.capAmountMinor - input.cumulativeBeforeMinor
        : 0n;
  return {
    unroundedMinor: raw
      .toDecimalPlaces(12, Decimal.ROUND_HALF_EVEN)
      .toFixed(12),
    amountMinor: rounded < remainingCap ? rounded : remainingCap,
  };
}

function parseDate(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Date must use YYYY-MM-DD");
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed)) throw new Error("Invalid calendar date");
  return parsed;
}
