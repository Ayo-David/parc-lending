import {
  allocateWriteoffRecovery,
  isWriteoffEligible,
  total,
  validateRestructure,
} from "../../src/services/loan-resolution-calculator.js";

describe("LN-08 resolution invariants", () => {
  it("requires separate authority for principal reduction and explicit capitalization", () => {
    expect(() =>
      validateRestructure({
        previousPrincipal: 100n,
        newPrincipal: 90n,
        capitalizedAmount: 0n,
        capitalizationAuthorized: false,
      }),
    ).toThrow("Principal reduction");
    expect(() =>
      validateRestructure({
        previousPrincipal: 100n,
        newPrincipal: 110n,
        capitalizedAmount: 10n,
        capitalizationAuthorized: false,
      }),
    ).toThrow("Capitalization");
    expect(() =>
      validateRestructure({
        previousPrincipal: 100n,
        newPrincipal: 110n,
        capitalizedAmount: 10n,
        capitalizationAuthorized: true,
      }),
    ).not.toThrow();
  });

  it("requires both the immutable DPD threshold and a positive obligation", () => {
    expect(
      isWriteoffEligible({
        daysPastDue: 90,
        minimumDaysPastDue: 90,
        outstanding: { penalty: 0n, fees: 0n, interest: 1n, principal: 10n },
      }),
    ).toBe(true);
    expect(
      isWriteoffEligible({
        daysPastDue: 89,
        minimumDaysPastDue: 90,
        outstanding: { penalty: 0n, fees: 0n, interest: 1n, principal: 10n },
      }),
    ).toBe(false);
  });

  it("allocates recovery exactly and exposes excess without resurrecting debt", () => {
    const result = allocateWriteoffRecovery(10_000n, {
      penalty: 500n,
      fees: 500n,
      interest: 2_000n,
      principal: 5_000n,
    });
    expect(total(result.allocated)).toBe(8_000n);
    expect(result.unapplied).toBe(2_000n);
    expect(total(result.allocated) + result.unapplied).toBe(10_000n);
  });
});
