import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

console.log("DATABASE_URL existe?", !!databaseUrl);

if (databaseUrl) {
  console.log(
    "Banco:",
    databaseUrl.replace(/postgresql:\/\/([^:]+):([^@]+)@/, "postgresql://$1:****@")
  );
}

const pool = new Pool({
  connectionString:
    databaseUrl || 'postgresql://postgres:postgres@localhost:5432/docemomento',
});

export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();

  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
};