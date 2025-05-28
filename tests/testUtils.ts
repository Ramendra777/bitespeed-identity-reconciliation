import { pool } from '../src/db';

export async function resetDatabase() {
  try {
    // Drop all tables and recreate them
    await pool.query('DROP TABLE IF EXISTS "Contact" CASCADE');
    
    // Recreate tables with schema
    await pool.query(`
      CREATE TABLE "Contact" (
        id SERIAL PRIMARY KEY,
        phoneNumber VARCHAR(15),
        email VARCHAR(255),
        linkedId INTEGER REFERENCES "Contact"(id),
        linkPrecedence VARCHAR(8) CHECK (linkPrecedence IN ('primary', 'secondary')),
        createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
        deletedAt TIMESTAMP
      )
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX idx_contact_email ON "Contact"(email) WHERE email IS NOT NULL
    `);
    await pool.query(`
      CREATE INDEX idx_contact_phone ON "Contact"(phoneNumber) WHERE phoneNumber IS NOT NULL
    `);
    await pool.query(`
      CREATE INDEX idx_contact_linked ON "Contact"(linkedId) WHERE linkedId IS NOT NULL
    `);
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}