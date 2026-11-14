import type { RequestContext } from "../security/request-context.js";
export type PublicCatalogueRecord={id:string;variantId:string;publicName:string;publicDescription:string|null;publicCategory:string|null;publicPrice:string|null;stockDisplayMode:string;publishedStock:string|null;isFeatured:boolean};
export type PublishProductInput={variantId:string;publicName:string;publicDescription?:string;publicCategory?:string;publicPrice?:string;stockDisplayMode:"exact"|"available"|"hidden";publishedStock?:string;isFeatured?:boolean};
export type PublicCatalogueQuery={search?:string;category?:string;featured?:boolean;limit?:number;offset?:number};
export interface PublicCatalogueRepository{listPublished(businessId:string,query?:PublicCatalogueQuery):Promise<readonly PublicCatalogueRecord[]>;publish(context:RequestContext,input:PublishProductInput):Promise<PublicCatalogueRecord>;unpublish(context:RequestContext,variantId:string):Promise<void>;}
