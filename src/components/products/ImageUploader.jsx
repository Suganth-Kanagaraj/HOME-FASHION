import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ImageUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Product"
            className="w-32 h-32 object-cover rounded-xl border border-slate-200 shadow-sm"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow hover:bg-rose-600"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl hover:border-[#d4a574] hover:bg-amber-50 transition-all cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-[#d4a574] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs text-slate-400 text-center px-2">Click to upload</span>
            </>
          )}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">or paste URL:</span>
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://..."
          className="h-7 text-xs"
        />
      </div>
    </div>
  );
}