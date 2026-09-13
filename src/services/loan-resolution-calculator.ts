export interface ComponentBalances {
  penalty: bigint;
  fees: bigint;
  interest: bigint;
  principal: bigint;
}

export function validateRestructure(input: {
  previousPrincipal: bigint;
  newPrincipal: bigint;
  principalReductionApprovalId?: string;
  capitalizedAmount: bigint;
  capitalizationAuthorized: boolean;
}): void {
  if (
    input.previousPrincipal < 0n ||
    input.newPrincipal < 0n ||
    input.capitalizedAmount < 0n
  )
    throw new Error("Restructure values cannot be negative");
  if (
    input.newPrincipal < input.previousPrincipal &&
    !input.principalReductionApprovalId
  )
    throw new Error(
      "Principal reduction requires a separately approved adjustment",
    );
  if (input.capitalizedAmount > 0n && !input.capitalizationAuthorized)
    throw new Error(
      "Capitalization was not authorized by the approved restructure command",
    );
  if (
    input.newPrincipal !== input.previousPrincipal + input.capitalizedAmount &&
    input.newPrincipal >= input.previousPrincipal
  )
    throw new Error(
      "New principal does not reconcile to authorized capitalization",
    );
}

export function isWriteoffEligible(input: {
  daysPastDue: number;
  minimumDaysPastDue: number;
  outstanding: ComponentBalances;
}): boolean {
  return (
    input.daysPastDue >= input.minimumDaysPastDue &&
    total(input.outstanding) > 0n
  );
}

export function allocateWriteoffRecovery(
  amount: bigint,
  remaining: ComponentBalances,
  order: readonly (keyof ComponentBalances)[] = [
    "penalty",
    "fees",
    "interest",
    "principal",
  ],
): { allocated: ComponentBalances; unapplied: bigint } {
  if (amount <= 0n) throw new Error("Recovery amount must be positive");
  if (new Set(order).size !== 4)
    throw new Error("Recovery order must contain four unique components");
  let available = amount;
  const allocated: ComponentBalances = {
    penalty: 0n,
    fees: 0n,
    interest: 0n,
    principal: 0n,
  };
  for (const component of order) {
    if (!(component in remaining) || remaining[component] < 0n)
      throw new Error("Invalid written-off balance");
    allocated[component] =
      remaining[component] < available ? remaining[component] : available;
    available -= allocated[component];
  }
  return { allocated, unapplied: available };
}

export const total = (balances: ComponentBalances): bigint =>
  balances.penalty + balances.fees + balances.interest + balances.principal;
