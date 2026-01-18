import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Lazy-loaded pool to avoid errors during build time
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
      max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
    });

    pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  return pool;
}

// Query helper function with logging in development
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();

  try {
    const result = await getPool().query<T>(text, params);
    const duration = Date.now() - start;

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', {
        text,
        params,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Query error', {
      text,
      params,
      duration: `${duration}ms`,
      error,
    });
    throw error;
  }
}

// Transaction helper function for atomic operations
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get a client from the pool (for manual transaction handling)
export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Export pool getter for direct access when needed
export { getPool as pool };
