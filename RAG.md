# SMARTFARM AI — RAG (RETRIEVAL-AUGMENTED GENERATION) SPECIFICATION

---

## 1. RAG Architecture

The Knowledge RAG engine powers grounding for agricultural guides, extension literature, and government scheme documents.

```
Document Upload (PDF/MD/HTML) ──► Structural Chunking (300-600 tokens)
                                          │
                                          ▼
                               Multilingual Embedding Engine
                                          │
                                          ▼
                               Vector Store (PostgreSQL + pgvector)
                                          │
                                          ▼
                              Hybrid Search (Vector + Full-Text TSVector)
                                          │
                                          ▼
                              Reciprocal Rank Fusion (RRF) & Citation Assembly
```

---

## 2. Ingestion & Quality Gates

- **Authority Weighting**: Documents are tagged by authority level (`GOVERNMENT` > `UNIVERSITY_RESEARCH` > `EXPERT_GUIDE` > `INTERNAL`).
- **Citation Preservation**: Every retrieved chunk preserves document title, section, page number, and source URL.
- **Private Document Scoping**: Farmer-uploaded documents are scoped strictly to their owner ID and never leaked to global retrieval.
