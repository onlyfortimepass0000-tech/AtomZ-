import { PlatformPreset } from '../types';

export const STORY_SAFE_ZONE = {
  topPct: 14,     // ~270px top safe margin for profile icon / time / status bar
  bottomPct: 14,  // ~270px bottom safe margin for reply box / swipe up / CTA
  leftPct: 0,
  rightPct: 0,
  label: 'Story UI Safe Zone (Top/Bottom 14%)'
};

export const PLATFORM_PRESETS: PlatformPreset[] = [
  // Instagram
  {
    id: 'ig-square',
    platform: 'Instagram',
    name: 'Square Post',
    width: 1080,
    height: 1080,
    aspectRatio: 1,
    hasSafeZone: false,
  },
  {
    id: 'ig-portrait',
    platform: 'Instagram',
    name: 'Portrait Post',
    width: 1080,
    height: 1350,
    aspectRatio: 1080 / 1350,
    hasSafeZone: false,
  },
  {
    id: 'ig-story',
    platform: 'Instagram',
    name: 'Story / Reel',
    width: 1080,
    height: 1920,
    aspectRatio: 1080 / 1920,
    hasSafeZone: true,
    safeZone: STORY_SAFE_ZONE,
  },

  // Facebook
  {
    id: 'fb-square',
    platform: 'Facebook',
    name: 'Feed Square',
    width: 1080,
    height: 1080,
    aspectRatio: 1,
    hasSafeZone: false,
  },
  {
    id: 'fb-landscape',
    platform: 'Facebook',
    name: 'Feed Landscape',
    width: 1200,
    height: 630,
    aspectRatio: 1200 / 630,
    hasSafeZone: false,
  },
  {
    id: 'fb-story',
    platform: 'Facebook',
    name: 'Story',
    width: 1080,
    height: 1920,
    aspectRatio: 1080 / 1920,
    hasSafeZone: true,
    safeZone: STORY_SAFE_ZONE,
  },

  // LinkedIn
  {
    id: 'li-square',
    platform: 'LinkedIn',
    name: 'Square',
    width: 1200,
    height: 1200,
    aspectRatio: 1,
    hasSafeZone: false,
  },
  {
    id: 'li-landscape',
    platform: 'LinkedIn',
    name: 'Landscape',
    width: 1200,
    height: 627,
    aspectRatio: 1200 / 627,
    hasSafeZone: false,
  },

  // YouTube
  {
    id: 'yt-thumbnail',
    platform: 'YouTube',
    name: 'Thumbnail',
    width: 1280,
    height: 720,
    aspectRatio: 1280 / 720,
    hasSafeZone: false,
  },

  // X / Twitter
  {
    id: 'tw-landscape',
    platform: 'X (Twitter)',
    name: 'Landscape Post',
    width: 1600,
    height: 900,
    aspectRatio: 1600 / 900,
    hasSafeZone: false,
  },

  // WhatsApp
  {
    id: 'wa-square',
    platform: 'WhatsApp',
    name: 'Profile / Square',
    width: 1080,
    height: 1080,
    aspectRatio: 1,
    hasSafeZone: false,
  },
  {
    id: 'wa-status',
    platform: 'WhatsApp',
    name: 'Status',
    width: 1080,
    height: 1920,
    aspectRatio: 1080 / 1920,
    hasSafeZone: true,
    safeZone: STORY_SAFE_ZONE,
  },

  // Google Display
  {
    id: 'gd-medium-rec',
    platform: 'Google Display',
    name: 'Medium Rectangle',
    width: 300,
    height: 250,
    aspectRatio: 300 / 250,
    hasSafeZone: false,
  },
  {
    id: 'gd-lg-rec',
    platform: 'Google Display',
    name: 'Large Rectangle',
    width: 336,
    height: 280,
    aspectRatio: 336 / 280,
    hasSafeZone: false,
  },
  {
    id: 'gd-leaderboard',
    platform: 'Google Display',
    name: 'Leaderboard',
    width: 728,
    height: 90,
    aspectRatio: 728 / 90,
    hasSafeZone: false,
  },
  {
    id: 'gd-half-page',
    platform: 'Google Display',
    name: 'Half Page',
    width: 300,
    height: 600,
    aspectRatio: 300 / 600,
    hasSafeZone: false,
  },
];
