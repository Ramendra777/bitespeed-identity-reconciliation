// src/services/identityService.ts
import  pool  from '../db';
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

  // If we have multiple primary contacts, we need to merge them
  if (primaryContacts.length > 1) {
    // Sort by createdAt to find the oldest one
    primaryContacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const oldestPrimary = primaryContacts[0];
    const newerPrimaries = primaryContacts.slice(1);

    // Convert newer primary contacts to secondary
    for (const primary of newerPrimaries) {
      await updateContact(primary.id, {
        linkedId: oldestPrimary.id,
        linkPrecedence: 'secondary',
      });
    }
  }

  // Determine the primary contact (either the single one or the oldest one after merge)
  const primaryContact =
    primaryContacts.length > 0
      ? primaryContacts[0]
      : await findPrimaryContact(matchingContacts[0]);

  // Check if we need to create a new secondary contact
  const shouldCreateSecondary =
    (email && !matchingContacts.some((c) => c.email === email)) ||
    (phoneNumber && !matchingContacts.some((c) => c.phoneNumber === phoneNumber));

  if (shouldCreateSecondary) {
    await createContact(phoneNumber, email, primaryContact.id, 'secondary');
  }

  // Get all linked contacts
  const allLinkedContacts = await findAllLinkedContacts(primaryContact.id);

  return formatResponse(primaryContact, allLinkedContacts);
};

const findPrimaryContact = async (contact: Contact): Promise<Contact> => {
  if (contact.linkPrecedence === 'primary') {
    return contact;
  }
  const result = await pool.query('SELECT * FROM "Contact" WHERE id = $1', [
    contact.linkedId,
  ]);
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
        phoneNumbers: primaryContact.phoneNumber
          ? [primaryContact.phoneNumber]
          : [],
        secondaryContactIds: [],
      },
    };
  }

  const emails = new Set<string>();
  const phoneNumbers = new Set<string>();
  const secondaryContactIds: number[] = [];

  // Add primary contact info first
  if (primaryContact.email) emails.add(primaryContact.email);
  if (primaryContact.phoneNumber) phoneNumbers.add(primaryContact.phoneNumber);

  // Process all linked contacts
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