import { createClient } from '@libsql/client';

async function addUserIdColumn() {
  try {
    const db = createClient({
      url: process.env.DB_FILE_NAME || './dev.db'
    });

    console.log('Adding user_id column to tasks table...');
    
    // Add the user_id column to the tasks table
    await db.execute(`
      ALTER TABLE tasks ADD COLUMN user_id TEXT NOT NULL DEFAULT ''
    `);
    
    console.log('Successfully added user_id column to tasks table');
    
  } catch (error) {
    console.log('Error:', error);
  }
}

addUserIdColumn();
