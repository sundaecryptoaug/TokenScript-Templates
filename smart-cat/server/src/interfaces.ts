import {SchemaField} from "@tokenscript/attestation/dist/eas/EasTicketAttestation";
import {UserRoles} from "./constant";

export interface KeyRecord {
    id: number;
    name: string;
    pubKey: string;
    ethAddress: string;
}
export type TenantKeys = {[keyId: number]: KeyRecord};

export type SchemaConfig = {
    name: string,
    inbuilt?: boolean,
    uid: string,
    fields: (SchemaField & {label: string, hint?: string})[],
    collectionField: string,
    idFields?: string[],
    emailCommitField?: string
};
export type TenantSchemas = {[uid: string]: SchemaConfig};

export interface TenantMember {
    userEmail: string
    roles: UserRoles[]
}
export type TenantMembers = {[userEmail: string]: TenantMember};