/** Chapa API response and request types */

export interface ChapaInitializeRequest {
  amount: string;
  currency: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title?: string;
    description?: string;
    logo?: string;
  };
}

export interface ChapaInitializeResponse {
  message: string;
  status: string;
  data: {
    checkout_url: string;
  };
}

export interface ChapaVerifyResponse {
  message: string;
  status: string;
  data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    currency: string;
    amount: number;
    charge: number;
    mode: string;
    method: string;
    type: string;
    status: string;
    reference: string;
    tx_ref: string;
    customization: {
      title: string;
      description: string;
      logo: string;
    };
    meta: unknown;
    created_at: string;
    updated_at: string;
  };
}

export interface ChapaWebhookPayload {
  event: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  currency: string;
  amount: number;
  charge: number;
  mode: string;
  method: string;
  type: string;
  status: string;
  reference: string;
  tx_ref: string;
  created_at: string;
  updated_at: string;
}

export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";
export type TransactionType = "DEPOSIT" | "WITHDRAW";
