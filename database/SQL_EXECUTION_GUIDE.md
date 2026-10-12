# SmartFarm AI — PostgreSQL 18 & pgAdmin 4 Execution Guide

This comprehensive, step-by-step guide explains how to execute the database scripts for **SmartFarm AI** in **pgAdmin 4** on your local **PostgreSQL 18** installation, targeting the **`Farmer`** database.

---

## 1. Quick Overview of SQL Files

All files are located in `D:\Farming\database\`:

| File | Purpose | Execution Requirement |
| :--- | :--- | :--- |
| **`postgresql_complete_schema.sql`** | Creates all 41 application tables, primary keys, indexes, and foreign keys. | **MANDATORY (Step 1)** |
| **`postgresql_seed_data.sql`** | Populates all 245 production & development records (crops, mandis, fertilizers, stores, user accounts). | **MANDATORY (Step 2)** |
| **`postgresql_schema_verification.sql`** | Validates table counts, row counts, constraints, and foreign key integrity. | **RECOMMENDED (Step 3)** |
| **`postgresql_optional_extensions.sql`** | Adds extensions (`pg_trgm`) and Phase 2/3 tables (AI chat transcripts, farm expenses). | **OPTIONAL (Future)** |

---

## 2. Step-by-Step pgAdmin 4 Execution Instructions

### Step 2.1: Open pgAdmin 4 and Connect to PostgreSQL 18
1. Launch **pgAdmin 4** from your Windows Start Menu.
2. In the left **Browser** tree, expand **Servers**.
3. Click on **PostgreSQL 18** (or your PostgreSQL server instance).
4. Enter your master password for the `postgres` superuser if prompted.

### Step 2.2: Select the `Farmer` Database
1. Under **PostgreSQL 18**, expand **Databases**.
2. Locate the existing database named **`Farmer`**.
   > *Note:* If the `Farmer` database does not exist yet, right-click **Databases** → **Create** → **Database...**, name it `Farmer` (Owner: `postgres`), and click **Save**.
3. Click on **`Farmer`** to select it.

### Step 2.3: Open Query Tool
1. In the top navigation menu, click **Tools** → **Query Tool** (or click the database icon with a lightning bolt, or press `Alt + Shift + Q`).
2. Verify that the query tab title says: `Query - <Server>/postgres@Farmer`.

### Step 2.4: Execute `postgresql_complete_schema.sql` (Schema Creation)
1. In pgAdmin Query Tool, open the file by clicking the **Open File** folder icon in the toolbar (or press `Ctrl + O`).
2. Navigate to:
   ```
   D:\Farming\database\postgresql_complete_schema.sql
   ```
   *(Alternatively: Open the file in VS Code or Notepad, copy all text, and paste it into the Query Tool).*
3. Press **F5** (or click the **Execute / Refresh** triangle icon ▶ in the toolbar).
4. **Expected Output:**
   ```
   Query returned successfully in ... msec.
   ```
   All 41 tables, indexes, and cascading foreign keys have now been created safely.

### Step 2.5: Execute `postgresql_seed_data.sql` (Data Ingestion)
1. In the Query Tool, clear the editor or open a new Query Tool tab.
2. Open or paste the contents of:
   ```
   D:\Farming\database\postgresql_seed_data.sql
   ```
3. Press **F5** (Execute).
4. **Expected Output:**
   ```
   Query returned successfully in ... msec.
   COMMIT;
   -- Seed insertion complete. Total records: 245
   ```
   *All 245 rows are inserted with `ON CONFLICT DO NOTHING`. If executed again, no duplicate entries will be created.*

### Step 2.6: Inspect Created Tables in pgAdmin Browser
1. In the left Browser tree under `Farmer`:
   Expand **Schemas** → **public** → **Tables**.
2. Right-click **Tables** and choose **Refresh**.
3. You should see all 41 PascalCase tables:
   - `"User"`, `"Role"`, `"UserRole"`, `"Farm"`, `"Field"`
   - `"Crop"`, `"CropTranslation"`, `"CropStage"`, `"CropCycle"`, `"Task"`
   - `"MarketCommodity"`, `"MarketLocation"`, `"MarketPriceObservation"`
   - `"FertilizerCategory"`, `"CropFertilizerGuidance"`
   - `"ProductCategory"`, `"ProductBrand"`, `"Product"`, `"CartItem"`, `"Order"`, `"OrderItem"`
4. To view rows in any table (e.g. `"User"` or `"Product"`):
   - Right-click `"User"` → **View/Edit Data** → **First 100 Rows**.
   - You will see the seeded accounts: `System Admin`, `Ramesh Patel`, and `Dhruv`.

### Step 2.7: Run `postgresql_schema_verification.sql`
1. Open and execute:
   ```
   D:\Farming\database\postgresql_schema_verification.sql
   ```
2. The verification suite executes 7 automated integrity tests:
   - **Test 1:** Table count check (`total_tables_created = 41`).
   - **Test 2:** Column count breakdown per table.
   - **Test 3:** Primary key constraints verification.
   - **Test 4:** Foreign key constraints with cascading rules.
   - **Test 5:** Unique indexes check.
   - **Test 6:** Record count audit across seeded tables.
   - **Test 7:** Referential integrity check (confirms **0 orphan records** across all tables).

---

## 3. Troubleshooting & FAQs

### Q1: What if a table or constraint already exists?
- All `CREATE TABLE` and `CREATE INDEX` statements in `postgresql_complete_schema.sql` use `IF NOT EXISTS`.
- All `ADD CONSTRAINT` statements are wrapped in conditional `DO $$ ... END $$` blocks that check `pg_constraint`.
- All `INSERT` statements in `postgresql_seed_data.sql` use `ON CONFLICT DO NOTHING`.
- **Result:** You can safely re-run the scripts at any time without errors or data duplication.

### Q2: Did any statement require superuser privileges?
- Only `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"` and `"pgcrypto"`.
- By default in pgAdmin 4, connecting as `postgres` has superuser permissions, so these extensions install seamlessly.
- If running on a restricted cloud PostgreSQL instance, extensions may need to be enabled from the cloud dashboard.

### Q3: Why are table names quoted (e.g. `"User"`)?
- Prisma ORM generates queries referencing models by their defined case (e.g. `SELECT ... FROM "User"`).
- Quoting ensures PostgreSQL respects PascalCase and matches Prisma Client exactly without column or table mapping mismatches.

---

## 4. Connecting Your Website to PostgreSQL

Once the SQL scripts have been executed in pgAdmin:

1. Open `D:\Farming\.env`.
2. Update the `DATABASE_URL` with your PostgreSQL password:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/Farmer?schema=public"
   ```
3. Open `D:\Farming\prisma\schema.prisma` and ensure provider is set to:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Regenerate the Prisma Client in your terminal:
   ```bash
   npx prisma generate
   ```
5. Restart your Next.js application:
   ```bash
   npm run dev
   ```
6. Your live website at `http://localhost:3000` is now powered directly by your PostgreSQL 18 `Farmer` database!
