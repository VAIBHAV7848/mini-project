import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { SessionService } from '@/core/engine-04-web/session';
import { transcribeAudioWithGroq } from '@/lib/groq';
import { entityIdSchema } from '@/lib/validation';
import {
  formatSuccessResponse,
  formatErrorResponse,
  NotFoundError,
  AuthorizationError,
  ValidationError,
} from '@/lib/errors';

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB

const transcribeMetadataSchema = z.object({
  proposalId: entityIdSchema,
  speakerRole: z.enum(['CLIENT', 'FREELANCER']).default('CLIENT'),
  speakerName: z.string().trim().max(80).optional(),
  language: z.string().trim().min(2).max(10).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await SessionService.getSessionFromHeaders(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const audioEntry = formData.get('audio');
    const rawProposalId = String(formData.get('proposalId') || '');
    const rawSpeakerRole = String(formData.get('speakerRole') || 'CLIENT').toUpperCase();
    const rawSpeakerName = formData.get('speakerName') ? String(formData.get('speakerName')) : undefined;
    const rawLanguage = formData.get('language') ? String(formData.get('language')) : undefined;

    const validated = transcribeMetadataSchema.parse({
      proposalId: rawProposalId,
      speakerRole: rawSpeakerRole,
      speakerName: rawSpeakerName,
      language: rawLanguage,
    });

    if (!audioEntry || typeof audioEntry === 'string') {
      throw new ValidationError('Audio file payload ("audio") is required for transcription.');
    }

    const audioFile = audioEntry as File;
    if (audioFile.size <= 0) {
      throw new ValidationError('Recorded audio clip is empty. Please speak clearly and record again.');
    }
    if (audioFile.size > MAX_AUDIO_BYTES) {
      throw new ValidationError('Audio file exceeds 10 MB size limit.');
    }

    const mimeType = (audioFile.type || 'audio/webm').split(';')[0].trim().toLowerCase();
    const allowedMimePrefixes = ['audio/', 'video/webm', 'video/mp4', 'application/octet-stream'];
    if (!allowedMimePrefixes.some((prefix) => mimeType.startsWith(prefix))) {
      throw new ValidationError(`Unsupported audio media type: ${mimeType}`);
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: validated.proposalId },
      include: {
        project: {
          select: { id: true, title: true, clientId: true, client: { select: { name: true } } },
        },
        freelancer: {
          select: { id: true, name: true },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundError('Proposal', validated.proposalId);
    }

    if (
      session.role !== 'ADMIN' &&
      session.userId !== proposal.project.clientId &&
      session.userId !== proposal.freelancerId
    ) {
      throw new AuthorizationError('You are not authorized to record negotiations for this proposal.');
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    const clipSha256 = crypto.createHash('sha256').update(audioBuffer).digest('hex');

    const promptHint = `Software engineering milestone escrow negotiation for project "${proposal.project.title}". Common terms: INR, rupees, phase, milestone, SHA-256, Merkle, deliverables, Next.js, TypeScript, Prisma, deadline, days.`;

    const transcription = await transcribeAudioWithGroq({
      audioBuffer,
      fileName: audioFile.name || 'negotiation-clip.webm',
      mimeType,
      language: validated.language,
      prompt: promptHint,
    });

    if (!transcription.text) {
      throw new ValidationError('No clear speech detected in audio clip. Please try recording closer to the microphone.');
    }

    const defaultSpeakerName =
      validated.speakerRole === 'CLIENT'
        ? proposal.project.client.name
        : proposal.freelancer.name;
    const speakerLabel = validated.speakerRole === 'CLIENT' ? 'Client' : 'Freelancer';
    const displaySpeaker = validated.speakerName
      ? `${speakerLabel} (${validated.speakerName})`
      : `${speakerLabel} (${defaultSpeakerName})`;

    const timeTag = new Date().toISOString().slice(11, 16);
    const formattedLine = `[${timeTag} UTC] [${displaySpeaker}]: ${transcription.text}`;

    return NextResponse.json(
      formatSuccessResponse({
        proposalId: proposal.id,
        speakerRole: validated.speakerRole,
        speakerLabel: displaySpeaker,
        text: transcription.text,
        formattedLine,
        model: transcription.model,
        durationSec: transcription.durationSec ?? null,
        clipSha256,
        transcriptTimestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
