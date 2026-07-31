import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:dummy@ep-dummy.us-east-1.aws.neon.tech/neondb?sslmode=require')
export const db = drizzle(sql, { schema })
