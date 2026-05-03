"use node";
import { generateSignature } from "./payfast";
import { PayfastPayment } from "../types";

export function initiatePayment(args: {
  merchant: {
    merchant_id: string;
    merchant_key: string;
    return_url: string;
    cancel_url: string;
    notify_url: string;
  };
  customer: {
    name_first: string;
    name_last: string;
    email_address: string;
    cell_number?: string;
  };
  transactions: {
    m_payment_id: string;
    amount: string;
    item_name: string;
    custom_str1?: string;
    custom_str2?: string;
  };
  split_payment: {
    merchant_id: number;
    percentage: number;
  };
}) {
  const paymentData: PayfastPayment = {
    merchant: args.merchant,
    customer: args.customer,
    transactions: {
      ...args.transactions,
      amount: args.transactions.amount,
    },
  };

  paymentData.signature = generateSignature(paymentData);

  // Flatten for the client — PayFast form fields must be top-level
  const { merchant, customer, transactions, signature } = paymentData;
  return {
    merchant_id: merchant.merchant_id,
    merchant_key: merchant.merchant_key,
    return_url: merchant.return_url,
    cancel_url: merchant.cancel_url,
    notify_url: merchant.notify_url,
    ...(merchant.fica_idnumber && { fica_idnumber: merchant.fica_idnumber }),

    ...(customer.name_first && { name_first: customer.name_first }),
    ...(customer.name_last && { name_last: customer.name_last }),
    ...(customer.email_address && { email_address: customer.email_address }),
    ...(customer.cell_number && { cell_number: customer.cell_number }),

    m_payment_id: transactions.m_payment_id,
    amount: transactions.amount,
    item_name: transactions.item_name,
    ...(transactions.item_description && {
      item_description: transactions.item_description,
    }),
    ...(transactions.custom_str1 && {
      custom_str1: transactions.custom_str1,
    }),
    ...(transactions.custom_str2 && {
      custom_str2: transactions.custom_str2,
    }),
    ...(transactions.custom_str3 && {
      custom_str3: transactions.custom_str3,
    }),
    ...(transactions.custom_str4 && {
      custom_str4: transactions.custom_str4,
    }),
    ...(transactions.custom_str5 && {
      custom_str5: transactions.custom_str5,
    }),
    ...(transactions.custom_int1 && {
      custom_int1: transactions.custom_int1,
    }),
    ...(transactions.custom_int2 && {
      custom_int2: transactions.custom_int2,
    }),
    ...(transactions.custom_int3 && {
      custom_int3: transactions.custom_int3,
    }),
    ...(transactions.custom_int4 && {
      custom_int4: transactions.custom_int4,
    }),
    ...(transactions.custom_int5 && {
      custom_int5: transactions.custom_int5,
    }),

    // split_payment is NOT included in signature
    split_payment: args.split_payment,

    signature,
  };
}
