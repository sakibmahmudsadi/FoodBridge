# M2 Integration Questions & Team Interface Alignment

## 1. Overview

This document records technical integration questions, interface agreements, and proposed decisions from **Member 2 (Donor & Donation Catalogue)** for teammates **Member 1 (Admin & Auth)**, **Member 3 (NGO Coordination & Reservations)**, and **Member 4 (Volunteer Fulfillment & Notifications)**.

All proposed choices requiring teammate approval are prominently highlighted.

---

## 2. Integration Questions for Member 1 (Admin & Access Platform)

### Question 1.1: `DONOR_PROFILES` Table Primary Key & Entity Mapping
> **[PENDING TEAM APPROVAL - DECISION D1]**
> - **Context**: The team confirmed that donor metadata is captured in `donor_profiles` containing `(user_id, donor_type, address, organization_name, is_deleted, deleted_at)` with `user_id` referencing `users(id)`.
> - **Proposal**: We recommend using `user_id` as **both the Primary Key and Foreign Key** (`user_id UUID PRIMARY KEY REFERENCES users(id)`).
> - **Questions for M1**:
>   1. Do you agree with `user_id` acting as the PK of `donor_profiles` (Option A), or do you plan to create a surrogate `id UUID` on `donor_profiles` (Option B)?
>   2. Who will author the TypeORM entity and migration for `donor_profiles`? If M1 authors it alongside `users`, M2 will consume it. If M1 prefers, M2 can author the `donor_profiles` entity in a shared directory.

---

### Question 1.2: Donor Registration & Profile Creation Lifecycle
- **Context**: When a new donor signs up via `POST /api/v1/auth/register`, we need both a `users` record and a `donor_profiles` record.
- **Questions for M1**:
  1. Does public registration take `donor_type`, `address`, and `organization_name` in the registration DTO and insert both `users` and `donor_profiles` inside a single database transaction?
  2. Or does registration create an initial `users` row with role `DONOR`, requiring the user to complete their `donor_profiles` on first login? (Single transaction at registration is strongly recommended to avoid orphaned user accounts without donor profiles).

---

### Question 1.3: Authenticated Context (`ActorContext`) & JWT Claims
- **Context**: M2 controllers extract donor identity using `@CurrentUser()` to enforce that donors can only create, view, edit, or cancel their own listings.
- **Questions for M1**:
  1. What exact properties will be attached to `req.user` after `JwtAuthGuard` executes?
     - Recommended shape:
       ```typescript
       interface AuthenticatedUser {
         id: string;            // UUID from users.id
         email: string;         // normalized email
         role: UserRole;        // 'ADMIN' | 'DONOR' | 'NGO' | 'VOLUNTEER'
         donorProfileId?: string; // UUID from donor_profiles.user_id
       }
       ```
  2. Can we confirm that `@CurrentUser()` returns this verified object on all protected routes?

---

### Question 1.4: Soft Deletion Policy Cascades
- **Context**: Both `users` and `donor_profiles` have soft-deletion columns (`is_deleted`, `deleted_at`).
- **Questions for M1**:
  1. If an Admin soft-deletes or deactivates a user via `DELETE /api/v1/users/:id`, will M1's service also set `is_deleted = true` on `donor_profiles`?
  2. Will M1's deactivation service check whether the donor has active donations in `AVAILABLE` or `RESERVED` status and reject deactivation until those donations are resolved or cancelled?

---

## 3. Integration Questions for Member 3 (NGO Coordination & Reservations)

### Question 2.1: Foreign Key Target on `DONATIONS.donor_user_id`
> **[PENDING TEAM APPROVAL - DECISION D2]**
> - **Context**: `donations.donor_user_id` links the donation to the owning donor.
> - **Proposal**: Foreign key references `donor_profiles(user_id)` directly with `ON DELETE RESTRICT`.
> - **Questions for M3**:
>   1. Do you agree with referencing `donor_profiles(user_id)`? (This ensures database-level integrity so non-donor users cannot be assigned as donation owners).
>   2. In your reservation queries and NGO dashboard, will you join `donations -> donor_profiles -> users` to display donor contact details?

---

### Question 2.2: Concurrency & Lock Acquisition during Reservation
- **Context**: M3 owns `POST /api/v1/reservations`. When an NGO reserves an available listing, M3 transitions `donations.status` from `AVAILABLE` to `RESERVED`.
- **Questions for M3**:
  1. Can we confirm that M3 uses TypeORM's `QueryRunner` with an explicit row lock:
     ```typescript
     await queryRunner.manager.findOne(Donation, {
       where: { id: donationId },
       lock: { mode: 'pessimistic_write' },
     });
     ```
  2. Does M3 commit the reservation and update the donation status within the same transaction to guarantee atomicity?

---

### Question 2.3: NGO Cancellation Workflow & Donation Re-Listing
- **Context**: If an NGO coordinator cancels a reservation prior to pickup (`POST /api/v1/reservations/:id/cancel`):
- **Questions for M3**:
  1. Will M3 check the database clock against `pickup_deadline`?
     - If `CURRENT_TIMESTAMP < pickup_deadline`: status reverts to `AVAILABLE`.
     - If `CURRENT_TIMESTAMP >= pickup_deadline`: status moves to `EXPIRED`.
  2. Can we confirm that M3 will use this rule so overdue listings are never accidentally made `AVAILABLE` again?

---

### Question 2.4: Donor Cancellation of a Reserved Donation
- **Context**: If a donor invokes `POST /api/v1/donations/:id/cancel` while a donation is in `RESERVED` status (e.g. food spoiled in kitchen):
- **Questions for M3**:
  1. What service method should M2 call to cancel the active reservation row atomically?
  2. Recommendation: M3 exports a `ReservationsService.cancelActiveReservationForDonation(manager, donationId, reason)` that takes the active `QueryRunner.manager` to prevent circular HTTP calls and keep both updates in one transaction.

---

## 4. Integration Questions for Member 4 (Volunteer Fulfillment & Notifications)

### Question 3.1: Pickup & Delivery State Transitions
- **Context**: M4 manages physical collection (`POST /assignments/:id/pickup`) and delivery confirmation (`POST /delivery-records/:id/confirm`).
- **Questions for M4**:
  1. Can we confirm that M4 updates `donations.status` to `PICKED_UP` upon successful pickup record creation?
  2. Can we confirm that M4 updates `donations.status` to `DELIVERED` when the coordinator confirms receipt?
  3. Are both updates performed inside M4's transaction manager?

---

### Question 3.2: Audit Logging Service Contract
- **Context**: M2 must record an audit entry when a donation is created, published, edited, or cancelled.
- **Questions for M4**:
  1. What is the agreed signature for `AuditService.record()`?
  2. Proposed signature:
     ```typescript
     await auditService.record(
       queryRunner.manager, // Transaction manager
       actorContext,        // { userId, role, ip, requestId }
       'DONATION_PUBLISHED',// Action string
       'DONATION',          // Entity type
       donation.id,         // Entity UUID
       oldValuesJson,       // Snapshot before mutation (or null on create)
       newValuesJson        // Snapshot after mutation
     );
     ```

---

### Question 3.3: Notification Outbox Service Contract
- **Context**: When a donor publishes or cancels a donation, notification emails must be enqueued.
- **Questions for M4**:
  1. What is the agreed signature for `NotificationService.enqueue()`?
  2. Proposed signature:
     ```typescript
     await notificationService.enqueue(
       queryRunner.manager,
       eventKey,            // e.g. `donation-cancelled:${donation.id}`
       eventType,           // 'DONATION_CANCELLED'
       recipientUserId,     // UUID of recipient
       templateName,        // 'donation-cancelled-email'
       payloadJson          // { donationTitle, reason, donorName }
     );
     ```

---

## 5. Summary of Action Items & Sign-Off Checklist

| Item | Description | Responsible | Status |
|---|---|---|---|
| **A1** | Confirm Option A (`user_id` as PK/FK on `donor_profiles`) | M1 & M2 | Proposed (Awaiting M1 sign-off) |
| **A2** | Confirm `donor_profiles(user_id)` as FK for `donations.donor_user_id` | M1, M2, M3 | Proposed (Awaiting team sign-off) |
| **A3** | Confirm `ActorContext` / JWT payload structure | M1 | Proposed |
| **A4** | Confirm atomic reservation lock and cancellation transition method | M2 & M3 | Aligned |
| **A5** | Confirm `AuditService` and `NotificationService` signatures | M2 & M4 | Aligned |

