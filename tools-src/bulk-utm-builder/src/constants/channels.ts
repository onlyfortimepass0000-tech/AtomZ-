import { ChannelPreset } from '../types';

export const CHANNEL_PRESETS: ChannelPreset[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    source: 'instagram',
    medium: 'social',
    description: 'Instagram organic posts, bio links, and reels',
  },
  {
    id: 'meta_ads',
    name: 'Facebook Ads',
    source: 'facebook',
    medium: 'paid_social',
    description: 'Facebook & Instagram sponsored ads',
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    source: 'google',
    medium: 'cpc',
    description: 'Google search, display, and YouTube ads',
  },
  {
    id: 'email',
    name: 'Email',
    source: 'newsletter',
    medium: 'email',
    description: 'Email newsletters & promotional broadcasts',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    source: 'whatsapp',
    medium: 'messaging',
    description: 'WhatsApp direct messages and broadcast channels',
  },
  {
    id: 'influencer',
    name: 'Influencer',
    source: 'influencer',
    medium: 'creator',
    description: 'Creator partnerships & affiliate referral links',
  },
  {
    id: 'other',
    name: 'Other',
    source: 'custom',
    medium: 'custom',
    description: 'Custom source & medium parameters',
  },
];
