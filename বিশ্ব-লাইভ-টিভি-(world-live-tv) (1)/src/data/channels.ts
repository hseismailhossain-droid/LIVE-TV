import { Channel, Category, Country } from '../types';
import generatedChannels from './generated-channels.json';

export const CURATED_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Channels', banglaName: 'সব চ্যানেল', icon: 'Tv' },
  { id: 'favorites', name: 'Favorites', banglaName: 'প্রিয় চ্যানেল', icon: 'Heart' },
  { id: 'news', name: 'News', banglaName: 'সংবাদ চ্যানেল', icon: 'Radio' },
  { id: 'entertainment', name: 'Entertainment & Movies', banglaName: 'বিনোদন ও সিনেমা', icon: 'Film' },
  { id: 'sports', name: 'Sports', banglaName: 'খেলাধুলা', icon: 'Trophy' },
  { id: 'islamic', name: 'Islamic & Religious', banglaName: 'ইসলামিক ও ধর্মীয়', icon: 'MoonPalace' },
];

export const PRESET_COUNTRIES: Country[] = [
  { code: 'BD', name: 'Bangladesh', banglaName: 'বাংলাদেশ', flag: '🇧🇩' },
  { code: 'IN', name: 'India', banglaName: 'ভারত', flag: '🇮🇳' },
  { code: 'SA', name: 'Saudi Arabia', banglaName: 'সৌদি আরব', flag: '🇸🇦' },
  { code: 'GLOBAL', name: 'International', banglaName: 'আন্তর্জাতিক', flag: '🌐' },
];

export const CURATED_CHANNELS: Channel[] = generatedChannels as Channel[];
