import type { RequestContext } from "../security/request-context.js";
export type SupplierRecord = { id: string; name: string; phone: string | null; email: string | null; status: string };
export type CreateSupplierInput = { name: string; phone?: string; email?: string; paymentTermsDays?: number };
export type PurchaseLineInput = { variantId: string; quantity: string; unitCost: string };
export type CreatePurchaseOrderInput = { locationId: string; supplierId: string; items: readonly PurchaseLineInput[] };
export type PurchaseOrderRecord = { id: string; orderNumber: string; status: string; total: string };
export type ReceiveGoodsInput = { purchaseOrderId: string; locationId: string; items: readonly { variantId: string; quantity: string; unitCost: string }[] };
export type SupplierInvoiceInput = { supplierId: string; goodsReceivedId?: string; invoiceNumber: string; total: string };
export type SupplierInvoiceRecord = { id: string; invoiceNumber: string; total: string; balanceDue: string; status: string };
export type SupplierPaymentInput = { supplierInvoiceId: string; amount: string; method: "cash"|"bank"|"mobile_money"; reference?: string };
export interface PurchasingRepository { listSuppliers(context: RequestContext): Promise<readonly SupplierRecord[]>; createSupplier(context: RequestContext,input:CreateSupplierInput):Promise<SupplierRecord>; createPurchaseOrder(context:RequestContext,input:CreatePurchaseOrderInput):Promise<PurchaseOrderRecord>; approvePurchaseOrder(context:RequestContext,id:string):Promise<PurchaseOrderRecord>; receiveGoods(context:RequestContext,input:ReceiveGoodsInput):Promise<{id:string;receivedNumber:string;status:string}>; createSupplierInvoice?(context:RequestContext,input:SupplierInvoiceInput):Promise<SupplierInvoiceRecord>; paySupplierInvoice?(context:RequestContext,input:SupplierPaymentInput):Promise<SupplierInvoiceRecord>; }
