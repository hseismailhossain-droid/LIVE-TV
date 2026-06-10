import { Channel } from '../types';

/**
 * Parses raw M3U playlist file content into structured Channel objects.
 */
export function parseM3U(content: string, defaultCountry: string = 'GLOBAL'): Channel[] {
  const lines = content.split('\n');
  const channels: Channel[] = [];
  let current: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Create a fresh partial channel
      current = {};
      
      // Attempt to extract channel name (starts after the last comma)
      const commaIndex = line.lastIndexOf(',');
      let name = 'Unknown Channel';
      if (commaIndex !== -1) {
        name = line.substring(commaIndex + 1).trim();
      }

      // Extract tvg-id or logo metadata
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      const logo = logoMatch ? logoMatch[1] : '';

      const tvgIdMatch = line.match(/tvg-id="([^"]+)"/i);
      const id = tvgIdMatch 
        ? tvgIdMatch[1] 
        : `ext-${Math.random().toString(36).substring(2, 11)}`;

      const groupMatch = line.match(/group-title="([^"]+)"/i);
      const category = groupMatch ? groupMatch[1].toLowerCase() : 'news';

      const countryMatch = line.match(/tvg-country="([^"]+)"/i);
      const country = countryMatch ? countryMatch[1].toUpperCase() : defaultCountry;

      const languageMatch = line.match(/tvg-language="([^"]+)"/i);
      const language = languageMatch ? languageMatch[1] : 'Various';

      current.id = id;
      current.name = name;
      current.logo = logo;
      current.category = mapCategory(category);
      current.country = country;
      current.language = language;
      current.type = 'hls'; // Default for IPTV lists
      current.isCustom = true;
    } else if (!line.startsWith('#') && current) {
      current.streamUrl = line;
      // Classify YouTube vs Standard HLS streams
      if (line.includes('youtube.com') || line.includes('youtu.be')) {
        current.type = 'youtube';
      } else {
        current.type = 'hls';
      }
      
      if (current.id && current.name && current.streamUrl) {
        channels.push(current as Channel);
      }
      current = null;
    }
  }

  return channels;
}

/**
 * Normalizes custom IPTV group tags into standard categories used by the application UI.
 */
function mapCategory(rawGroup: string): string {
  const group = rawGroup.toLowerCase();
  
  if (group.includes('news') || group.includes('খবর') || group.includes('info')) return 'news';
  if (group.includes('sport') || group.includes('খেলা') || group.includes('football') || group.includes('cricket')) return 'sports';
  if (group.includes('islam') || group.includes('quran') || group.includes('religion') || group.includes('prophet') || group.includes('church')) return 'islamic';
  if (group.includes('music') || group.includes('গান') || group.includes('song')) return 'music';
  if (group.includes('documentary') || group.includes('science') || group.includes('history') || group.includes('nature') || group.includes('education')) return 'documentary';
  if (group.includes('kids') || group.includes('cartoon') || group.includes('disney')) return 'kids';
  
  // Default to entertainment
  return 'entertainment';
}

/**
 * List of countries with active IPTV playlists on iptv-org
 */
export const IPTV_COUNTRIES_DIRECTORY = [
  { code: 'BD', name: 'Bangladesh', banglaName: 'বাংলাদেশ', flag: '🇧🇩' },
  { code: 'IN', name: 'India', banglaName: 'ভারত', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', banglaName: 'পাকিস্তান', flag: '🇵🇰' },
  { code: 'SA', name: 'Saudi Arabia', banglaName: 'সৌদি আরব', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', banglaName: 'সংযুক্ত আরব আমিরাত', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', banglaName: 'কাতার', flag: '🇶🇦' },
  { code: 'TR', name: 'Turkey', banglaName: 'তুরস্ক', flag: '🇹🇷' },
  { code: 'US', name: 'United States', banglaName: 'যুক্তরাষ্ট্র', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', banglaName: 'যুক্তরাজ্য', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', banglaName: 'কানাডা', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', banglaName: 'অস্ট্রেলিয়া', flag: '🇦🇺' },
  { code: 'MY', name: 'Malaysia', banglaName: 'মালয়েশিয়া', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', banglaName: 'সিঙ্গাপুর', flag: '🇸🇬' },
  { code: 'ID', name: 'Indonesia', banglaName: 'ইন্দোনেশিয়া', flag: '🇮🇩' },
  { code: 'DE', name: 'Germany', banglaName: 'জার্মানি', flag: '🇩🇪' },
  { code: 'FR', name: 'France', banglaName: 'ফ্রান্স', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', banglaName: 'জাপান', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', banglaName: 'দক্ষিণ কোরিয়া', flag: '🇰🇷' },
  { code: 'IT', name: 'Italy', banglaName: 'ইতালি', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', banglaName: 'স্পেন', flag: '🇪🇸' },
  { code: 'CN', name: 'China', banglaName: 'চীন', flag: '🇨🇳' },
  { code: 'RU', name: 'Russia', banglaName: 'রাশিয়া', flag: '🇷🇺' },
  { code: 'BR', name: 'Brazil', banglaName: 'ব্রাজিল', flag: '🇧🇷' },
];
