# M2 Viva Defense Notes & Technical Knowledge Guide

## 1. Relational Database Concepts (FoodBridge Context)

### 1.1. Tables, Rows, and Columns
- **Table**: A structured collection of related data in a relational database organized into rows and columns (e.g. `donations`, `food_categories`, `donor_profiles`).
- **Row (Record / Tuple)**: A single individual data item in a table (e.g. one specific donation of 30 meal boxes from Grand Palace Hotel).
- **Column (Attribute / Field)**: A specific property stored for every row (e.g. `title`, `quantity`, `unit`, `pickup_deadline`).

---

### 1.2. Primary Key (PK) & Why We Use UUIDs
- **Definition**: A primary key is a column (or combination of columns) that uniquely identifies each row in a database table. It must be unique and non-null.
- **Why UUID v4 instead of auto-incrementing integers (1, 2, 3...)?**
  1. **Security & Anti-Enumeration**: Auto-incrementing integers allow attackers or competitors to easily guess other resource URLs (e.g., scraping `/api/v1/donations/1`, `/api/v1/donations/2` to measure total volume). UUIDs are 128-bit cryptographically random strings that cannot be guessed.
  2. **Client/Service-Side Generation**: A UUID can be generated in application memory before saving to the database, simplifying distributed workflows and offline mock generation.
  3. **Data Merging & Replication**: Multiple databases or microservices can generate UUIDs independently without risk of key collision.

---

### 1.3. Foreign Key (FK) & Referential Integrity
- **Definition**: A foreign key is a column in one table that references the primary key of another table, establishing a verifiable relationship between them.
- **Referential Integrity**: Guarantees that the relationship always remains valid. A child row cannot reference a non-existent parent row.
- **On Delete Actions in FoodBridge**:
  - We use `ON DELETE RESTRICT` (or `NO ACTION`) on critical relations (e.g., `donations.category_id REFERENCES food_categories(id)`).
  - This prevents hard deletion of a parent record if child records exist (e.g., an Admin cannot delete the category "Cooked Meals" if 50 donations already belong to it).

---

### 1.4. Cardinality & Relationship Types in FoodBridge
- **One-to-One (1:1)**:
  - Example: `users` and `donor_profiles`.
  - Exactly one user account with role `DONOR` corresponds to exactly one `donor_profiles` row containing their address and business details.
- **One-to-Many (1:N)**:
  - Example: `donor_profiles` to `donations`. One donor creates many surplus food listings over time.
  - Example: `food_categories` to `donations`. One category ("Cooked Meals") classifies many different donations.
- **Many-to-Many (M:N)**:
  - In FoodBridge, Many-to-Many relationships (such as NGOs and Volunteers) are decomposed into two 1:N relationships using an explicit join entity (`ngo_volunteers`), storing invitation timestamps and membership status.

---

### 1.5. Enums (Enumerated Types)
- **Definition**: A data type consisting of a static, predefined set of allowed named values.
- **FoodBridge Enums**:
  - `donor_type`: `'Individual'`, `'Restaurant'`, `'Business'`.
  - `unit`: `'MEALS'`, `'BOXES'`, `'KG'`, `'LITRES'`.
  - `status`: `'DRAFT'`, `'AVAILABLE'`, `'RESERVED'`, `'PICKED_UP'`, `'DELIVERED'`, `'CANCELLED'`, `'EXPIRED'`, `'FAILED'`.
- **Why Enums?**: Prevents spelling mistakes or arbitrary strings in the database, enforces business rules at compile-time in TypeScript, and enables query optimization in PostgreSQL.

---

### 1.6. Soft Deletion vs. Hard Deletion
- **Hard Deletion (`DELETE FROM`)**: Permanently purges the row from storage. Destroys historical audit trails and violates foreign key constraints if historical transactions exist.
- **Soft Deletion**: Retains the row in the database, but marks it with `is_deleted = true` and records a timestamp in `deleted_at`.
- **Why Soft Deletion in FoodBridge?**:
  - Food donations involve real-world legal liabilities, safe food handling compliance, and university grading audits.
  - If a donor archives an unreserved listing, soft deletion preserves the record for dispute inspection while hiding it from active public search queries (`WHERE deleted_at IS NULL`).

---

## 2. Backend & NestJS Architecture Concepts

### 2.1. Entity & Object-Relational Mapping (TypeORM)
- **Entity**: A TypeScript class decorated with TypeORM decorators (`@Entity()`, `@Column()`, `@PrimaryGeneratedColumn('uuid')`, `@ManyToOne()`) that maps directly to a relational database table.
- **Role**: Allows developers to query and manipulate database rows as strongly-typed object instances rather than writing raw SQL strings.

---

### 2.2. Data Transfer Object (DTO)
- **Definition**: An object that defines how data is sent over the network between the client and server.
- **Why separate DTOs from Entities?**
  1. **Security (Mass Assignment Prevention)**: If an entity was accepted directly in a controller, a malicious caller could submit `{ "id": "...", "status": "DELIVERED", "donorUserId": "victim-id" }`. DTOs act as strict gatekeepers: only whitelisted fields are accepted.
  2. **Validation**: DTOs use `class-validator` decorators (`@IsString()`, `@IsPositive()`, `@IsEnum()`) to reject invalid payloads at the HTTP gateway before executing business logic.
  3. **Decoupling**: The database schema can evolve internally without breaking external API contracts.

---

### 2.3. NestJS Architecture: Modules, Controllers, Services
- **Module (`@Module`)**: The organizational boundary. Groups related controllers, services, and entity repositories into a cohesive, testable package (e.g. `DonationsModule`).
- **Controller (`@Controller`)**: Handles incoming HTTP requests, maps routes (`@Get()`, `@Post()`), inspects headers, parses parameters, and returns HTTP responses with appropriate status codes. Contains **no** database queries or core business logic.
- **Service (`@Injectable`)**: Contains the business rules, transaction orchestration, state machine transitions, and database repository interactions. Services are injected into controllers via Dependency Injection.

---

### 2.4. Dependency Injection (DI)
- A design pattern where a class receives its dependencies from an external container (the NestJS Inversion of Control container) rather than instantiating them itself via `new Service()`.
- **Benefits**: Decouples code, enables easy mocking in unit tests (e.g., replacing real database repositories with in-memory mock repositories), and enforces modularity.

---

### 2.5. REST API Principles
- **Representational State Transfer**:
  - **Statelessness**: Every request contains all necessary authentication and context data (JWT token). The server maintains no in-memory session.
  - **Standard HTTP Verbs**:
    - `GET`: Read resource without side-effects (idempotent, safe).
    - `POST`: Create a new resource or trigger an action (not idempotent).
    - `PATCH`: Partially update an existing resource (idempotent).
    - `DELETE`: Remove or archive a resource (idempotent).
  - **Standard HTTP Status Codes**:
    - `200 OK`: Successful read or update.
    - `201 Created`: Successful creation.
    - `400 Bad Request`: Client validation error.
    - `401 Unauthorized`: Missing or invalid credentials.
    - `403 Forbidden`: Authenticated user lacks permission.
    - `404 Not Found`: Resource does not exist.
    - `409 Conflict`: Business rule or concurrency conflict.
    - `500 Internal Server Error`: Unhandled server exception.

---

## 3. Ten Faculty Viva Questions with Beginner-Friendly Answers

### Q1: Why did your team choose UUID v4 instead of auto-incrementing integers for primary keys?
**Answer**:  
"Auto-incrementing numbers (1, 2, 3...) expose our system to enumeration attacks—an unauthorized user could guess valid donation IDs simply by incrementing numbers and see our business volume. UUIDs are 128-bit cryptographically random strings that cannot be guessed. Additionally, UUIDs can be generated by the application layer before hitting the database, making distributed transactions, testing, and future scaling much cleaner."

---

### Q2: What is the difference between an Entity and a DTO, and why shouldn't we use an Entity in our Controller?
**Answer**:  
"An **Entity** represents the internal table structure in the database and interacts with TypeORM. A **DTO (Data Transfer Object)** defines the contract for data traveling over the network.  
If we accepted Entities directly in Controllers, an attacker could perform a 'Mass Assignment' attack by sending unexpected fields in the JSON body—such as changing their status directly to `DELIVERED` or altering the `donor_user_id`. DTOs with `class-validator` allow us to whitelist and validate incoming data strictly before it touches our database."

---

### Q3: How do you prevent double-booking if two NGOs try to reserve the same donation at the exact same millisecond?
**Answer**:  
"We prevent double-booking at two levels:
1. **Pessimistic Row Locking in the Transaction**: When an NGO requests a reservation, Member 3 executes `SELECT * FROM donations WHERE id = :id FOR UPDATE`. PostgreSQL locks that specific row. The second NGO's request must wait until the first transaction finishes. The second request then reads the updated state, sees `RESERVED`, and is rejected with `409 Conflict`.
2. **PostgreSQL Partial Unique Index**: We create a unique index on `reservations(donation_id)` filtered by `WHERE status IN ('RESERVED', 'ASSIGNED', 'PICKED_UP')`. This guarantees at the database level that no two active reservations can ever coexist for the same donation."

---

### Q4: Why is arbitrary `PATCH /donations/:id` of the status field prohibited in your API?
**Answer**:  
"Food redistribution has physical handoffs and food safety liabilities. Changing status from `AVAILABLE` to `RESERVED` requires creating an atomic reservation record; changing to `PICKED_UP` requires a verified physical collection timestamp from an assigned volunteer.  
Allowing a client to send `PATCH { status: 'DELIVERED' }` would bypass these mandatory checks and break referential integrity. Therefore, all status changes use dedicated, audited RPC command endpoints like `/publish`, `/reservations`, and `/pickup`."

---

### Q5: What is the difference between Hard Delete and Soft Delete, and why is Soft Delete necessary for donations?
**Answer**:  
"A **Hard Delete** completely removes the row from the database using SQL `DELETE`. A **Soft Delete** keeps the row intact but updates `is_deleted = true` and `deleted_at = timestamp`.  
In FoodBridge, historical donations may have associated pickup evidence, coordinator confirmations, or dispute history. Hard-deleting a donation would break foreign keys on completed reservations or destroy audit records. Soft deletion preserves legal accountability while hiding archived drafts from active public searches."

---

### Q6: How does the system ensure that a donor cannot set a pickup deadline that occurs after the food has expired?
**Answer**:  
"We enforce this at two layers:
1. **DTO Layer**: In the `PublishDonationDto`, we implement custom class-validator decorators that check that `availableFrom < pickupDeadline <= declaredUseByAt`.
2. **Database Layer**: In the PostgreSQL table definition, we add a check constraint:
   `CHECK (available_from < pickup_deadline AND pickup_deadline <= declared_use_by_at)`.  
This guarantees that even if a developer bypasses the DTO, the database will reject invalid time sequences."

---

### Q7: What is NestJS Dependency Injection and how does it make your application more maintainable?
**Answer**:  
"Dependency Injection is a design pattern where NestJS creates and manages instances of our services and injects them where needed—for example, injecting `DonationsService` into `DonationsController`.  
Instead of hardcoding `new DonationsService()` inside the controller, the controller simply declares it in its constructor. This makes our code loosely coupled, reusable, and easy to unit test because we can substitute mock services during automated testing without modifying the controller code."

---

### Q8: How does the system ensure a donor cannot create a donation under someone else's user ID?
**Answer**:  
"We **never** accept `donor_user_id` in the request body. When a donor calls `POST /api/v1/donations`, the request passes through our `JwtAuthGuard`. The guard validates the cryptographic signature of the JWT token in the `Authorization` header, extracts the verified `user.id`, and attaches it to `req.user`.  
The controller extracts this verified ID using `@CurrentUser()` and passes it to the service. Even if an attacker supplies a malicious `donorUserId` in the JSON body, the DTO whitelist strips it, ensuring complete ownership security."

---

### Q9: What is a PostgreSQL Partial Index, and why did you use one on the `reservations` table?
**Answer**:  
"A normal unique index enforces uniqueness across every single row in the table. A **Partial Index** enforces uniqueness only on a subset of rows that satisfy a specific `WHERE` filter.  
In FoodBridge, an NGO might legitimately cancel a reservation, returning the food to `AVAILABLE` so another NGO can reserve it later. If we put a normal unique index on `reservations.donation_id`, the historical cancelled reservation would block any new reservation.  
By using a partial unique index `WHERE status IN ('RESERVED', 'ASSIGNED', 'PICKED_UP')`, we ensure only **one live active reservation** exists at any time, while still storing unlimited historical cancelled records."

---

### Q10: Why are quantities stored as `numeric(10,2)` in PostgreSQL and handled as strings in JSON?
**Answer**:  
"Standard programming languages and floating-point types (`float` or `double`) use binary representations that cause rounding errors (such as `0.1 + 0.2 = 0.30000000000000004`). In a surplus food platform where actual physical handoffs of 15.50 kg are recorded, rounding discrepancies create false audit discrepancies.  
PostgreSQL's `numeric(10,2)` stores exact fixed-point decimal values. Serializing them as strings in JSON payloads guarantees that client JavaScript engines do not introduce floating-point precision loss during network parsing."

