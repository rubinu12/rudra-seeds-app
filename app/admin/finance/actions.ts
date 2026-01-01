// app/admin/finance/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schema for Receiving Money
const ReceivePaymentSchema = z.object({
  companyId: z.coerce.number().positive(),
  amount: z.coerce.number().positive(),
  walletId: z.coerce.number().positive(),
  mode: z.string().min(1),
  reference: z.string().optional(),
});

// Schema for Manual Balance Adjustment
const SetBalanceSchema = z.object({
  walletId: z.coerce.number().positive(),
  newBalance: z.coerce.number(),
});

export type FinanceFormState = {
  message: string;
  success: boolean;
};

// Action 1: Receive Lump Sum from Seed Company
export async function receiveCompanyPayment(prevState: FinanceFormState, formData: FormData): Promise<FinanceFormState> {
  const data = {
    companyId: formData.get('companyId'),
    amount: formData.get('amount'),
    walletId: formData.get('walletId'),
    mode: formData.get('mode'),
    reference: formData.get('reference'),
  };

  const validated = ReceivePaymentSchema.safeParse(data);
  if (!validated.success) return { message: "Invalid data. Check amounts.", success: false };

  const { companyId, amount, walletId, mode, reference } = validated.data;

  try {
    // 1. Log the Payment
    await sql`
      INSERT INTO company_payments (dest_company_id, amount, target_wallet_id, payment_mode, reference_number)
      VALUES (${companyId}, ${amount}, ${walletId}, ${mode}, ${reference || ''})
    `;

    // 2. Add Money to Wallet
    await sql`
      UPDATE virtual_wallets 
      SET balance = balance + ${amount}
      WHERE wallet_id = ${walletId}
    `;

    revalidatePath('/admin/finance');
    return { message: "Payment Received Successfully!", success: true };
  } catch (e) {
    return { message: "Database Error.", success: false };
  }
}

// Action 2: Manual Balance Correction
export async function setWalletBalance(prevState: FinanceFormState, formData: FormData): Promise<FinanceFormState> {
  const validated = SetBalanceSchema.safeParse({
    walletId: formData.get('walletId'),
    newBalance: formData.get('newBalance'),
  });

  if (!validated.success) return { message: "Invalid Amount", success: false };

  try {
    await sql`
      UPDATE virtual_wallets 
      SET balance = ${validated.data.newBalance}
      WHERE wallet_id = ${validated.data.walletId}
    `;
    revalidatePath('/admin/finance');
    return { message: "Balance Updated!", success: true };
  } catch (e) {
    return { message: "Failed to update.", success: false };
  }
}