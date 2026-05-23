'use client';
import { useRef, useState } from 'react';
import { compressImage } from '@/lib/utils';
import { uploadFile } from '@/lib/api';
import { useToast } from './ToastContext';

interface Props {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = 'Photo' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const base64 = await compressImage(file, 200);
      const { url } = await uploadFile(base64, file.name, file.type);
      onChange(url);
      toast('Photo uploaded!', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer bg-gray-50 active:bg-gray-100 transition-colors"
      >
        {uploading ? (
          <div className="py-4">
            <div className="w-8 h-8 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Uploading...</p>
          </div>
        ) : value ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Uploaded" className="h-32 w-full object-cover rounded-lg" />
            <p className="text-xs text-gray-500 mt-2">Tap to change</p>
          </div>
        ) : (
          <div className="py-4">
            <div className="text-3xl mb-2">📷</div>
            <p className="text-sm font-medium text-gray-600">Tap to take photo</p>
            <p className="text-xs text-gray-400 mt-1">or upload from gallery</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
