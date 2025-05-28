# Bitespeed Identity Service

This service is designed to reconcile customer identities on FluxKart.com, ensuring that multiple orders with different emails and phone numbers can be linked back to the same customer.

---

## 🚀 Live API Endpoint

```
POST https://bitespeed-identity-reconciliation-q01c.onrender.com/identify
```

Request body:
```json
{
  "email": "example@email.com",
  "phoneNumber": "1234567890"
}
```

---

## 🧠 Tech Stack

- **Node.js** with **TypeScript**
- **Express.js** framework
- **PostgreSQL** database
- **Render.com** for hosting

---

## 📁 Folder Structure

```
bitespeed-identity-reconciliation/
├── node_modules/
├── src/
│   ├── config.ts
│   ├── db.ts
│   ├── models/
│   │   └── contact.ts
│   ├── services/
│   │   └── identityService.ts
│   ├── controllers/
│   │   └── identityController.ts
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── api.test.ts
│   ├── identityService.test.ts
│   └── testUtils.ts
├── db/
│   └── schema.sql
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── tsconfig.json
```

---

## 🧪 Sample Postman Request

Use JSON body:
```json
{
  "email": "george@hillvalley.edu",
  "phoneNumber": "717171"
}
```

---

## ⚙️ Scripts

```bash
# Install dependencies
npm install

# Start in production
npm run build
npm run dev
```

---


