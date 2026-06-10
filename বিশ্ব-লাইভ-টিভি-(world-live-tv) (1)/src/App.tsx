import React, { useState, useEffect, useMemo } from 'react';
import { CURATED_CATEGORIES, PRESET_COUNTRIES, CURATED_CHANNELS } from './data/channels';
import { Channel } from './types';
import VideoPlayer from './components/VideoPlayer';
import AddChannelModal from './components/AddChannelModal';
import IPTVLoader from './components/IPTVLoader';
import { 
  Tv, 
  Search, 
  PlusCircle, 
  Heart, 
  Sparkles, 
  Trash2, 
  Globe2, 
  Radio, 
  Film, 
  Trophy, 
  Moon, 
  Music, 
  Smile, 
  HelpCircle,
  Settings,
  Flame,
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // 1. Core States
  const [channels, setChannels] = useState<Channel[]>(() => {
    const savedCustom = localStorage.getItem('customChannels');
    const custom = savedCustom ? JSON.parse(savedCustom) : [];
    return [...CURATED_CHANNELS, ...custom];
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const savedFav = localStorage.getItem('favoriteChannels');
    return savedFav ? JSON.parse(savedFav) : [];
  });

  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(() => {
    // Autoselect first channel (Somoy TV) on mount if available
    return CURATED_CHANNELS[0] || null;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setVisibleCount(100);
  }, [selectedCategory, selectedCountry, searchQuery]);

  // 2. Synchronize states with LocalStorage
  const handleAddChannel = (newChannel: Channel) => {
    setChannels(prev => [newChannel, ...prev]);

    const savedCustom = localStorage.getItem('customChannels');
    const customList = savedCustom ? JSON.parse(savedCustom) : [];
    localStorage.setItem('customChannels', JSON.stringify([newChannel, ...customList]));
    
    // Auto-select to play
    setSelectedChannel(newChannel);
  };

  const handleDeleteChannel = (channelId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (selectedChannel?.id === channelId) {
      setSelectedChannel(null);
    }

    setChannels(prev => prev.filter(c => c.id !== channelId));

    const savedCustom = localStorage.getItem('customChannels');
    if (savedCustom) {
      const customList: Channel[] = JSON.parse(savedCustom);
      const filteredCustom = customList.filter(c => c.id !== channelId);
      localStorage.setItem('customChannels', JSON.stringify(filteredCustom));
    }
  };

  const toggleFavorite = (channelId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    let updated: string[];
    if (favorites.includes(channelId)) {
      updated = favorites.filter(id => id !== channelId);
    } else {
      updated = [...favorites, channelId];
    }
    setFavorites(updated);
    localStorage.setItem('favoriteChannels', JSON.stringify(updated));
  };

  const handleImportedChannels = (newChannels: Channel[], sourceName: string) => {
    const existingIds = new Set(channels.map(c => c.id));
    const filtered = newChannels.filter(c => !existingIds.has(c.id));
    
    setChannels(prev => [...prev, ...filtered]);

    const savedCustom = localStorage.getItem('customChannels');
    const customList: Channel[] = savedCustom ? JSON.parse(savedCustom) : [];
    localStorage.setItem('customChannels', JSON.stringify([...filtered, ...customList]));

    if (filtered.length > 0) {
      setSelectedChannel(filtered[0]);
    }
  };

  // 3. Clear all custom playlists & channels reset
  const handleResetCatalog = () => {
    if (window.confirm('আপনি কি সমস্ত কাস্টম ও ইমপোর্ট করা চ্যানেল মুছে ফেলে আদি চ্যানেল তালিকায় ফিরে যেতে চান?')) {
      localStorage.removeItem('customChannels');
      localStorage.removeItem('favoriteChannels');
      setChannels(CURATED_CHANNELS);
      setFavorites([]);
      setSelectedChannel(CURATED_CHANNELS[0] || null);
    }
  };

  // 4. Custom Icon Resolver for Categories
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Tv': return <Tv className="w-4 h-4 shrink-0 text-[#00e5ff]" />;
      case 'Heart': return <Heart className="w-4 h-4 shrink-0 text-[#ff2d78] fill-[#ff2d78]/20" />;
      case 'Radio': return <Radio className="w-4 h-4 shrink-0 text-[#ffd700]" />;
      case 'Film': return <Film className="w-4 h-4 shrink-0 text-indigo-400" />;
      case 'Trophy': return <Trophy className="w-4 h-4 shrink-0 text-[#ffd700]" />;
      case 'MoonPalace': return <Moon className="w-4 h-4 shrink-0 text-teal-400" />;
      case 'Music': return <Music className="w-4 h-4 shrink-0 text-fuchsia-400" />;
      case 'Globe': return <Globe2 className="w-4 h-4 shrink-0 text-[#00e5ff]" />;
      case 'Smile': return <Smile className="w-4 h-4 shrink-0 text-[#ffd700]" />;
      default: return <Tv className="w-4 h-4 shrink-0" />;
    }
  };

  // 5. Computed Filtered Lists
  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      // Filter by category
      if (selectedCategory === 'favorites') {
        if (!favorites.includes(channel.id)) return false;
      } else if (selectedCategory !== 'all') {
        if (channel.category !== selectedCategory) return false;
      }

      // Filter by country
      if (selectedCountry !== 'all') {
        if (channel.country !== selectedCountry) return false;
      }

      // Filter by search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const primaryMatch = channel.name.toLowerCase().includes(query);
        const banglaMatch = channel.banglaName?.toLowerCase().includes(query);
        const langMatch = channel.language.toLowerCase().includes(query);
        const categoryMatch = channel.category.toLowerCase().includes(query);
        
        return primaryMatch || banglaMatch || langMatch || categoryMatch;
      }

      return true;
    });
  }, [channels, favorites, selectedCategory, selectedCountry, searchQuery]);

  return (
    <div className="min-h-screen bg-[#06060f] text-white flex flex-col selection:bg-[#00e5ff] selection:text-[#06060f] antialiased">
      
      {/* Dynamic Header */}
      <header className="border-b border-[#00e5ff]/20 bg-[#06060f]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand / Launcher */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#111122] p-0.5 flex items-center justify-center border-2 border-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.3)] active:scale-95 transition-all overflow-hidden">
              <span className="font-bold text-[#ff2d78] text-[20px] tracking-tight font-sans">I</span>
              <span className="font-bold text-[#00e5ff] text-[18px] tracking-tight font-sans">LZ</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-[20px] tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00e5ff] to-[#ff2d78]">
                  Ismail Learning Zone
                </h1>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ff2d78] animate-blink shrink-0"></span>
              </div>
              <p className="text-[10px] text-[#99aacc] mt-1 uppercase tracking-wider font-mono">
                সমগ্র বিশ্বের সব লাইভ টিভি চ্যানেল এক ক্লিকে
              </p>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setShowLoader(!showLoader)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                showLoader 
                  ? 'bg-[#00e5ff]/10 border-[#00e5ff]/40 text-[#00e5ff]' 
                  : 'bg-[#111122] border-[#00e5ff]/10 text-white hover:border-[#00e5ff]/40'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 text-[#00e5ff]" />
              {showLoader ? 'লোডার বন্ধ করুন' : 'বিশ্বের প্লে-লিস্ট লোড'}
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#00e5ff] to-[#ff2d78] hover:opacity-90 text-[#06060f] text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.2)] active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              চ্যানেল যোগ করুন
            </button>

            <button
              onClick={handleResetCatalog}
              title="কালেকশন রিসেট করুন"
              className="p-2 bg-[#111122] border border-[#00e5ff]/10 hover:border-[#ff2d78]/30 rounded-xl text-white hover:text-[#ff2d78] transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container Dashboard */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-5 space-y-5">
        
        {/* Expanded IPTV Loader Box (AnimatePresence) */}
        <AnimatePresence>
          {showLoader && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <IPTVLoader onImported={handleImportedChannels} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic World Stats Strip (Architectural Honesty) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0e0e1c] border border-[#00e5ff]/10 px-5 py-3 rounded-xl text-xs text-[#99aacc] font-mono">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#00e5ff] animate-ping' : 'bg-[#ff2d78] animate-pulse'}`} />
            <span>
              {isOnline 
                ? 'সিস্টেম লাইভ: সব চ্যানেল সম্প্রচার ও ক্যাটাগরি স্বয়ংক্রিয়ভাবে ক্লাউড থেকে আপডেটকৃত।' 
                : 'অফলাইন মোড অ্যাক্টিভ: আপনি এখন ইন্টারনেট ছাড়াই ১৮০০+ চ্যানেল সার্চ ও ব্রাউজ করছেন।'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>মোট সংরক্ষিত চ্যানেল: <strong className="text-[#00e5ff]">{channels.length}টি</strong></span>
            <span>প্রিয় চ্যানেল: <strong className="text-[#ff2d78]">{favorites.length}টি</strong></span>
          </div>
        </div>

        {/* Grid Arena: Split Player + Channels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT: Live Video Streaming Theatre Area (Grid Column: 7/12) */}
          <section className="lg:col-span-7 space-y-4">
            <VideoPlayer 
              channel={selectedChannel} 
              isOnline={isOnline}
            />

            {/* Now Playing Stats / Quick help guidelines */}
            <div className="bg-[#0e0e1c]/80 rounded-xl p-4 border border-[#00e5ff]/10 flex items-start gap-3">
              <Smile className="w-5 h-5 text-[#ffd700] shrink-0 mt-0.5" />
              <div className="text-xs text-[#99aacc] leading-relaxed font-sans">
                <span className="font-semibold text-white">প্লেয়ার গাইড:</span> ভিডিও লোড না হলে উপরের পুনরায় লোড করুন বাটন চাপুন। কাস্টম .M3U ফাইলের যেকোনো চ্যানেল এই সিস্টেমে সম্পূর্ণ ফ্রি সম্প্রচার করা যাবে।
              </div>
            </div>
          </section>

          {/* RIGHT: Channel Explorer, Search and Filter Area (Grid Column: 5/12) */}
          <section className="lg:col-span-5 flex flex-col bg-[#111122]/90 rounded-2xl border border-[#00e5ff]/10 p-4 h-[550px] md:h-[620px] overflow-hidden">
            
            {/* Search Engine Header */}
            <div className="relative mb-3 shrink-0">
              <Search className="w-4 h-4 text-[#99aacc] absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="চ্যানেল, দেশ বা ভাষা সার্চ করুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#06060f] border border-[#00e5ff]/20 focus:border-[#00e5ff] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 font-sans focus:outline-none transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[#99aacc] hover:text-white text-xs px-1.5 py-0.5 hover:bg-[#111122] rounded font-sans transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Country Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 max-w-full shrink-0 scrollbar-none">
              <button
                onClick={() => setSelectedCountry('all')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg shrink-0 transition-all cursor-pointer ${
                  selectedCountry === 'all' 
                    ? 'bg-gradient-to-r from-[#00e5ff] to-[#ff2d78] text-[#06060f] shadow-md' 
                    : 'bg-[#06060f] border border-[#00e5ff]/10 text-[#99aacc] hover:text-white'
                }`}
              >
                🌐 সব দেশ
              </button>
              {PRESET_COUNTRIES.map((ct) => (
                <button
                  key={ct.code}
                  onClick={() => setSelectedCountry(ct.code)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg shrink-0 transition-all cursor-pointer ${
                    selectedCountry === ct.code 
                      ? 'bg-gradient-to-r from-[#00e5ff] to-[#ff2d78] text-[#06060f] shadow-md' 
                      : 'bg-[#06060f] border border-[#00e5ff]/10 text-[#99aacc] hover:text-white'
                  }`}
                >
                  {ct.flag} {ct.banglaName}
                </button>
              ))}
            </div>

            {/* Interactive Grid Columns */}
            <div className="flex flex-1 overflow-hidden gap-3.5">
              
              {/* Category selector column */}
              <div className="w-[110px] md:w-[130px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin border-r border-[#00e5ff]/10">
                {CURATED_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  
                  // Compute active channel count on this category
                  const count = channels.filter(c => {
                    if (cat.id === 'all') return true;
                    if (cat.id === 'favorites') return favorites.includes(c.id);
                    return c.category === cat.id;
                  }).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full p-2.5 rounded-xl flex flex-col items-start gap-1 justify-between transition-all group text-left cursor-pointer ${
                        isActive 
                          ? 'bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff]' 
                          : 'bg-[#06060f]/60 border border-transparent text-[#99aacc] hover:bg-[#06060f] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {renderCategoryIcon(cat.icon)}
                        <span className="text-[11px] font-extrabold tracking-tight leading-none block line-clamp-1">
                          {cat.banglaName}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono opacity-60 self-end font-bold">
                        {count}টি
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Channels List Column */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                <AnimatePresence mode="popLayout">
                  {filteredChannels.length === 0 ? (
                    <motion.div 
                      key="no-content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16 text-[#99aacc] font-sans px-4"
                    >
                      <Tv className="w-8 h-8 text-[#00e5ff]/50 mx-auto mb-2" />
                      <p className="text-xs font-semibold">কোনো কন্টেন্ট খুঁজে পাওয়া যায়নি</p>
                      <p className="text-[10px] text-zinc-650 mt-1">দয়া করে অন্য ক্যাটাগরি বা ফিল্টার ব্যবহার করুন।</p>
                    </motion.div>
                  ) : (
                    <motion.div key="channels-list" className="space-y-2">
                      {filteredChannels.slice(0, visibleCount).map((channel, idx) => {
                        const isPlaying = selectedChannel?.id === channel.id;
                        const isFav = favorites.includes(channel.id);

                        return (
                          <motion.div
                            key={channel.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15, delay: Math.min(idx * 0.01, 0.1) }}
                            layout="position"
                            onClick={() => setSelectedChannel(channel)}
                            className={`group w-full p-2 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isPlaying 
                                ? 'bg-[#0e0e1c] border-[#00e5ff]/60 shadow-[0_0_10px_rgba(0,229,255,0.15)]' 
                                : 'bg-[#06060f] border-[#00e5ff]/10 hover:border-[#00e5ff]/30 hover:bg-[#0e0e1c]/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                              {/* Card Logo with error image fallback */}
                              <div className="w-9 h-9 rounded-full bg-[#111122] p-1 flex items-center justify-center shrink-0 border border-[#00e5ff]/20 group-hover:border-[#00e5ff]/50 overflow-hidden relative">
                                <img
                                  src={channel.logo}
                                  alt={channel.name}
                                  className="max-w-full max-h-full object-contain rounded-full"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tv"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>';
                                  }}
                                  referrerPolicy="no-referrer"
                                />
                                {isPlaying && (
                                  <span className="absolute inset-0 bg-[#00e5ff]/15 flex items-center justify-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d78] animate-blink"></span>
                                  </span>
                                )}
                              </div>

                              {/* Label */}
                              <div className="overflow-hidden">
                                <h4 className={`text-xs font-bold leading-tight truncate ${isPlaying ? 'text-[#00e5ff]' : 'text-white group-hover:text-[#00e5ff]'}`}>
                                  {channel.banglaName || channel.name}
                                </h4>
                                <p className="text-[10px] text-[#99aacc] tracking-tight flex items-center gap-1 mt-0.5 truncate">
                                  <span>{channel.language}</span>
                                  <span>•</span>
                                  <span>{channel.country}</span>
                                </p>
                              </div>
                            </div>

                            {/* Hover action bar */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Favorite toggle button */}
                              <button
                                onClick={(e) => toggleFavorite(channel.id, e)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isFav 
                                    ? 'text-[#ff2d78] bg-[#ff2d78]/10' 
                                    : 'text-[#99aacc] hover:text-[#ff2d78] hover:bg-white/5'
                                }`}
                                title={isFav ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকাভুক্ত করুন"}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                              </button>

                              {/* Delete custom channel option */}
                              {channel.isCustom && (
                                <button
                                  onClick={(e) => handleDeleteChannel(channel.id, e)}
                                  className="p-1.5 text-[#99aacc]/60 hover:text-[#ff2d78] hover:bg-[#ff2d78]/10 rounded-lg transition-colors cursor-pointer"
                                  title="চ্যানেলটি ডিলিট করুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                          </motion.div>
                        );
                      })}

                      {/* Load More Trigger button */}
                      {filteredChannels.length > visibleCount && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => setVisibleCount(prev => prev + 100)}
                          className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-[#00e5ff]/10 to-[#ff2d78]/10 hover:from-[#00e5ff]/20 hover:to-[#ff2d78]/20 border border-[#00e5ff]/20 hover:border-[#00e5ff]/40 text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-white cursor-pointer active:scale-[0.98] transition-all duration-200 text-center flex items-center justify-center gap-2"
                        >
                          <span>আরও চ্যানেল লোড করুন </span>
                          <span className="text-xs text-[#99aacc] font-mono">
                            (+{filteredChannels.length - visibleCount}টি বাকি আছে)
                          </span>
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </section>

        </div>

      </main>

      {/* Floating Interactive Footer with system diagnostics */}
      <footer className="mt-auto border-t border-[#00e5ff]/20 bg-[#06060f] py-4 text-center text-[11px] text-[#99aacc]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <p>© {new Date().getFullYear()} Ismail Learning Zone. All Rights Reserved.</p>
          <p className="flex items-center gap-2">
            <span>Powered by HLS Live Network</span>
            <span>|</span>
            <span className="text-[#00e5ff] font-bold">● Live Portal Online</span>
          </p>
        </div>
      </footer>

      {/* Manual Channel Adder Modal */}
      <AddChannelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddChannel}
      />

    </div>
  );
}
