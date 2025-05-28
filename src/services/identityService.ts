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
  const matchingContacts = await findContactsByEmailOrPhone(email, phoneNumber);

  if (matchingContacts.length === 0) {
    // No match: create a new primary contact
    const newContact = await createContact(phoneNumber, email, null, 'primary');
    return formatResponse(newContact);
  }

  // Find primary contacts
  const primaryContacts = matchingContacts.filter(c => c.linkPrecedence === 'primary');

  // Merge multiple primaries
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

  // Safely get the effective primary contact
  let primaryContact: Contact | undefined;
  if (primaryContacts.length > 0) {
    primaryContact = primaryContacts[0];
  } else {
    primaryContact = await findPrimaryContact(matchingContacts[0]);
    if (!primaryContact) {
      throw new Error(`Primary contact not found for linkedId = ${matchingContacts[0]?.linkedId}`);
    }
  }

  // Check if we need to create a secondary contact
  const shouldCreateSecondary =
    (email && !matchingContacts.some(c => c.email === email)) ||
    (phoneNumber && !matchingContacts.some(c => c.phoneNumber === phoneNumber));

  if (shouldCreateSecondary && primaryContact?.id) {
    await createContact(phoneNumber, email, primaryContact.id, 'secondary');
  }

  // Fetch all linked contacts
  const allLinkedContacts = await findAllLinkedContacts(primaryContact.id);

  return formatResponse(primaryContact, allLinkedContacts);
};

const findPrimaryContact = async (contact: Contact): Promise<Contact | undefined> => {
  if (contact.linkPrecedence === 'primary') return contact;

  const result = await pool.query('SELECT * FROM "Contact" WHERE id = $1', [
    contact.linkedId,
  ]);

  if (result.rows.length === 0) {
    console.warn(`No contact found for linkedId = ${contact.linkedId}`);
    return undefined;
  }

  return result.rows[0];
};

const formatResponse = (
  primaryContact: Contact,
  allLinkedContacts?: Contact[]
): IdentifyResponse => {
  if (!allLinkedContacts) {
    return {
      contact: {
        primaryContactId: primaryContact.id,
        emails: primaryContact.email ? [primaryContact.email] : [],
        phoneNumbers: primaryContact.phoneNumber ? [primaryContact.phoneNumber] : [],
        secondaryContactIds: [],
      },
    };
  }

  const emails = new Set<string>();
  const phoneNumbers = new Set<string>();
  const secondaryContactIds: number[] = [];

  if (primaryContact.email) emails.add(primaryContact.email);
  if (primaryContact.phoneNumber) phoneNumbers.add(primaryContact.phoneNumber);

  for (const contact of allLinkedContacts) {
    if (contact.id === primaryContact.id) continue;

    if (contact.linkPrecedence === 'secondary') {
      secondaryContactIds.push(contact.id);
    }

    if (contact.email) emails.add(contact.email);
    if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
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
