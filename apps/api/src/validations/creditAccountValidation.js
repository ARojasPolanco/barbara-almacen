import { z } from "zod";

export const createCreditAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const registerPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be positive"),
  paymentMethod: z.enum(["EFECTIVO", "MERCADO_PAGO", "CUENTA_DNI", "TRANSFERENCIA"], {
    message: "Invalid payment method",
  }),
});
