-- =====================================================================================
-- SMARTFARM AI - OPTIONAL POSTGRESQL EXTENSIONS & PHASE 2/3 AGRI-INTELLIGENCE TABLES
-- Target Database: "Farmer" (PostgreSQL 18)
-- Schema: "public"
--
-- PURPOSE:
-- 1. Useful PostgreSQL performance & cryptographic extensions.
-- 2. Optional Phase 2/3 tables identified in the SmartFarm AI Master Spec
--    (Persistent AI Chat History, Personalized Agronomic Recommendations, Farm Financials)
--    which are currently simulated in memory or client-side.
--
-- NOTE:
-- This file is OPTIONAL. You do NOT need to run this for the core 41 Prisma tables to work.
-- Run this if you wish to expand database persistence to AI chat transcripts and ledger records.
-- =====================================================================================

BEGIN;

-- -------------------------------------------------------------------------------------
-- 1. OPTIONAL PERFORMANCE & TEXT SEARCH EXTENSIONS
-- -------------------------------------------------------------------------------------
-- Enables trigram indexing for fuzzy text search across crop names, mandi commodities, and fertilizer brands
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enables cryptographic functions for token hashing and session signing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enables standard UUID v4 generation functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- -------------------------------------------------------------------------------------
-- 2. OPTIONAL PHASE 2/3 AGRI-INTELLIGENCE SCHEMA EXTENSIONS
-- -------------------------------------------------------------------------------------

-- Table: AiConversation (Persisting multilingual conversational sessions with Agri-AI)
CREATE TABLE IF NOT EXISTS "AiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cropContext" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- Table: AiMessage (Persisting chat turns, queries, and advisory responses)
CREATE TABLE IF NOT EXISTS "AiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sender" TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
    "content" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION,
    "sourceReferences" TEXT, -- JSON array of references (e.g. AGMARKNET, ICAR)
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- Table: Recommendation (Saved agronomic recommendations from AI or agricultural experts)
CREATE TABLE IF NOT EXISTS "Recommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "farmId" TEXT,
    "cropCycleId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general', -- 'irrigation', 'fertilizer', 'pest_control', 'harvest'
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actionPayload" TEXT, -- JSON action payload
    "isActioned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- Table: FarmExpense (Crop cost tracking: seeds, fertilizers, diesel, labor)
CREATE TABLE IF NOT EXISTS "FarmExpense" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "cropCycleId" TEXT,
    "category" TEXT NOT NULL, -- 'seeds', 'fertilizer', 'pesticides', 'labor', 'machinery', 'irrigation'
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmExpense_pkey" PRIMARY KEY ("id")
);

-- Table: FarmIncome (Produce sales receipts and mandi sales revenue)
CREATE TABLE IF NOT EXISTS "FarmIncome" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "cropCycleId" TEXT,
    "buyerName" TEXT,
    "mandiName" TEXT,
    "quantitySoldKg" DOUBLE PRECISION NOT NULL,
    "ratePerKg" DOUBLE PRECISION NOT NULL,
    "totalIncome" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmIncome_pkey" PRIMARY KEY ("id")
);

-- -------------------------------------------------------------------------------------
-- 3. INDEXES FOR OPTIONAL EXTENSION TABLES
-- -------------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "AiConversation_userId_idx" ON "AiConversation"("userId");
CREATE INDEX IF NOT EXISTS "AiMessage_conversationId_idx" ON "AiMessage"("conversationId");
CREATE INDEX IF NOT EXISTS "Recommendation_userId_idx" ON "Recommendation"("userId");
CREATE INDEX IF NOT EXISTS "FarmExpense_farmId_idx" ON "FarmExpense"("farmId");
CREATE INDEX IF NOT EXISTS "FarmIncome_farmId_idx" ON "FarmIncome"("farmId");

-- -------------------------------------------------------------------------------------
-- 4. FOREIGN KEY CONSTRAINTS FOR OPTIONAL EXTENSION TABLES
-- -------------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AiConversation_userId_fkey') THEN
        ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AiMessage_conversationId_fkey') THEN
        ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey" 
            FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Recommendation_userId_fkey') THEN
        ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FarmExpense_farmId_fkey') THEN
        ALTER TABLE "FarmExpense" ADD CONSTRAINT "FarmExpense_farmId_fkey" 
            FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FarmIncome_farmId_fkey') THEN
        ALTER TABLE "FarmIncome" ADD CONSTRAINT "FarmIncome_farmId_fkey" 
            FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

COMMIT;
