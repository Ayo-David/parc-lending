import {
  calculateDaysPastDue,
  calculateInterestAccrual,
  calculatePenalty,
  selectDelinquencyBucket,
} from "../../src/services/loan-servicing-calculator.js";

describe("LN-07 servicing calculations", () => {
  it("preserves unrounded accrual precision and rounds only the posted amount", () => {
    const result = calculateInterestAccrual({
      openingPrincipalMinor: 10_000_001n,
      annualRate: "12.1234567890",
      dayCountNumerator: 1,
      dayCountDenominator: 365,
      roundingMode: "HALF_EVEN",
    });
    expect(result.unroundedMinor).toBe("3321.495342834433");
    expect(result.amountMinor).toBe(3321n);
  });

  it("starts DPD only after the configured grace period", () => {
    expect(
      calculateDaysPastDue({
        assessmentDate: "2026-09-14",
        dueDate: "2026-09-12",
        gracePeriodDays: 2,
        remainingAmountMinor: 1n,
      }),
    ).toBe(0);
    expect(
      calculateDaysPastDue({
        assessmentDate: "2026-09-15",
        dueDate: "2026-09-12",
        gracePeriodDays: 2,
        remainingAmountMinor: 1n,
      }),
    ).toBe(1);
    expect(
      calculateDaysPastDue({
        assessmentDate: "2026-10-20",
        dueDate: "2026-09-12",
        gracePeriodDays: 2,
        remainingAmountMinor: 0n,
      }),
    ).toBe(0);
  });

  it("selects tenant-configured delinquency thresholds", () => {
    const buckets = [
      { code: "CURRENT", minimumDpd: 0 },
      { code: "WATCH", minimumDpd: 1 },
      { code: "BAD", minimumDpd: 30 },
    ];
    expect(selectDelinquencyBucket(0, buckets)).toBe("CURRENT");
    expect(selectDelinquencyBucket(29, buckets)).toBe("WATCH");
    expect(selectDelinquencyBucket(30, buckets)).toBe("BAD");
  });

  it("caps percentage penalties and refuses compounding", () => {
    expect(
      calculatePenalty({
        type: "PERCENTAGE",
        basisAmountMinor: 100_001n,
        rate: "2.5000000000",
        cumulativeBeforeMinor: 4_000n,
        capAmountMinor: 5_000n,
        roundingMode: "HALF_UP",
        compounds: false,
      }),
    ).toEqual({ unroundedMinor: "2500.025000000000", amountMinor: 1_000n });
    expect(() =>
      calculatePenalty({
        type: "FIXED",
        basisAmountMinor: 1n,
        fixedAmountMinor: 1n,
        cumulativeBeforeMinor: 0n,
        roundingMode: "HALF_EVEN",
        compounds: true as false,
      }),
    ).toThrow("Compounding penalties are disabled");
  });
});
