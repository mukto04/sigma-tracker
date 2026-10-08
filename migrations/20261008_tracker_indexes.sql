-- Apply once to the Cloudflare D1 production database.
-- Each statement is safe for the existing tracker schema.
CREATE INDEX IF NOT EXISTS "User_companyId_role_idx" ON "User"("companyId", "role");
CREATE INDEX IF NOT EXISTS "Project_companyId_idx" ON "Project"("companyId");
CREATE INDEX IF NOT EXISTS "TimeEntry_userId_startTime_idx" ON "TimeEntry"("userId", "startTime");
CREATE INDEX IF NOT EXISTS "TimeEntry_projectId_idx" ON "TimeEntry"("projectId");
CREATE INDEX IF NOT EXISTS "Screenshot_userId_createdAt_idx" ON "Screenshot"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Screenshot_createdAt_userId_idx" ON "Screenshot"("createdAt", "userId");
CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_userId_idx" ON "ActivityLog"("createdAt", "userId");
