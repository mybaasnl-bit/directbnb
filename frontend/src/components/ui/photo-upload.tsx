'use client';

import { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { api } from '@/lib/api';
import { Upload, X, Loader2, ImagePlus, AlertCircle } from 'lucide-react';

interface UploadedPhoto {
  id: string;
  url: string;
  isCover: boolean;
}

interface PhotoUploadProps {
  /** Existing photos already saved to the property */
  photos: UploadedPhoto[];
  /** Called after successful upload; passes back the Cloudinary URL */
  onUpload: (url: string) => Promise<void>;
  /** Called when user clicks delete on a photo */
  onDelete: (photoId: string) => void;
  /** Whether upload is available (CLOUDINARY_CLOUD_NAME etc set) */
  uploadEnabled?: boolean;
  /** Show while a delete is pending (photoId being deleted) */
  deletingId?: string | null;
}

interface PendingFile {
  file: File;
  preview: string;
  status: 'uploading' | 'error';
  error?: string;
}

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const ACCEPTED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/avif': ['.avif'],
};

export function PhotoUpload({
  photos,
  onUpload,
  onDelete,
  uploadEnabled = true,
  deletingId = null,
}: PhotoUploadProps) {
  const [pending, setPending] = useState<PendingFile[]>([]);

  const uploadFile = useCallback(async (file: File) => {
    const preview = URL.createObjectURL(file);

    setPending(prev => [...prev, { file, preview, status: 'uploading' }]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url: string = res.data?.data?.url ?? res.data?.url;
      await onUpload(url);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        'Upload mislukt';
      setPending(prev =>
        prev.map(p =>
          p.preview === preview
            ? { ...p, status: 'error', error: Array.isArray(msg) ? msg[0] : msg }
            : p,
        ),
      );
      return;
    }

    // Remove from pending after success
    setPending(prev => prev.filter(p => p.preview !== preview));
    URL.revokeObjectURL(preview);
  }, [onUpload]);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      rejected.forEach(({ file, errors }) => {
        setPending(prev => [
          ...prev,
          {
            file,
            preview: '',
            status: 'error',
            error: errors[0]?.message ?? 'Ongeldig bestand',
          },
        ]);
      });
      accepted.forEach(uploadFile);
    },
    [uploadFile],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_BYTES,
    disabled: !uploadEnabled,
    multiple: true,
  });

  const removePending = (preview: string) => {
    setPending(prev => {
      const entry = prev.find(p => p.preview === preview);
      if (entry?.preview) URL.revokeObjectURL(entry.preview);
      return prev.filter(p => p.preview !== preview);
    });
  };

  return (
    <div className="space-y-4">
      {/* Photo grid */}
      {(photos.length > 0 || pending.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {/* Saved photos */}
          {photos.map(photo => (
            <div
              key={photo.id}
              className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
            >
              <img
                src={photo.url}
                alt=""
                className="w-full h-full object-cover"
              />
              {photo.isCover && (
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => onDelete(photo.id)}
                disabled={deletingId === photo.id}
                className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
              >
                {deletingId === photo.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </button>
            </div>
          ))}

          {/* Pending uploads */}
          {pending.map(p => (
            <div
              key={p.preview}
              className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
            >
              {p.preview ? (
                <img src={p.preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-red-50">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
              )}

              {/* Uploading overlay */}
              {p.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}

              {/* Error overlay */}
              {p.status === 'error' && (
                <div className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center p-2">
                  <AlertCircle className="w-5 h-5 text-white mb-1" />
                  <p className="text-white text-[10px] text-center leading-tight line-clamp-2">
                    {p.error}
                  </p>
                  <button
                    type="button"
                    onClick={() => removePending(p.preview)}
                    className="mt-1.5 text-white/80 hover:text-white text-[10px] underline"
                  >
                    Verwijderen
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {uploadEnabled ? (
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragReject
              ? 'border-red-400 bg-red-50'
              : isDragActive
              ? 'border-brand bg-brand-light'
              : 'border-slate-300 hover:border-brand hover:bg-brand-light/40'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isDragActive ? 'bg-brand-light' : 'bg-slate-100'
            }`}>
              {isDragActive
                ? <Upload className="w-5 h-5 text-brand" />
                : <ImagePlus className="w-5 h-5 text-slate-500" />
              }
            </div>
            {isDragReject ? (
              <p className="text-sm font-medium text-red-600">Bestandstype niet ondersteund</p>
            ) : isDragActive ? (
              <p className="text-sm font-medium text-brand-600">Laat los om te uploaden</p>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-700">
                  Sleep foto&apos;s hiernaartoe,{' '}
                  <span className="text-brand">of klik om te kiezen</span>
                </p>
                <p className="text-xs text-slate-400">
                  JPG, PNG, WEBP, GIF · max 8 MB per foto
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50">
          <ImagePlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-medium">Upload niet beschikbaar</p>
          <p className="text-xs text-slate-400 mt-1">
            Stel <code className="bg-slate-200 px-1 rounded">CLOUDINARY_*</code> in de backend{' '}
            <code className="bg-slate-200 px-1 rounded">.env</code> in om uploads in te schakelen.
          </p>
        </div>
      )}
    </div>
  );
}
