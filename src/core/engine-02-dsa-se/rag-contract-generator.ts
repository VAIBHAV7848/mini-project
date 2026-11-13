/**
 * Engine 02 (DSA & SE) — RAG Milestone Contract Generator
 *
 * Implements Retrieval-Augmented Generation (RAG) to generate schema-compliant,
 * balanced escrow milestones from client-freelancer negotiation transcripts
 * and retrieved engineering knowledge templates.
 */

import { callGroqChat } from '@/lib/groq';
import {
  globalVectorRetriever,
  RetrievalResult,
  MILESTONE_KNOWLEDGE_CORPUS,
  KnowledgeDocument,
} from './rag-knowledge-base';

export interface RagContractInput {
  project: {
    id: string;
    title: string;
    description: string;
    budget: number;
    skillTags: string[];
  };
  proposal: {
    id: string;
    freelancerId: string;
    freelancerName?: string;
    bidAmount: number;
    coverLetter: string;
  };
  chatTranscript?: string;
}

export interface GeneratedMilestoneItem {
  title: string;
  description: string;
  amount: number;
  dueDate: string; // ISO String
  acceptanceChecklist: string[];
}

export interface RagContractGenerationResult {
  milestones: GeneratedMilestoneItem[];
  totalAmount: number;
  retrievedContext: {
    matchedDocuments: Array<{
      id: string;
      title: string;
      category: string;
      similarityScore: number;
    }>;
    appliedClauses: string[];
  };
  modelUsed: string;
  generationMode: 'GROQ_RAG' | 'DETERMINISTIC_FALLBACK';
  summaryExplanation: string;
}

export class RagContractGenerator {
  /**
   * Execute the end-to-end RAG pipeline
   */
  static async generateMilestones(
    input: RagContractInput
  ): Promise<RagContractGenerationResult> {
    const { project, proposal, chatTranscript = '' } = input;

    // 1. RETRIEVAL STEP (R)
    // Query vector store using combined requirements and chat agreement
    const searchQuery = `${project.title} ${project.description} ${project.skillTags.join(' ')} ${chatTranscript}`;
    const retrievedResults = globalVectorRetriever.search(searchQuery, 2);

    // Also pull standard escrow policy
    const policyDoc = MILESTONE_KNOWLEDGE_CORPUS.find((d) => d.id === 'kb-escrow-clauses');
    const appliedClauses = policyDoc?.legalClauses || [];

    // 2. AUGMENTATION STEP (A)
    const promptContext = this.buildAugmentedPrompt({
      project,
      proposal,
      chatTranscript,
      retrievedResults,
      appliedClauses,
    });

    // 3. GENERATION STEP (G) via Groq LLM
    try {
      const response = await callGroqChat(
        [
          {
            role: 'system',
            content:
              'You are an expert Software Engineering Contract Architect for KLE Technological University Escrow Engine. Your job is to analyze client-freelancer negotiation chat and project specs, reference the retrieved standard milestone templates, and generate a strictly valid JSON object containing realistic, balanced escrow milestones. Return ONLY valid JSON matching the requested structure without markdown fences or conversational text.',
          },
          {
            role: 'user',
            content: promptContext,
          },
        ],
        {
          temperature: 0.1,
          maxTokens: 800,
        }
      );

      // Clean response content (strip markdown backticks if returned)
      let cleanedJson = response.content.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleanedJson);
      const normalizedMilestones = this.normalizeAndValidateMilestones(
        parsed.milestones,
        proposal.bidAmount
      );

      return {
        milestones: normalizedMilestones,
        totalAmount: proposal.bidAmount,
        retrievedContext: {
          matchedDocuments: retrievedResults.map((r) => ({
            id: r.document.id,
            title: r.document.title,
            category: r.document.category,
            similarityScore: r.similarityScore,
          })),
          appliedClauses,
        },
        modelUsed: response.model,
        generationMode: 'GROQ_RAG',
        summaryExplanation:
          parsed.summaryExplanation ||
          `Generated ${normalizedMilestones.length} milestone(s) synthesized from negotiation chat and retrieved ${retrievedResults[0]?.document.title || 'engineering'} standards.`,
      };
    } catch (llmError) {
      console.warn('[RagContractGenerator] Groq LLM generation failed, falling back to deterministic template synthesis:', llmError);

      // 4. DETERMINISTIC FALLBACK (Academic viva resilience)
      return this.generateDeterministicFallback(input, retrievedResults, appliedClauses);
    }
  }

  /**
   * Build the augmented RAG prompt
   */
  private static buildAugmentedPrompt(params: {
    project: RagContractInput['project'];
    proposal: RagContractInput['proposal'];
    chatTranscript: string;
    retrievedResults: RetrievalResult[];
    appliedClauses: string[];
  }): string {
    const { project, proposal, chatTranscript, retrievedResults, appliedClauses } = params;

    const templatesText = retrievedResults
      .map((r) => {
        const doc = r.document;
        const milestonesText = (doc.suggestedMilestones || [])
          .map(
            (m) =>
              `  - Title: ${m.title}\n    Ratio: ${m.relativeBudgetPercent}%\n    Days: ${m.estimatedDays}\n    Checklist: ${m.acceptanceChecklist.join(', ')}`
          )
          .join('\n');
        return `[Retrieved Template: ${doc.title} (Match Score: ${(r.similarityScore * 100).toFixed(1)}%)]\n${milestonesText}`;
      })
      .join('\n\n');

    return `
PROJECT SPECIFICATION:
- Title: ${project.title}
- Description: ${project.description}
- Skill Tags: ${project.skillTags.join(', ')}
- Target Budget: ₹${project.budget}

FREELANCER PROPOSAL:
- Agreed Bid Amount: ₹${proposal.bidAmount}
- Cover Letter: ${proposal.coverLetter}

CLIENT-FREELANCER NEGOTIATION TRANSCRIPT:
${chatTranscript.trim() ? chatTranscript : '(No prior chat notes provided. Synthesize optimal breakdown based on project requirements and retrieved templates.)'}

RETRIEVED KNOWLEDGE BASE MILESTONE PATTERNS:
${templatesText}

MANDATORY ESCROW POLICIES:
${appliedClauses.map((c) => `- ${c}`).join('\n')}

INSTRUCTIONS:
1. Divide the agreed bid amount (₹${proposal.bidAmount}) across 2 to 4 sequential milestones based on the negotiation chat and retrieved templates.
2. The sum of all milestone "amount" fields MUST equal EXACTLY ${proposal.bidAmount}.
3. Assign realistic due dates starting from today (${new Date().toISOString().split('T')[0]}). Space milestones by the discussed timelines or default 5 to 7 days each.
4. Each milestone must feature concrete, testable acceptance criteria in "acceptanceChecklist".
5. Return JSON ONLY with the exact following format:
{
  "summaryExplanation": "Brief 1-sentence rationale for the milestone breakdown.",
  "milestones": [
    {
      "title": "Milestone Title",
      "description": "Milestone description",
      "amount": 5000.00,
      "dueDate": "2026-11-20T00:00:00.000Z",
      "acceptanceChecklist": ["Checklist item 1", "Checklist item 2"]
    }
  ]
}
`.trim();
  }

  /**
   * Validate and balance milestone amounts to ensure exact equality with proposal bid
   */
  private static normalizeAndValidateMilestones(
    rawMilestones: any[],
    targetTotal: number
  ): GeneratedMilestoneItem[] {
    if (!Array.isArray(rawMilestones) || rawMilestones.length === 0) {
      throw new Error('LLM returned invalid or empty milestones array.');
    }

    const now = Date.now();
    let accumulated = 0;

    const validated: GeneratedMilestoneItem[] = rawMilestones.map((m, idx) => {
      const title = String(m.title || `Milestone ${idx + 1}`).trim();
      const description = String(m.description || 'Deliverable implementation and verification.').trim();
      const amount = Math.max(1, Number(m.amount) || Math.round(targetTotal / rawMilestones.length));
      accumulated += amount;

      // Ensure valid ISO date in the future
      let dueDate = m.dueDate;
      if (!dueDate || isNaN(Date.parse(dueDate)) || new Date(dueDate).getTime() <= now) {
        dueDate = new Date(now + (idx + 1) * 7 * 24 * 3600 * 1000).toISOString();
      }

      const acceptanceChecklist = Array.isArray(m.acceptanceChecklist)
        ? m.acceptanceChecklist.map((c: any) => String(c).trim()).filter(Boolean)
        : ['Deliverable artifact uploaded with valid SHA-256 checksum'];

      return {
        title,
        description,
        amount: Math.round(amount * 100) / 100,
        dueDate,
        acceptanceChecklist,
      };
    });

    // Balance rounding discrepancy onto the last milestone
    const diff = Math.round((targetTotal - accumulated) * 100) / 100;
    if (Math.abs(diff) > 0.01 && validated.length > 0) {
      const last = validated[validated.length - 1];
      last.amount = Math.round((last.amount + diff) * 100) / 100;
    }

    return validated;
  }

  /**
   * Deterministic fallback synthesizing retrieved templates without LLM
   */
  private static generateDeterministicFallback(
    input: RagContractInput,
    retrievedResults: RetrievalResult[],
    appliedClauses: string[]
  ): RagContractGenerationResult {
    const targetTotal = input.proposal.bidAmount;
    const topDoc: KnowledgeDocument =
      retrievedResults[0]?.document || MILESTONE_KNOWLEDGE_CORPUS[0];
    const templateMilestones = topDoc.suggestedMilestones || [
      {
        title: 'Phase 1: Foundation & Core Deliverables',
        description: 'Establish initial deliverables, models, and cryptographic verification.',
        relativeBudgetPercent: 50,
        estimatedDays: 7,
        acceptanceChecklist: ['Initial deliverables submitted with SHA-256 checksums'],
      },
      {
        title: 'Phase 2: Final Verification & Hand-off',
        description: 'Complete all requirements, test verification, and acceptance hand-off.',
        relativeBudgetPercent: 50,
        estimatedDays: 14,
        acceptanceChecklist: ['Full test suite passes and final artifact verified'],
      },
    ];

    const now = Date.now();
    let accumulatedDays = 0;
    let accumulatedAmount = 0;

    const milestones: GeneratedMilestoneItem[] = templateMilestones.map((tm, idx) => {
      accumulatedDays += tm.estimatedDays || 7;
      const fraction = tm.relativeBudgetPercent / 100;
      const amt = Math.round(targetTotal * fraction * 100) / 100;
      accumulatedAmount += amt;

      return {
        title: tm.title,
        description: tm.description,
        amount: amt,
        dueDate: new Date(now + accumulatedDays * 24 * 3600 * 1000).toISOString(),
        acceptanceChecklist: tm.acceptanceChecklist,
      };
    });

    // Fix rounding discrepancies on the last milestone
    const diff = Math.round((targetTotal - accumulatedAmount) * 100) / 100;
    if (diff !== 0 && milestones.length > 0) {
      milestones[milestones.length - 1].amount = Math.round((milestones[milestones.length - 1].amount + diff) * 100) / 100;
    }

    return {
      milestones,
      totalAmount: targetTotal,
      retrievedContext: {
        matchedDocuments: retrievedResults.map((r) => ({
          id: r.document.id,
          title: r.document.title,
          category: r.document.category,
          similarityScore: r.similarityScore,
        })),
        appliedClauses,
      },
      modelUsed: 'heuristic-engine-02',
      generationMode: 'DETERMINISTIC_FALLBACK',
      summaryExplanation: `Generated deterministic milestone distribution based on retrieved ${topDoc.title} template.`,
    };
  }
}
