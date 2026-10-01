# SMARTFARM AI — SECURITY & COMPLIANCE SPECIFICATION

---

## 1. Security Architecture & Controls

1. **Authentication & Password Hygiene**:
   - Passwords hashed using bcrypt / Argon2id.
   - Session tokens stored in HttpOnly, Secure, SameSite=Lax cookies.
   - Rate limiting on authentication routes (5 requests / min).

2. **Authorization (RBAC & Policy Checks)**:
   - Deny-by-default access control.
   - Every database query and API operation enforces strict farm/field ownership verification (`field.farm.user_id === session.user_id`).
   - Admin routes explicitly protected by `admin.*` permission checks.

3. **Input Validation & Sanitization**:
   - Strongly typed Zod schemas validate all inbound query params and request bodies.
   - SQL Injection protection via Prisma parameterization.
   - GeoJSON geometry validation (polygon sanity, vertex limits).

4. **Secure Storage & Private Uploads**:
   - File uploads stored outside public web root with randomized UUID filenames.
   - MIME type verification using magic-byte content sniffing.
   - File download served strictly via signed URL authorization.

5. **Secrets & Privacy**:
   - API keys and database credentials strictly stored in `.env`.
   - Audit logging (`audit_logs`) records all administrative actions and security mutations.
