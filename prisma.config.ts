import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Use env() to enforce presence, or process.env if optional
    url: env('DATABASE_URL'),
    // shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL ?? ''
  },
})
