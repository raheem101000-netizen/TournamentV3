export type FieldType = "text" | "dropdown" | "yesno";

export interface RegistrationFieldConfig {
  id: string;
  fieldType: FieldType;
  fieldLabel: string;
  fieldPlaceholder?: string | null;
  isRequired: number;
  dropdownOptions?: string | null;
  displayOrder: number;
}

export interface RegistrationStepConfig {
  id: string;
  stepNumber: number;
  stepTitle: string;
  stepDescription?: string | null;
  fields: RegistrationFieldConfig[];
}

export interface RegistrationFormConfig {
  id: string;
  tournamentId: string;
  requiresPayment: number;
  entryFee?: number | null;
  paymentUrl?: string | null;
  paymentInstructions?: string | null;
  steps: RegistrationStepConfig[];
}

export interface RegistrationFormData {
  tournamentId: string;
  teamName: string;
  contactEmail?: string;
  responses: Record<string, string>;
  paymentProofUrl?: string;
  paymentTransactionId?: string;
}

export interface PaymentVerification {
  id: string;
  teamName: string;
  contactEmail?: string;
  paymentProofUrl?: string | null;
  paymentTransactionId?: string | null;
  paymentStatus: "pending" | "submitted" | "verified" | "rejected";
  status: "draft" | "submitted" | "approved" | "rejected";
  createdAt: Date;
}
