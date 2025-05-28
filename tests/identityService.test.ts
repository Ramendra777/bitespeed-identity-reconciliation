// tests/identityService.test.ts
import { identifyContact } from '../src/services/identityService';
import { createContact } from '../src/models/contact';
import { resetDatabase } from './testUtils';
import { pool } from '../src/db';

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe('identifyContact', () => {
  it('should create a new primary contact when no matches exist', async () => {
    const response = await identifyContact('test@example.com', '123456');
    
    expect(response.contact.primaryContactId).toBeDefined();
    expect(response.contact.emails).toEqual(['test@example.com']);
    expect(response.contact.phoneNumbers).toEqual(['123456']);
    expect(response.contact.secondaryContactIds).toEqual([]);
  });

  it('should link to existing contact when email matches', async () => {
    const primary = await createContact('123456', 'test@example.com', null, 'primary');
    
    const response = await identifyContact('test@example.com', '789012');
    
    expect(response.contact.primaryContactId).toBe(primary.id);
    expect(response.contact.emails).toEqual(['test@example.com']);
    expect(response.contact.phoneNumbers).toEqual(['123456', '789012']);
    expect(response.contact.secondaryContactIds.length).toBe(1);
  });

  it('should merge two primary contacts when they are linked', async () => {
    const primary1 = await createContact('111111', 'one@example.com', null, 'primary');
    const primary2 = await createContact('222222', 'two@example.com', null, 'primary');
    
    const response = await identifyContact('one@example.com', '222222');
    
    expect(response.contact.primaryContactId).toBe(primary1.id);
    expect(response.contact.secondaryContactIds).toContain(primary2.id);
    expect(response.contact.emails).toEqual(
      expect.arrayContaining(['one@example.com', 'two@example.com'])
    );
    expect(response.contact.phoneNumbers).toEqual(
      expect.arrayContaining(['111111', '222222'])
    );
  });
});