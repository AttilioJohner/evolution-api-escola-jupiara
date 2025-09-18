import { PrismaClient } from '@prisma/client';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

interface ProbeResult {
  success: boolean;
  error?: string;
  code?: string;
  timing?: number;
  host?: string;
  resolvedIp?: string;
}

function maskConnectionString(url: string): string {
  return url.replace(/:([^:@]+)@/, ':***@');
}

async function resolveDnsHost(host: string): Promise<string | null> {
  try {
    const result = await dnsLookup(host);
    return result.address;
  } catch (error) {
    console.error(`[DNS] Failed to resolve ${host}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function testDatabaseConnection(url: string, label: string): Promise<ProbeResult> {
  const start = Date.now();

  try {
    // Extract host from connection string
    const urlObj = new URL(url);
    const host = urlObj.hostname;

    console.log(`[${label}] Testing connection to ${maskConnectionString(url)}`);

    // DNS resolution test
    const resolvedIp = await resolveDnsHost(host);
    if (!resolvedIp) {
      return {
        success: false,
        error: 'DNS resolution failed',
        code: 'DNS_FAIL',
        host
      };
    }

    console.log(`[${label}] DNS resolved ${host} → ${resolvedIp}`);

    // Database connection test
    const prisma = new PrismaClient({
      datasources: {
        db: { url }
      },
      log: ['error']
    });

    await prisma.$queryRaw`SELECT 1 as test`;
    await prisma.$disconnect();

    const timing = Date.now() - start;
    console.log(`[${label}] ✅ Connection successful (${timing}ms)`);

    return {
      success: true,
      timing,
      host,
      resolvedIp
    };

  } catch (error: any) {
    const timing = Date.now() - start;
    const errorCode = error.code || error.errorCode || 'UNKNOWN';
    const errorMessage = error.message || String(error);

    console.error(`[${label}] ❌ Connection failed (${timing}ms):`, errorMessage);
    console.error(`[${label}] Error code: ${errorCode}`);

    return {
      success: false,
      error: errorMessage,
      code: errorCode,
      timing
    };
  }
}

export async function runDatabaseProbe(): Promise<{
  pooler: ProbeResult;
  direct: ProbeResult;
}> {
  console.log('🔍 Starting database connectivity probe...\n');

  const poolerUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (!poolerUrl && !directUrl) {
    throw new Error('Neither DATABASE_URL nor DIRECT_URL is configured');
  }

  const results = {
    pooler: { success: false, error: 'Not configured' } as ProbeResult,
    direct: { success: false, error: 'Not configured' } as ProbeResult
  };

  // Test direct connection first (more reliable)
  if (directUrl) {
    console.log('=== Testing DIRECT connection (port 5432) ===');
    results.direct = await testDatabaseConnection(directUrl, 'DIRECT');
    console.log('');
  }

  // Test pooler connection
  if (poolerUrl) {
    console.log('=== Testing POOLER connection (port 6543) ===');
    results.pooler = await testDatabaseConnection(poolerUrl, 'POOLER');
    console.log('');
  }

  // Summary
  console.log('📊 PROBE SUMMARY:');
  console.log(`Direct (5432): ${results.direct.success ? '✅' : '❌'} ${results.direct.error || ''}`);
  console.log(`Pooler (6543): ${results.pooler.success ? '✅' : '❌'} ${results.pooler.error || ''}`);

  return results;
}

// CLI execution
if (require.main === module) {
  runDatabaseProbe()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Probe failed:', error);
      process.exit(1);
    });
}