import 'dotenv/config';

let db: any;

if (process.env.NODE_ENV === 'test') {
	// Use better-sqlite3 for tests to avoid libsql file locking issues
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const BetterSqlite3 = require('better-sqlite3');
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { drizzle: drizzleBetter } = require('drizzle-orm/better-sqlite3');

	// DB_FILE_NAME may be prefixed with file: in tests
	const filePath = (process.env.DB_FILE_NAME || '').replace(/^file:/, '');
	const conn = new BetterSqlite3(filePath);
	db = drizzleBetter(conn);
} else {
	// default: libsql client (for runtime environments expecting libsql URLs)
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { drizzle } = require('drizzle-orm/libsql');
	db = drizzle(process.env.DB_FILE_NAME!);
}

export default db;