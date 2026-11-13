/**
 * Engine 02 (DSA & SE) — RAG Knowledge Base & Vector Space Retrieval Engine
 *
 * Implements an in-memory Vector Space Model using TF-IDF and Cosine Similarity
 * to retrieve standard milestone templates, acceptance criteria, and escrow clauses
 * given project requirements and client-freelancer negotiation chat transcripts.
 */

export interface KnowledgeDocument {
  id: string;
  category: 'web' | 'mobile' | 'backend' | 'ai-ml' | 'devops' | 'design' | 'escrow-policy';
  title: string;
  summary: string;
  tags: string[];
  suggestedMilestones?: Array<{
    title: string;
    description: string;
    relativeBudgetPercent: number; // e.g. 40 means 40%
    estimatedDays: number;
    acceptanceChecklist: string[];
  }>;
  legalClauses?: string[];
}

export interface RetrievalResult {
  document: KnowledgeDocument;
  similarityScore: number;
  matchedTokens: string[];
}

export const MILESTONE_KNOWLEDGE_CORPUS: KnowledgeDocument[] = [
  {
    id: 'kb-web-fullstack',
    category: 'web',
    title: 'Modern Full-Stack Web Application (Next.js / React / Node)',
    summary: 'Standard engineering milestone distribution for full-stack web applications with authentication, database persistence, and frontend UI.',
    tags: ['react', 'next', 'nextjs', 'typescript', 'frontend', 'fullstack', 'tailwind', 'ui', 'web'],
    suggestedMilestones: [
      {
        title: 'Phase 1: Design System, Architecture & Authentication',
        description: 'Establish repository structure, theme system, RBAC role handling, and authenticated session management.',
        relativeBudgetPercent: 35,
        estimatedDays: 5,
        acceptanceChecklist: [
          'Design tokens and responsive layout shell implemented',
          'Role-based access control and login/logout workflows complete',
          'Database models and initial migrations verified',
        ],
      },
      {
        title: 'Phase 2: Core Domain Features & Business Logic API',
        description: 'Implement primary data entities, CRUD operations, state machines, and REST/GraphQL route handlers.',
        relativeBudgetPercent: 40,
        estimatedDays: 7,
        acceptanceChecklist: [
          'Core domain CRUD endpoints operational with Zod validation',
          'State transition rules and concurrency safety enforced',
          'Interactive UI components bound to real-time APIs',
        ],
      },
      {
        title: 'Phase 3: Integration Testing, Security Audit & Deployment',
        description: 'End-to-end user journey tests, performance optimization, and production deployment.',
        relativeBudgetPercent: 25,
        estimatedDays: 4,
        acceptanceChecklist: [
          '80%+ automated test suite coverage passing in CI',
          'Zero critical security vulnerabilities or plain-text credentials',
          'Production build deployed and smoke verified',
        ],
      },
    ],
    legalClauses: [
      'Deliverables must include clean source code and build instructions.',
      'Intellectual property transfers to the client upon escrow fund release.',
    ],
  },
  {
    id: 'kb-mobile-app',
    category: 'mobile',
    title: 'Cross-Platform Mobile Application (React Native / Flutter)',
    summary: 'Standard mobile app delivery structure including navigation flows, native integrations, and store packaging.',
    tags: ['mobile', 'react-native', 'flutter', 'ios', 'android', 'app'],
    suggestedMilestones: [
      {
        title: 'Phase 1: Mobile UI Screens & Navigation Architecture',
        description: 'Deliver responsive cross-platform screen views, navigation stack, and local state management.',
        relativeBudgetPercent: 40,
        estimatedDays: 7,
        acceptanceChecklist: [
          'All primary mobile screens matching Figma mockups',
          'Deep linking and nested navigation flows verified',
        ],
      },
      {
        title: 'Phase 2: Native Device APIs & Offline Synchronization',
        description: 'Integrate native device sensors, camera/storage, push notifications, and offline SQLite caching.',
        relativeBudgetPercent: 35,
        estimatedDays: 8,
        acceptanceChecklist: [
          'Hardware permission gates implemented gracefully',
          'Background sync and offline-first queue functioning',
        ],
      },
      {
        title: 'Phase 3: Release Builds & Store Packaging',
        description: 'Produce signed Android APK/AAB and iOS TestFlight builds with analytics.',
        relativeBudgetPercent: 25,
        estimatedDays: 5,
        acceptanceChecklist: [
          'Clean release build generation without crash logs',
          'Installation and launch verified across both OS platforms',
        ],
      },
    ],
  },
  {
    id: 'kb-backend-microservice',
    category: 'backend',
    title: 'High-Throughput Backend Service & Transaction Ledger',
    summary: 'Robust backend API engineering with ACID transactions, rate limiting, and relational schema normalization.',
    tags: ['backend', 'api', 'database', 'sql', 'prisma', 'microservice', 'node', 'express'],
    suggestedMilestones: [
      {
        title: 'Phase 1: Normalized Database Schema & Migrations',
        description: 'Design BCNF relational entities, foreign keys, index optimization, and transactional ledger tables.',
        relativeBudgetPercent: 40,
        estimatedDays: 5,
        acceptanceChecklist: [
          'Prisma/SQL migrations apply idempotently without orphan records',
          'Foreign key constraints and WAL journaling configured',
        ],
      },
      {
        title: 'Phase 2: High-Performance REST Endpoints & Concurrency Guards',
        description: 'Implement atomic state transitions with mutex locking, idempotent webhooks, and rate-limiting middleware.',
        relativeBudgetPercent: 60,
        estimatedDays: 8,
        acceptanceChecklist: [
          'Double-spend prevention verified via automated concurrency tests',
          'API documentation provided with OpenAPI/Swagger schemas',
        ],
      },
    ],
  },
  {
    id: 'kb-ai-ml-data',
    category: 'ai-ml',
    title: 'Machine Learning, RAG Pipeline & Data Engineering',
    summary: 'Data preprocessing, vector embeddings, model serving, and LLM orchestration.',
    tags: ['ai', 'ml', 'rag', 'llm', 'embeddings', 'python', 'vector', 'model'],
    suggestedMilestones: [
      {
        title: 'Phase 1: Data Ingestion & Vector Retrieval Pipeline',
        description: 'Build chunking, embedding generation, vector store indexing, and Top-K retrieval tests.',
        relativeBudgetPercent: 50,
        estimatedDays: 6,
        acceptanceChecklist: [
          'Document corpus parsed and embedded into vector storage',
          'Retrieval precision and recall benchmarked above baseline',
        ],
      },
      {
        title: 'Phase 2: LLM Synthesis, Evaluation & API Serving',
        description: 'Connect LLM generation with prompt templates, hallucination checks, and FastAPI/Next.js endpoints.',
        relativeBudgetPercent: 50,
        estimatedDays: 6,
        acceptanceChecklist: [
          'End-to-end RAG response latency under 2 seconds',
          'Evaluation test suite demonstrating high faithfulness',
        ],
      },
    ],
  },
  {
    id: 'kb-ui-ux-design',
    category: 'design',
    title: 'UI/UX Design, Wireframing & Design System',
    summary: 'Design workflows spanning user journey mapping, high-fidelity Figma components, and hand-off assets.',
    tags: ['design', 'ui', 'ux', 'figma', 'prototype', 'wireframe'],
    suggestedMilestones: [
      {
        title: 'Phase 1: Information Architecture & Wireframes',
        description: 'User personas, flow diagrams, and low-fidelity interactive wireframes.',
        relativeBudgetPercent: 40,
        estimatedDays: 4,
        acceptanceChecklist: [
          'Complete user flow diagrams approved by client',
          'Clickable wireframe prototype covering all primary journeys',
        ],
      },
      {
        title: 'Phase 2: High-Fidelity Design System & Developer Tokens',
        description: 'Polished components, typography scales, dark/light color palettes, and exported asset library.',
        relativeBudgetPercent: 60,
        estimatedDays: 6,
        acceptanceChecklist: [
          'Figma component library with auto-layout variants',
          'CSS tokens, SVGs, and responsive design specifications ready for engineering',
        ],
      },
    ],
  },
  {
    id: 'kb-escrow-clauses',
    category: 'escrow-policy',
    title: 'Mandatory Escrow Protection & Deliverable Verification Policy',
    summary: 'Standard contractual rules enforced by the Escrow FSM and Evidence Engine.',
    tags: ['escrow', 'security', 'checksum', 'dispute', 'evidence', 'sha256', 'policy'],
    legalClauses: [
      'EVIDENCE_INTEGRITY: Every milestone deliverable must be hashed with Node.js crypto SHA-256 upon submission to create an immutable cryptographic leaf.',
      'WATCHDOG_AUTO_APPROVAL: The client has a strict 7-day review window. If no dispute or approval is registered within this window, the watchdog auto-releases escrow funds.',
      'DISPUTE_ARBITRATION: In the event of a dispute, an authorized department Reviewer assesses the cryptographic Merkle evidence tree and project specifications to issue a binding ruling.',
    ],
  },
];

/**
 * Text Tokenizer & Normalizer for Engine 02 Vector Search
 */
export function tokenizeText(text: string): string[] {
  // Normalize technology identifiers like next.js -> nextjs, react.js -> reactjs, node.js -> nodejs
  const normalizedText = text
    .toLowerCase()
    .replace(/\bnext\.js\b/g, 'nextjs')
    .replace(/\breact\.js\b/g, 'react')
    .replace(/\bnode\.js\b/g, 'nodejs')
    .replace(/\bvue\.js\b/g, 'vuejs');

  const STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as',
    'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could',
    'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
    'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
    'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself',
    'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
    'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that',
    'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
    'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where',
    'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
  ]);

  return normalizedText
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * In-Memory TF-IDF Vector Space Retriever
 */
export class VectorSpaceRetriever {
  private documents: KnowledgeDocument[];
  private idfMap: Map<string, number> = new Map();
  private docVectors: Map<string, Map<string, number>> = new Map();

  constructor(corpus: KnowledgeDocument[] = MILESTONE_KNOWLEDGE_CORPUS) {
    this.documents = corpus;
    this.buildIndex();
  }

  private buildIndex(): void {
    const totalDocs = this.documents.length;
    const docFrequency: Map<string, number> = new Map();

    // 1. Calculate Document Frequency (DF)
    for (const doc of this.documents) {
      const docText = `${doc.title} ${doc.summary} ${doc.tags.join(' ')}`;
      const uniqueTokens = new Set(tokenizeText(docText));
      for (const token of uniqueTokens) {
        docFrequency.set(token, (docFrequency.get(token) || 0) + 1);
      }
    }

    // 2. Calculate Inverse Document Frequency (IDF) with smoothing: log(1 + (N / DF))
    for (const [token, df] of docFrequency.entries()) {
      this.idfMap.set(token, Math.log(1 + totalDocs / df));
    }

    // 3. Precompute Document TF-IDF Vectors
    for (const doc of this.documents) {
      const docText = `${doc.title} ${doc.summary} ${doc.tags.join(' ')}`;
      const tokens = tokenizeText(docText);
      const tfMap: Map<string, number> = new Map();
      for (const t of tokens) {
        tfMap.set(t, (tfMap.get(t) || 0) + 1);
      }

      const vector: Map<string, number> = new Map();
      let normSq = 0;
      for (const [t, count] of tfMap.entries()) {
        const tf = count / tokens.length;
        const idf = this.idfMap.get(t) || 0.1;
        const weight = tf * idf;
        vector.set(t, weight);
        normSq += weight * weight;
      }

      // Normalize vector
      const norm = Math.sqrt(normSq) || 1;
      for (const [t, weight] of vector.entries()) {
        vector.set(t, weight / norm);
      }

      this.docVectors.set(doc.id, vector);
    }
  }

  /**
   * Search knowledge base using query text (e.g. project tags + negotiation chat)
   */
  search(query: string, topK: number = 2): RetrievalResult[] {
    const queryTokens = tokenizeText(query);
    if (queryTokens.length === 0) {
      return this.documents.slice(0, topK).map((doc) => ({
        document: doc,
        similarityScore: 0.1,
        matchedTokens: [],
      }));
    }

    // Build query vector
    const qTfMap: Map<string, number> = new Map();
    for (const t of queryTokens) {
      qTfMap.set(t, (qTfMap.get(t) || 0) + 1);
    }

    const qVector: Map<string, number> = new Map();
    let qNormSq = 0;
    for (const [t, count] of qTfMap.entries()) {
      const tf = count / queryTokens.length;
      const idf = this.idfMap.get(t) || 0.1;
      const weight = tf * idf;
      qVector.set(t, weight);
      qNormSq += weight * weight;
    }
    const qNorm = Math.sqrt(qNormSq) || 1;
    for (const [t, w] of qVector.entries()) {
      qVector.set(t, w / qNorm);
    }

    // Compute Cosine Similarity with all documents
    const results: RetrievalResult[] = [];
    for (const doc of this.documents) {
      const docVec = this.docVectors.get(doc.id);
      if (!docVec) continue;

      let dotProduct = 0;
      const matchedTokens: string[] = [];

      for (const [token, qWeight] of qVector.entries()) {
        const dWeight = docVec.get(token);
        if (dWeight !== undefined) {
          dotProduct += qWeight * dWeight;
          matchedTokens.push(token);
        }
      }

      results.push({
        document: doc,
        similarityScore: Number(dotProduct.toFixed(4)),
        matchedTokens,
      });
    }

    // Sort descending by similarity
    results.sort((a, b) => b.similarityScore - a.similarityScore);
    return results.slice(0, topK);
  }
}

export const globalVectorRetriever = new VectorSpaceRetriever();
