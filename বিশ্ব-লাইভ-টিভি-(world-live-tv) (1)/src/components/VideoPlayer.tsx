import { useEffect, useRef, useState } from 'react';
import { Channel } from '../types';
import { Play, RotateCcw, AlertTriangle, Volume2, VolumeX, Maximize2, Tv, RefreshCw, Radio } from 'lucide-react';

interface VideoPlayerProps {
  channel: Channel | null;
  onPrev?: () => void;
  onNext?: () => void;
  isOnline?: boolean;
}

export default function VideoPlayer({ channel, onPrev, onNext, isOnline = true }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hlsLoaded, setHlsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Load HLS.js dynamically from CDN
  useEffect(() => {
    if ((window as any).Hls) {
      setHlsLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.4.12/hls.min.js';
    script.async = true;
    script.onload = () => {
      setHlsLoaded(true);
    };
    script.onerror = () => {
      setError('HLS Player CDN failed to load. Please check connection.');
    };
    document.body.appendChild(script);
  }, []);

  // Handle HLS Playback Setup
  useEffect(() => {
    if (!channel || channel.type !== 'hls') return;

    if (!hlsLoaded) {
      setIsLoading(true);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setIsLoading(true);
    setIsPlaying(true);

    let hlsInstance: any = null;
    const hlsClass = (window as any).Hls;

    if (hlsClass && hlsClass.isSupported()) {
      hlsInstance = new hlsClass({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });
      hlsInstance.loadSource(channel.streamUrl);
      hlsInstance.attachMedia(video);

      hlsInstance.on(hlsClass.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.muted = isMuted;
        video.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.log("Autoplay blocked, waiting for user click.", err);
          setIsPlaying(false);
        });
      });

      hlsInstance.on(hlsClass.Events.ERROR, (event: any, data: any) => {
        if (data.fatal) {
          switch (data.type) {
            case hlsClass.ErrorTypes.NETWORK_ERROR:
              console.log('Fatal network error, attempting recovery...');
              hlsInstance.startLoad();
              break;
            case hlsClass.ErrorTypes.MEDIA_ERROR:
              console.log('Fatal media error, attempting recovery...');
              hlsInstance.recoverMediaError();
              break;
            default:
              setError('চ্যানেল স্ট্রিমটি সরাসরি লোড করা যাচ্ছে না। এটি সাময়িকভাবে বন্ধ অথবা জিও-রেস্ট্রিক্টেড হতে পারে।');
              setIsLoading(false);
              hlsInstance.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari Native Support
      video.src = channel.streamUrl;
      video.muted = isMuted;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      });
      video.addEventListener('error', () => {
        setError('স্ট্রিমটি লোড করা যাচ্ছে না।');
        setIsLoading(false);
      });
    } else {
      setError('আপনার ব্রাউজার HLS প্লেব্যাক সমর্থন করে না।');
      setIsLoading(false);
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [channel, hlsLoaded, retryTrigger]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Playback Control Handlers
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || channel?.type !== 'hls') return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true));
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const retryStream = () => {
    setRetryTrigger(prev => prev + 1);
  };

  const handleFullscreen = () => {
    const element = containerRef.current;
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch((err) => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="w-full flex flex-col bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-805/90 shadow-2xl relative">
      {/* Player Header Info */}
      {channel && (
        <div className="bg-[#0e0e1c] px-5 py-3.5 border-b border-[#00e5ff]/20 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#111122] p-1.5 flex items-center justify-center border-2 border-[#00e5ff] overflow-hidden shrink-0">
              {channel.logo ? (
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="max-w-full max-h-full object-contain rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tv"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>';
                  }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Tv className="w-5 h-5 text-[#00e5ff]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm md:text-base leading-tight">
                  {channel.banglaName || channel.name}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-[#ff2d78]/10 text-[#ff2d78] border border-[#ff2d78]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d78] animate-blink"></span> লাইভ
                </span>
              </div>
              <p className="text-[#99aacc] text-[11px] mt-0.5 flex items-center gap-2 font-mono">
                <span>{channel.country === 'BD' ? 'বাংলাদেশ' : channel.country === 'IN' ? 'ভারত' : 'আমেরিকা-ইউরোপ-অন্যান্য'}</span>
                <span>•</span>
                <span className="capitalize">{channel.category}</span>
                <span>•</span>
                <span>{channel.language}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={retryStream}
              className="p-1.5 bg-white/5 border border-[#00e5ff]/20 hover:text-[#00e5ff] hover:bg-white/10 rounded-lg transition-all"
              title="পুনরায় লোড করুন (Reload)"
            >
              <RefreshCw className="w-4 h-4 text-[#99aacc]" />
            </button>
          </div>
        </div>
      )}

      {/* Main Video Arena */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-black flex items-center justify-center group overflow-hidden max-h-[460px]"
      >
        {!channel ? (
          /* Empty / Inactive state */
          <div className="flex flex-col items-center justify-center text-center p-8 text-zinc-500 select-none">
            <div className="w-20 h-20 rounded-full bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4 animate-bounce duration-[2000ms]">
              <Tv className="w-10 h-10 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <h4 className="text-zinc-200 font-semibold text-base md:text-lg">
              এখনও কোনো চ্যানেল নির্বাচন করা হয়নি
            </h4>
            <p className="text-zinc-500 text-xs md:text-sm max-w-sm mt-1">
              যেকোনো একটি টিভি চ্যানেলে ক্লিক করে লাইভ সম্প্রচার দেখুন। আপনি সার্চ বা ক্যাটাগরি ফিল্টার ব্যবহার করতে পারেন।
            </p>
          </div>
        ) : !isOnline ? (
          /* Offline State Warning */
          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-center p-6 z-10 border border-dashed border-[#ff2d78]/40 rounded-b-xl">
            <Radio className="w-12 h-12 text-[#ff2d78] mb-3 animate-pulse" />
            <h4 className="text-white font-bold text-sm md:text-base">আপনি বর্তমানে অফলাইনে আছেন</h4>
            <p className="text-zinc-400 text-xs md:text-sm max-w-md px-4 mt-2 leading-relaxed">
              লাইভ টিভি চ্যানেল সম্প্রচার দেখতে একটি সক্রিয় ইন্টারনেট সংযোগ আবশ্যক। তবে আমাদের তৈরি অফলাইন ক্যাটালগ সিস্টেমে আপনি ১৮০০+ চ্যানেল সার্চ ও ব্রাউজ করতে পারবেন।
            </p>
            <div className="mt-4 px-4 py-2 bg-white/5 border border-white/10 text-[10px] text-[#99aacc] rounded-lg">
              কানেকশন ফিরে আসলে লাইভ স্ট্রিম স্বয়ংক্রিয়ভাবে পুনরায় চালু হবে।
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-center p-6 z-10 border border-dashed border-red-900/40 rounded-b-xl">
            <AlertTriangle className="w-12 h-12 text-[#ff2d78] mb-3 animate-pulse" />
            <p className="text-zinc-300 font-medium text-sm md:text-base max-w-md px-4 leading-relaxed">
              {error}
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={retryStream}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs md:text-sm rounded-lg transition-all shadow-md active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" /> পুনরায় চেষ্টা করুন
              </button>
            </div>
          </div>
        ) : (
          /* Player Canvas */
          <div className="w-full h-full relative flex items-center justify-center">
            {isLoading && (
              /* Loading Spinner inside video */
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-13">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-zinc-800 border-t-[#00e5ff] rounded-full animate-spin"></div>
                  <Radio className="w-5 h-5 text-[#00e5ff] absolute inset-0 m-auto animate-pulse" />
                </div>
                <span className="text-zinc-450 text-xs font-mono mt-3 animate-pulse tracking-wide text-[#99aacc]">
                  লাইভ লোড হচ্ছে...
                </span>
              </div>
            )}

            {channel.type === 'youtube' ? (
              <iframe
                src={channel.streamUrl}
                title={channel.name}
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="no-referrer"
                onLoad={() => setIsLoading(false)}
              ></iframe>
            ) : (
              <video
                ref={videoRef}
                className="w-full h-full object-contain absolute inset-0"
                playsInline
                onClick={togglePlay}
              ></video>
            )}

            {/* Custom overlays / control bars */}
            {!isLoading && (
              <>
                {/* User's big play button toggle over direct HLS */}
                {channel.type === 'hls' && (
                  <button
                    onClick={togglePlay}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-black/60 border-2 border-white/50 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all opacity-0 group-hover:opacity-100 focus:outline-none z-10"
                  >
                    {isPlaying ? (
                      <span className="block w-4 h-4 bg-white border-x-4 border-transparent"></span>
                    ) : (
                      <Play className="w-6 h-6 fill-current text-white translate-x-0.5" />
                    )}
                  </button>
                )}

                {/* Overlaid Channels Tag badge */}
                <div className="absolute top-3.5 right-3.5 bg-black/70 px-3 py-1 rounded-md text-[10px] font-bold text-[#00e5ff] border border-[#00e5ff]/30 z-10 pointer-events-none">
                  {channel.name}
                </div>

                {/* Lower control strip when hovered */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                    {channel.type === 'hls' && (
                      <button
                        onClick={togglePlay}
                        className="p-1.5 bg-[#00e5ff] hover:bg-[#00e5ff]/85 text-zinc-950 rounded-full transition-all focus:outline-none"
                      >
                        {isPlaying ? (
                          <span className="block w-2.5 h-2.5 bg-zinc-950 border-x-2 border-zinc-950 rounded-[1px]"></span>
                        ) : (
                          <Play className="w-2.5 h-2.5 fill-current" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={toggleMute}
                      className="p-1 text-zinc-300 hover:text-zinc-105 rounded transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-4.5 h-4.5 text-red-400" /> : <Volume2 className="w-4.5 h-4.5 text-[#00e5ff]" />}
                    </button>
                    
                    <span className="text-[10px] font-mono text-[#ff2d78] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#ff2d78] animate-ping shrink-0" /> DIRECT STREAM
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono bg-zinc-900/90 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded">
                      {channel.type.toUpperCase()} MODE
                    </span>
                    <button
                      onClick={handleFullscreen}
                      className="p-1.5 bg-black/60 border border-white/20 hover:border-[#00e5ff] hover:text-[#00e5ff] text-white rounded-lg transition-colors"
                      title="ফুল স্ক্রিন"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Description Info Area below Video */}
      {channel && channel.description && (
        <div className="bg-[#111122]/60 p-4 border-t border-[#00e5ff]/10">
          <p className="text-[#99aacc] text-xs leading-relaxed font-sans">
            <span className="font-semibold text-white">তথ্যসূত্রঃ</span> {channel.description}
          </p>
        </div>
      )}
    </div>
  );
}
