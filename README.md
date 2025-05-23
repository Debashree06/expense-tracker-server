# ExpenseApp API Documentation

## Overview
The ExpenseApp backend provides a RESTful API for managing expenses, supporting both web and mobile clients. The API  which I have designed for simplicity, scalability, and offline sync support.

- **Base URL:** `http://<your-server>:5000/api`
---

## Endpoints

### 1. Add Expense
- **POST** `/expenses`
- **Body:**
  ```json
  {
    "amount": 100,
    "description": "Lunch",
    "category": "Food",
    "date": "2024-05-20",
    "userId": "user123"
  }
  ```
- **Response:** 201 Created, returns the created expense object.

### 2. Get Expenses (by user)
- **GET** `/expenses/:userId`
- **Response:** 200 OK, returns an array of expense objects for the user.

### 3. Delete Expense
- **DELETE** `/expenses/:id`
- **Response:** 200 OK, `{ message: 'Expense deleted' }`

### 4. Sync Expenses (for mobile offline sync)
- **POST** `/expenses/sync`
- **Body:**
  ```json
  {
    "userId": "user123",
    "lastSyncTime": "2024-05-20",
    "pendingChanges": [
      { "type": "create", "data": { ... } },
      { "type": "update", "id": "...", "data": { ... } },
      { "type": "delete", "id": "..." }
    ]
  }
  ```
- **Response:** 200 OK, returns `{ serverChanges, syncResults }`

---

## Approach
- **RESTful Design:** Each endpoint follows REST conventions for clarity and scalability.
- **UserId:** All expense operations are scoped by `userId` for multi-user support.
- **Offline Sync:** The `/sync` endpoint allows mobile clients to push local changes and fetch server updates, supporting offline-first usage.
- **Conflict Resolution:** Uses timestamps and "last write wins" for resolving conflicts during sync.
- **Validation:** Input is validated on the backend using `express-validator`.

---

## Example Usage (with Postman)

### Add Expense
- Method: POST
- URL: `http://localhost:5000/api/expenses`
- Body (JSON):
  ```json
  {
    "amount": 250,
    "description": "Groceries",
    "category": "Shopping",
    "date": "2024-05-20T15:00:00.000Z",
    "userId": "user123"
  }
  ```

### Get Expenses
- Method: GET
- URL: `http://localhost:5000/api/expenses/user123`

### Delete Expense
- Method: DELETE
- URL: `http://localhost:5000/api/expenses/<expenseId>`

### Sync Expenses
- Method: POST
- URL: `http://localhost:5000/api/expenses/sync`
- Body (JSON):
  ```json
  {
    "userId": "user123",
    "lastSyncTime": "2024-05-20T12:00:00.000Z",
    "pendingChanges": []
  }
  ```




