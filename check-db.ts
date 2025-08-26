import db from './src/database/index.js';
import { tasks, userTable } from './src/database/schema.js';

async function checkDB() {
  try {
    console.log('Checking database...');
    
    // Check if tasks exist
    const existingTasks = await db.select().from(tasks);
    console.log('Existing tasks:', existingTasks.length);
    
    // Check if users exist
    const existingUsers = await db.select().from(userTable);
    console.log('Existing users:', existingUsers.length);
    
  } catch (error) {
    console.log('Error:', error);
  }
}

checkDB();
