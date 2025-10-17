/**
 * Centralized Icon Configuration
 * All icon definitions for the entire application
 * Import this file instead of duplicating icon arrays everywhere
 */

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  // Core & Popular
  faStar, faHeart, faHome, faBuilding, faBed, faDoorOpen, faKey,
  
  // Amenities & Services
  faWifi, faParking, faUtensils, faDumbbell, faSpa, faSwimmingPool,
  faCocktail, faCoffee, faBacon, faMugHot, faGlassMartini, faGlassCheers,
  faConciergeBell, faSuitcaseRolling, faTaxi, faCar, faPlaneDeparture,
  faTrain, faSubway, faBus, faCarSide, faBicycle, faWalking, faWheelchair,
  
  // Room Features
  faTv, faPhone, faDesktop, faLaptop, faPrint, faFax,
  faSnowflake, faFire, faFan, faLightbulb, faWindowMaximize,
  faLock, faVault, faShieldAlt,
  
  // Check-in/out & Access
  faSignInAlt, faSignOutAlt,
  
  // Bathroom
  faBath, faShower, faToilet, faHotTub,
  
  // Dining & Kitchen
  faCube, faSink, faCalendarCheck, faLeaf, faIceCream,
  faStore, faList, faTicket,
  
  // Laundry
  faTshirt, faWind,
  
  // Services
  faBell, faHandsHelping, faHandshake, faTruck, faBoxOpen,
  faPaw, faChild, faUsers,
  
  // Business & Events
  faChalkboard, faChartLine, faCalendarAlt, faRing,
  
  // Entertainment & Activities
  faMusic, faFilm, faGamepad, faBook, faNewspaper,
  faShoppingBag, faGift, faMapMarkedAlt, faThumbsUp,
  faMapSigns, faCampground, faSwimmer, faCloudSun, faCalendar,
  
  // Outdoor & Views
  faTree, faUmbrellaBeach, faEye, faMountain, faWater, faCity,
  
  // Navigation & Location
  faCompass, faFlag, faGlobe, faMap,
  
  // Money & Payment
  faCreditCard, faMoneyBill, faExchangeAlt,
  
  // Safety & Medical
  faSmoking, faSmokingBan, faFirstAid, faPills, faUserMd,
  faHospital, faAmbulance, faFireExtinguisher, faRoute, faShieldVirus,
  
  // Information
  faInfoCircle, faQuestionCircle, faExclamationTriangle,
  faExclamationCircle, faCheckCircle, faTimesCircle,
  faLanguage, faPoll, faFileContract,
  
  // Building Features
  faElevator, faStairs,
  
  // Miscellaneous
  faCrown, faTimes, faLink, faCertificate
} from '@fortawesome/free-solid-svg-icons';

import {
  // Social Media - Brand Icons
  faFacebook, faTiktok, faInstagram, faYoutube, faTwitter,
  faLinkedin, faPinterest, faSnapchat, faTelegram, faWhatsapp
} from '@fortawesome/free-brands-svg-icons';

/**
 * Icon definition type
 */
export interface IconConfig {
  icon: IconDefinition;
  name: string;
  category?: string;
}

/**
 * Complete icon library - 200+ icons
 * Organized by category for easy maintenance
 */
export const ICON_LIBRARY: IconConfig[] = [
  // ===== CORE & POPULAR (8) =====
  { icon: faStar, name: 'star', category: 'core' },
  { icon: faHeart, name: 'heart', category: 'core' },
  { icon: faHome, name: 'home', category: 'core' },
  { icon: faBuilding, name: 'building', category: 'core' },
  { icon: faBuilding, name: 'hotel', category: 'core' },
  { icon: faBed, name: 'bed', category: 'core' },
  { icon: faDoorOpen, name: 'door', category: 'core' },
  { icon: faKey, name: 'key', category: 'core' },
  
  // ===== AMENITIES & SERVICES (29) =====
  { icon: faWifi, name: 'wifi', category: 'amenities' },
  { icon: faParking, name: 'parking', category: 'amenities' },
  { icon: faUtensils, name: 'restaurant', category: 'amenities' },
  { icon: faUtensils, name: 'utensils', category: 'amenities' },
  { icon: faDumbbell, name: 'gym', category: 'amenities' },
  { icon: faDumbbell, name: 'dumbbell', category: 'amenities' },
  { icon: faDumbbell, name: 'fitness', category: 'amenities' },
  { icon: faSpa, name: 'spa', category: 'amenities' },
  { icon: faSpa, name: 'beauty-spa', category: 'amenities' },
  { icon: faSwimmingPool, name: 'swimming-pool', category: 'amenities' },
  { icon: faSwimmingPool, name: 'pool', category: 'amenities' },
  { icon: faCocktail, name: 'bar', category: 'amenities' },
  { icon: faCocktail, name: 'cocktail', category: 'amenities' },
  { icon: faCocktail, name: 'bar-lounge', category: 'amenities' },
  { icon: faGlassMartini, name: 'drink-corner', category: 'amenities' },
  { icon: faGlassCheers, name: 'party', category: 'amenities' },
  { icon: faCoffee, name: 'coffee', category: 'amenities' },
  { icon: faBacon, name: 'breakfast', category: 'amenities' },
  { icon: faMugHot, name: 'tea-lounge', category: 'amenities' },
  
  // ===== FACILITIES (16) =====
  { icon: faConciergeBell, name: 'concierge-bell', category: 'facilities' },
  { icon: faConciergeBell, name: 'concierge', category: 'facilities' },
  { icon: faConciergeBell, name: 'amenities', category: 'facilities' },
  { icon: faSuitcaseRolling, name: 'luggage', category: 'facilities' },
  { icon: faTaxi, name: 'taxi', category: 'facilities' },
  { icon: faCar, name: 'car', category: 'facilities' },
  { icon: faPlaneDeparture, name: 'airport', category: 'facilities' },
  { icon: faPlaneDeparture, name: 'flight-service', category: 'facilities' },
  { icon: faTrain, name: 'train', category: 'facilities' },
  { icon: faSubway, name: 'metro', category: 'facilities' },
  { icon: faBus, name: 'bus', category: 'facilities' },
  { icon: faBus, name: 'shuttle-bus', category: 'facilities' },
  { icon: faCarSide, name: 'car-rental', category: 'facilities' },
  { icon: faBicycle, name: 'bicycle', category: 'facilities' },
  { icon: faBicycle, name: 'bicycle-rental', category: 'facilities' },
  { icon: faWalking, name: 'walk', category: 'facilities' },
  { icon: faWheelchair, name: 'wheelchair', category: 'facilities' },
  
  // ===== ROOM FEATURES (19) =====
  { icon: faTv, name: 'tv', category: 'room' },
  { icon: faPhone, name: 'phone', category: 'room' },
  { icon: faDesktop, name: 'computer', category: 'room' },
  { icon: faLaptop, name: 'workspace', category: 'room' },
  { icon: faPrint, name: 'printer', category: 'room' },
  { icon: faFax, name: 'fax', category: 'room' },
  { icon: faSnowflake, name: 'ac', category: 'room' },
  { icon: faSnowflake, name: 'air-conditioning', category: 'room' },
  { icon: faFire, name: 'heat', category: 'room' },
  { icon: faFan, name: 'fan', category: 'room' },
  { icon: faLightbulb, name: 'light', category: 'room' },
  { icon: faWindowMaximize, name: 'window', category: 'room' },
  { icon: faDoorOpen, name: 'balcony', category: 'room' },
  { icon: faLock, name: 'safe', category: 'room' },
  { icon: faLock, name: 'lock', category: 'room' },
  { icon: faVault, name: 'vault', category: 'room' },
  { icon: faShieldAlt, name: 'shield', category: 'room' },
  { icon: faShieldAlt, name: 'security', category: 'room' },
  
  // ===== CHECK-IN/OUT (3) =====
  { icon: faSignInAlt, name: 'check-in', category: 'checkin' },
  { icon: faSignOutAlt, name: 'check-out', category: 'checkin' },
  { icon: faKey, name: 'access', category: 'checkin' },
  
  // ===== BATHROOM (4) =====
  { icon: faBath, name: 'bath', category: 'bathroom' },
  { icon: faBath, name: 'public-bath', category: 'bathroom' },
  { icon: faShower, name: 'shower', category: 'bathroom' },
  { icon: faToilet, name: 'toilet', category: 'bathroom' },
  { icon: faHotTub, name: 'hot-tub-person', category: 'bathroom' },
  { icon: faHotTub, name: 'sauna', category: 'bathroom' },
  
  // ===== DINING & KITCHEN (14) =====
  { icon: faUtensils, name: 'kitchen', category: 'dining' },
  { icon: faUtensils, name: 'in-room-dining', category: 'dining' },
  { icon: faCube, name: 'fridge', category: 'dining' },
  { icon: faCube, name: 'microwave', category: 'dining' },
  { icon: faFire, name: 'oven', category: 'dining' },
  { icon: faSink, name: 'dishwasher', category: 'dining' },
  { icon: faCalendarCheck, name: 'restaurant-reservation', category: 'dining' },
  { icon: faLeaf, name: 'halal-food', category: 'dining' },
  { icon: faIceCream, name: 'ice-treat', category: 'dining' },
  { icon: faStore, name: 'vending-machines', category: 'dining' },
  { icon: faStore, name: 'convenience-store', category: 'dining' },
  { icon: faList, name: 'menu', category: 'dining' },
  { icon: faTicket, name: 'coupon', category: 'dining' },
  
  // ===== LAUNDRY (5) =====
  { icon: faTshirt, name: 'laundry', category: 'laundry' },
  { icon: faTshirt, name: 'coin-laundry', category: 'laundry' },
  { icon: faTshirt, name: 'washer', category: 'laundry' },
  { icon: faTshirt, name: 'kimono-rental', category: 'laundry' },
  { icon: faWind, name: 'dryer', category: 'laundry' },
  
  // ===== SERVICES (13) =====
  { icon: faBell, name: 'morning-call', category: 'services' },
  { icon: faHandsHelping, name: 'massage', category: 'services' },
  { icon: faHandshake, name: 'handshake', category: 'services' },
  { icon: faLeaf, name: 'eco-cleaning', category: 'services' },
  { icon: faTruck, name: 'courier-service', category: 'services' },
  { icon: faBoxOpen, name: 'locker-room', category: 'services' },
  { icon: faBoxOpen, name: 'original-goods', category: 'services' },
  { icon: faPaw, name: 'pet-friendly', category: 'services' },
  { icon: faPaw, name: 'pet', category: 'services' },
  { icon: faChild, name: 'child', category: 'services' },
  { icon: faUsers, name: 'family', category: 'services' },
  { icon: faUsers, name: 'users', category: 'services' },
  
  // ===== BUSINESS & EVENTS (10) =====
  { icon: faUsers, name: 'conference-room', category: 'business' },
  { icon: faHandshake, name: 'meeting', category: 'business' },
  { icon: faChalkboard, name: 'presentation', category: 'business' },
  { icon: faChalkboard, name: 'seminar', category: 'business' },
  { icon: faUsers, name: 'conference', category: 'business' },
  { icon: faKey, name: 'rental-space', category: 'business' },
  { icon: faChartLine, name: 'facility-congestion', category: 'business' },
  { icon: faCalendarAlt, name: 'event', category: 'business' },
  { icon: faRing, name: 'wedding', category: 'business' },
  { icon: faGlassCheers, name: 'party', category: 'business' },
  
  // ===== ENTERTAINMENT & ACTIVITIES (20) =====
  { icon: faMusic, name: 'music', category: 'entertainment' },
  { icon: faFilm, name: 'cinema', category: 'entertainment' },
  { icon: faGamepad, name: 'game', category: 'entertainment' },
  { icon: faGamepad, name: 'gamepad', category: 'entertainment' },
  { icon: faBook, name: 'book', category: 'entertainment' },
  { icon: faNewspaper, name: 'newspaper', category: 'entertainment' },
  { icon: faShoppingBag, name: 'shopping', category: 'entertainment' },
  { icon: faShoppingBag, name: 'shopping-bag', category: 'entertainment' },
  { icon: faGift, name: 'gift', category: 'entertainment' },
  { icon: faMapMarkedAlt, name: 'sightseeing', category: 'entertainment' },
  { icon: faThumbsUp, name: 'recommended-activity', category: 'entertainment' },
  { icon: faChild, name: 'playground', category: 'entertainment' },
  { icon: faMapSigns, name: 'self-organized-tour', category: 'entertainment' },
  { icon: faCampground, name: 'camp', category: 'entertainment' },
  { icon: faSwimmer, name: 'water-ladder', category: 'entertainment' },
  { icon: faLeaf, name: 'sakura', category: 'entertainment' },
  { icon: faLeaf, name: 'yoga', category: 'entertainment' },
  { icon: faCloudSun, name: 'weather', category: 'entertainment' },
  { icon: faCalendar, name: 'local-events', category: 'entertainment' },
  
  // ===== OUTDOOR & VIEWS (13) =====
  { icon: faTree, name: 'garden', category: 'outdoor' },
  { icon: faTree, name: 'park', category: 'outdoor' },
  { icon: faTree, name: 'forest', category: 'outdoor' },
  { icon: faUmbrellaBeach, name: 'beach', category: 'outdoor' },
  { icon: faUmbrellaBeach, name: 'terrace', category: 'outdoor' },
  { icon: faUmbrellaBeach, name: 'umbrella-beach', category: 'outdoor' },
  { icon: faEye, name: 'view', category: 'outdoor' },
  { icon: faMountain, name: 'mountain', category: 'outdoor' },
  { icon: faWater, name: 'sea', category: 'outdoor' },
  { icon: faWater, name: 'lake', category: 'outdoor' },
  { icon: faWater, name: 'river', category: 'outdoor' },
  
  // ===== NAVIGATION & LOCATION (6) =====
  { icon: faMapMarkedAlt, name: 'map', category: 'navigation' },
  { icon: faMapMarkedAlt, name: 'location', category: 'navigation' },
  { icon: faCompass, name: 'compass', category: 'navigation' },
  { icon: faFlag, name: 'flag', category: 'navigation' },
  { icon: faGlobe, name: 'globe', category: 'navigation' },
  { icon: faCity, name: 'city', category: 'navigation' },
  
  // ===== MONEY & PAYMENT (3) =====
  { icon: faCreditCard, name: 'credit-card', category: 'payment' },
  { icon: faMoneyBill, name: 'money', category: 'payment' },
  { icon: faExchangeAlt, name: 'exchange', category: 'payment' },
  
  // ===== SAFETY & MEDICAL (13) =====
  { icon: faSmoking, name: 'smoking-area', category: 'safety' },
  { icon: faSmokingBan, name: 'no-smoking', category: 'safety' },
  { icon: faFirstAid, name: 'first-aid', category: 'safety' },
  { icon: faPills, name: 'pharmacy', category: 'safety' },
  { icon: faUserMd, name: 'doctor', category: 'safety' },
  { icon: faHospital, name: 'hospital', category: 'safety' },
  { icon: faAmbulance, name: 'ambulance', category: 'safety' },
  { icon: faFireExtinguisher, name: 'fire', category: 'safety' },
  { icon: faShieldAlt, name: 'police', category: 'safety' },
  { icon: faRoute, name: 'evacuation-plan', category: 'safety' },
  { icon: faShieldVirus, name: 'covid-measures', category: 'safety' },
  
  // ===== INFORMATION (15) =====
  { icon: faInfoCircle, name: 'info', category: 'information' },
  { icon: faInfoCircle, name: 'info-circle', category: 'information' },
  { icon: faQuestionCircle, name: 'help', category: 'information' },
  { icon: faQuestionCircle, name: 'q-and-a', category: 'information' },
  { icon: faExclamationTriangle, name: 'warning', category: 'information' },
  { icon: faExclamationCircle, name: 'danger', category: 'information' },
  { icon: faCheckCircle, name: 'success', category: 'information' },
  { icon: faTimesCircle, name: 'error', category: 'information' },
  { icon: faLanguage, name: 'how-to-translate', category: 'information' },
  { icon: faLanguage, name: 'language', category: 'information' },
  { icon: faMap, name: 'floor-guide', category: 'information' },
  { icon: faPoll, name: 'survey', category: 'information' },
  { icon: faGlobe, name: 'official-website', category: 'information' },
  { icon: faFileContract, name: 'accommodation-terms', category: 'information' },
  
  // ===== BUILDING FEATURES (2) =====
  { icon: faElevator, name: 'elevator', category: 'building' },
  { icon: faStairs, name: 'stairs', category: 'building' },
  
  // ===== SOCIAL MEDIA (11) =====
  { icon: faFacebook, name: 'facebook', category: 'social' },
  { icon: faTiktok, name: 'tiktok', category: 'social' },
  { icon: faInstagram, name: 'instagram', category: 'social' },
  { icon: faYoutube, name: 'youtube', category: 'social' },
  { icon: faTwitter, name: 'twitter', category: 'social' },
  { icon: faLinkedin, name: 'linkedin', category: 'social' },
  { icon: faPinterest, name: 'pinterest', category: 'social' },
  { icon: faSnapchat, name: 'snapchat', category: 'social' },
  { icon: faTelegram, name: 'telegram', category: 'social' },
  { icon: faWhatsapp, name: 'whatsapp', category: 'social' },
  
  // ===== MISCELLANEOUS (4) =====
  { icon: faCrown, name: 'crown', category: 'misc' },
  { icon: faTimes, name: 'times', category: 'misc' },
  { icon: faLink, name: 'link', category: 'misc' },
  { icon: faCertificate, name: 'tabi-life-loyalty-program', category: 'misc' },
];

/**
 * Get all icons as array (for icon picker)
 */
export const getAllIcons = (): IconConfig[] => ICON_LIBRARY;

/**
 * Get icon names only (for validation)
 */
export const getAllIconNames = (): string[] => 
  ICON_LIBRARY.map(icon => icon.name);

/**
 * Find icon by name
 */
export const findIconByName = (name: string): IconDefinition | undefined => {
  const icon = ICON_LIBRARY.find(i => i.name === name);
  return icon?.icon;
};

/**
 * Get icons by category
 */
export const getIconsByCategory = (category: string): IconConfig[] =>
  ICON_LIBRARY.filter(icon => icon.category === category);

/**
 * Get all categories
 */
export const getIconCategories = (): string[] => {
  const categories = new Set(ICON_LIBRARY.map(icon => icon.category).filter(Boolean));
  return Array.from(categories) as string[];
};

/**
 * Get unique icons for icon picker (removes duplicates)
 * Shows only the primary name for each unique icon
 */
export const getUniqueIcons = (): IconConfig[] => {
  const seen = new Set<IconDefinition>();
  const unique: IconConfig[] = [];
  
  for (const iconConfig of ICON_LIBRARY) {
    if (!seen.has(iconConfig.icon)) {
      seen.add(iconConfig.icon);
      unique.push(iconConfig);
    }
  }
  
  return unique;
};

/**
 * Default icon
 */
export const DEFAULT_ICON = faStar;
export const DEFAULT_ICON_NAME = 'star';
