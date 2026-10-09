# ShopKart Viva Guide — Labs 02, 03, 04, 05, and 06

This guide connects the lab requirements to the actual project code so you can explain the implementation clearly in a viva.

## 1) Project structure and how the app fits together

### Backend

- [backend/index.js](backend/index.js) starts Express, loads env variables, attaches middleware, and mounts routes.
- [backend/routes/customer.routes.js](backend/routes/customer.routes.js) handles register/login/me/logout endpoints.
- [backend/routes/product.routes.js](backend/routes/product.routes.js) handles product listing and detail endpoints.
- [backend/routes/wishlist.routes.js](backend/routes/wishlist.routes.js) protects all wishlist operations.
- [backend/routes/cart.routes.js](backend/routes/cart.routes.js) protects all cart operations.

### Frontend

- [frontend/src/App.jsx](frontend/src/App.jsx) contains the route setup.
- [frontend/src/services/api.js](frontend/src/services/api.js) centralizes all Axios requests and configures `withCredentials: true`.
- [frontend/src/components/Navbar.jsx](frontend/src/components/Navbar.jsx) renders navigation and logout.
- [frontend/src/components/ProductCard.jsx](frontend/src/components/ProductCard.jsx) handles wishlist and cart actions.
- [frontend/src/components/SearchBar.jsx](frontend/src/components/SearchBar.jsx) handles product search/filter UI.
- [frontend/src/pages/Login.jsx](frontend/src/pages/Login.jsx), [frontend/src/pages/Register.jsx](frontend/src/pages/Register.jsx), and [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx) cover Lab 02.
- [frontend/src/pages/Products.jsx](frontend/src/pages/Products.jsx), [frontend/src/pages/ProductDetails.jsx](frontend/src/pages/ProductDetails.jsx) cover Lab 03.
- [frontend/src/pages/Wishlist.jsx](frontend/src/pages/Wishlist.jsx) covers Lab 04.
- [frontend/src/context/CartContext.jsx](frontend/src/context/CartContext.jsx) and [frontend/src/pages/Cart.jsx](frontend/src/pages/Cart.jsx) cover Lab 05.

---

## 2) Lab 02 — Login → Home Flow

### What this lab is about

This lab is about authentication and protected frontend flow. The backend already had the APIs; the frontend needed to connect to them and maintain the session.

### Key backend files

- [backend/controllers/customer.controller.js](backend/controllers/customer.controller.js)
- [backend/middlewares/auth.middleware.js](backend/middlewares/auth.middleware.js)
- [backend/models/customer.model.js](backend/models/customer.model.js)
- [backend/utils/generateToken.js](backend/utils/generateToken.js)

### How registration works

In [frontend/src/pages/Register.jsx](frontend/src/pages/Register.jsx):

- The form uses controlled inputs for fullName, email, password, and phone.
- On submit, it calls `api.post("/customers/register", form)`.
- If the server responds successfully, the app redirects to `/login`.

Backend flow:

- [backend/routes/customer.routes.js](backend/routes/customer.routes.js) exposes `POST /customers/register`.
- [backend/controllers/customer.controller.js](backend/controllers/customer.controller.js) validates required fields, hashes the password using bcrypt, checks for duplicate email, and saves the customer.

What viva answer should be:

- “Registration collects the user data, validates it, hashes the password, stores it, and returns success or validation errors.”
- “The password is never stored in plain text.”

### How login works

In [frontend/src/pages/Login.jsx](frontend/src/pages/Login.jsx):

- The form sends email + password to `POST /customers/login`.
- The API client is configured with `withCredentials: true` in [frontend/src/services/api.js](frontend/src/services/api.js).
- The backend sets the JWT in an HttpOnly cookie.
- On success, the app navigates to `/home`.

Backend flow:

- The controller checks the user exists.
- It compares the entered password with the stored hash using bcrypt.
- If valid, it generates a JWT and sets the cookie with `res.cookie(...)`.

### Why `withCredentials: true` matters

This is a must-know viva answer.

- The browser must include cookies in cross-site requests when the frontend and backend are on different origins.
- Since the backend sends an HttpOnly cookie, the browser stores it automatically.
- JavaScript cannot read that cookie because it is HttpOnly, but the browser includes it automatically on future authenticated requests.

### Why `/home` is a protected route

In [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx):

- It calls `api.get("/customers/me")` inside `useEffect`.
- If the request fails, it redirects to `/login`.

The backend protects `/customers/me` using [backend/middlewares/auth.middleware.js](backend/middlewares/auth.middleware.js):

- It reads the JWT from the cookie.
- It verifies the signature using `JWT_SECRET`.
- It loads the customer from MongoDB and attaches it to `req.user`.
- If the token is invalid or missing, it responds with 401.

This is authentication + authorization logic:

- Authentication = “Who are you?”
- Authorization = “Are you allowed to access this resource?”

### Logout flow

In [frontend/src/components/Navbar.jsx](frontend/src/components/Navbar.jsx):

- The logout button triggers `api.post("/customers/logout")`.
- The backend clears the cookie.
- The user is redirected to `/login`.

### Viva questions and answers for Lab 02

#### Q1. Why do we use `withCredentials: true`?

Because the JWT is stored in an HttpOnly cookie and the browser must send that cookie with authenticated requests.

#### Q2. Why can’t JavaScript read an HttpOnly cookie?

Because HttpOnly prevents JavaScript access for security reasons; the browser sends it automatically with requests.

#### Q3. Why is `/home` protected?

Because only an authenticated customer should access their own profile data.

#### Q4. Why fetch `/customers/me` instead of storing the user manually?

Because the server is the source of truth. The token proves login; `/customers/me` fetches current, validated user data from the database.

#### Q5. What is the difference between authentication and authorization?

Authentication proves identity; authorization decides whether that identity can access a resource.

---

## 3) Lab 03 — Product Catalog & Discovery

### What this lab is about

This lab introduces the real product catalog and search/filter flow. Products come from MongoDB instead of being hardcoded.

### Key backend files

- [backend/models/product.model.js](backend/models/product.model.js)
- [backend/controllers/product.controller.js](backend/controllers/product.controller.js)
- [backend/routes/product.routes.js](backend/routes/product.routes.js)
- [backend/utils/seedProducts.js](backend/utils/seedProducts.js)

### Product model

The `Product` schema includes:

- name
- description
- price
- category
- image
- stock
- createdAt

Validation is handled in the model:

- price > 0
- stock >= 0
- required fields for name, description, category, image

This matters because the data layer enforces rules before writing to MongoDB.

### Product API endpoints

From [backend/routes/product.routes.js](backend/routes/product.routes.js):

- `POST /products` creates a product
- `GET /products` returns products
- `GET /products/:id` returns one product

The controller in [backend/controllers/product.controller.js](backend/controllers/product.controller.js) handles:

- validation of product ID
- fetch by ID
- search via query `search`
- category filtering via query `category`
- combined filtering when both are present

### Search and filtering logic

The API supports patterns like:

- `/products?search=keyboard`
- `/products?category=Electronics`
- `/products?search=keyboard&category=Electronics`

This is important because the server handles filtering in MongoDB rather than loading everything and filtering in the browser.

### Frontend product discovery flow

- [frontend/src/pages/Products.jsx](frontend/src/pages/Products.jsx) loads the products list.
- [frontend/src/components/SearchBar.jsx](frontend/src/components/SearchBar.jsx) contains the search input and category dropdown.
- [frontend/src/components/ProductCard.jsx](frontend/src/components/ProductCard.jsx) renders each product.
- [frontend/src/pages/ProductDetails.jsx](frontend/src/pages/ProductDetails.jsx) fetches individual product details by ID.

### Why URL params vs query params?

- `/:id` is used for a single resource: `/products/123`
- `?search=...&category=...` is used for filtering a list: `/products?category=Electronics`

### State handling in frontend

The product pages show:

- Loading state: “Loading products...”
- Empty state: “No products found.”
- Error state: “Something went wrong while loading products.”

This is necessary because the UI must never be blank or misleading while network requests are happening.

### Viva questions and answers for Lab 03

#### Q1. Why should product data come from MongoDB instead of hardcoding in React?

Because the data is dynamic, shared, and updated centrally. The backend is the source of truth.

#### Q2. What is the difference between a URL parameter and a query parameter?

A URL parameter identifies a specific resource, while a query parameter filters or modifies a list request.

#### Q3. Why use `/products/:id` and not `/products?category=...` for a single product?

Because the route is identifying one specific record by ID.

#### Q4. Why do we need loading, error, and empty states?

Because users need to know the app is working, failed, or has no results. Blank screens are poor UX.

#### Q5. Why handle filtering on the backend?

Because it is more efficient and keeps the API contract clean; large datasets should be filtered close to the database.

---

## 4) Lab 04 — Wishlist

### What this lab is about

This lab introduces a persistent user-specific wishlist using MongoDB references. It is a backend-first feature and does not require Context API/Redux.

### Key backend files

- [backend/models/customer.model.js](backend/models/customer.model.js)
- [backend/controllers/wishlist.controller.js](backend/controllers/wishlist.controller.js)
- [backend/routes/wishlist.routes.js](backend/routes/wishlist.routes.js)
- [backend/middlewares/auth.middleware.js](backend/middlewares/auth.middleware.js)

### Wishlist data model

The user model includes a `wishlist` field:

- an array of `ObjectId`s
- each ObjectId references the `Product` collection

This is the key design rule from the lab:

- Do not duplicate the whole product object into the wishlist.
- Store only product references.

Why this is important:

- If product price or stock changes later, you do not need to update every wishlist item manually.
- The product remains the source of truth.

### Why `populate()` is used

When the backend loads the current user and calls `populate("wishlist")`, it replaces product ids with actual product documents.

This means the frontend receives full product metadata such as:

- name
- price
- category
- image
- stock

The backend uses the authenticated user from the JWT, not a `userId` from the request body.

### Wishlist API flow

The wishlist endpoints are protected and use the authenticated user.

#### Add product to wishlist

- Validates the product ID
- Checks if the product exists
- Prevents duplicates
- Saves the product id into the current user’s wishlist

If the product is already saved, the API returns 409 Conflict.

#### Get wishlist

- Finds the authenticated customer
- Populates the wishlist
- Returns the product list

#### Remove product

- Checks the product exists in the wishlist
- Removes it
- Saves the user

### Frontend wishlist flow

- [frontend/src/components/ProductCard.jsx](frontend/src/components/ProductCard.jsx) lets the user click Wishlist.
- [frontend/src/pages/Wishlist.jsx](frontend/src/pages/Wishlist.jsx) fetches the user’s wishlist.
- It renders cards dynamically and includes remove actions.
- It also handles loading, empty, and error states.

### Common mistakes to avoid

- Sending `userId` from the frontend
- Storing full product objects in the wishlist
- Hardcoding wishlist data
- Allowing duplicates
- Ignoring loading/error states

### Viva questions and answers for Lab 04

#### Q1. Why are ObjectIds stored instead of full product objects?

Because the product collection is the source of truth and references are cheaper, cleaner, and easier to maintain.

#### Q2. What does `ref: "Product"` do?

It tells Mongoose that this field is a reference to a document in the `Product` collection.

#### Q3. Why do we use `populate()`?

So the DB resolves the ObjectIds into actual product documents before sending them to the frontend.

#### Q4. Why should wishlist endpoints be protected?

Because each user must only access their own wishlist, never someone else’s.

#### Q5. Why should the server get the user from the JWT rather than from the client?

Because the client cannot be trusted. The server must determine identity from the authenticated token.

---

## 5) Lab 05 — Shopping Cart

### What this lab is about

This lab adds quantity-based, persistent cart logic and shared frontend state. The cart is no longer just a wishlist; it is a dynamic order-building structure.

### Key backend files

- [backend/models/customer.model.js](backend/models/customer.model.js)
- [backend/controllers/cart.controller.js](backend/controllers/cart.controller.js)
- [backend/routes/cart.routes.js](backend/routes/cart.routes.js)

### Cart data model

The user model includes a `cart` array, where each item contains:

- `product`: ObjectId reference to Product
- `quantity`: Number, min 1

This is different from wishlist because cart must know how many units of each product the customer wants.

### Cart API behaviour

The cart handles:

- Add to cart: adds a product with quantity 1, or increases quantity if it already exists
- Get cart: loads current user cart and populates product data
- Update quantity: checks value >= 1 and <= stock
- Remove item: removes the product from the authenticated user’s cart

Important business rules:

- quantity cannot be below 1
- quantity cannot exceed stock
- same product should not create duplicate cart rows
- product must exist in the cart before quantity update or remove

### Why cart logic is more complex than wishlist

Wishlist stores only whether something is saved.
Cart stores quantity and order state, so the app must validate stock and aggregate totals.

### Derived values from cart state

Subtotal is calculated dynamically from the cart, not stored in MongoDB:

`subtotal = sum(product.price * quantity)`

This matches the requirement to avoid stale values.

### Frontend cart state

The project uses a global React context:

- [frontend/src/context/CartContext.jsx](frontend/src/context/CartContext.jsx)

It stores:

- `cartItems`
- `loading`
- `error`
- `addToCart`
- `updateCart`
- `removeCartItem`
- `refreshCart`

This keeps all components in sync without each component fetching data separately.

### Why a global cart is necessary

If the Navbar, Product Card, and Cart page each kept their own copy of the cart:

- counts could mismatch
- quantity updates could get out of sync
- the UI would become inconsistent

A single source of truth prevents this.

### UI features in Lab 05

- [frontend/src/pages/Cart.jsx](frontend/src/pages/Cart.jsx) renders cart items, quantity controls, and order summary.
- [frontend/src/components/Navbar.jsx](frontend/src/components/Navbar.jsx) shows `Cart (n)` automatically from shared state.
- [frontend/src/components/ProductCard.jsx](frontend/src/components/ProductCard.jsx) shows Add to Cart / Adding... / Add Another states.
- [frontend/src/pages/ProductDetails.jsx](frontend/src/pages/ProductDetails.jsx) allows adding a product from the detail screen.

### Important viva talking points

- Product price should not be copied into the cart object because product price can change later.
- Cart totals must be derived from current product data and quantity.
- The server must always identify the user from the JWT.
- Stock validation prevents overselling.
- Duplicate cart entries are merged into one row with the quantity increased.

### Viva questions and answers for Lab 05

#### Q1. Why does cart state need to be global?

Because multiple screens need the same cart data at the same time.

#### Q2. Why should the Navbar not fetch the cart separately?

Because then the Navbar and Cart page can drift apart. One shared state is cleaner and more consistent.

#### Q3. What is the difference between server state and frontend state?

Server state is persisted in MongoDB and comes from the backend. Frontend state is UI state such as toggles, loading indicators, and current cart memory.

#### Q4. What is derived state?

Derived state is calculated from existing state, not stored separately. Example: subtotal and cart item count.

#### Q5. Why should subtotal not be stored in MongoDB?

Because it can become stale when prices or quantities change.

#### Q6. Why does cart need quantity while wishlist does not?

Wishlist is a simple saved bookmark. Cart is an order item with quantity and stock validation.

#### Q7. How do you prevent quantity from exceeding stock?

By validating `newQuantity <= product.stock` before saving.

#### Q8. What happens when the same product is added twice?

The quantity increases instead of creating a duplicate row.

#### Q9. Why is the server identifying the user from JWT important?

Because user identity must be trusted and enforced server-side.

---

## 6) Lab 06 — Checkout, Payment, and Order Tracking

### What this lab is about

This lab converts the cart into a real transactional flow. Instead of only adding items to a list, the user now provides shipping information, pays through Razorpay, and the app creates a permanent order record in MongoDB. This is the point where the app behaves like a real e-commerce checkout system rather than a demo catalog.

### Key backend files

- [backend/models/order.model.js](backend/models/order.model.js)
- [backend/controllers/order.controller.js](backend/controllers/order.controller.js)
- [backend/routes/order.routes.js](backend/routes/order.routes.js)
- [backend/config/razorpay.js](backend/config/razorpay.js)
- [backend/models/customer.model.js](backend/models/customer.model.js)

### Key frontend files

- [frontend/src/pages/Checkout.jsx](frontend/src/pages/Checkout.jsx)
- [frontend/src/pages/OrderSuccess.jsx](frontend/src/pages/OrderSuccess.jsx)
- [frontend/src/pages/Orders.jsx](frontend/src/pages/Orders.jsx)
- [frontend/src/pages/OrderDetails.jsx](frontend/src/pages/OrderDetails.jsx)
- [frontend/src/services/api.js](frontend/src/services/api.js)

### Why order data is separate from cart data

The cart is a live working basket. The order is a final purchase record. They are not the same thing.

- Cart stores the current customer selection and quantity.
- Order stores a snapshot of what was purchased, at what price, with shipping details, and payment information.
- If a product price changes later, old orders must still reflect the original order amount.
- If the customer edits cart items after checkout, that should not update the completed order.

This is why the backend creates a snapshot in the order document before payment is confirmed.

### Order schema and stored data

In [backend/models/order.model.js](backend/models/order.model.js), each order stores:

- `user`: customer who placed the order
- `items[]`: each item includes product reference, name, price, quantity, image
- `shippingAddress`: fullName, phone, addressLine1, city, state, pincode
- `totalAmount`: final order value
- `paymentStatus`: `PENDING`, `PAID`, or `FAILED`
- `status`: order lifecycle like `PENDING_PAYMENT`, `PLACED`, `CONFIRMED`, etc.
- `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`

This makes the order auditable and traceable. The app can show order history and verify payments later.

### Checkout flow in detail

The flow starts in [frontend/src/pages/Checkout.jsx](frontend/src/pages/Checkout.jsx):

1. The page reads the current cart from the shared `CartContext`.
2. If the cart is empty, it redirects to `/cart`.
3. The user fills shipping fields: full name, phone, address, city, state, pincode.
4. On submit, the client validates the form locally.
5. It calls `createPaymentOrder` from [frontend/src/services/api.js](frontend/src/services/api.js).
6. The backend creates a server-side payment order and checks product availability and stock.

### Backend validation before payment

In [backend/controllers/order.controller.js](backend/controllers/order.controller.js), the backend does all critical validation before creating the order:

- checks shipping address fields are present
- validates phone number format
- validates 6-digit pincode
- reads the authenticated customer from the JWT
- fetches the customer cart
- ensures the cart is not empty
- loads product records using the cart product IDs
- validates that every product still exists and has enough stock
- creates a final snapshot and total amount

This is extremely important in viva: the server must never trust the frontend for business rules. A malicious user could otherwise fake the cart or fake product data.

### Why `buildOrderSnapshot` is important

The `buildOrderSnapshot` function does more than simply copy the cart. It protects the system from invalid or stale data:

- missing product => order cannot proceed
- invalid quantity => order cannot proceed
- quantity > stock => order cannot proceed
- total is recalculated from live product price and quantity

This means the order reflects real availability at checkout time, and the order record remains permanent and reliable.

### Razorpay payment creation

Once validation passes, the backend creates a Razorpay order using the secret key stored in the server environment.

Key steps:

- `createRazorpayInstance()` loads `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- the server calls `razorpay.orders.create({ amount, currency, receipt, notes })`
- amount is sent in paise, so `Math.round(totalAmount * 100)` is used
- Razorpay returns a `razorpayOrderId`
- the backend saves that id into the order record and responds with the public key and order details to the frontend

This is the secure way to initiate payment. The secret key is never sent to the browser.

### Frontend Razorpay popup flow

In [frontend/src/pages/Checkout.jsx](frontend/src/pages/Checkout.jsx):

- the app loads the Razorpay checkout script from `https://checkout.razorpay.com/v1/checkout.js`
- it opens a popup with options such as `key`, `amount`, `currency`, `order_id`, and `prefill`
- the popup handles success, cancellation, and errors
- if the payment succeeds, the handler calls `verifyPayment` with the data returned by Razorpay
- then it clears the local cart and navigates to `/order-success/:id`

This pattern is standard in payment integrations: create payment order on backend, then process payment client-side, then verify server-side.

### Signature verification is mandatory

The most important concept in Lab 06 is payment verification.

When Razorpay responds, it sends:

- `razorpay_order_id`
- `razorpay_payment_id`
- `razorpay_signature`

The backend reconstructs the signature using:

`sha256(key_secret, razorpayOrderId + "|" + razorpayPaymentId)`

Then it compares that with the signature sent by Razorpay.

Why this matters:

- The browser is not trusted.
- A user could manipulate frontend data.
- The server is the only place that knows the secret key.
- Signature matching ensures the payment response is genuine and not fake.

If the signature is invalid, the order is marked as `FAILED` and payment verification fails.

### What happens after successful payment

When verification succeeds:

- `order.razorpayPaymentId` and `order.razorpaySignature` are saved
- `paymentStatus = "PAID"`
- `status = "PLACED"`
- the customer cart is cleared with `customer.cart = []`
- the order becomes a confirmed purchase record

This ensures the user cannot keep paying for the same cart repeatedly.

### Why cart is cleared only after successful verification

This is a key viva point:

- If payment is cancelled, failed, or the signature is invalid, the cart should remain intact.
- Clearing the cart before payment verification would make the user lose items while payment is still invalid.
- The backend checks authenticity before finalizing the purchase.

### Order history and authorization

The backend exposes:

- `GET /orders` for all orders of the current user
- `GET /orders/:id` for one specific order

Both endpoints rely on the authenticated user from JWT data. The controller filters by `user: req.user._id`, so a user cannot access other users’ orders.

This is authorization in action.

### Frontend order pages

- [frontend/src/pages/Orders.jsx](frontend/src/pages/Orders.jsx) loads the current customer’s orders and displays them in a list.
- [frontend/src/pages/OrderDetails.jsx](frontend/src/pages/OrderDetails.jsx) shows the full details of a single order.
- [frontend/src/pages/OrderSuccess.jsx](frontend/src/pages/OrderSuccess.jsx) confirms payment success and gives the user a thank-you screen.

These pages are simple front-end views over secure backend data. The real logic remains in the backend.

### Important viva talking points

- Checkout is not just UI; it is a secure transaction pipeline.
- The app validates shipping and stock before payment.
- The server creates the Razorpay order, not the browser.
- Payment verification uses a secret-key HMAC signature.
- Order data is a historical snapshot, not live cart state.
- Cart is cleared only on successful verification.
- Each user can only access their own orders.
- The frontend should never be trusted for payment security.

### Viva questions and answers for Lab 06

#### Q1. Why do we create a payment order on the backend?

Because Razorpay requires a server-side order object and the secret key should never be exposed to the browser. The backend is the trusted component for payment creation.

#### Q2. Why do we validate shipping address before payment?

Because invalid shipping data will cause problems later in delivery and order processing. It also prevents malformed or malicious request payloads.

#### Q3. Why is the order snapshot important?

Because the cart is dynamic, but the order is permanent. Snapshotting preserves the exact items, quantity, and price at the time of purchase.

#### Q4. What is a Razorpay signature and why is it important?

A Razorpay signature is a hash created using the secret key and order/payment IDs. It verifies that the payment response came from Razorpay and was not tampered with.

#### Q5. Why does the server verify the payment instead of trusting the browser?

Because the browser is controlled by the client and cannot be trusted for security-critical data. Only the server has the secret key and can authenticate the payment.

#### Q6. Why clear the cart only after payment is verified?

Because a cancelled or failed payment must not remove the customer’s cart. Clearing too early would lose items unexpectedly.

#### Q7. Why does `totalAmount` use `amount * 100` before sending to Razorpay?

Because Razorpay expects payment values in paise, not rupees.

#### Q8. Why do we use `user: req.user._id` when fetching orders?

Because the API should only return the logged-in customer’s orders, not any other user’s records.

#### Q9. What is the difference between `paymentStatus` and `status`?

`paymentStatus` refers to whether the payment is pending, paid, or failed. `status` refers to the order lifecycle after payment, such as placed, confirmed, or shipped.

#### Q10. What is the simplest way to explain Lab 06 in one sentence?

“Lab 06 is the checkout and payment phase, where the app validates the cart, creates a Razorpay order, verifies the payment securely on the backend, stores the final order record, and lets the user track their purchase history.”

---

## 7) Common patterns across all labs

### 1. Backend is the source of truth

- MongoDB stores products, users, wishlist, cart, and orders.
- The frontend fetches from APIs and renders the data.

### 2. Auth is protected by middleware

- The app does not trust client data for identity.
- The server reads the JWT and attaches the user.

### 3. UI must handle states properly

Every dynamic feature should handle:

- loading
- success
- error
- empty

### 4. Never trust the frontend for critical business rules

- quantity checks
- stock checks
- duplicate prevention
- authorization
- payment verification

These belong in the backend.

### 5. Derived values should not be stored separately

Examples:

- subtotal
- cart count
- total units

If they are derived, compute them from the current state.

### 6. Real-world apps need transaction-like thinking

A payment flow is not just a button click. It requires validation, snapshotting, security, and confirmation before final data changes are allowed.

---

## 8) A short way to speak in the viva

If you need a 1-minute explanation, say this:

“Lab 02 was about authentication. The frontend sends registration and login requests, the backend validates and stores the user, and a JWT cookie is issued to keep the session authenticated. Lab 03 introduced products, where the frontend fetches data from MongoDB and renders dynamic search and detail pages. Lab 04 added wishlist references using ObjectId and `populate()` so each user can save products without duplicating the product data. Lab 05 took this to cart logic, where each cart item includes quantity, stock validation, subtotal calculation, and global app state so Navbar and Cart page stay in sync. Lab 06 completed the e-commerce flow by adding checkout, shipping validation, Razorpay payment, signature verification, and order storage. The main principle across all labs is that the backend owns the real data, the frontend renders and interacts with it, and business rules like auth, duplicate checks, stock validation, payment verification, and authorization are enforced server-side.”

---

## 9) Final review checklist before viva

Before your viva, be ready to explain:

- Why cookies are used for auth
- Why HttpOnly cookies can’t be read by JavaScript
- Why `/customers/me` is called on protected pages
- Why product and wishlist references use ObjectId
- Why `populate()` matters in MongoDB
- Why duplicate wishlist/cart items are prevented
- Why stock validation is server-side
- Why subtotal and cart count are derived, not stored
- Why a single shared cart state is better than multiple independent copies
- Why order snapshots are created before payment
- Why Razorpay verification is done on the backend
- Why the cart is cleared only after a successful payment
- Why users can only access their own orders

That is enough to sound confident and technically correct in a viva.
