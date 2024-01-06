import {z} from 'zod';
import {SchemaConfig, TenantSchemas} from "./interfaces";

export const MAX_LIMIT = 100;

export const errorResponseSchema = z.object({
  error: z.string(),
})

export enum ABI_FIELD_TYPES {
  bool = 'bool',
  uint8 = 'uint8',
  uint16 = 'uint16',
  uint32 = 'uint32',
  uint64 = 'uint64',
  uint128 = 'uint128',
  uint256 = 'uint256',
  address = 'address',
  string = 'string',
  bytes = 'bytes',
  bytes32 = 'bytes32'
}

export enum UserRoles {
  READ = "read",
  WRITE = "write",
}

export const EAS_VERSION_CONFIG: {
  [key: string]: {
    name: string,
    explorerUrl: string,
    eas: {
      address: string,
      version: string,
      chainId: number
    }
  }
} = {
  "arbitrum-0.26": {
    name: "Arbitrum 0.26 (Recommended)",
    explorerUrl: "https://arbitrum.easscan.org",
    eas: {
      address: "0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458",
      version: "0.26",
      chainId: 42161
    }
  },
  "ethereum-0.26": {
    name: "Ethereum v0.26",
    explorerUrl: "https://easscan.org",
    eas: {
      address: "0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587",
      version: "0.26",
      chainId: 1,
    }
  },
  "sepolia-0.26": {
    name: "Sepolia v0.26 (Testnet)",
    explorerUrl: "https://sepolia.easscan.org",
    eas: {
      address: "0xC2679fBD37d54388Ce493F1DB75320D236e1815e",
      version: "0.26",
      chainId: 11155111,
    }
  }
}

export const DEFAULT_TICKET_SCHEMA: SchemaConfig = {
  name: "Default Ticket Schema",
  inbuilt: true,
  uid: "0x7f6fb09beb1886d0b223e9f15242961198dd360021b2c9f75ac879c0f786cafd",
  fields: [
    { label: "Event ID", name: "eventId", type: "string", hint: "The identifier for the event. Allows issuing multiple events with the same private key." },
    { label: "Ticket ID", name: "ticketId", type: "string", hint: "A unique value to identify a single ticket." },
    { label: "Ticket Class", name: "ticketClass", type: "uint8", hint: "A numeric value from 1-256 to represent the ticket class or tier." },
    { label: "Email commitment", name: "commitment", type: "bytes", isCommitment: true, hint: "The email address of the user. This value is hidden in a pedersen commitment and used to verify ownership." },
  ],
  collectionField: "eventId",
  idFields: ["ticketId"],
  emailCommitField: "commitment"
}

export const DEFAULT_MEMBERSHIP_SCHEMA: SchemaConfig = {
  name: "Default Membership Schema",
  inbuilt: true,
  uid: "0x44ec5251add2115c92896cf4b531eb2fcfac6d8ec8caa451df52f0a25a028545",
  fields: [
    { label: "Version", name: "version", type: "uint8", hint: "The version of SmartLayer pass" },
    { label: "Organisation ID", name: "orgId", type: "string", hint: "The SmartLayer org ID" },
    { label: "Member ID", name: "memberId", type: "string", hint: "The unique ID for the SL pass" },
    { label: "Member Role", name: "memberRole", type: "string", hint: "The member role for this ID" },
    { label: "Email commitment", name: "commitment", type: "bytes", isCommitment: true, hint: "The email address for the member (hidden in Pedersen commitment)" },
    { label: "TokenScript URI", name: "scriptURI", type: "string", hint: "The TokenScript URI for this attestation" },
  ],
  collectionField: "orgId",
  idFields: ["memberId"],
  emailCommitField: "commitment"
}

export const INBUILT_SCHEMAS: TenantSchemas = {
  "0x7f6fb09beb1886d0b223e9f15242961198dd360021b2c9f75ac879c0f786cafd": DEFAULT_TICKET_SCHEMA,
  "0x44ec5251add2115c92896cf4b531eb2fcfac6d8ec8caa451df52f0a25a028545": DEFAULT_MEMBERSHIP_SCHEMA
}

export const DEFAULT_EMAIL_TEMPLATE_CONTENT = `
<div style="
    background-color: #ffffff;
    margin: 0 auto;
    max-width: 640px;
    text-align: center;
    color: #20323e;" class="main">
	<a clicktracking="off" target="_blank">
		<img
            src="\${logoUrl}"
            style="
                width: 100%;
                margin-top: 32px;
                margin-left: auto;
                margin-right: auto;"
		/>
	</a>
	<div style="margin: 0 3px">
		<div
            style="
            font-family: 'Rubik', 'Segoe UI', 'Roboto', 'Oxygen-Sans', 'Ubuntu',
              'Helvetica Neue', 'sans-serif';
            font-style: normal;
            font-weight: 600;
            font-size: 30px;
            line-height: 36px;
            margin-top: 32px;"
		>
			Your ticket attestation for \${eventName}
		</div>

		<div style="
            font-family: 'Rubik', 'Segoe UI', 'Roboto', 'Oxygen-Sans', 'Ubuntu',
              'Helvetica Neue', 'sans-serif';
            font-style: normal;
            font-weight: 600;
            font-size: 20px;
            line-height: 24px;
            text-align: center;
            color: #20323e;
            margin: 0 auto;
            max-width: 400px;
            padding: 32px 0;
          "
		>
			Click on the magic link below to install your \${eventName} ticket and receive exclusive perks!
		</div>

		<a href="\${magicLink}" clicktracking="off" target="_blank">
			Your Magic Link
		</a>
	</div>
</div>
`;
