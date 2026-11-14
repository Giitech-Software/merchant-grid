import type { RequestContext } from "../security/request-context.js";
export type CustomerRecord = { id: string; name: string; phone: string | null; email: string | null; creditLimit: string; status: string };
export type CreateCustomerInput = { name: string; phone?: string; email?: string; creditLimit?: string; paymentTermsDays?: number };
export type InvoiceItemInput = { variantId: string; quantity: string; unitPrice: string; discount?: string; tax?: string };
export type InvoiceRecord = { id: string; invoiceNumber: string; status: string; total: string; balanceDue: string };
export type PaymentInput = { invoiceId: string; method: "cash" | "bank" | "mobile_money" | "credit"; amount: string; reference?: string };
export type PaymentRecord = { id: string; invoiceId: string; method: string; amount: string; status: string };
export type CreateInvoiceInput = { locationId: string; customerId?: string; items: readonly InvoiceItemInput[] };
export interface SalesRepository { listCustomers(context: RequestContext): Promise<readonly CustomerRecord[]>; createCustomer(context: RequestContext, input: CreateCustomerInput): Promise<CustomerRecord>; createInvoice(context: RequestContext, input: CreateInvoiceInput): Promise<InvoiceRecord>; postInvoice(context: RequestContext, invoiceId: string): Promise<InvoiceRecord>; recordPayment(context: RequestContext, input: PaymentInput): Promise<PaymentRecord>; }
