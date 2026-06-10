import fs from 'fs';

interface RawM3UEntry {
  name: string;
  logo: string;
  streamUrl: string;
  country: string;
  language: string;
  category: string;
}

// Map country codes to readable names for metadata
const COUNTRY_MAP: { [key: string]: string } = {
  BD: 'Bangladesh',
  IN: 'India',
  US: 'United States',
  UK: 'United Kingdom',
  CA: 'Canada',
  DE: 'Germany',
  FR: 'France',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  TR: 'Turkey',
  PK: 'Pakistan',
  GLOBAL: 'International'
};

// Map raw categories or names to normalized predefined categories in App
function normalizeCategory(group: string, name: string): string {
  const cn = (group + ' ' + name).toLowerCase();
  if (cn.includes('quran') || cn.includes('islam') || cn.includes('peace') || cn.includes('makkah') || cn.includes('madinah') || cn.includes('madani') || cn.includes('religious') || cn.includes('isla')) {
    return 'islamic';
  }
  if (cn.includes('sport') || cn.includes('cricket') || cn.includes('football') || cn.includes('tenis') || cn.includes('racing') || cn.includes('t sports') || cn.includes('tsports') || cn.includes('espn') || cn.includes('olympic') || cn.includes('game') || cn.includes('ufc') || cn.includes('wwe')) {
    return 'sports';
  }
  if (cn.includes('news') || cn.includes('khabor') || cn.includes('sangbad') || cn.includes('somoy') || cn.includes('independent') || cn.includes('jamuna') || cn.includes('al jazeera') || cn.includes('bbc') || cn.includes('cnn') || cn.includes('dw') || cn.includes('bloomberg') || cn.includes('cnbc') || cn.includes('rt') || cn.includes('reuters')) {
    return 'news';
  }
  return 'entertainment'; // default to general movie and entertainment
}

// Map English names of Bengali channels to beautiful Bengali designations
const BENGALI_NAME_MAP: { [key: string]: string } = {
  'Somoy News TV': 'সময় টিভি (Somoy TV Live)',
  'Somoy News': 'সময় টিভি (Somoy TV Live)',
  'Somoy TV': 'সময় টিভি (Somoy TV Live)',
  'Jamuna TV': 'যমুনা টিভি (Jamuna TV Live)',
  'Independent TV': 'ইনডিপেনডেন্ট টিভি (Independent TV)',
  'Channel 24': 'চ্যানেল ২৪ (Channel 24 Live)',
  'DBC News': 'ডিবিসি নিউজ (DBC News)',
  'Ekattor TV': 'একাত্তর টিভি (Ekattor HD)',
  'RTV': 'আরটিভি (RTV Entertainment)',
  'Channel i': 'চ্যানেল আই (Channel i Live)',
  'NTV': 'এনটিভি (NTV Bangla)',
  'Bangla Vision': 'বাংলাভিশন (Bangla Vision)',
  'T Sports': 'টি স্পোর্টস (T Sports HD)',
  'BTV National': 'বিটিভি ন্যাশনাল (BTV Govt.)',
  'BTV News': 'বিটিভি নিউজ (BTV News Live)',
  'BTV World': 'বিটিভি ওয়ার্ল্ড (BTV World)',
  'BTV Chattogram': 'বিটিভি চট্টগ্রাম',
  'News 24': 'নিউজ ২৪ (News 24 Live)',
  'Desh TV': 'দেশ টিভি (Desh TV)',
  'Sangsad TV': 'সংসদ বাংলাদেশ টেলিভিশন',
  'ATN Bangla': 'এটিএন বাংলা (ATN Bangla)',
  'ATN News': 'এটিএন নিউজ (ATN News)',
  'Asian TV': 'এশিয়ান টিভি',
  'Bijoy TV': 'বিজয় টিভি',
  'My TV': 'মাই টিভি (My TV Bangla)',
  'Mohona TV': 'মোহনা টিভি',
  'Global TV': 'গ্লোবাল টেলিভিশন',
  'Duronto TV': 'দুরন্ত টিভি (Duronto Kids)',
  'Deepto TV': 'দীপ্ত টিভি (Deepto TV)',
  'Green TV': 'গ্রিন টিভি',
  'Ekhon TV': 'এখন টিভি (Ekhon Business TV)',
  'Madani Channel Bangla': 'মাদানী চ্যানেল বাংলা',
  'Peace TV Bangla': 'পিস টিভি বাংলা',
  'ABP Ananda': 'এবিপি আনন্দ (ABP Ananda)',
  'Zee 24 Ghanta': 'জি ২৪ ঘণ্টা',
  'Republic Bangla': 'রিপাবলিক বাংলা',
  'Star Jalsha': 'স্টার জলসা (Star Jalsha)',
  'Zee Bangla': 'জি বাংলা (Zee Bangla)',
  'Colors Bangla': 'কালারস বাংলা',
  'Sony AATH': 'সনি আট (Sony AATH)',
  'Sun Bangla': 'সান বাংলা',
  'DD Bangla': 'ডিডি বাংলা (Doordarshan)'
};

function parseM3U(content: string, defaultCountry: string, defaultLanguage: string): RawM3UEntry[] {
  const lines = content.split('\n');
  const entries: RawM3UEntry[] = [];
  let currentMetadata: { [key: string]: string } = {};
  let currentDisplayName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      // Parse attributes
      currentMetadata = {};
      
      // Match attributes like key="value" or key=value
      const matches = line.matchAll(/([a-zA-Z0-9-ñ]+)="([^"]*)"/g);
      for (const match of matches) {
        currentMetadata[match[1]] = match[2];
      }

      // Display name is after the last comma
      const commaIdx = line.lastIndexOf(',');
      if (commaIdx !== -1) {
        currentDisplayName = line.substring(commaIdx + 1).trim();
      } else {
        currentDisplayName = currentMetadata['tvg-name'] || 'Unknown Channel';
      }
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      // This is the URL line
      const url = line;
      
      // Basic security and compatibility filtering (skip local, private, or audio-only formats)
      if (
        url.includes('127.0.0.1') || 
        url.includes('localhost') || 
        url.endsWith('.mp3') || 
        url.endsWith('.ogg') ||
        url.endsWith('.wav')
      ) {
        continue;
      }

      const name = currentDisplayName || currentMetadata['tvg-name'] || 'Unknown Channel';
      const logo = currentMetadata['tvg-logo'] || '';
      const group = currentMetadata['group-title'] || '';
      const category = normalizeCategory(group, name);

      entries.push({
        name,
        logo,
        streamUrl: url,
        country: defaultCountry,
        language: defaultLanguage,
        category
      });

      currentMetadata = {};
      currentDisplayName = '';
    }
  }

  return entries;
}

// Quick URL validation helper to perform deep pruning
function isValidLogo(url: string): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

async function main() {
  console.log('Downloading live streams database from iptv-org catalogs...');

  const sources = [
    { url: 'https://iptv-org.github.io/iptv/countries/bd.m3u', country: 'BD', lang: 'Bangla' },
    { url: 'https://iptv-org.github.io/iptv/countries/in.m3u', country: 'IN', lang: 'Hindi/Bangla' },
    { url: 'https://iptv-org.github.io/iptv/countries/sa.m3u', country: 'SA', lang: 'Arabic' },
    { url: 'https://iptv-org.github.io/iptv/categories/news.m3u', country: 'GLOBAL', lang: 'English' },
    { url: 'https://iptv-org.github.io/iptv/categories/sports.m3u', country: 'GLOBAL', lang: 'English' },
    { url: 'https://iptv-org.github.io/iptv/categories/movies.m3u', country: 'GLOBAL', lang: 'English' },
    { url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u', country: 'GLOBAL', lang: 'English' },
    { url: 'https://iptv-org.github.io/iptv/categories/music.m3u', country: 'GLOBAL', lang: 'English' },
    { url: 'https://iptv-org.github.io/iptv/categories/religious.m3u', country: 'GLOBAL', lang: 'Arabic/English' }
  ];

  const allChannels: any[] = [];
  const processedUrls = new Set<string>();

  // Ensure high quality preloaded/stable custom backup list goes first or has priority
  const premiumBaseChannels = [
    {
      id: 'somoy-tv-premium',
      name: 'Somoy News TV',
      banglaName: 'সময় টিভি (Somoy TV Live)',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Somoy_TV_logo.png',
      category: 'news',
      country: 'BD',
      language: 'Bangla',
      streamUrl: 'https://bozztv.com/rongo/rongo-somoy/index.m3u8',
      type: 'hls',
      description: 'সময় টেলিভিশন বাংলাদেশের একটি শীর্ষস্থানীয় ২৪ ঘণ্টা সংবাদভিত্তিক সরাসরি সম্প্রচারিত এইচডি টেলিভিশন চ্যানেল।'
    },
    {
      id: 'jamuna-tv-premium',
      name: 'Jamuna TV',
      banglaName: 'যমুনা টিভি (Jamuna TV Live)',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Jamuna_TV_Logo.png',
      category: 'news',
      country: 'BD',
      language: 'Bangla',
      streamUrl: 'https://bozztv.com/rongo/rongo-JamunaTelevision/index.m3u8',
      type: 'hls',
      description: 'সংবাদ ও সমসাময়িক বিষয় নিয়ে প্রচারিত বাংলাদেশের ২৪ ঘন্টার আধুনিক টেলিভিশন সম্প্রচার নেটওয়ার্ক।'
    },
    {
      id: 'independent-tv-premium',
      name: 'Independent TV',
      banglaName: 'ইনডিপেনডেন্ট টিভি (Independent TV)',
      logo: 'https://live-independent-tv.vshcdn.net/independenttv/logo.png',
      category: 'news',
      country: 'BD',
      language: 'Bangla',
      streamUrl: 'https://bozztv.com/rongo/rongo-IndependentTV/index.m3u8',
      type: 'hls',
      description: 'সঠিক ও দ্রুত সংবাদ পরিবেশনে প্রতিশ্রুতিবদ্ধ বাংলাদেশের জনপ্রিয় স্যাটেলাইট টেলিভিশন।'
    },
    {
      id: 'channel-24-premium',
      name: 'Channel 24',
      banglaName: 'চ্যানেল ২৪ (Channel 24 Live)',
      logo: 'https://i.imgur.com/4JLkaF7.png',
      category: 'news',
      country: 'BD',
      language: 'Bangla',
      streamUrl: 'https://bozztv.com/rongo/rongo-Channel24HD/index.m3u8',
      type: 'hls',
      description: 'বাংলাদেশি সংবাদ ও তথ্যভিত্তিক স্যাটেলাইট টেলিভিশন চ্যানেল।'
    },
    {
      id: 'dbc-news-premium',
      name: 'DBC News',
      banglaName: 'ডিবিসি নিউজ (DBC News)',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/d/de/DBC_News_Logo.png',
      category: 'news',
      country: 'BD',
      language: 'Bangla',
      streamUrl: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1728/output/index.m3u8',
      type: 'hls',
      description: 'ডিবিসি নিউজ বাংলাদেশের একটি আধুনিক উপগ্রহ-ভিত্তিক সংবাদ টেলিভিশন চ্যানেল।'
    },
    {
      id: 'ekattor-tv-premium',
      name: 'Ekattor TV',
      banglaName: 'একাত্তর টিভি (Ekattor HD)',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Ekattor_TV_Logo.png',
      category: 'news',
      country: 'BD',
      language: 'Bangla',
      streamUrl: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1705/output/1705.m3u8',
      type: 'hls',
      description: 'বাংলাদেশের প্রথম পূর্ণাঙ্গ এইচডি সংবাদ চ্যানেল, যা দেশীয় ও আন্তর্জাতিক সংবাদ সরাসরি সম্প্রচার করেছে।'
    },
    {
      id: 'tsports-premium',
      name: 'T Sports',
      banglaName: 'টি স্পোর্টস (T Sports HD)',
      logo: 'https://i.imgur.com/2JzlorD.png',
      category: 'sports',
      country: 'BD',
      language: 'Bangla',
      streamUrl: 'https://tvsen7.aynaott.com/tsports-hd/index.m3u8',
      type: 'hls',
      description: 'বাংলাদেশের প্রথম ও একমাত্র ডেডিকেটেড লাইভ স্পোর্টস টেলিভিশন চ্যানেল।'
    },
    {
      id: 'rtv-premium',
      name: 'RTV',
      banglaName: 'आरটিভি',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/RTV_Bangladesh.png',
      category: 'entertainment',
      country: 'BD',
      language: 'Bangla',
      streamUrl: 'https://bozztv.com/rongo/rongo-RTV/index.m3u8',
      type: 'hls'
    },
    {
      id: 'madani-b-premium',
      name: 'Madani Channel Bangla',
      banglaName: 'মাদানী চ্যানেল বাংলা',
      logo: 'https://i.imgur.com/vIJTVia.png',
      category: 'islamic',
      country: 'BD',
      language: 'Bangla',
      streamUrl: 'https://streaming.madanichannel.tv/static/streaming-playlists/hls/d3e49b76-ac06-4689-a641-9200445b647f/master.m3u8',
      type: 'hls'
    },
    {
      id: 'peacetv-b-premium',
      name: 'Peace TV Bangla',
      banglaName: 'পিস টিভি বাংলা',
      logo: 'https://i.imgur.com/1ztVXUi.png',
      category: 'islamic',
      country: 'GLOBAL',
      language: 'Bangla',
      streamUrl: 'https://dzkyvlfyge.erbvr.com/PeaceTvBangla/index.m3u8',
      type: 'hls'
    },
    {
      id: 'makkah-live-24',
      name: 'Makkah Live 24/7',
      banglaName: 'মক্কা লাইভ (Makkah Live TV)',
      logo: 'https://i.imgur.com/8QpM94O.png',
      category: 'islamic',
      country: 'SA',
      language: 'Arabic',
      streamUrl: 'https://makkah.securenets.net/hls/makkah_all_1200.m3u8',
      type: 'hls',
      description: 'পবিত্র মস্তজিদুল হারাম, মক্কা মুকাররমা থেকে ২৪ ঘন্টা সরাসরি সম্প্রচারিত লাইভ ফিড।'
    },
    {
      id: 'madinah-live-24',
      name: 'Madinah Live 24/7',
      banglaName: 'মদিনা লাইভ (Madinah Live TV)',
      logo: 'https://i.imgur.com/Z47FjQ3.png',
      category: 'islamic',
      country: 'SA',
      language: 'Arabic',
      streamUrl: 'https://madinah.securenets.net/hls/madinah_all_1200.m3u8',
      type: 'hls',
      description: 'পবিত্র মসজিদে নববী, মদিনা মুনাওয়ারা থেকে ২৪ ঘন্টা সরাসরি সম্প্রচারিত লাইভ ফিড।'
    }
  ];

  for (const ch of premiumBaseChannels) {
    allChannels.push(ch);
    processedUrls.add(ch.streamUrl);
  }

  // Iterate over each source list
  for (const src of sources) {
    try {
      console.log(`Fetching stream list from: ${src.url}`);
      const response = await fetch(src.url);
      if (!response.ok) {
        console.error(`Failed to fetch source: ${src.url}`);
        continue;
      }
      const rawText = await response.text();
      const parsed = parseM3U(rawText, src.country, src.lang);
      
      console.log(`Parsed ${parsed.length} raw channels from ${src.country}`);

      let filteredCount = 0;
      for (const entry of parsed) {
        // Prevent duplicate URLs
        if (processedUrls.has(entry.streamUrl)) continue;

        // Skip channels with totally empty names or obviously dead loops
        if (!entry.name || entry.name.toLowerCase().includes('loop') || entry.name.toLowerCase().includes('demo')) {
          continue;
        }

        processedUrls.add(entry.streamUrl);

        // Map English to beautiful Bengali names if available, or polish the English string
        let displayName = entry.name;
        let pBanglaName = BENGALI_NAME_MAP[entry.name];
        
        // Match approximate names
        if (!pBanglaName) {
          for (const key of Object.keys(BENGALI_NAME_MAP)) {
            if (entry.name.toLowerCase().includes(key.toLowerCase())) {
              pBanglaName = BENGALI_NAME_MAP[key];
              break;
            }
          }
        }

        // Generate a clean safe id
        const cleanId = entry.name
          .replace(/[^a-zA-Z0-9]/g, '-')
          .toLowerCase() + '-' + Math.floor(Math.random() * 10000);

        allChannels.push({
          id: cleanId,
          name: entry.name,
          banglaName: pBanglaName || entry.name,
          logo: isValidLogo(entry.logo) ? entry.logo : 'https://cdn-icons-png.flaticon.com/512/5115/5115594.png',
          category: entry.category,
          country: entry.country,
          language: entry.language,
          streamUrl: entry.streamUrl,
          type: 'hls',
          description: `বাংলাদেশ ও সমগ্র বিশ্বের অন্যতম জনপ্রিয় লাইভ চ্যানেল - ${entry.name}`
        });

        filteredCount++;
      }
      console.log(`Appended ${filteredCount} unique channels from ${src.country}.`);
    } catch (e) {
      console.error(`Error handling list ${src.url}:`, e);
    }
  }

  // Double check duplicates or excessive counts. If it's too high, let's keep around 450 highest-quality channels
  // prioritizing Bangladesh channels, then India channels, then highly rated categories.
  console.log(`Initial total channels gathered: ${allChannels.length}`);

  // Let's sort to keep BD channels at the top of lists, then India, then rest
  allChannels.sort((a, b) => {
    if (a.country === 'BD' && b.country !== 'BD') return -1;
    if (b.country === 'BD' && a.country !== 'BD') return 1;
    if (a.country === 'IN' && b.country !== 'IN') return -1;
    if (b.country === 'IN' && a.country !== 'IN') return 1;
    return a.name.localeCompare(b.name);
  });

  // Limit to an elite pool of exactly 1800 channels to optimize loading performance & UI responsiveness
  const maxLength = Math.min(allChannels.length, 1800);
  const prunedChannels = allChannels.slice(0, maxLength);

  console.log(`Pruning list to ${prunedChannels.length} highly optimized, high-fidelity live channels`);

  // Save dynamically generated JSON
  const outputFilePath = './src/data/generated-channels.json';
  fs.writeFileSync(outputFilePath, JSON.stringify(prunedChannels, null, 2));
  console.log(`Successfully written channels database containing ${prunedChannels.length} items to ${outputFilePath}!`);
}

main();
