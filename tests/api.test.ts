// tests/api.test.ts
import request from 'supertest';
import app from '../src/app';
import { createContact } from '../src/models/contact';
import { resetDatabase } from './testUtils';
import { pool } from '../src/db';

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe('POST /identify', () => {
  it('should return a new primary contact when no matches exist', async () => {
    const response = await request(app)
      .post('/identify')
      .send({ email: 'new@example.com', phoneNumber: '123456' });
    
    expect(response.status).toBe(200);
    expect(response.body.contact.primaryContactId).toBeDefined();
    expect(response.body.contact.emails).toEqual(['new@example.com']);
    expect(response.body.contact.phoneNumbers).toEqual(['123456']);
    expect(response.body.contact.secondaryContactIds).toEqual([]);
  });

  it('should return existing contact when email matches', async () => {
    const primary = await createContact('111111', 'existing@example.com', null, 'primary');
    
    const response = await request(app)
      .post('/identify')
      .send({ email: 'existing@example.com', phoneNumber: '222222' });
    
    expect(response.status).toBe(200);
    expect(response.body.contact.primaryContactId).toBe(primary.id);
    expect(response.body.contact.emails).toEqual(['existing@example.com']);
    expect(response.body.contact.phoneNumbers).toEqual(['111111', '222222']);
    expect(response.body.contact.secondaryContactIds.length).toBe(1);
  });

  it('should return 400 when neither email nor phone is provided', async () => {
    const response = await request(app)
      .post('/identify')
      .send({});
    
    expect(response.status).toBe(400);
  });
});