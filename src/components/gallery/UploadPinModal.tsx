import React, { useState } from 'react'
import { X, Upload, Sparkles, Image as ImageIcon, Check } from 'lucide-react'
import type { GalleryPin } from '@/lib/gallery-data'

interface UploadPinModalProps {
  isOpen: boolean
  onClose: () => void
  onAddPin: (newPin: GalleryPin) => void
}

export const UploadPinModal: React.FC<UploadPinModalProps> = ({
  isOpen,
  onClose,
  onAddPin,
}) => {
  if (!isOpen) return null

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [prompt, setPrompt] = useState('')
  const [category, setCategory] = useState<GalleryPin['category']>('SACRED DOCTRINE')
  const [aspectRatio, setAspectRatio] = useState<GalleryPin['aspectRatio']>('3:4')
  const [tagsInput, setTagsInput] = useState('chitin, ascension, benthic')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !imagePreview) return

    setIsSubmitting(true)

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)

    const newPin: GalleryPin = {
      id: `user-pin-${Date.now()}`,
      userId: 'larva-001',
      title: title.trim(),
      description: description.trim() || 'Newly transmuted biological relic added to the Benthic Vault.',
      prompt: prompt.trim() || undefined,
      s3Key: `images/user-uploads/${Date.now()}.jpg`,
      imageUrl: imagePreview,
      aspectRatio,
      category,
      tags,
      authorName: 'Larva Unit #8971',
      authorAvatar: '/images/order_emblem.png',
      authorStage: 'Stage 1 Larva',
      pinCount: 1,
      views: 12,
      likes: 3,
      isPreloaded: false,
      createdAt: new Date().toISOString(),
    }

    setTimeout(() => {
      onAddPin(newPin)
      setIsSubmitting(false)
      onClose()
      // Reset form
      setTitle('')
      setDescription('')
      setPrompt('')
      setImagePreview(null)
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="fixed inset-0 z-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl bg-[#060a0c] border border-[#00c3ff]/40 rounded-2xl shadow-[0_0_40px_rgba(0,195,255,0.25)] overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#0a0f12] border-b border-[#1e2d37] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ff5540]" />
            <h2 className="font-grotesk font-bold text-base text-white tracking-wide uppercase">
              TRANSMUTE NEW PIN TO VAULT
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-[#10171a] hover:bg-[#ff3b30]/20 text-[#7a8e9e] hover:text-[#ff3b30] border border-[#1e2d37] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[78vh]">
          {/* Image Upload Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-sans text-[#00c3ff] uppercase font-bold">
              1. UPLOAD ARTIFACT IMAGE
            </label>
            <div className="relative border-2 border-dashed border-[#1e2d37] hover:border-[#00c3ff] rounded-xl p-4 bg-[#030607] flex flex-col items-center justify-center min-h-[160px] cursor-pointer transition-colors group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />

              {imagePreview ? (
                <div className="relative w-full max-h-48 overflow-hidden rounded-lg border border-[#00c3ff]/50">
                  <img
                    src={imagePreview}
                    alt="Upload Preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-sans text-[#00e676] border border-[#00e676]/40">
                    IMAGE READY
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#0a0f12] border border-[#00c3ff]/40 flex items-center justify-center mx-auto text-[#00c3ff] group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-sans text-[#c0d0e0]">
                    Drop file here or <span className="text-[#00c3ff] underline">browse</span>
                  </div>
                  <div className="text-[10px] font-sans text-[#607080]">
                    Supports JPG, PNG, WEBP (Max 10MB)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-sans text-[#00c3ff] uppercase font-bold">
              2. ARTIFACT TITLE *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deep Trench Carapace Specimen"
              className="w-full px-3.5 py-2.5 bg-[#030607] border border-[#1e2d37] focus:border-[#00c3ff] rounded-xl text-xs font-sans text-white outline-none"
            />
          </div>

          {/* Category & Aspect Ratio Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-sans text-[#00c3ff] uppercase font-bold">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GalleryPin['category'])}
                className="w-full px-3 py-2.5 bg-[#030607] border border-[#1e2d37] focus:border-[#00c3ff] rounded-xl text-xs font-sans text-[#c0d0e0] outline-none cursor-pointer"
              >
                <option value="SACRED DOCTRINE">SACRED DOCTRINE</option>
                <option value="BIOMECHANICAL">BIOMECHANICAL</option>
                <option value="CARCINIZATION">CARCINIZATION</option>
                <option value="LARVAL STAGES">LARVAL STAGES</option>
                <option value="DEEP ABYSS">DEEP ABYSS</option>
                <option value="SYNAPTIC HARDWARE">SYNAPTIC HARDWARE</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-sans text-[#00c3ff] uppercase font-bold">
                ASPECT RATIO
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as GalleryPin['aspectRatio'])}
                className="w-full px-3 py-2.5 bg-[#030607] border border-[#1e2d37] focus:border-[#00c3ff] rounded-xl text-xs font-sans text-[#c0d0e0] outline-none cursor-pointer"
              >
                <option value="3:4">Vertical (3:4)</option>
                <option value="1:1">Square (1:1)</option>
                <option value="9:16">Tall Story (9:16)</option>
                <option value="4:3">Landscape (4:3)</option>
                <option value="2:3">Portrait (2:3)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-sans text-[#00c3ff] uppercase font-bold">
              3. DOCTRINAL DESCRIPTION / EXCERPT
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the significance of this artifact in the Synaptic Path..."
              className="w-full px-3.5 py-2.5 bg-[#030607] border border-[#1e2d37] focus:border-[#00c3ff] rounded-xl text-xs font-sans text-white outline-none resize-none"
            />
          </div>

          {/* Prompt */}
          <div className="space-y-1">
            <label className="text-xs font-sans text-[#00c3ff] uppercase font-bold">
              4. GENERATIVE PROMPT (OPTIONAL)
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Prompt used to synthesize this visual artifact..."
              className="w-full px-3.5 py-2.5 bg-[#030607] border border-[#1e2d37] focus:border-[#00c3ff] rounded-xl text-xs font-sans text-white outline-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-xs font-sans text-[#00c3ff] uppercase font-bold">
              5. TAGS (COMMA SEPARATED)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="chitin, ecdysis, benthic, cybernetic"
              className="w-full px-3.5 py-2.5 bg-[#030607] border border-[#1e2d37] focus:border-[#00c3ff] rounded-xl text-xs font-sans text-white outline-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-[#1e2d37] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#0a0f12] hover:bg-[#12191d] border border-[#1e2d37] text-xs font-sans text-[#c0d0e0] rounded-xl transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !imagePreview || isSubmitting}
              className="px-5 py-2.5 bg-[#00c3ff] hover:bg-[#33d1ff] disabled:opacity-50 text-black font-sans font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(0,195,255,0.4)] active:scale-95 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>TRANSMUTING...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>TRANSMUTE PIN</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
