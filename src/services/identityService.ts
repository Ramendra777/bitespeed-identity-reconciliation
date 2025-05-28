// src/services/identityService.ts
import pool from '../db';
import {
  Contact,
  createContact,
  findContactsByEmailOrPhone,
  updateContact,
  findAllLinkedContacts,
} from '../models/contact';

interface IdentifyResponse {
  contact: {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export const identifyContact = async (
  email: string | null,
  phoneNumber: string | null
): Promise<IdentifyResponse> => {
  // Find all contacts that match either email or phone
  const matchingContacts = await findContactsByEmailOrPhone(email, phoneNumber);

  if (matchingContacts.length === 0) {
    // No matches found, create a new primary contact
    const newContact = await createContact(phoneNumber, email, null, 'primary');
    return formatResponse(newContact);
  }

  // Find all primary contacts from the matches
  const primaryContacts = matchingContacts.filter(
    (c) => c.linkPrecedence === 'primary'
  );

  // If multiple primary contacts, merge them
  if (primaryContacts.length > 1) {
    primaryContacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const oldestPrimary = primaryContacts[0];
    const newerPrimaries = primaryContacts.slice(1);

    for (const primary of newerPrimaries) {
      await updateContact(primary.id, {
        linkedId: oldestPrimary.id,
        linkPrecedence: 'secondary',
      });
    }
  }

  // Determine the actual primary contact
  const baseContact = matchingContacts.find(c => c.linkPrecedence === 'primary') || matchingContacts[0];
  const primaryContact = await findPrimaryContact(baseContact);

  // If linkedId is still undefined (should not happen), throw a clear error
  if (!primaryContact?.id) {
    throw new Error(`Primary contact not found for linkedId = ${baseContact.linkedId}`);
  }

  // Check if we need to create a new secondary contact
  const emailExists = email && matchingContacts.some((c) => c.email === email);
  const phoneExists = phoneNumber && matchingContacts.some((c) => c.phoneNumber === phoneNumber);

  const shouldCreateSecondary = (!emailExists && !!email) || (!phoneExists && !!phoneNumber);

  if (shouldCreateSecondary) {
    await createContact(phoneNumber, email, primaryContact.id, 'secondary');
  }

  // Fetch all linked contacts
  const allLinkedContacts = await findAllLinkedContacts(primaryContact.id);
  return formatResponse(primaryContact, allLinkedContacts);
};

const findPrimaryContact = async (contact: Contact): Promise<Contact> => {
  if (contact.linkPrecedence === 'primary') {
    return contact;
  }

  if (!contact.linkedId) {
    throw new Error(`No contact found for linkedId = ${contact.linkedId}`);
  }

  const result = await pool.query('SELECT * FROM "Contact" WHERE id = $1', [contact.linkedId]);

  if (result.rows.length === 0) {
    throw new Error(`Primary contact not found for linkedId = ${contact.linkedId}`);
  }

  return result.rows[0];
};

const formatResponse = (
  primaryContact: Contact,
  allLinkedContacts?: Contact[]
): IdentifyResponse => {
  const emails = new Set<string>();
  const phoneNumbers = new Set<string>();
  const secondaryContactIds: number[] = [];

  if (primaryContact.email) emails.add(primaryContact.email);
  if (primaryContact.phoneNumber) phoneNumbers.add(primaryContact.phoneNumber);

  if (allLinkedContacts) {
    for (const contact of allLinkedContacts) {
      if (contact.id === primaryContact.id) continue;

      if (contact.linkPrecedence === 'secondary') {
        secondaryContactIds.push(contact.id);
      }

      if (contact.email) emails.add(contact.email);
      if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
    }
  }

  return {
    contact: {
      primaryContactId: primaryContact.id,
      emails: Array.from(emails),
      phoneNumbers: Array.from(phoneNumbers),
      secondaryContactIds,
    },
  };
};
