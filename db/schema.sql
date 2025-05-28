CREATE TABLE "Contact" (
  id SERIAL PRIMARY KEY,
  phoneNumber VARCHAR(15),
  email VARCHAR(255),
  linkedId INTEGER REFERENCES "Contact"(id),
  linkPrecedence VARCHAR(8) CHECK (linkPrecedence IN ('primary', 'secondary')),
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  deletedAt TIMESTAMP
);

CREATE INDEX idx_contact_email ON "Contact"(email) WHERE email IS NOT NULL;
CREATE INDEX idx_contact_phone ON "Contact"(phoneNumber) WHERE phoneNumber IS NOT NULL;
CREATE INDEX idx_contact_linked ON "Contact"(linkedId) WHERE linkedId IS NOT NULL;