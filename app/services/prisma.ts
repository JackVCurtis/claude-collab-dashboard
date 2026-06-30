import { PrismaClient } from '@prisma/client'

/**
 * A single shared PrismaClient for the whole process. Importing this module
 * anywhere (`import prisma from '#services/prisma'`) returns the same instance,
 * which keeps the Postgres connection pool from being recreated per request.
 */
const prisma = new PrismaClient()

export default prisma
