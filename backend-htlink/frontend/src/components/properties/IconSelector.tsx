// src/components/properties/IconSelector.tsx
import React, { useState, useRef, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleIconSelect = (iconName: string) => {
    onSelect(iconName);
    setIsOpen(false);
  };

  const selectedIconObject = icons.find(i => i.name === selectedIcon) || icons[0];

  return (
    <div className="relative" ref={selectorRef}>
      <div
        className="flex items-center gap-3 p-2.5 border border-slate-300 rounded-lg cursor-pointer bg-white hover:border-blue-400"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FontAwesomeIcon icon={selectedIconObject.icon} className="text-slate-600 w-5 text-center" />
        <span className="text-sm text-slate-500">Click to change</span>
      </div>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg">
          <div className="grid grid-cols-6 gap-1 p-2">
            {icons.map(({ name, icon }) => (
              <div
                key={name}
                className="flex items-center justify-center h-10 rounded-md hover:bg-slate-100 cursor-pointer"
                onClick={() => handleIconSelect(name)}
                title={name.replace('fa-', '').replace('-', ' ')}
              >
                <FontAwesomeIcon icon={icon} className="text-xl text-slate-600" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};