import {createEnv} from '@t3-oss/env-core';
import dotenv from 'dotenv';
import {z} from 'zod';

dotenv.config();

export const env = createEnv({
  clientPrefix: '',
  server: {
    FASTIFY_PORT: z.coerce.number().default(3008),
    FASTIFY_ADDRESS: z.string().default('127.0.0.1'),
    LOG_LEVEL: z.string().default('debug'),
    DB_HOST: z.string().default('127.0.0.1'),
    DB_PORT: z.coerce.number().default(5432),
    DB_USER: z.string().default('test_admin'),
    DB_PASSWORD: z.string().default('admin'),
    DB_DATABASE: z.string().default('smart_cat'),
    CONTRACT_CHAIN: z.coerce.number().default(11155111),
    CONTRACT_RPC: z.string().default("https://sepolia.infura.io/v3/9f79b2f9274344af90b8d4e244b580ef"),
    SMARTCAT_CONTRACT: z.string().default("0x882c95484Ed23DDaACB303297184E1B97007f1DC"),
    NFT_CONTRACT: z.string().default("0x1d6E5bcF82D2515214D2EB0d4a79Ca35a2428827")
  },
  client: {},
  runtimeEnv: process.env,
});
