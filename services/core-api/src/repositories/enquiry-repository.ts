import type { RequestContext } from "../security/request-context.js";
export type EnquiryInput={businessId:string;name:string;email?:string;phone?:string;message:string};
export type EnquiryRecord={id:string;name:string;email:string|null;phone:string|null;message:string;status:string;createdAt:string};
export type EnquiryStatus="new"|"contacted"|"closed"|"spam";
export interface EnquiryRepository{create(input:EnquiryInput):Promise<EnquiryRecord>;list(context:RequestContext,options?:{status?:EnquiryStatus;limit?:number;offset?:number}):Promise<readonly EnquiryRecord[]>;updateStatus?(context:RequestContext,enquiryId:string,status:EnquiryStatus):Promise<EnquiryRecord|null>;}
