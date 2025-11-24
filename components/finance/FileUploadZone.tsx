"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadZoneProps {
    onFilesSelected: (files: File[]) => void;
    maxFiles?: number;
    maxSize?: number; // in bytes
    acceptedFileTypes?: string[];
    disabled?: boolean;
}

export default function FileUploadZone({
    onFilesSelected,
    maxFiles = 10,
    maxSize = 10 * 1024 * 1024, // 10MB default
    acceptedFileTypes = ['.pdf', '.csv'],
    disabled = false,
}: FileUploadZoneProps) {
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        setError(null);

        if (rejectedFiles.length > 0) {
            const rejection = rejectedFiles[0];
            if (rejection.errors[0]?.code === 'file-too-large') {
                setError(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
            } else if (rejection.errors[0]?.code === 'file-invalid-type') {
                setError(`Invalid file type. Only ${acceptedFileTypes.join(', ')} files are supported.`);
            } else {
                setError('File upload failed. Please try again.');
            }
            return;
        }

        if (acceptedFiles.length > 0) {
            onFilesSelected(acceptedFiles);
        }
    }, [onFilesSelected, maxSize, acceptedFileTypes]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedFileTypes.reduce((acc, type) => {
            if (type === '.pdf') acc['application/pdf'] = ['.pdf'];
            if (type === '.csv') acc['text/csv'] = ['.csv'];
            return acc;
        }, {} as Record<string, string[]>),
        maxFiles,
        maxSize,
        disabled,
    });

    return (
        <div className="file-upload-zone">
            <div
                {...getRootProps()}
                className={`file-upload-dropzone ${isDragActive ? 'file-upload-dropzone--active' : ''} ${disabled ? 'file-upload-dropzone--disabled' : ''}`}
            >
                <input {...getInputProps()} />

                <div className="file-upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                </div>

                <div className="file-upload-content">
                    {isDragActive ? (
                        <p className="file-upload-text file-upload-text--active">
                            Drop your files here...
                        </p>
                    ) : (
                        <>
                            <p className="file-upload-text">
                                <strong>Drag and drop</strong> your financial files here
                            </p>
                            <p className="file-upload-subtext">
                                or click to browse
                            </p>
                        </>
                    )}
                </div>

                <div className="file-upload-info">
                    <span className="file-upload-badge">PDF</span>
                    <span className="file-upload-badge">CSV</span>
                    <span className="file-upload-limit">Max {maxSize / (1024 * 1024)}MB per file</span>
                </div>
            </div>

            {error && (
                <div className="file-upload-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <style jsx>{`
        .file-upload-zone {
          width: 100%;
        }

        .file-upload-dropzone {
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.02);
        }

        .file-upload-dropzone:hover:not(.file-upload-dropzone--disabled) {
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.04);
        }

        .file-upload-dropzone--active {
          border-color: #34C759;
          background: rgba(52, 199, 89, 0.1);
        }

        .file-upload-dropzone--disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .file-upload-icon {
          margin-bottom: 16px;
          color: rgba(255, 255, 255, 0.6);
        }

        .file-upload-icon svg {
          margin: 0 auto;
        }

        .file-upload-content {
          margin-bottom: 24px;
        }

        .file-upload-text {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 8px;
        }

        .file-upload-text--active {
          color: #34C759;
        }

        .file-upload-subtext {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }

        .file-upload-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .file-upload-badge {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        .file-upload-limit {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .file-upload-error {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding: 12px;
          background: rgba(255, 59, 48, 0.1);
          border: 1px solid rgba(255, 59, 48, 0.3);
          border-radius: 8px;
          color: #ff3b30;
          font-size: 14px;
        }
      `}</style>
        </div>
    );
}
