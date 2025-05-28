// src/models/contact.ts
import { QueryResult } from 'pg';
import { pool } from '../db';

export interface Contact {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: 'primary' | 'secondary';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const createContact = async (
  phoneNumber: string | null,
  email: string | null,
  linkedId: number | null,
  linkPrecedence: 'primary' | 'secondary'
): Promise<Contact> => {
  const result = await pool.query(
    `INSERT INTO "Contact" (phoneNumber, email, linkedId, linkPrecedence)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [phoneNumber, email, linkedId, linkPrecedence]
  );
  return result.rows[0];
};

export const findContactsByEmailOrPhone = async (
  email: string | null,
  phoneNumber: string | null
): Promise<Contact[]> => {
  let query = `SELECT * FROM "Contact" WHERE deletedAt IS NULL AND (`;
  const params: (string | null)[] = [];
  const conditions: string[] = [];

  if (email) {
    params.push(email);
    conditions.push(`email = $${params.length}`);
  }

  if (phoneNumber) {
    params.push(phoneNumber);
    conditions.push(`phoneNumber = $${params.length}`);
  }

  if (conditions.length === 0) {
    return [];
  }

  query += conditions.join(' OR ') + ')';
  const result = await pool.query(query, params);
  return result.rows;
};

export const updateContact = async (
  id: number,
  updates: Partial<Contact>
): Promise<Contact> => {
  const fieldsToUpdate = Object.keys(updates)
    .map((key, index) => `${key} = $${index + 1}`)
    .join(', ');
  
  const values = Object.values(updates);
  values.push(id);

  const result = await pool.query(
    `UPDATE "Contact"
     SET ${fieldsToUpdate}, updatedAt = NOW()
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );
  return result.rows[0];
};

export const findAllLinkedContacts = async (primaryId: number): Promise<Contact[]> => {
  const result = await pool.query(
    `WITH RECURSIVE contact_tree AS (
       SELECT * FROM "Contact" WHERE id = $1 AND deletedAt IS NULL
       UNION
       SELECT c.* FROM "Contact" c
       JOIN contact_tree ct ON c.linkedId = ct.id OR (c.id = ct.linkedId AND ct.linkPrecedence = 'primary')
       WHERE c.deletedAt IS NULL
     )
     SELECT * FROM contact_tree`,
    [primaryId]
  );
  return result.rows;
};