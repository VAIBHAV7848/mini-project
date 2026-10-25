'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Loader2,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { calculateFileSha256, formatBytes } from '@/lib/crypto-hash';

interface DeliverableInspectorProps {
  expectedChecksum?: string;
  milestoneTitle?: string;
  fileName?: string;
  fileUrl?: string;
}

export function DeliverableInspector({
  expectedChecksum,
  milestoneTitle,
  fileName,
  fileUrl,
}: DeliverableInspectorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState<string>('');
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setIsHashing(true);
    try {
      const hash = await calculateFileSha256(selected);
      setComputedHash(hash);
    } catch (err) {
      console.error('Hashing error:', err);
    } finally {
      setIsHashing(false);
    }
  };

  const isMatch =
    expectedChecksum && computedHash
      ? expectedChecksum.toLowerCase() === computedHash.toLowerCase()
      : null;

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="card p-0 border border-line bg-surface overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-line bg-surface-highlight/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono2 text-[10px] font-bold uppercase tracking-wider text-brand-base px-2 py-0.5 rounded bg-brand-base/10 border border-brand-base/20">
            Engine 02 · Web Crypto SHA-256
          </span>
          <span className="text-xs text-paper font-bold">Deliverable Integrity Inspector</span>
        </div>
        {expectedChecksum && (
          <span className="text-[11px] font-mono2 text-paper-faint">
            Target: {expectedChecksum.slice(0, 10)}...
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Authoritative Checksum Banner */}
        {expectedChecksum && (
          <div className="p-3.5 rounded-xl bg-charcoal border border-line-strong space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono2 text-[10px] uppercase font-bold text-paper-faint flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-brand-base" /> Registered Authoritative Checksum (Ledger)
              </span>
              <button
                type="button"
                onClick={() => handleCopy(expectedChecksum)}
                className="text-[10px] font-mono2 text-brand-light hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="font-mono2 text-xs text-brand-light break-all select-all">
              {expectedChecksum}
            </p>
            {fileName && (
              <p className="text-[11px] text-paper-faint font-mono2">
                Deliverable Artifact: <span className="text-paper">{fileName}</span>
              </p>
            )}
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div>
          <label className="block text-xs font-semibold text-paper mb-2">
            Inspect Local File Against Cryptographic Proof
          </label>
          <div className="relative border-2 border-dashed border-line hover:border-brand-base rounded-xl p-5 text-center transition-colors bg-surface-elevated/50">
            <input
              type="file"
              onChange={handleFileDrop}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
              <Upload className="w-6 h-6 text-brand-base" />
              <div>
                <p className="text-xs font-bold text-paper">
                  {file ? file.name : 'Drop deliverable file here to inspect'}
                </p>
                <p className="text-[11px] text-paper-muted mt-0.5">
                  Computed client-side in browser memory via Web Crypto API · Zero bytes uploaded
                </p>
              </div>
              {file && (
                <span className="font-mono2 text-[10px] text-brand-light px-2 py-0.5 rounded bg-brand-base/15">
                  {formatBytes(file.size)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Verification Status */}
        {isHashing && (
          <div className="p-3 bg-charcoal border border-line rounded-xl flex items-center gap-2.5 text-xs text-brand-light font-mono2">
            <Loader2 className="w-4 h-4 animate-spin text-brand-base shrink-0" />
            <span>Computing SHA-256 digest via crypto.subtle.digest...</span>
          </div>
        )}

        {computedHash && !isHashing && (
          <div className="space-y-3">
            <div className="p-3 bg-charcoal border border-line-strong rounded-xl space-y-1">
              <span className="text-[10px] font-mono2 text-paper-faint uppercase font-bold">
                Locally Computed Digest
              </span>
              <p className="font-mono2 text-xs text-paper break-all select-all">{computedHash}</p>
            </div>

            {isMatch === true && (
              <div className="p-3.5 rounded-xl bg-success-tint/40 border border-success text-success-light flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 text-success" />
                <div className="text-xs">
                  <p className="font-bold text-paper">100% CRYPTOGRAPHIC MATCH · AUTHENTIC DELIVERABLE</p>
                  <p className="text-paper-muted">
                    The local file hash is identical to the immutable ledger record. No corruption or tampering
                    detected.
                  </p>
                </div>
              </div>
            )}

            {isMatch === false && (
              <div className="p-3.5 rounded-xl bg-danger-tint/40 border border-danger text-danger-light flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0 text-danger" />
                <div className="text-xs">
                  <p className="font-bold text-paper">CHECKSUM MISMATCH · TAMPER WARNING</p>
                  <p className="text-paper-muted">
                    The local file does not match the registered milestone proof. The deliverable has been modified or
                    substituted.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
