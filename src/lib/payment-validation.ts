export type WiseVerificationErrors = {
  transactionReference?: string;
  paymentProof?: string;
};

export function validateWiseVerificationInputs(
  transactionReference: string,
  paymentProof: string,
): WiseVerificationErrors {
  const errors: WiseVerificationErrors = {};

  if (!transactionReference.trim()) {
    errors.transactionReference = "Transaction reference required";
  }

  if (!paymentProof.trim()) {
    errors.paymentProof = "Payment proof required";
  }

  return errors;
}
