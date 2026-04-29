'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, ImageIcon, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import AvatarCropModal from '@/components/avatar-crop-modal';
import UserAvatar from '@/components/user-avatar';
import { useApp } from '@/lib/app-context';

interface ProfilePictureUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ALLOWED_EXTENSIONS = 'PNG, JPEG, WebP';

export default function ProfilePictureUpload({ isOpen, onClose }: ProfilePictureUploadProps) {
  const { currentUser, updateProfile } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setShowCrop(false);
    setUploading(false);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
    setDragOver(false);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file format. Please use ${ALLOWED_EXTENSIONS}.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setSuccess(false);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setShowCrop(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleCrop = async (croppedBlob: Blob) => {
    setShowCrop(false);
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Upload with progress tracking via XMLHttpRequest
      const formData = new FormData();
      formData.append('file', croppedBlob, 'avatar.webp');

      const url = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload/avatar');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.url) resolve(data.url);
              else reject(new Error(data.error || 'Upload failed'));
            } catch {
              reject(new Error('Invalid server response'));
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error || `Upload failed (${xhr.status})`));
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error. Please check your connection.'));
        xhr.ontimeout = () => reject(new Error('Upload timed out. Please try again.'));
        xhr.timeout = 60000; // 60s timeout

        xhr.send(formData);
      });

      // Update profile with new avatar URL
      await updateProfile({ avatar: url });
      setUploadProgress(100);
      setSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await updateProfile({ avatar: '' });
      setSuccess(true);
      setTimeout(handleClose, 1000);
    } catch {
      setError('Failed to remove avatar.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-card border border-border/50 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/30">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-bold font-syne">Profile Picture</h3>
            </div>
            <button onClick={handleClose} className="p-1.5 hover:bg-background/50 rounded-lg smooth-transition" aria-label="Close">
              <X className="w-5 h-5 text-foreground/60" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Current avatar preview */}
            <div className="flex items-center gap-5">
              <UserAvatar
                userId={currentUser?.id}
                displayName={currentUser?.displayName || 'U'}
                avatarUrl={currentUser?.avatar}
                size="lg"
                showGlow
              />
              <div>
                <p className="font-semibold text-foreground">{currentUser?.displayName}</p>
                <p className="text-sm text-foreground/50">@{currentUser?.username}</p>
              </div>
            </div>

            {/* Drag & Drop zone */}
            {!uploading && !success && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer smooth-transition
                  ${dragOver
                    ? 'border-accent bg-accent/10'
                    : 'border-border/40 hover:border-accent/50 hover:bg-accent/5'
                  }`}
              >
                <Upload className={`w-8 h-8 ${dragOver ? 'text-accent' : 'text-foreground/30'} smooth-transition`} />
                <div className="text-center">
                  <p className="font-semibold text-sm text-foreground/80">
                    {dragOver ? 'Drop your image here' : 'Click or drag & drop'}
                  </p>
                  <p className="text-xs text-foreground/40 mt-1">
                    Max 10MB · {ALLOWED_EXTENSIONS} · 1:1 square recommended
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_TYPES.join(',')}
                  onChange={handleInputChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Upload progress */}
            {uploading && !success && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/70">Uploading...</span>
                  <span className="font-mono text-accent">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-background/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full smooth-transition"
                    style={{ width: `${uploadProgress}%`, transition: 'width 0.3s ease' }}
                  />
                </div>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-300 font-medium">Profile picture updated successfully!</p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Remove avatar button */}
            {currentUser?.avatar && !uploading && !success && (
              <button
                onClick={handleRemoveAvatar}
                className="text-sm text-foreground/40 hover:text-red-400 smooth-transition"
              >
                Remove current photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Crop modal (overlays the upload modal) */}
      {showCrop && selectedFile && (
        <AvatarCropModal
          imageFile={selectedFile}
          onCrop={handleCrop}
          onCancel={() => {
            setShowCrop(false);
            setSelectedFile(null);
          }}
        />
      )}
    </>
  );
}
