/**
 * Icon Color & Gradient Utilities
 * Centralized color management for icons across the app
 */

import { getIconsByCategory } from '../config/icons';

/**
 * Beautiful gradient mappings by icon category
 */
const CATEGORY_GRADIENTS: Record<string, string> = {
  // Core & General
  'core': 'from-blue-500 to-indigo-600',
  'misc': 'from-purple-500 to-purple-600',
  
  // Amenities & Facilities
  'amenities': 'from-emerald-500 to-teal-600',
  'facilities': 'from-cyan-500 to-blue-600',
  'room': 'from-sky-500 to-blue-600',
  
  // Services
  'services': 'from-violet-500 to-purple-600',
  'business': 'from-indigo-500 to-blue-600',
  'laundry': 'from-blue-400 to-cyan-500',
  
  // Food & Dining
  'dining': 'from-orange-500 to-amber-600',
  'bathroom': 'from-teal-500 to-cyan-600',
  
  // Check-in & Access
  'checkin': 'from-green-500 to-emerald-600',
  
  // Entertainment & Activities
  'entertainment': 'from-pink-500 to-rose-600',
  'outdoor': 'from-lime-500 to-green-600',
  
  // Information & Navigation
  'information': 'from-blue-500 to-sky-600',
  'navigation': 'from-slate-500 to-gray-600',
  
  // Safety & Payment
  'safety': 'from-red-500 to-rose-600',
  'payment': 'from-yellow-500 to-orange-600',
  
  // Building & Social
  'building': 'from-stone-500 to-slate-600',
  'social': 'from-fuchsia-500 to-pink-600',
};

/**
 * Solid color mappings by icon category (fallback for non-gradient)
 */
const CATEGORY_COLORS: Record<string, string> = {
  'core': '#3b82f6',
  'amenities': '#10b981',
  'facilities': '#06b6d4',
  'room': '#0ea5e9',
  'services': '#8b5cf6',
  'business': '#6366f1',
  'dining': '#f59e0b',
  'bathroom': '#14b8a6',
  'checkin': '#22c55e',
  'entertainment': '#ec4899',
  'outdoor': '#84cc16',
  'information': '#3b82f6',
  'navigation': '#64748b',
  'safety': '#ef4444',
  'payment': '#eab308',
  'building': '#78716c',
  'social': '#d946ef',
  'laundry': '#38bdf8',
  'misc': '#a855f7',
};

/**
 * Get gradient class for an icon based on its name
 */
export const getIconGradient = (iconName: string): string => {
  if (!iconName) return CATEGORY_GRADIENTS['core'] || 'from-gray-500 to-gray-600';
  
  // Try to find icon in library and get its category
  const categories = Object.keys(CATEGORY_GRADIENTS);
  
  for (const category of categories) {
    const iconsInCategory = getIconsByCategory(category);
    const found = iconsInCategory.find(ic => ic.name === iconName);
    if (found) {
      return CATEGORY_GRADIENTS[category] || 'from-gray-500 to-gray-600';
    }
  }
  
  // Fallback: try to guess from icon name
  const nameLower = iconName.toLowerCase();
  
  if (nameLower.includes('food') || nameLower.includes('restaurant') || nameLower.includes('dining')) {
    return CATEGORY_GRADIENTS['dining'];
  }
  if (nameLower.includes('pool') || nameLower.includes('spa') || nameLower.includes('gym')) {
    return CATEGORY_GRADIENTS['amenities'];
  }
  if (nameLower.includes('check') || nameLower.includes('key') || nameLower.includes('door')) {
    return CATEGORY_GRADIENTS['checkin'];
  }
  if (nameLower.includes('park') || nameLower.includes('garden') || nameLower.includes('outdoor')) {
    return CATEGORY_GRADIENTS['outdoor'];
  }
  
  // Default gradient
  return 'from-slate-500 to-gray-600';
};

/**
 * Get solid color for an icon based on its name (for non-gradient uses)
 */
export const getIconColor = (iconName: string): string => {
  if (!iconName) return CATEGORY_COLORS['core'] || '#64748b';
  
  // Try to find icon in library and get its category
  const categories = Object.keys(CATEGORY_COLORS);
  
  for (const category of categories) {
    const iconsInCategory = getIconsByCategory(category);
    const found = iconsInCategory.find(ic => ic.name === iconName);
    if (found) {
      return CATEGORY_COLORS[category] || '#64748b';
    }
  }
  
  // Fallback: try to guess from icon name
  const nameLower = iconName.toLowerCase();
  
  if (nameLower.includes('food') || nameLower.includes('restaurant') || nameLower.includes('dining')) {
    return CATEGORY_COLORS['dining'];
  }
  if (nameLower.includes('pool') || nameLower.includes('spa') || nameLower.includes('gym')) {
    return CATEGORY_COLORS['amenities'];
  }
  if (nameLower.includes('check') || nameLower.includes('key') || nameLower.includes('door')) {
    return CATEGORY_COLORS['checkin'];
  }
  if (nameLower.includes('park') || nameLower.includes('garden') || nameLower.includes('outdoor')) {
    return CATEGORY_COLORS['outdoor'];
  }
  
  // Default color
  return '#64748b';
};

/**
 * Generate a deterministic color from string (for unknown icons)
 */
export const generateColorFromString = (str: string): string => {
  if (!str) return '#64748b';
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];
  
  return colors[Math.abs(hash) % colors.length];
};
