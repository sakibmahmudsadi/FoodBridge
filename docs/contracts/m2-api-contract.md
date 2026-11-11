# M2 API Contract Specification: Donor & Donation Catalogue

## 1. Global API Standards

- **Base URL Prefix**: `/api/v1`
- **Authentication**: Bearer JWT passed in header: `Authorization: Bearer <token>`.
- **Role Guards**: `@Roles('ADMIN')`, `@Roles('DONOR')`, `@Roles('NGO')`, `@Roles('VOLUNTEER')`.
- **Content-Type**: `application/json` for all request bodies and responses.
- **Actor Context**: Derives `user.id`, `user.role`, and `user.donorProfileId` from the verified JWT. Client request bodies **cannot** supply ownership fields.
- **Pagination Standard**:
  - Query parameters: `page` (default: 1, min: 1), `limit` (default: 10, min: 1, max: 100).
  - Deterministic sort: Primary timestamp (`created_at DESC`) plus secondary UUID (`id ASC`).

---

## 2. Standard Response Envelopes

### 2.1. Single Resource / Command Success Envelope (HTTP 200 / 201)

```json
{
  "success": true,
  "message": "Resource created or processed successfully",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "meta": null
}
```

### 2.2. Paginated List Success Envelope (HTTP 200)

```json
{
  "success": true,
  "message": "Records retrieved successfully",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### 2.3. Error Response Envelope (HTTP 4xx / 5xx)

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "code": "VALIDATION_FAILED",
  "message": "Input validation failed on one or more fields",
  "details": [
    {
      "field": "quantity",
      "messages": [
        "quantity must be greater than zero"
      ]
    }
  ],
  "path": "/api/v1/donations",
  "requestId": "req-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "timestamp": "2026-11-10T16:15:00.000Z"
}
```

---

## 3. Standard HTTP Status Codes & Error Codes

| Status Code | Reason | FoodBridge Scenario | Application Error Code |
|---|---|---|---|
| **200 OK** | Success | Resource retrieved, patched, or deleted | `SUCCESS` |
| **201 Created** | Created | Resource successfully created | `CREATED` |
| **400 Bad Request** | Client error | Malformed syntax, invalid DTO parameters, deadline ordering violation | `VALIDATION_FAILED`, `INVALID_DEADLINE_SEQUENCE`, `INVALID_UNIT_SCALE` |
| **401 Unauthorized** | Auth missing/invalid | Missing Bearer token, expired JWT, signature mismatch | `UNAUTHORIZED`, `TOKEN_EXPIRED` |
| **403 Forbidden** | Role or scope violation | User role insufficient, donor accessing another donor's private draft | `FORBIDDEN_RESOURCE_ACCESS`, `ROLE_NOT_AUTHORIZED` |
| **404 Not Found** | Missing record | Requested category or donation UUID does not exist or is soft-deleted | `CATEGORY_NOT_FOUND`, `DONATION_NOT_FOUND` |
| **409 Conflict** | State violation | Cannot edit reserved donation, category in use cannot be deleted, duplicate name | `DONATION_ALREADY_RESERVED`, `INVALID_STATE_TRANSITION`, `CATEGORY_IN_USE` |
| **500 Internal** | Server error | Unhandled exception or unexpected database error (details redacted) | `INTERNAL_SERVER_ERROR` |

---

## 4. Food Categories Endpoints

### 4.1. POST `/api/v1/food-categories`
- **Description**: Creates a new food category.
- **Authorization**: `ADMIN` only.
- **Request Body**:
```json
{
  "name": "Cooked Meals",
  "description": "Prepared hot or chilled meals packaged in hygienic food-grade containers."
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Food category created successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "name": "Cooked Meals",
    "description": "Prepared hot or chilled meals packaged in hygienic food-grade containers.",
    "isActive": true,
    "createdAt": "2026-11-10T10:00:00.000Z",
    "updatedAt": "2026-11-10T10:00:00.000Z"
  },
  "meta": null
}
```
- **Error Responses**:
  - `400 Bad Request`: `name` missing or shorter than 2 characters.
  - `409 Conflict`: Category with this name already exists (`CATEGORY_NAME_DUPLICATE`).

---

### 4.2. GET `/api/v1/food-categories`
- **Description**: Lists all active categories (or all categories if requested by Admin).
- **Authorization**: Authenticated (`ADMIN`, `DONOR`, `NGO`, `VOLUNTEER`).
- **Query Parameters**:
  - `includeInactive` (boolean, optional, default: `false`, `ADMIN` only).
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Food categories retrieved successfully",
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "name": "Cooked Meals",
      "description": "Prepared hot or chilled meals packaged in hygienic food-grade containers.",
      "isActive": true,
      "createdAt": "2026-11-10T10:00:00.000Z",
      "updatedAt": "2026-11-10T10:00:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
      "name": "Bakery & Breads",
      "description": "Surplus bread, pastries, and baked goods packaged dry.",
      "isActive": true,
      "createdAt": "2026-11-10T10:00:00.000Z",
      "updatedAt": "2026-11-10T10:00:00.000Z"
    }
  ],
  "meta": null
}
```

---

### 4.3. GET `/api/v1/food-categories/:id`
- **Description**: Retrieves single category detail by UUID.
- **Authorization**: Authenticated.
- **Path Parameters**: `id` (UUID).
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "name": "Cooked Meals",
    "description": "Prepared hot or chilled meals packaged in hygienic food-grade containers.",
    "isActive": true,
    "createdAt": "2026-11-10T10:00:00.000Z",
    "updatedAt": "2026-11-10T10:00:00.000Z"
  },
  "meta": null
}
```
- **Error Response (404 Not Found)**:
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "code": "CATEGORY_NOT_FOUND",
  "message": "Food category with ID 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' was not found",
  "details": [],
  "path": "/api/v1/food-categories/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "requestId": "req-12345",
  "timestamp": "2026-11-10T16:15:00.000Z"
}
```

---

### 4.4. PATCH `/api/v1/food-categories/:id`
- **Description**: Updates category details or activates/deactivates the category.
- **Authorization**: `ADMIN` only.
- **Request Body**:
```json
{
  "description": "Updated handling guidelines for cooked meals.",
  "isActive": true
}
```
- **Response (200 OK)**: Returns updated category object inside success envelope.

---

### 4.5. DELETE `/api/v1/food-categories/:id`
- **Description**: Deletes a category if unused. If any donation references this category, returns 409 Conflict (soft deactivation via PATCH is recommended instead).
- **Authorization**: `ADMIN` only.
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Food category deleted successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
  },
  "meta": null
}
```
- **Error Response (409 Conflict)**:
```json
{
  "success": false,
  "statusCode": 409,
  "error": "Conflict",
  "code": "CATEGORY_IN_USE",
  "message": "Cannot delete category referenced by existing donations. Deactivate the category instead.",
  "details": [],
  "path": "/api/v1/food-categories/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "requestId": "req-12345",
  "timestamp": "2026-11-10T16:15:00.000Z"
}
```

---

## 5. Donations Endpoints

### 5.1. POST `/api/v1/donations`
- **Description**: Creates a new donation in `DRAFT` status.
- **Authorization**: `DONOR` only.
- **Business Rules**:
  - Requires at least a `title`.
  - Partial fields are allowed so the donor can draft incrementally.
  - Initial status is automatically set to `DRAFT`.
  - `donor_user_id` is assigned from the authenticated JWT, never accepted in the body.
- **Request Body (Draft Creation)**:
```json
{
  "title": "30 surplus chicken biryani meal boxes",
  "categoryId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "description": "Freshly cooked hotel buffet surplus, individually boxed.",
  "quantity": "30.00",
  "unit": "BOXES",
  "pickupAddress": "Grand Palace Hotel, Kitchen Dispatch Gate 2, Dhanmondi",
  "area": "Dhanmondi",
  "latitude": 23.7465,
  "longitude": 90.3758,
  "availableFrom": "2026-11-12T17:00:00+06:00",
  "pickupDeadline": "2026-11-12T19:00:00+06:00",
  "declaredUseByAt": "2026-11-12T21:00:00+06:00",
  "storageNotes": "Keep in insulated hot box; consume within 2 hours of pickup.",
  "allergenNotes": "Contains chicken, dairy (ghee), nuts."
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Donation draft created successfully",
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "donorUserId": "e3b0c442-98fc-1c14-9afb-f4c8996fb924",
    "categoryId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "title": "30 surplus chicken biryani meal boxes",
    "description": "Freshly cooked hotel buffet surplus, individually boxed.",
    "quantity": "30.00",
    "unit": "BOXES",
    "pickupAddress": "Grand Palace Hotel, Kitchen Dispatch Gate 2, Dhanmondi",
    "area": "Dhanmondi",
    "latitude": 23.746500,
    "longitude": 90.375800,
    "availableFrom": "2026-11-12T11:00:00.000Z",
    "pickupDeadline": "2026-11-12T13:00:00.000Z",
    "declaredUseByAt": "2026-11-12T15:00:00.000Z",
    "storageNotes": "Keep in insulated hot box; consume within 2 hours of pickup.",
    "allergenNotes": "Contains chicken, dairy (ghee), nuts.",
    "status": "DRAFT",
    "publishedAt": null,
    "createdAt": "2026-11-10T16:20:00.000Z",
    "updatedAt": "2026-11-10T16:20:00.000Z"
  },
  "meta": null
}
```

---

### 5.2. GET `/api/v1/donations`
- **Description**: Lists paginated donations with role-based scoping and query filters.
- **Authorization**: Scoped by role:
  - `ADMIN`: Sees all donations across all donors.
  - `DONOR`: Sees only own donations (`donor_user_id = req.user.id`).
  - `NGO`: Default sees only `status = AVAILABLE` with `pickup_deadline > NOW()`, plus past donations reserved by own NGO.
- **Query Parameters**:
  - `page` (int, default: 1)
  - `limit` (int, default: 10, max: 100)
  - `status` (string, optional: `AVAILABLE`, `RESERVED`, etc.)
  - `area` (string, optional: e.g. `Dhanmondi`)
  - `categoryId` (UUID, optional)
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Donations retrieved successfully",
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "donorUserId": "e3b0c442-98fc-1c14-9afb-f4c8996fb924",
      "categoryId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "title": "30 surplus chicken biryani meal boxes",
      "quantity": "30.00",
      "unit": "BOXES",
      "pickupAddress": "Grand Palace Hotel, Kitchen Dispatch Gate 2, Dhanmondi",
      "area": "Dhanmondi",
      "availableFrom": "2026-11-12T11:00:00.000Z",
      "pickupDeadline": "2026-11-12T13:00:00.000Z",
      "declaredUseByAt": "2026-11-12T15:00:00.000Z",
      "status": "AVAILABLE",
      "publishedAt": "2026-11-10T16:25:00.000Z",
      "createdAt": "2026-11-10T16:20:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 5.3. GET `/api/v1/donations/:id`
- **Description**: Retrieves single donation detail by UUID.
- **Authorization**: Scoped access:
  - `ADMIN`: Allowed for all.
  - Owning `DONOR`: Allowed.
  - Reserving `NGO`: Allowed if reserved by caller's NGO.
  - Assigned `VOLUNTEER`: Allowed if assigned to collect this donation.
- **Response (200 OK)**: Full donation entity object inside success envelope.
- **Error Responses**:
  - `403 Forbidden`: If caller attempts to inspect another donor's private draft.
  - `404 Not Found`: If ID does not exist or has been soft-deleted.

---

### 5.4. PATCH `/api/v1/donations/:id`
- **Description**: Updates fields of a draft or unreserved available donation.
- **Authorization**: Owning `DONOR` only.
- **Business Rules**:
  - Prohibited if `status` is `RESERVED`, `PICKED_UP`, or `DELIVERED` (`409 Conflict`).
  - Cannot alter `status` via this endpoint (use `/publish` or `/cancel`).
  - Re-validates the combined existing and updated time ranges.
- **Request Body (Partial)**:
```json
{
  "quantity": "35.00",
  "storageNotes": "Keep in insulated thermal containers; handle with clean gloves."
}
```
- **Response (200 OK)**: Returns updated donation object.
- **Error Response (409 Conflict)**:
```json
{
  "success": false,
  "statusCode": 409,
  "error": "Conflict",
  "code": "DONATION_ALREADY_RESERVED",
  "message": "Cannot modify donation terms while a live reservation is active",
  "details": [],
  "path": "/api/v1/donations/f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "requestId": "req-5678",
  "timestamp": "2026-11-10T16:30:00.000Z"
}
```

---

### 5.5. DELETE `/api/v1/donations/:id`
- **Description**: Soft-deletes / archives an unreserved donation (`is_deleted = true`, sets `deleted_at`).
- **Authorization**: Owning `DONOR` or `ADMIN`.
- **Business Rules**:
  - Rejected with `409 Conflict` if any historical or active reservation exists (use `/cancel` instead).
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Donation archived successfully",
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "deletedAt": "2026-11-10T16:35:00.000Z"
  },
  "meta": null
}
```

---

### 5.6. POST `/api/v1/donations/:id/publish`
- **Description**: Validates and transitions a donation from `DRAFT` to `AVAILABLE`.
- **Authorization**: Owning `DONOR` only.
- **Preconditions**:
  - Current status must be `DRAFT`.
  - Full required fields must be present and valid:
    - `category_id` (must reference an active food category)
    - `quantity > 0`
    - `unit` in (`MEALS`, `BOXES`, `KG`, `LITRES`)
    - Whole number validation if unit is `MEALS` or `BOXES`
    - Non-empty `pickup_address` and `area`
    - `available_from < pickup_deadline <= declared_use_by_at`
    - `pickup_deadline > CURRENT_TIMESTAMP`
- **Request Body**: None (empty body `{}`).
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Donation published successfully and is now available for reservation",
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "AVAILABLE",
    "publishedAt": "2026-11-10T16:40:00.000Z"
  },
  "meta": null
}
```
- **Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "code": "INCOMPLETE_PUBLISH_TERMS",
  "message": "Cannot publish draft: pickup_deadline must be earlier than declared_use_by_at",
  "details": [
    {
      "field": "pickupDeadline",
      "messages": [
        "pickupDeadline must be strictly before declaredUseByAt"
      ]
    }
  ],
  "path": "/api/v1/donations/f47ac10b-58cc-4372-a567-0e02b2c3d479/publish",
  "requestId": "req-9999",
  "timestamp": "2026-11-10T16:40:00.000Z"
}
```

---

### 5.7. POST `/api/v1/donations/:id/cancel`
- **Description**: Cancels / withdraws a donation before physical pickup.
- **Authorization**: Owning `DONOR` only.
- **Business Rules**:
  - Allowed when status is `AVAILABLE` or `RESERVED`.
  - Prohibited once status reaches `PICKED_UP` or `DELIVERED` (`409 Conflict`).
  - If currently `RESERVED`, cancels the active reservation and assignment atomically, and enqueues notification to the reserving NGO coordinator.
  - Requires a non-blank cancellation reason.
- **Request Body**:
```json
{
  "reason": "Kitchen emergency: cold storage unit failed, food cannot be safely held."
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Donation cancelled successfully",
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "CANCELLED",
    "cancellationReason": "Kitchen emergency: cold storage unit failed, food cannot be safely held."
  },
  "meta": null
}
```

---

### 5.8. GET `/api/v1/donations/:id/timeline`
- **Description**: Retrieves a chronological audit projection of all business milestones for this donation.
- **Authorization**: Scoped access (`ADMIN`, owning `DONOR`, reserving `NGO`, assigned `VOLUNTEER`).
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Donation timeline retrieved successfully",
  "data": {
    "donationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "currentStatus": "RESERVED",
    "events": [
      {
        "action": "DRAFT_CREATED",
        "actorRole": "DONOR",
        "timestamp": "2026-11-10T16:20:00.000Z",
        "notes": "Draft initialized by donor"
      },
      {
        "action": "PUBLISHED",
        "actorRole": "DONOR",
        "timestamp": "2026-11-10T16:25:00.000Z",
        "notes": "Food lot published with 30 BOXES"
      },
      {
        "action": "RESERVED",
        "actorRole": "NGO",
        "timestamp": "2026-11-10T16:28:30.000Z",
        "notes": "Reserved by FoodAid Foundation"
      }
    ]
  },
  "meta": null
}
```

---

## 6. Reporting Endpoints

### 6.1. GET `/api/v1/reports/donor`
- **Description**: Generates aggregate donor statistics for the calling donor's account.
- **Authorization**: `DONOR` only.
- **Query Parameters**:
  - `startDate` (ISO 8601 date, optional)
  - `endDate` (ISO 8601 date, optional)
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Donor impact report generated successfully",
  "data": {
    "donorUserId": "e3b0c442-98fc-1c14-9afb-f4c8996fb924",
    "totalDonationsListed": 15,
    "activeListings": 2,
    "deliveredDonations": 11,
    "cancelledDonations": 1,
    "expiredDonations": 1,
    "deliveredQuantitiesByUnit": {
      "MEALS": 140,
      "BOXES": 85,
      "KG": "24.50",
      "LITRES": "0.00"
    }
  },
  "meta": null
}
```

> **Course Integrity Note**: Different units are deliberately aggregated **separately** by unit type. They are never summed into an artificial combined total.

