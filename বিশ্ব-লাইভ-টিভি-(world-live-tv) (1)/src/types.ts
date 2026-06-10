export interface Channel {
  id: string;
  name: string;
  banglaName?: string;
  logo: string;
  category: string;
  country: string;
  language: string;
  streamUrl: string;
  type: 'hls' | 'youtube' | 'iframe';
  description?: string;
  isCustom?: boolean;
}

export interface Category {
  id: string;
  name: string;
  banglaName: string;
  icon: string;
}

export interface Country {
  code: string;
  name: string;
  banglaName: string;
  flag: string;
}

export interface Playlist {
  id: string;
  name: string;
  url: string;
  channelCount?: number;
}
