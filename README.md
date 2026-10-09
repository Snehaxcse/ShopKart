# ShopKart Authentication Lab

Minimal full-stack app for customer register, login, profile, and logout using JWT in an HttpOnly cookie.

## Tech stack

- Backend: Node.js, Express, MongoDB, Mongoose, bcrypt, jsonwebtoken, cookie-parser
- Frontend: React (Vite), React Router DOM, Axios

## Folder structure

```
ShopKart/
  backend/
    controllers/
    models/
    routes/
    middlewares/
    utils/
    index.js
  frontend/
    src/
      pages/
      components/
      services/
```

## Environment variables

Backend (`backend/.env`):

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Frontend (`frontend/.env`):

```
VITE_API_URL=http://localhost:5000
```

For payments, create or copy **Test Mode** API keys from the Razorpay Dashboard. Set
`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`. Replace the example
placeholders and restart the backend after changing these values. The backend sends
the public key to the checkout page; the secret remains server-side. The Razorpay
Checkout popup opens after submitting the checkout form; it will not appear before then.

## How to run backend

```
cd backend
copy .env.example .env
npm install
npm run dev
```

Fill in `MONGO_URI` and `JWT_SECRET` in `backend/.env` before starting.

## How to run frontend

```
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

## API endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /customers/register | No | Register a customer |
| POST | /customers/login | No | Login and set JWT cookie |
| GET | /customers/me | Yes | Get logged-in customer |
| POST | /customers/logout | Yes | Clear JWT cookie |
| POST | /orders/create-payment-order | Yes | Create an order and Razorpay payment session |
| POST | /orders/verify-payment | Yes | Verify Razorpay signature and complete the order |
| GET | /orders | Yes | List current user's orders |
| GET | /orders/:id | Yes | Fetch one order |

## Authentication flow

1. Login → backend verifies the bcrypt password
2. Backend creates a JWT
3. JWT is stored in an HttpOnly cookie named `token`
4. Browser automatically sends the cookie with Axios (`withCredentials: true`)
5. Auth middleware verifies the JWT
6. Protected API (`GET /customers/me`) returns the customer
