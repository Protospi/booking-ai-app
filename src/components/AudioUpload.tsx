import React, { useState } from 'react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

interface AudioUploadProps {
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: Error) => void;
}

export default function AudioUpload({ onUploadSuccess, onUploadError }: AudioUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    const fileName = `audio-${Date.now()}-${file.name}`;
    const params = {
      Bucket: "my-app-audio-files",
      Key: fileName,
      Body: file,
      ContentType: file.type,
    };

    try {
      setIsUploading(true);
      await s3.send(new PutObjectCommand(params));
      const url = `https://my-app-audio-files.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileName}`;
      onUploadSuccess(url);
    } catch (err) {
      onUploadError(err as Error);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      uploadFile(selectedFile);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileInput}
          ref={fileInputRef}
          className="hidden"
        />
        <button
          type="button"
          onClick={triggerFileInput}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
        {selectedFile && (
          <button
            type="submit"
            disabled={isUploading}
            className="px-4 py-2 rounded-lg bg-[#6467F2] hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <div className="flex gap-2">
                <div className="animate-bounce">●</div>
                <div className="animate-bounce delay-100">●</div>
                <div className="animate-bounce delay-200">●</div>
              </div>
            ) : (
              'Upload Audio'
            )}
          </button>
        )}
      </form>
      {selectedFile && (
        <span className="text-sm text-zinc-400">
          {selectedFile.name}
        </span>
      )}
    </div>
  );
} 