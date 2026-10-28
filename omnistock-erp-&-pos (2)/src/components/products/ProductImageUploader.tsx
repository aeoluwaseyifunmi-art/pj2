import React, { useState, useRef } from 'react';
import { Image, Upload, Link, X, Sparkles, Check } from 'lucide-react';

export const CURATED_PRODUCT_PRESETS = [
  { label: 'Specialty Coffee', url: '/src/assets/images/retail_coffee_beans_1793014154529.jpg' },
  { label: 'Organic Olive Oil', url: '/src/assets/images/retail_organic_olive_oil_1793014155756.jpg' },
  { label: 'Tech & Electronics', url: '/src/assets/images/retail_mechanical_keyboard_1793014156131.jpg' },
  { label: 'Artisan Honey', url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80' },
  { label: 'Fresh Bakery', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
  { label: 'Green Tea', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80' },
  { label: 'Organic Produce', url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80' },
  { label: 'Apparel & Goods', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' },
  { label: 'Beverages & Soda', url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80' }
];

interface ProductImageUploaderProps {
  imageUrl: string;
  onChange: (url: string) => void;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  imageUrl,
  onChange
}) => {
  const [mode, setMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [customUrl, setCustomUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }

    // Limit to reasonable size (~3MB) for base64 storage
    if (file.size > 3.5 * 1024 * 1024) {
      alert('Image file is larger than 3.5MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageError(false);
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      setImageError(false);
      onChange(customUrl.trim());
      setCustomUrl('');
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-slate-300 font-semibold block text-xs flex items-center gap-1.5">
          <Image className="w-3.5 h-3.5 text-emerald-400" />
          <span>Product Image</span>
        </label>

        {imageUrl && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setImageError(false);
            }}
            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Remove Image</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        {/* Preview Frame */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center relative group">
          {imageUrl && !imageError ? (
            <>
              <img
                src={imageUrl}
                alt="Product preview"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] transition-opacity cursor-pointer"
              >
                <X className="w-4 h-4 mb-0.5 text-rose-400" />
                <span>Remove</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 text-center p-2">
              <Image className="w-6 h-6 opacity-40 mb-1" />
              <span className="text-[10px] text-slate-500">No Image</span>
            </div>
          )}
        </div>

        {/* Input Methods */}
        <div className="flex-1 space-y-2 w-full">
          {/* Subtabs */}
          <div className="flex items-center gap-1 border-b border-slate-800 pb-1 text-xs">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                mode === 'upload' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3 h-3" />
              <span>Upload File</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('presets')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                mode === 'presets' ? 'bg-slate-800 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Photo Presets</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                mode === 'url' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link className="w-3 h-3" />
              <span>Web URL</span>
            </button>
          </div>

          {/* Upload File Mode */}
          {mode === 'upload' && (
            <div className="space-y-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800/80 border border-dashed border-slate-700 hover:border-emerald-500 rounded-lg text-slate-300 text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Choose photo from computer or phone camera</span>
              </button>
              <p className="text-[10px] text-slate-500">Supports JPG, PNG, WebP up to 3.5MB</p>
            </div>
          )}

          {/* Presets Mode */}
          {mode === 'presets' && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-28 overflow-y-auto pr-1">
                {CURATED_PRODUCT_PRESETS.map((preset) => {
                  const isSelected = imageUrl === preset.url;
                  return (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => {
                        setImageError(false);
                        onChange(preset.url);
                      }}
                      className={`relative rounded-md overflow-hidden aspect-video border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-sm'
                          : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/75 px-1 py-0.5 text-[9px] text-white truncate font-medium">
                        {preset.label}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Web URL Mode */}
          {mode === 'url' && (
            <form onSubmit={handleApplyUrl} className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/product-image.jpg"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded cursor-pointer"
              >
                Apply
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
