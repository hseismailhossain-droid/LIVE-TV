import React, { useState } from 'react';
import { Channel } from '../types';
import { CURATED_CATEGORIES, PRESET_COUNTRIES } from '../data/channels';
import { X, Plus, Info } from 'lucide-react';

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (channel: Channel) => void;
}

export default function AddChannelModal({ isOpen, onClose, onAdd }: AddChannelModalProps) {
  const [name, setName] = useState('');
  const [banglaName, setBanglaName] = useState('');
  const [logo, setLogo] = useState('');
  const [category, setCategory] = useState('entertainment');
  const [country, setCountry] = useState('BD');
  const [language, setLanguage] = useState('Bangla');
  const [streamUrl, setStreamUrl] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !streamUrl) return;

    // Detect type
    let type: 'hls' | 'youtube' | 'iframe' = 'hls';
    if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')) {
      type = 'youtube';
      // Normalize if standard watch link to embed format
      if (streamUrl.includes('watch?v=')) {
        const id = streamUrl.split('watch?v=')[1]?.split('&')[0];
        if (id) {
          // Check if it's a live stream channel or exact video id
          setStreamUrl(`https://www.youtube.com/embed/${id}?autoplay=1&mute=1`);
        }
      }
    }

    const newChannel: Channel = {
      id: `custom-${Date.now()}`,
      name,
      banglaName: banglaName || undefined,
      logo: logo || 'https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=120&auto=format&fit=crop&q=60',
      category,
      country,
      language: language || 'Bangla',
      streamUrl,
      type,
      description: description || 'ব্যবহারকারী দ্বারা যুক্ত করা কাস্টম চ্যানেল।',
      isCustom: true,
    };

    onAdd(newChannel);
    
    // Reset form
    setName('');
    setBanglaName('');
    setLogo('');
    setCategory('entertainment');
    setCountry('BD');
    setLanguage('Bangla');
    setStreamUrl('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              কাস্টম চ্যানেল যুক্ত করুন
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Add a live TV channel from any web source</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-lg text-xs text-emerald-400 leading-relaxed flex gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              আপনি যেকোনো লাইভ টিভি স্ট্রিম লিঙ্ক (<strong>.m3u8</strong>) অথবা ইউটিউব চ্যানেলের ভিডিও লিঙ্ক ব্রাউজার থেকে কপি করে এখানে সরাসরি পেস্ট করতে পারেন।
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                চ্যানেলের ইংরেজি নাম <span className="text-emerald-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Channel 9 Live"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                বাংলা নাম (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="যেমন: চ্যানেল ৯ বাংলা"
                value={banglaName}
                onChange={(e) => setBanglaName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              স্ট্রিমিং ইউআরএল (Stream URL) <span className="text-emerald-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://example.com/live/stream.m3u8"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm font-mono text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              চ্যানেলের লোগো ইউআরএল (Logo Image URL)
            </label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm font-mono text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                ক্যাটাগরি
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-2 py-2 text-sm text-zinc-200 focus:outline-none transition-colors"
              >
                {CURATED_CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'favorites').map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.banglaName} ({cat.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                দেশ / অঞ্চল
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-2 py-2 text-sm text-zinc-200 focus:outline-none"
              >
                {PRESET_COUNTRIES.map((ct) => (
                  <option key={ct.code} value={ct.code}>
                    {ct.flag} {ct.banglaName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                ভাষা (Language)
              </label>
              <input
                type="text"
                placeholder="যেমন: Bangla, English, Arabic"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                বিবরণ বা ডেসক্রিপশন
              </label>
              <input
                type="text"
                placeholder="যেমন: ২৪ ঘণ্টার লাইভ বাংলা খবর"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-3 bg-zinc-900/50 -mx-6 -mb-6 p-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-805 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg text-xs font-semibold shadow-md active:scale-95 transition-all"
            >
              যোগ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
