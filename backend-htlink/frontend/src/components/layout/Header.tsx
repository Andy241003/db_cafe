// src/components/layout/Header.tsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faBell } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatar?: string;
  email?: string;
}

interface HeaderProps {
  title: string;
  breadcrumb: string;
  user?: User;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  breadcrumb,
  user = {
    id: "1",
    name: "John Doe",
    role: "Owner",
    initials: "JD",
  },
  onSearch,
  onNotificationClick,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      onSearch?.(searchQuery);
    }
  };

  const handleNotifications = () => {
    onNotificationClick?.();
  };

  const handleLogout = () => {
    // In a real app, you'd clear tokens, etc.
    console.log("Logging out...");
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between fixed top-0 left-0 sm:left-64 right-0 z-[100]">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <div className="text-sm text-slate-500 hidden md:block">
          {breadcrumb}
        </div>
      </div>
    </header>
  );
};

export default Header;
