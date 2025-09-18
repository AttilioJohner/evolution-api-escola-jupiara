# Database Configuration Guide

## Environment Variables for Render

Configure the following environment variables in your Render service:

### Required Variables

```bash
# Primary connection (Pooler - recommended for production)
DATABASE_URL=postgresql://postgres.<PASSWORD>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=5

# Direct connection (for migrations and fallback)
DIRECT_URL=postgresql://postgres.<PASSWORD>@db.<PROJECT-REF>.<REGION>.supabase.co:5432/postgres?sslmode=require

# Optional: Database settings
DATABASE_ENABLED=true
```

### URL Format Details

**Pooler URL (6543):**
- Host: `aws-<REGION>.pooler.supabase.com`
- Port: `6543`
- Required params: `sslmode=require&pgbouncer=true`
- Recommended: `&connection_limit=5`

**Direct URL (5432):**
- Host: `db.<PROJECT-REF>.<REGION>.supabase.co`
- Port: `5432`
- Required params: `sslmode=require`

## Health Monitoring

### Health Check Endpoints

- `GET /health` - General API health
- `GET /health/db` - Database connectivity test

### Database Probe Script

Run locally to test both connections:

```bash
npm run db:probe
```

### Expected Responses

**Healthy DB Connection:**
```json
{
  "ok": true,
  "status": "connected",
  "duration_ms": 245,
  "connection_type": "pooler"
}
```

**Failed DB Connection:**
```json
{
  "ok": false,
  "status": "connection_failed",
  "error_code": "P1001",
  "error_message": "Can't reach database server"
}
```

## Troubleshooting

### Common Issues

1. **P1001 - Can't reach database server**
   - Check URL format and credentials
   - Verify Supabase project is active
   - Test with direct URL (port 5432) first

2. **Prepared statement errors with pooler**
   - Ensure `pgbouncer=true` in DATABASE_URL
   - Check connection pooling mode in Supabase

3. **Connection timeout**
   - Add `&connect_timeout=10&pool_timeout=10`
   - Reduce `connection_limit` to 3-5

### Fallback Strategy

If pooler (6543) fails:
1. Switch to DIRECT_URL temporarily
2. Update Render env vars
3. Monitor for stability
4. Investigate pooler access restrictions

### Network Diagnostics

The probe script tests:
- DNS resolution for both hosts
- Actual database connectivity
- Connection timing and error codes

## Prisma Configuration

The schema is configured with:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")    // Pooler connection
  directUrl = env("DIRECT_URL")      // Direct connection
}

generator client {
  binaryTargets = ["native", "debian-openssl-3.0.x"]  // For Render deployment
}
```

- Migrations use `DIRECT_URL`
- Runtime queries use `DATABASE_URL`
- PgBouncer mode automatically detected