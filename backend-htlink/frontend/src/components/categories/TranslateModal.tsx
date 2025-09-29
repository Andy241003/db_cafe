// src/components/categories/TranslateModal.tsx
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Category, Language } from "../../types/categories";

interface TranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onAcceptTranslation: (
    categoryId: number,
    targetLang: Language,
    translatedData: { title: string; description: string }
  ) => void;
}

const AVAILABLE_LANGS = [
  { code: "vi" as Language, flag: "🇻🇳", label: "Vietnamese" },
  { code: "en" as Language, flag: "🇺🇸", label: "English" },
  { code: "ja" as Language, flag: "🇯🇵", label: "Japanese" },
  { code: "kr" as Language, flag: "🇰🇷", label: "Korean" },
  { code: "fr" as Language, flag: "🇫🇷", label: "French" },
];

export const TranslateModal: React.FC<TranslateModalProps> = ({
  isOpen,
  onClose,
  category,
  onAcceptTranslation,
}) => {
  const [activeTab, setActiveTab] = useState<Language>("vi");
  const [activeTabs, setActiveTabs] = useState<Language[]>(["vi", "en", "ja"]);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [translatedContent, setTranslatedContent] = useState<
    Record<Language, { title: string; description: string }>
  >({
    vi: { title: "", description: "" },
    en: { title: "", description: "" },
    ja: { title: "", description: "" },
    kr: { title: "", description: "" },
    fr: { title: "", description: "" },
  });

  // Lấy dữ liệu thật từ category.translations khi mở modal
  useEffect(() => {
    if (category && isOpen) {
      const data: Record<Language, { title: string; description: string }> = {
        vi: {
          title: category.translations?.vi?.title || "",
          description: category.translations?.vi?.description || "",
        },
        en: {
          title: category.translations?.en?.title || "",
          description: category.translations?.en?.description || "",
        },
        ja: {
          title: category.translations?.ja?.title || "",
          description: category.translations?.ja?.description || "",
        },
        kr: {
          title: category.translations?.kr?.title || "",
          description: category.translations?.kr?.description || "",
        },
        fr: {
          title: category.translations?.fr?.title || "",
          description: category.translations?.fr?.description || "",
        },
      };
      setTranslatedContent(data);
    }
  }, [category, isOpen]);

  // Click outside để đóng dropdown
  useEffect(() => {
    if (showLangDropdown) {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node) &&
          !buttonRef.current?.contains(e.target as Node)
        ) {
          setShowLangDropdown(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showLangDropdown]);

  // Reset khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      setShowLangDropdown(false);
      setActiveTab("vi");
      setActiveTabs(["vi", "en", "ja"]);
    }
  }, [isOpen]);

  if (!isOpen || !category) return null;

  const handleTabChange = (lang: Language) => setActiveTab(lang);

  const handleAddLanguageTab = (lang: Language) => {
    if (!activeTabs.includes(lang)) {
      setActiveTabs([...activeTabs, lang]);
      setActiveTab(lang);

      setTranslatedContent((prev) => ({
        ...prev,
        [lang]: {
          title: category.translations?.[lang]?.title || "",
          description: category.translations?.[lang]?.description || "",
        },
      }));
    }
    setShowLangDropdown(false);
  };

  const getOriginalContent = () => {
    const originalLang: Language = activeTab === "en" ? "vi" : "en";
    return translatedContent[originalLang];
  };

  const getTranslatedContent = () => translatedContent[activeTab];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">AI Translation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 flex gap-2 border-b border-gray-200 bg-gray-50">
          {activeTabs.map((lang) => {
            const info = AVAILABLE_LANGS.find((l) => l.code === lang);
            return (
              <button
                key={lang}
                onClick={() => handleTabChange(lang)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                  activeTab === lang
                    ? "bg-blue-500 text-white"
                    : "bg-white border border-gray-300 text-gray-700"
                }`}
              >
                {info?.flag} {lang.toUpperCase()}
              </button>
            );
          })}

          <button
            ref={buttonRef}
            onClick={() => {
              setButtonRect(buttonRef.current?.getBoundingClientRect() || null);
              setShowLangDropdown((prev) => !prev);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full"
          >
            +
          </button>
        </div>

        {/* Dropdown */}
        {showLangDropdown &&
          buttonRect &&
          createPortal(
            <div
              ref={dropdownRef}
              className="bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]"
              style={{
                position: "fixed",
                top: buttonRect.bottom + 8,
                left: buttonRect.left,
              }}
            >
              <ul>
                {AVAILABLE_LANGS.filter(
                  (l) => !activeTabs.includes(l.code)
                ).map((lang) => (
                  <li
                    key={lang.code}
                    onClick={() => handleAddLanguageTab(lang.code)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex gap-2 items-center"
                  >
                    {lang.flag} {lang.label}
                  </li>
                ))}
              </ul>
            </div>,
            document.body
          )}

        {/* Content */}
        <div className="p-6 flex-grow overflow-auto">
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Original Content
            </label>
            <div className="p-4 bg-gray-50 border rounded-lg">
              <div className="font-semibold">{getOriginalContent().title}</div>
              <div>{getOriginalContent().description}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Translation ({activeTab.toUpperCase()})
            </label>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-semibold mb-2">
                {getTranslatedContent().title}
              </div>
              <div>{getTranslatedContent().description}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-gray-700 bg-white"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              category &&
              onAcceptTranslation(category.id, activeTab, getTranslatedContent())
            }
            className="px-4 py-2 rounded-md bg-green-600 text-white"
          >
            Use Translation
          </button>
        </div>
      </div>
    </div>
  );
};
