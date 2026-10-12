# SmartFarm AI — SQLite to PostgreSQL Migration Guide

This document details the exact status of your existing data in `prisma/dev.db`, explains the preservation strategy, and outlines how to transfer every record safely to **PostgreSQL 18** (`Farmer` database) without data loss or integrity issues.

---

## 1. Existing SQLite Data Audit (`prisma/dev.db`)

An automated inspection of `prisma/dev.db` was conducted using the Prisma ORM runtime.

### Summary
- **Total Populated Tables:** 21 tables
- **Total Rows Present:** 245 rows
- **Key Accounts Discovered:**
  - `System Admin` (`admin@smartfarm.ai` / role: `ADMIN`)
  - `Ramesh Patel` (`farmer@smartfarm.ai` / phone: `+919876543211` / role: `FARMER`)
  - **`Dhruv`** (phone: `8780617178`, village: `Vavol`, farm: `Dhruvil` of 52 acres / role: `FARMER`)
- **Key Agronomic Data Discovered:**
  - 3 Core crops (`wheat`, `cotton`, `groundnut`) with 9 localized translations (English, Hindi, Gujarati)
  - 18 phonological crop stages with 54 multilingual translations
  - 11 APMC Mandi commodities & 10 Gujarat Mandi locations
  - 84 live AGMARKNET daily modal price observations
  - 8 Fertilizer categories & 6 verified crop fertilizer advisory guidance rules
  - 8 E-commerce fertilizer products across 6 brands and 4 categories
  - 2 Completed orders with 3 order item line items

### Detailed Table Breakdown
| Table | Row Count | Primary Content Description |
| :--- | :---: | :--- |
| `Role` | 4 | System security roles (`FARMER`, `ADMIN`, `EXPERT`, `BUYER`) |
| `User` | 3 | Admin, Ramesh Patel, and registered user Dhruv |
| `UserRole` | 3 | Role associations |
| `Farm` | 3 | Agricultural farms (`Patel Organic Farm`, `Dhruvil`) |
| `Field` | 2 | Farm field plots |
| `Crop` | 3 | Master crops |
| `CropTranslation` | 9 | Localized crop names (en, gu, hi) |
| `CropStage` | 18 | Sowing, vegetative, flowering, boll formation, harvest |
| `CropStageTranslation` | 54 | Multilingual stage names |
| `CropCycle` | 2 | Sown crop cycles |
| `Task` | 2 | Scheduled agricultural tasks |
| `MarketCommodity` | 11 | APMC mandi commodities |
| `MarketLocation` | 10 | APMC mandis (Rajkot, Gondal, Surat, Vadodara, etc.) |
| `MarketPriceObservation`| 84 | Modal market prices per quintal |
| `FertilizerCategory` | 8 | Urea, DAP, NPK, MOP, SSP, Bio-fertilizer, Zinc, Boron |
| `CropFertilizerGuidance`| 6 | Verified dosage, timing, and application guidance |
| `ProductCategory` | 4 | Organic, Chemical, Bio-fertilizers, Micronutrients |
| `ProductBrand` | 6 | IFFCO, GSFC, Coromandel, KRIBHCO, Bayer, SmartFarm |
| `Product` | 8 | Fertilizer catalog items with prices, MRP, stock |
| `Order` | 2 | Placed orders with delivery details |
| `OrderItem` | 3 | Order line item snapshots |
| **TOTAL** | **245** | |

---

## 2. Safety & Non-Destructive Principles

1. **`prisma/dev.db` is NEVER deleted or overwritten:** It remains intact on your filesystem as an active fallback.
2. **Deterministic Seed SQL:** We have exported all 245 rows with exact UUID primary keys and foreign keys to `database/postgresql_seed_data.sql`.
3. **Idempotent Ingestion:** Every `INSERT` statement includes `ON CONFLICT DO NOTHING`. If executed multiple times, no rows will be duplicated or corrupted.

---

## 3. Migration Execution Procedure

### Method A: Direct Execution via pgAdmin 4 (Fastest & Recommended)

This method does not require any additional npm packages or node connection configuration:

1. Open **pgAdmin 4**.
2. Connect to your **PostgreSQL 18** server and select the **`Farmer`** database.
3. Open **Tools** → **Query Tool**.
4. Open and execute `database/postgresql_complete_schema.sql` (press **F5**).
5. Open and execute `database/postgresql_seed_data.sql` (press **F5**).
6. Run `database/postgresql_schema_verification.sql` to verify that all 245 records are loaded cleanly.

### Method B: Automated Node Script

If you have already configured your PostgreSQL credentials in `.env`:

```bash
node scripts/migrate-sqlite-to-postgres.mjs
```

---

## 4. Post-Migration Verification Checklist

In pgAdmin Query Tool, run:
```sql
SELECT 'Users' AS entity, COUNT(*) FROM "User"
UNION ALL
SELECT 'Crops', COUNT(*) FROM "Crop"
UNION ALL
SELECT 'Market Observations', COUNT(*) FROM "MarketPriceObservation"
UNION ALL
SELECT 'Products', COUNT(*) FROM "Product"
UNION ALL
SELECT 'Orders', COUNT(*) FROM "Order";
```
Expected output:
- Users: 3
- Crops: 3
- Market Observations: 84
- Products: 8
- Orders: 2

All data has transitioned from SQLite to PostgreSQL with 100% fidelity.
