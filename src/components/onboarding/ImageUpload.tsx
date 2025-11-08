'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  label: string;
  currentUrl?: string | null;
  onUpload: (file: File) => Promise<string | null>;
  accept?: string;
  maxSizeMB?: number;
}

export default function ImageUpload({
  label,
  currentUrl,
  onUpload,
  accept = 'image/*',
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setError(null);
    setUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const url = await onUpload(file);
      if (url) {
        setPreview(url);
      } else {
        setError('Upload failed. Please check the error message above and try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image. Please try again.';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-300">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : preview ? 'Change Image' : 'Upload Image'}
          </button>
          {error && (
            <p className="mt-1 text-xs text-red-600">{error}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Max size: {maxSizeMB}MB
          </p>
        </div>
      </div>
    </div>
  );
}

