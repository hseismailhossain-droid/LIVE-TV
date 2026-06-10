import React, { useState, useRef } from 'react';
import { Channel } from '../types';
import { parseM3U, IPTV_COUNTRIES_DIRECTORY } from '../utils/m3uParser';
import { Globe, Upload, HelpCircle, Loader2, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface IPTVLoaderProps {
  onImported: (channels: Channel[], sourceName: string) => void;
}

export default function IPTVLoader({ onImported }: IPTVLoaderProps) {
  const [selectedCountryCode, setSelectedCountryCode] = useState('US');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from Public iptv-org list
  const handleLoadCountry = async () => {
    const country = IPTV_COUNTRIES_DIRECTORY.find(c => c.code === selectedCountryCode);
    if (!country) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const playlistUrl = `https://iptv-org.github.io/iptv/countries/${selectedCountryCode.toLowerCase()}.m3u`;

    try {
      const response = await fetch(playlistUrl);
      if (!response.ok) {
        throw new Error(`সার্ভার থেকে প্লেলিস্ট ডাউনলোড করা যায়নি (Status: ${response.status})`);
      }
      
      const text = await response.text();
      const parsedChannels = parseM3U(text, selectedCountryCode);
      
      if (parsedChannels.length === 0) {
        throw new Error('প্লেলিস্টটিতে কোনো সক্রিয় চ্যানেলের লিঙ্ক খুঁজে পাওয়া যায়নি।');
      }

      onImported(parsedChannels, country.banglaName);
      setSuccess(`সফলভাবে ${country.banglaName} দেশের ${parsedChannels.length}টি লাইভ চ্যানেল তালিকাভূক্ত হয়েছে!`);
      
      // Auto-clear message in 4s
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
      setError(`চ্যানেল লোড করতে সমস্যা হয়েছে: ${err.message || 'নেটওয়ার্ক বা ক্যাশিং সমস্যা'}`);
    } finally {
      setLoading(false);
    }
  };

  // Parse files manually
  const parseFile = (file: File) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error('ফাইলটি খালি বা পড়া যায়নি।');
        }
        
        const parsed = parseM3U(text, 'UPLOADED');
        if (parsed.length === 0) {
          throw new Error('ফাইলটি সঠিক .m3u ফরম্যাটের নয় অথবা এতে কোনো চ্যানেল স্ট্রিম নেই।');
        }

        onImported(parsed, file.name.replace('.m3u', ''));
        setSuccess(`সফলভাবে আপনার ফাইল থেকে ${parsed.length}টি লাইভ চ্যালেন ইমপোর্ট করা হয়েছে!`);
        setTimeout(() => setSuccess(null), 5000);
      } catch (err: any) {
        setError(err.message || 'ফাইলটি প্রসেস করতে ব্যর্থ হয়েছে।');
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('ফাইলটি পড়তে সমস্যা হচ্ছে।');
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  // Drag-and-drop mechanics
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0e0e1c]/80 p-5 rounded-2xl border border-[#00e5ff]/20">
      
      {/* Box A: Country Downloader */}
      <div className="flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Globe className="w-4 h-4 text-[#00e5ff]" />
            <span>বিশ্বের দেশ অনুযায়ী চ্যানেল লোড করুন</span>
          </div>
          <p className="text-[#99aacc] text-xs mt-1 leading-relaxed">
            মেম্বার প্রোভাইডার ক্লাউড থেকে বিশ্বের যেকোনো দেশের হাজার হাজার ফ্রি এবং পাবলিক সম্প্রচার চ্যানেল এক ক্লিকে লোড করুন।
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedCountryCode}
            onChange={(e) => setSelectedCountryCode(e.target.value)}
            disabled={loading}
            className="flex-1 bg-[#111122] border border-[#00e5ff]/20 text-white focus:border-[#00e5ff] rounded-xl px-2.5 py-2 text-sm focus:outline-none transition-colors"
          >
            {IPTV_COUNTRIES_DIRECTORY.map((ct) => (
              <option key={ct.code} value={ct.code} className="bg-[#111122]">
                {ct.flag} {ct.banglaName} ({ct.name})
              </option>
            ))}
          </select>

          <button
            onClick={handleLoadCountry}
            disabled={loading}
            className="px-4 py-2 bg-[#00e5ff] hover:bg-[#00e5ff]/85 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold text-xs md:text-sm rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : (
              'চ্যানেল আনুন'
            )}
          </button>
        </div>
      </div>

      {/* Box B: File Upload */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          dragging 
            ? 'border-[#00e5ff] bg-[#00e5ff]/10' 
            : 'border-[#00e5ff]/20 bg-[#111122] hover:bg-[#111122]/90 hover:border-[#00e5ff]/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".m3u,.m3u8,.txt"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="w-10 h-10 rounded-full bg-[#06060f] border border-[#00e5ff]/20 flex items-center justify-center text-[#99aacc] mb-2">
          <Upload className="w-5 h-5 text-[#00e5ff]" />
        </div>
        
        <p className="text-white text-xs font-semibold">
          আপনার নিজের .M3U ফাইল এখানে ড্রপ বা ব্রাউজ করুন
        </p>
        <p className="text-[#99aacc] text-[10px] mt-0.5">
          Drag & drop your IPTV playlist or custom TV catalog file
        </p>
      </div>

      {/* Message Output Bar (Full-Width) */}
      {(error || success) && (
        <div className="col-span-1 md:col-span-2 pt-1">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#ff2d78]/10 text-[#ff2d78] text-xs border border-[#ff2d78]/30">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#00e5ff]/10 text-[#00e5ff] text-xs border border-[#00e5ff]/30">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
