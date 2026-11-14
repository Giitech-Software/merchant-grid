import type { Pool } from "pg";
import type { RequestContext } from "../security/request-context.js";
import type { EnquiryInput, EnquiryRecord, EnquiryRepository, EnquiryStatus } from "./enquiry-repository.js";

export class PostgresEnquiryRepository implements EnquiryRepository {
  public constructor(private readonly pool: Pool) {}
  public async create(input: EnquiryInput): Promise<EnquiryRecord> {
    const result = await this.pool.query<EnquiryRecord>(`insert into catalogue_enquiries (tenant_id,business_id,name,email,phone,message) select tenant_id,$1,$2,$3,$4,$5 from businesses where id=$1 returning id,name,email,phone,message,status,created_at as "createdAt"`, [input.businessId,input.name,input.email??null,input.phone??null,input.message]);
    const record=result.rows[0]; if (!record) throw new Error("Business does not exist"); return record;
  }
  public async list(context: RequestContext,options:{status?:EnquiryStatus;limit?:number;offset?:number}={}): Promise<readonly EnquiryRecord[]> {
    const result=await this.pool.query<EnquiryRecord>(`select id,name,email,phone,message,status,created_at as "createdAt" from catalogue_enquiries where tenant_id=$1 and business_id=$2 and ($3::text is null or status=$3) order by created_at desc limit $4 offset $5`,[context.tenantId,context.businessId,options.status??null,options.limit??50,options.offset??0]); return result.rows;
  }
  public async updateStatus(context: RequestContext,enquiryId:string,status:EnquiryStatus): Promise<EnquiryRecord|null> {
    const client=await this.pool.connect();
    try {
      await client.query("begin");
      const current=await client.query<{status:EnquiryStatus}>(`select status from catalogue_enquiries where id=$1 and tenant_id=$2 and business_id=$3 for update`,[enquiryId,context.tenantId,context.businessId]);
      if(!current.rows[0]){await client.query("rollback");return null;}
      const result=await client.query<EnquiryRecord>(`update catalogue_enquiries set status=$1,updated_at=now() where id=$2 and tenant_id=$3 and business_id=$4 returning id,name,email,phone,message,status,created_at as "createdAt"`,[status,enquiryId,context.tenantId,context.businessId]);
      const record=result.rows[0];
      if(!record) throw new Error("Enquiry update failed");
      await client.query(`insert into audit_events (tenant_id,business_id,actor_user_id,action,target_type,target_id,before_data,after_data) values ($1,$2,$3,$4,$5,$6,$7,$8)`,[context.tenantId,context.businessId,context.userId,"catalogue.enquiry.status_changed","catalogue_enquiry",enquiryId,JSON.stringify({status:current.rows[0].status}),JSON.stringify({status})]);
      await client.query("commit"); return record;
    } catch(error) { await client.query("rollback"); throw error; } finally { client.release(); }
  }
}
