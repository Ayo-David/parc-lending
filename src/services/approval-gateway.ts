export interface LendingApprovalGateway {
  consume(input: {
    tenantId: string;
    approvalId: string;
    action:
      | "PRODUCT_PUBLICATION"
      | "MANUAL_LOAN_APPROVAL"
      | "LOAN_DISBURSEMENT"
      | "LOAN_RESTRUCTURE"
      | "LOAN_WRITE_OFF";
    resourceType:
      | "loan_product_version"
      | "loan_manual_review_case"
      | "loan_disbursement"
      | "loan_restructure"
      | "loan_write_off";
    resourceId: string;
    payloadHash: string;
    idempotencyKey: string;
    correlationId: string;
  }): Promise<{
    approvalId: string;
    replayed: boolean;
    makerId?: string;
    checkerIds?: string[];
    authorityLevel?: number;
    consumedAt?: string;
  }>;
}
