import mysql from "mysql2/promise";

declare global {
  var __mishnaPool: mysql.Pool | undefined;
}

export function db(): mysql.Pool {
  if (!global.__mishnaPool) {
    global.__mishnaPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 3306),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      charset: "utf8mb4_unicode_ci",
      waitForConnections: true,
      connectionLimit: 10,
      dateStrings: true,
    });
  }
  return global.__mishnaPool;
}

/** SELECT שמחזיר שורות (עטיפה נוחה סביב query עם טיפוס גנרי). */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const [rows] = await db().query(sql, params);
  return rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** INSERT/UPDATE/DELETE — מחזיר תוצאת ה-execute (insertId, affectedRows וכו'). */
export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<mysql.ResultSetHeader> {
  const [result] = await db().query(sql, params);
  return result as mysql.ResultSetHeader;
}
