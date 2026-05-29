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
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const { toast } = useToast();

  async function handleFile(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await compressImage(file, 200);
      const { url } = await uploadFile(base64, file.name, file.type || 'image/jpeg');
      onChange(url);
      toast('Photo uploaded!', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed — try again', 'error');
    } finally {
      setUploading(false);
    }
  }

  function resetInput(ref: React.RefObject<HTMLInputElement | null>) {
    if (ref.current) ref.current.value = '';
  }

  // Close popup FIRST, then open picker after DOM settles (needed on mobile)
  function openCamera() {
    setShowPicker(false);
    setTimeout(() => { resetInput(cameraRef); cameraRef.current?.click(); }, 80);
  }

  function openGallery() {
    setShowPicker(false);
    setTimeout(() => { resetInput(galleryRef); galleryRef.current?.click(); }, 80);
  }

  return (
    <div>
      <label className="text-sm font-semibold text-gray-700 block mb-1.5">{label}</label>

      {/* Trigger area */}
      <div
        onClick={() => !uploading && setShowPicker(true)}
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer bg-gray-50 active:bg-gray-100 transition-colors"
      >
        {uploading ? (
          <div className="py-6">
            <div className="w-10 h-10 border-3 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderWidth: 3 }} />
            <p className="text-sm font-medium text-gray-600">Uploading photo...</p>
            <p className="text-xs text-gray-400 mt-1">Please wait</p>
          </div>
        ) : value ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Student photo" className="h-40 w-full object-cover rounded-xl" />
            <p className="text-xs text-gray-400 mt-2">Tap to change photo</p>
          </div>
        ) : (
          <div className="py-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 24 24" className="w-8 h-8 fill-red-400">
                <path d="M12 15.2A3.2 3.2 0 0 1 8.8 12 3.2 3.2 0 0 1 12 8.8 3.2 3.2 0 0 1 15.2 12 3.2 3.2 0 0 1 12 15.2M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">Add Photo</p>
            <p className="text-xs text-gray-400 mt-1">Tap to choose or take a photo</p>
          </div>
        )}
      </div>

      {/* Bottom-sheet picker */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowPicker(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full bg-white rounded-t-3xl px-5 pt-3 pb-10 shadow-2xl"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideUp 0.2s ease-out' }}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
            <p className="text-center text-base font-bold text-gray-800 mb-5">Select Photo</p>

            {/* Take Photo */}
            <button
              type="button"
              onClick={openCamera}
              className="w-full flex items-center gap-4 bg-red-50 border border-red-100 rounded-2xl px-4 py-4 mb-3 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-red-800 rounded-xl flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M12 15.2A3.2 3.2 0 0 1 8.8 12 3.2 3.2 0 0 1 12 8.8 3.2 3.2 0 0 1 15.2 12 3.2 3.2 0 0 1 12 15.2M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-800">Take Photo</p>
                <p className="text-xs text-gray-500 mt-0.5">Open camera to capture now</p>
              </div>
            </button>

            {/* Choose from Gallery */}
            <button
              type="button"
              onClick={openGallery}
              className="w-full flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 mb-4 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-800">Choose from Gallery</p>
                <p className="text-xs text-gray-500 mt-0.5">Pick an existing photo</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="w-full py-3 text-sm font-semibold text-gray-500 rounded-2xl bg-gray-100 active:opacity-70"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Camera — with capture for mobile */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          e.target.value = ''; // reset so same file can be picked again
          if (file) handleFile(file);
        }}
      />

      {/* Gallery — no capture so it opens the photo library */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          e.target.value = ''; // reset so same file can be picked again
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
