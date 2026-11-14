import type { Pool } from "pg";
import type { RequestContext } from "../security/request-context.js";
import type { CatalogueRepository, CategoryRecord, CreateCategoryInput, CreateProductInput, ProductRecord, VariantRecord, BarcodeRecord, CreateVariantInput, CreateBarcodeInput } from "./catalogue-repository.js";
export class PostgresCatalogueRepository implements CatalogueRepository {
  public constructor(private readonly pool: Pool) {}
  public async listVariants(context: RequestContext, productId: string): Promise<readonly VariantRecord[]> {
    const result = await this.pool.query<VariantRecord>(`select id, product_id as "productId", sku, name, retail_price::text as "retailPrice", wholesale_price::text as "wholesalePrice", buying_cost::text as "buyingCost", status from product_variants where tenant_id=$1 and business_id=$2 and product_id=$3 order by name`, [context.tenantId, context.businessId, productId]);
    return result.rows;
  }
  public async createVariant(context: RequestContext, input: CreateVariantInput): Promise<VariantRecord> {
    const result = await this.pool.query<VariantRecord>(`insert into product_variants (tenant_id,business_id,product_id,sku,name,retail_price,wholesale_price,buying_cost) select $1,$2,id,$3,$4,$5,$6,$7 from products where id=$8 and tenant_id=$1 and business_id=$2 returning id, product_id as "productId", sku, name, retail_price::text as "retailPrice", wholesale_price::text as "wholesalePrice", buying_cost::text as "buyingCost", status`, [context.tenantId, context.businessId, input.sku, input.name, input.retailPrice, input.wholesalePrice ?? null, input.buyingCost ?? null, input.productId]);
    const variant = result.rows[0]; if (!variant) throw new Error("Variant product scope is invalid"); return variant;
  }
  public async createBarcode(context: RequestContext, input: CreateBarcodeInput): Promise<BarcodeRecord> {
    const result = await this.pool.query<BarcodeRecord>(`insert into product_barcodes (tenant_id,business_id,variant_id,barcode,is_primary) select $1,$2,id,$3,$4 from product_variants where id=$5 and tenant_id=$1 and business_id=$2 returning id, variant_id as "variantId", barcode, is_primary as "isPrimary"`, [context.tenantId, context.businessId, input.barcode, input.isPrimary ?? false, input.variantId]);
    const barcode = result.rows[0]; if (!barcode) throw new Error("Barcode variant scope is invalid"); return barcode;
  }
  public async listCategories(context: RequestContext): Promise<readonly CategoryRecord[]> {
    const result = await this.pool.query<CategoryRecord>("select id, name, slug, status from product_categories where tenant_id = $1 and business_id = $2 order by name asc", [context.tenantId, context.businessId]);
    return result.rows;
  }
  public async createCategory(context: RequestContext, input: CreateCategoryInput): Promise<CategoryRecord> {
    const result = await this.pool.query<CategoryRecord>(
      `insert into product_categories (tenant_id, business_id, name, slug) values ($1, $2, $3, $4)
       returning id, name, slug, status`, [context.tenantId, context.businessId, input.name, input.slug],
    );
    const category = result.rows[0]; if (!category) throw new Error("Category insert did not return a record");
    await this.pool.query(`insert into audit_events (tenant_id, business_id, actor_user_id, action, target_type, target_id, after_data, context) values ($1,$2,$3,'category.created','product_category',$4,$5::jsonb,$6::jsonb)`, [context.tenantId, context.businessId, context.userId, category.id, JSON.stringify(category), JSON.stringify({ requestId: context.requestId })]);
    return category;
  }
  public async listProducts(context: RequestContext): Promise<readonly ProductRecord[]> {
    const result = await this.pool.query<ProductRecord>("select id, category_id as \"categoryId\", sku, name, description, brand, status from products where tenant_id = $1 and business_id = $2 order by name asc", [context.tenantId, context.businessId]);
    return result.rows;
  }
  public async createProduct(context: RequestContext, input: CreateProductInput): Promise<ProductRecord> {
    const result = await this.pool.query<ProductRecord>(
      `insert into products (tenant_id, business_id, category_id, sku, name, description, brand)
       select $1, $2, $3, $4, $5, $6, $7
       where $3::uuid is null or exists (select 1 from product_categories where id = $3 and tenant_id = $1 and business_id = $2)
       returning id, category_id as "categoryId", sku, name, description, brand, status`,
      [context.tenantId, context.businessId, input.categoryId ?? null, input.sku, input.name, input.description ?? null, input.brand ?? null],
    );
    const product = result.rows[0]; if (!product) throw new Error("Product category or business scope is invalid");
    await this.pool.query(`insert into audit_events (tenant_id, business_id, actor_user_id, action, target_type, target_id, after_data, context) values ($1,$2,$3,'product.created','product',$4,$5::jsonb,$6::jsonb)`, [context.tenantId, context.businessId, context.userId, product.id, JSON.stringify(product), JSON.stringify({ requestId: context.requestId })]);
    return product;
  }
}
