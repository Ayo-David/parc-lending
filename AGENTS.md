# Lending service instructions

## Ownership

Own loan product versions, applications, eligibility/underwriting outcomes, offers, contracts, disbursement intent, schedules, interest accruals, repayments allocation, delinquency, restructuring, write-off and post-write-off recovery. Own only the `parc_lending` database.

## Domain rules

- Product terms are versioned and immutable once referenced by an offer/loan. Historical loans retain their original terms.
- Separate application, offer, contract and active-loan lifecycles; transitions must be explicit, authorized and auditable.
- Calculations use exact arithmetic, declared day-count/rounding rules and deterministic schedules. Persist the rule/version used.
- Lending requests payment execution and ledger postings through contracts; it never writes their databases.
- Disbursement, repayment and recovery processing are idempotent and tolerate duplicate/out-of-order events.
- Credit decisions require reason codes and model/policy version where relevant; do not invent regulatory or underwriting rules.
- Write-off does not erase the receivable history; recoveries after write-off remain traceable.

## Database and delivery

- Canonical migrations: `db/migrations/`; generated snapshot: `db/schema/current.sql`.
- Test schedule boundaries, rounding, partial/late/overpayments, accrual retries, restructuring, write-off recovery, concurrent events and tenant isolation.
- Any calculation change needs golden examples and an impact/migration analysis for existing loans.
