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
exports.findAllLinkedContacts = exports.updateContact = exports.findContactsByEmailOrPhone = exports.createContact = void 0;
const db_1 = require("../db");
const createContact = (phoneNumber, email, linkedId, linkPrecedence) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`INSERT INTO "Contact" (phoneNumber, email, linkedId, linkPrecedence)
     VALUES ($1, $2, $3, $4)
     RETURNING *`, [phoneNumber, email, linkedId, linkPrecedence]);
    return result.rows[0];
});
exports.createContact = createContact;
const findContactsByEmailOrPhone = (email, phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    let query = `SELECT * FROM "Contact" WHERE deletedAt IS NULL AND (`;
    const params = [];
    const conditions = [];
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
    const result = yield db_1.pool.query(query, params);
    return result.rows;
});
exports.findContactsByEmailOrPhone = findContactsByEmailOrPhone;
const updateContact = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    const fieldsToUpdate = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');
    const values = Object.values(updates);
    values.push(id);
    const result = yield db_1.pool.query(`UPDATE "Contact"
     SET ${fieldsToUpdate}, updatedAt = NOW()
     WHERE id = $${values.length}
     RETURNING *`, values);
    return result.rows[0];
});
exports.updateContact = updateContact;
const findAllLinkedContacts = (primaryId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`WITH RECURSIVE contact_tree AS (
       SELECT * FROM "Contact" WHERE id = $1 AND deletedAt IS NULL
       UNION
       SELECT c.* FROM "Contact" c
       JOIN contact_tree ct ON c.linkedId = ct.id OR (c.id = ct.linkedId AND ct.linkPrecedence = 'primary')
       WHERE c.deletedAt IS NULL
     )
     SELECT * FROM contact_tree`, [primaryId]);
    return result.rows;
});
exports.findAllLinkedContacts = findAllLinkedContacts;
