import { defineConfig } from 'prisma/config';
import 'dotenv/config'; // Prisma 7 CLI doesn't auto-load .env — must load explicitly

// See: https://pris.ly/d/config-datasource
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    seed: 'ts-node ./prisma/seed.ts',
  },
});
