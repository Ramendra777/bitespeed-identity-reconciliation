"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyContact = void 0;
// src/services/identityService.ts
const db_1 = require("../db");
const contact_1 = require("../models/contact");
const identifyContact = (email, phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    // Find all contacts that match either email or phone
    const matchingContacts = yield (0, contact_1.findContactsByEmailOrPhone)(email, phoneNumber);
    if (matchingContacts.length === 0) {
        // No matches found, create a new primary contact
        const newContact = yield (0, contact_1.createContact)(phoneNumber, email, null, 'primary');
        return formatResponse(newContact);
    }
    // Find all primary contacts from the matches
    const primaryContacts = matchingContacts.filter((c) => c.linkPrecedence === 'primary');
    // If we have multiple primary contacts, we need to merge them
    if (primaryContacts.length > 1) {
        // Sort by createdAt to find the oldest one
        primaryContacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const oldestPrimary = primaryContacts[0];
        const newerPrimaries = primaryContacts.slice(1);
        // Convert newer primary contacts to secondary
        for (const primary of newerPrimaries) {
            yield (0, contact_1.updateContact)(primary.id, {
                linkedId: oldestPrimary.id,
                linkPrecedence: 'secondary',
            });
        }
    }
    // Determine the primary contact (either the single one or the oldest one after merge)
    const primaryContact = primaryContacts.length > 0
        ? primaryContacts[0]
        : yield findPrimaryContact(matchingContacts[0]);
    // Check if we need to create a new secondary contact
    const shouldCreateSecondary = (email && !matchingContacts.some((c) => c.email === email)) ||
        (phoneNumber && !matchingContacts.some((c) => c.phoneNumber === phoneNumber));
    if (shouldCreateSecondary) {
        yield (0, contact_1.createContact)(phoneNumber, email, primaryContact.id, 'secondary');
    }
    // Get all linked contacts
    const allLinkedContacts = yield (0, contact_1.findAllLinkedContacts)(primaryContact.id);
    return formatResponse(primaryContact, allLinkedContacts);
});
exports.identifyContact = identifyContact;
const findPrimaryContact = (contact) => __awaiter(void 0, void 0, void 0, function* () {
    if (contact.linkPrecedence === 'primary') {
        return contact;
    }
    const result = yield db_1.pool.query('SELECT * FROM "Contact" WHERE id = $1', [
        contact.linkedId,
    ]);
    return result.rows[0];
});
const formatResponse = (primaryContact, allLinkedContacts) => {
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
    const emails = new Set();
    const phoneNumbers = new Set();
    const secondaryContactIds = [];
    // Add primary contact info first
    if (primaryContact.email)
        emails.add(primaryContact.email);
    if (primaryContact.phoneNumber)
        phoneNumbers.add(primaryContact.phoneNumber);
    // Process all linked contacts
    for (const contact of allLinkedContacts) {
        if (contact.id === primaryContact.id)
            continue;
        if (contact.linkPrecedence === 'secondary') {
            secondaryContactIds.push(contact.id);
        }
        if (contact.email)
            emails.add(contact.email);
        if (contact.phoneNumber)
            phoneNumbers.add(contact.phoneNumber);
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
