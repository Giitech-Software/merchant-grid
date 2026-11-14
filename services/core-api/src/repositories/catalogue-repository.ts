import type { RequestContext } from "../security/request-context.js";
export type CategoryRecord = { id: string; name: string; slug: string; status: string };
export type ProductRecord = { id: string; categoryId: string | null; sku: string; name: string; description: string | null; brand: string | null; status: string };
export type CreateCategoryInput = { name: string; slug: string };
export type CreateProductInput = { categoryId?: string; sku: string; name: string; description?: string; brand?: string };
export type VariantRecord = { id: string; productId: string; sku: string; name: string; retailPrice: string; wholesalePrice: string | null; buyingCost: string | null; status: string };
export type BarcodeRecord = { id: string; variantId: string; barcode: string; isPrimary: boolean };
export type CreateVariantInput = { productId: string; sku: string; name: string; retailPrice: string; wholesalePrice?: string; buyingCost?: string };
export type CreateBarcodeInput = { variantId: string; barcode: string; isPrimary?: boolean };
export interface CatalogueRepository {
  listCategories(context: RequestContext): Promise<readonly CategoryRecord[]>;
  createCategory(context: RequestContext, input: CreateCategoryInput): Promise<CategoryRecord>;
  listProducts(context: RequestContext): Promise<readonly ProductRecord[]>;
  createProduct(context: RequestContext, input: CreateProductInput): Promise<ProductRecord>;
  listVariants(context: RequestContext, productId: string): Promise<readonly VariantRecord[]>;
  createVariant(context: RequestContext, input: CreateVariantInput): Promise<VariantRecord>;
  createBarcode(context: RequestContext, input: CreateBarcodeInput): Promise<BarcodeRecord>;
}
