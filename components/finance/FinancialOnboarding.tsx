"use client";

import { useState } from 'react';
import FileUploadZone from './FileUploadZone';

interface UploadedFileStatus {
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  accountsDetected?: number;
  transactionsExtracted?: number;
  duplicatesSkipped?: number;
  error?: string;
}

export default function FinancialOnboarding() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    // Add files to upload queue
    const newFiles: UploadedFileStatus[] = files.map(file => ({
      file,
      status: 'uploading',
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsUploading(true);

    // Upload files one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileIndex = uploadedFiles.length + i;

      try {
        // Update status to uploading
        setUploadedFiles(prev => {
          const updated = [...prev];
          updated[fileIndex] = { ...updated[fileIndex], status: 'uploading', progress: 0 };
          return updated;
        });

        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Upload file
        const response = await fetch('/api/finance/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          // Check if it's an authentication error
          if (response.status === 401) {
            throw new Error('Please log in to upload files');
          }

          // Try to get error message from response
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          } catch {
            throw new Error(`Upload failed (${response.status})`);
          }
        }

        const result = await response.json();

        // Update status to completed
        setUploadedFiles(prev => {
          const updated = [...prev];
          updated[fileIndex] = {
            ...updated[fileIndex],
            status: 'completed',
            progress: 100,
            accountsDetected: result.accountsDetected,
            transactionsExtracted: result.transactionsExtracted,
            duplicatesSkipped: result.duplicatesSkipped,
          };
          return updated;
        });
      } catch (error) {
        // Update status to error
        setUploadedFiles(prev => {
          const updated = [...prev];
          updated[fileIndex] = {
            ...updated[fileIndex],
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          };
          return updated;
        });
      }
    }

    setIsUploading(false);
  };

  const handleGetStarted = () => {
    // Navigate to finances page (will show dashboard since user now has data)
    window.location.href = '/finances';
  };

  const allCompleted = uploadedFiles.length > 0 && uploadedFiles.every(f => f.status === 'completed');
  const hasAnyData = uploadedFiles.some(f => f.status === 'completed');

  return (
    <div className="financial-onboarding">
      <div className="onboarding-container">
        {/* Header */}
        <div className="onboarding-header">
          <div className="onboarding-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h1 className="onboarding-title">Build Your Financial Profile</h1>
          <p className="onboarding-subtitle">
            Upload your bank statements, credit card statements, or investment account exports.
            We'll automatically extract and organize your financial data.
          </p>
        </div>

        {/* Upload Zone */}
        {uploadedFiles.length === 0 && (
          <FileUploadZone
            onFilesSelected={handleFilesSelected}
            disabled={isUploading}
          />
        )}

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files">
            <h3 className="uploaded-files-title">Uploaded Files</h3>
            <div className="uploaded-files-list">
              {uploadedFiles.map((fileStatus, index) => (
                <div key={index} className={`uploaded-file uploaded-file--${fileStatus.status}`}>
                  <div className="uploaded-file-icon">
                    {fileStatus.status === 'uploading' && (
                      <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    )}
                    {fileStatus.status === 'processing' && (
                      <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    )}
                    {fileStatus.status === 'completed' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )}
                    {fileStatus.status === 'error' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    )}
                  </div>

                  <div className="uploaded-file-info">
                    <div className="uploaded-file-name">{fileStatus.file.name}</div>
                    <div className="uploaded-file-details">
                      {fileStatus.status === 'uploading' && 'Uploading...'}
                      {fileStatus.status === 'processing' && 'Processing...'}
                      {fileStatus.status === 'completed' && (
                        <span>
                          {fileStatus.accountsDetected} account{fileStatus.accountsDetected !== 1 ? 's' : ''}, {' '}
                          {fileStatus.transactionsExtracted} transaction{fileStatus.transactionsExtracted !== 1 ? 's' : ''}
                          {fileStatus.duplicatesSkipped! > 0 && ` (${fileStatus.duplicatesSkipped} duplicate${fileStatus.duplicatesSkipped !== 1 ? 's' : ''} skipped)`}
                        </span>
                      )}
                      {fileStatus.status === 'error' && (
                        <span className="error-text">{fileStatus.error}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add More Files Button */}
            {!isUploading && (
              <div className="add-more-files">
                <FileUploadZone
                  onFilesSelected={handleFilesSelected}
                  disabled={isUploading}
                />
              </div>
            )}
          </div>
        )}

        {/* Manual Entry Option */}
        <div className="manual-entry-option">
          <p className="manual-entry-text">
            Don't have files to upload?
          </p>
          <button className="btn btn--ghost" onClick={() => window.location.href = '/finances?manual=true'}>
            Enter data manually
          </button>
        </div>

        {/* Get Started Button */}
        {hasAnyData && (
          <div className="onboarding-actions">
            <button
              className="btn btn--primary btn--lg"
              onClick={handleGetStarted}
              disabled={isUploading}
            >
              {allCompleted ? 'View My Dashboard' : 'Continue to Dashboard'}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .financial-onboarding {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
        }

        .onboarding-container {
          max-width: 800px;
          width: 100%;
        }

        .onboarding-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .onboarding-icon {
          margin-bottom: 24px;
          color: #34C759;
        }

        .onboarding-icon svg {
          margin: 0 auto;
        }

        .onboarding-title {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 12px;
          color: rgba(255, 255, 255, 0.95);
        }

        .onboarding-subtitle {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .uploaded-files {
          margin-top: 32px;
        }

        .uploaded-files-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: rgba(255, 255, 255, 0.9);
        }

        .uploaded-files-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .uploaded-file {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .uploaded-file--completed {
          border-color: rgba(52, 199, 89, 0.3);
          background: rgba(52, 199, 89, 0.05);
        }

        .uploaded-file--error {
          border-color: rgba(255, 59, 48, 0.3);
          background: rgba(255, 59, 48, 0.05);
        }

        .uploaded-file-icon {
          flex-shrink: 0;
        }

        .uploaded-file--uploading .uploaded-file-icon,
        .uploaded-file--processing .uploaded-file-icon {
          color: #007AFF;
        }

        .uploaded-file--completed .uploaded-file-icon {
          color: #34C759;
        }

        .uploaded-file--error .uploaded-file-icon {
          color: #FF3B30;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .uploaded-file-info {
          flex: 1;
          min-width: 0;
        }

        .uploaded-file-name {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .uploaded-file-details {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }

        .error-text {
          color: #FF3B30;
        }

        .add-more-files {
          margin-top: 24px;
        }

        .manual-entry-option {
          margin-top: 32px;
          text-align: center;
          padding: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .manual-entry-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 12px;
        }

        .onboarding-actions {
          margin-top: 32px;
          text-align: center;
        }

        .btn--lg {
          padding: 16px 48px;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}
