import {
  allocateRepayment,
  type DueInstallment,
} from "../../src/services/loan-repayment-service.js";

const installment = (
  overrides: Partial<DueInstallment> = {},
): DueInstallment => ({
  id: "00000000-0000-4000-8000-000000000001",
  installmentNumber: 1,
  penaltyDue: 1_000n,
  penaltyPaid: 0n,
  feesDue: 2_000n,
  feesPaid: 0n,
  interestDue: 3_000n,
  interestPaid: 0n,
  principalDue: 10_000n,
  principalPaid: 0n,
  ...overrides,
});

describe("LN-06 exact repayment allocation", () => {
  const order = ["PENALTY", "FEES", "INTEREST", "PRINCIPAL"] as const;

  it("allocates partial payments in configured priority without losing a minor unit", () => {
    const result = allocateRepayment(4_500n, order, [installment()]);
    expect(
      result.lines.map(({ component, amount }) => [component, amount]),
    ).toEqual([
      ["PENALTY", 1_000n],
      ["FEES", 2_000n],
      ["INTEREST", 1_500n],
    ]);
    expect(result.allocated + result.unapplied).toBe(4_500n);
  });

  it("allocates each component oldest-installment first", () => {
    const result = allocateRepayment(3_500n, order, [
      installment({ id: "2", installmentNumber: 2, penaltyDue: 1_500n }),
      installment({ id: "1", installmentNumber: 1 }),
    ]);
    expect(
      result.lines.map(({ installmentId, component, amount }) => [
        installmentId,
        component,
        amount,
      ]),
    ).toEqual([
      ["1", "PENALTY", 1_000n],
      ["2", "PENALTY", 1_500n],
      ["1", "FEES", 1_000n],
    ]);
  });

  it("separates an overpayment as unapplied credit", () => {
    const result = allocateRepayment(20_000n, order, [installment()]);
    expect(result.allocated).toBe(16_000n);
    expect(result.unapplied).toBe(4_000n);
    expect(result.lines.reduce((sum, line) => sum + line.amount, 0n)).toBe(
      result.allocated,
    );
  });

  it("uses bigint safely above JavaScript's maximum safe integer", () => {
    const amount = 9_007_199_254_740_993n;
    const result = allocateRepayment(amount, order, [
      installment({ principalDue: amount }),
    ]);
    expect(result.allocated + result.unapplied).toBe(amount);
  });
});
