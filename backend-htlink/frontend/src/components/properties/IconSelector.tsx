// src/components/properties/IconSelector.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faBuilding, faHotel, faHome, faCrown, faGem, faStar,
  faMountain, faUmbrellaBeach, faTree, faLandmark, faChessRook, faCity,
  faUniversity, faMosque, faChurch, faSynagogue
} from '@fortawesome/free-solid-svg-icons';

interface IconSelectorProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
}

export const IconSelector: React.FC<IconSelectorProps> = ({
  selectedIcon,
  onSelect
}) => {
  const icons: { name: string; icon: IconProp }[] = [
    { name: 'fa-building', icon: faBuilding },
    { name: 'fa-hotel', icon: faHotel },
    { name: 'fa-home', icon: faHome },
    { name: 'fa-crown', icon: faCrown },
    { name: 'fa-gem', icon: faGem },
    { name: 'fa-star', icon: faStar },
    { name: 'fa-mountain', icon: faMountain },
    { name: 'fa-umbrella-beach', icon: faUmbrellaBeach },
    { name: 'fa-tree', icon: faTree },
    { name: 'fa-landmark', icon: faLandmark },
    { name: 'fa-chess-rook', icon: faChessRook },
    { name: 'fa-city', icon: faCity },
    { name: 'fa-university', icon: faUniversity },
    { name: 'fa-mosque', icon: faMosque },
    { name: 'fa-church', icon: faChurch },
    { name: 'fa-synagogue', icon: faSynagogue }
  ];

  // Removed click outside handler since we're using inline grid now

  const handleIconSelect = (iconName: string) => {
    console.log('Icon selected:', iconName);
    onSelect(iconName);
  };

  const selectedIconObject = icons.find(i => i.name === selectedIcon) || icons[0];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-2.5 border border-slate-300 rounded-lg bg-white">
        <FontAwesomeIcon icon={selectedIconObject.icon} className="text-slate-600 w-5 text-center" />
        <span className="text-sm text-slate-500">Current icon</span>
      </div>
      
      <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
        <div className="text-sm font-medium text-slate-700 mb-2">Choose an icon:</div>
        <div className="grid grid-cols-8 gap-2">
          {icons.map(({ name, icon }) => (
            <button
              key={name}
              type="button"
              className={`flex items-center justify-center h-8 w-8 rounded-md hover:bg-blue-100 cursor-pointer transition-colors border ${
                selectedIcon === name ? 'border-blue-500 bg-blue-50' : 'border-transparent'
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Icon selected:', name);
                handleIconSelect(name);
              }}
              title={name.replace('fa-', '').replace('-', ' ')}
            >
              <FontAwesomeIcon icon={icon} className="text-sm text-slate-600" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};