'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileUp,
  X,
  FileText,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import Portal from '@/components/ui/Portal';
import type { Currency } from '@/lib/pricing';
import type { ParseIntentResponse } from '@/lib/rag-client';
import styles from './RfpUploaderModal.module.css';

interface RfpUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlueprintExtracted: (blueprint: ParseIntentResponse) => void;
  currency: Currency;
  isNoir?: boolean;
}

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function RfpUploaderModal({
  isOpen,
  onClose,
  onBlueprintExtracted,
  currency,
}: RfpUploaderModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    if (isUploading) return;
    setSelectedFile(null);
    setIsDragging(false);
    setProgressStatus(null);
    onClose();
  }, [isUploading, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('File exceeds 25MB limit. Please upload a smaller document.');
      return;
    }
    const name = file.name.toLowerCase();
    const isAllowed = name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.md') || name.endsWith('.txt');
    if (!isAllowed) {
      toast.error('Supported formats: PDF, DOCX, Markdown (.md), or Plain Text (.txt).');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUploadAndExtract = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setProgressStatus('Reading and preparing document...');

    const timer1 = setTimeout(() => {
      setProgressStatus('Extracting technical requirements with Retriever Cognitive Core...');
    }, 450);

    const timer2 = setTimeout(() => {
      setProgressStatus('Synthesizing CPQ architecture blueprint...');
    }, 1800);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('currency', currency);

      const res = await fetch('/api/scoping/parse-rfp', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to parse RFP');
      }

      const blueprint: ParseIntentResponse = await res.json();
      onBlueprintExtracted(blueprint);

      const modelName = blueprint.telemetry?.modelUsed || 'Retriever Engine';
      const latency = blueprint.telemetry?.latencyMs ? ` in ${blueprint.telemetry.latencyMs}ms` : '';
      const confidence = blueprint.confidenceScore ? `${Math.round(blueprint.confidenceScore * 100)}% Match` : 'Parsed';

      toast.success(
        `🎯 ${confidence} via ${modelName}${latency}: ${blueprint.summaryRationale}`,
        { duration: 7000 }
      );

      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`RFP analysis failed: ${message}`);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsUploading(false);
      setProgressStatus(null);
    }
  };

  return (
    <Portal>
      <div
        className={styles.backdrop}
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rfp-uploader-title"
      >
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <div className={styles.titleArea}>
              <FileUp size={20} className={styles.titleIcon} />
              <h2 id="rfp-uploader-title" className={styles.title}>Multimodal RFP / PRD Parser</h2>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={handleClose}
              disabled={isUploading}
              aria-label="Close RFP uploader modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className={styles.body}>
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp size={36} className={styles.uploadIcon} />
              <div className={styles.dropText}>
                Drag &amp; drop your RFP, PRD, or Architecture Doc here
              </div>
              <div className={styles.subText}>
                Supports PDF, DOCX, Markdown (.md), and TXT (up to 25MB)
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className={styles.hiddenInput}
                aria-label="Upload RFP or project brief document"
                accept=".pdf,.docx,.md,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    validateAndSetFile(e.target.files[0]);
                  }
                }}
              />
            </div>

            {selectedFile && (
              <div className={styles.selectedFileInfo}>
                <div className={styles.fileBadge}>
                  <FileText size={16} />
                  <span>{selectedFile.name}</span>
                </div>
                <div className={styles.fileSize}>
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            )}

            {progressStatus && (
              <div className={styles.progressBox}>
                <div className={styles.spinner} />
                <span>{progressStatus}</span>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={() => void handleUploadAndExtract()}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <div className={styles.spinner} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Parse &amp; Generate Blueprint</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
