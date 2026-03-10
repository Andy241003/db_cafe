import { faImages, faVrCardboard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Form, Input, InputNumber, Popconfirm, Select, Tag } from 'antd';
import { Coffee, Edit, Eye, Info, Play, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import MediaPickerModal from '../../components/MediaPickerModal';
import { cafeLanguagesApi, cafeMenuApi, cafeSettingsApi, type CategoryTranslation, type ItemTranslation, type MenuCategory, type MenuCategoryCreate, type MenuItem, type MenuItemCreate } from '../../services/cafeApi';
import { getApiBaseUrl } from '../../utils/api';

const { TextArea } = Input;

const LANGUAGE_CONFIG: Record<string, { name: string; flag: string }> = {
  vi: { name: 'Tiếng Việt', flag: '🇻🇳' },
  en: { name: 'English', flag: '🇬🇧' },
  zh: { name: '中文', flag: '🇨🇳' },
  ja: { name: '日本語', flag: '🇯🇵' },
  ko: { name: '한국어', flag: '🇰🇷' },
  th: { name: 'ไทย', flag: '🇹🇭' },
  fr: { name: 'Français', flag: '🇫🇷' },
};

const CafeMenu: React.FC = () => {
  // Categories state
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [categoryForm] = Form.useForm();

  // Menu Items state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);
  const [menuItemModalVisible, setMenuItemModalVisible] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuItemForm] = Form.useForm();
  
  // Media picker state
  const [mediaPickerVisible, setMediaPickerVisible] = useState(false);
  const [mediaPickerMode, setMediaPickerMode] = useState<'category-icon' | 'item-image'>('item-image');
  const [selectedCategoryIconId, setSelectedCategoryIconId] = useState<number | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);
  const [primaryImageId, setPrimaryImageId] = useState<number | null>(null);

  // Multi-language form state
  const [categoryTranslations, setCategoryTranslations] = useState<Record<string, CategoryTranslation>>({});
  const [itemTranslations, setItemTranslations] = useState<Record<string, ItemTranslation>>({});
  const [currentCategoryLocale, setCurrentCategoryLocale] = useState('vi');
  const [currentItemLocale, setCurrentItemLocale] = useState('vi');
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['vi', 'en']);

  // Temporary state for category form when media picker is open
  const [tempCategoryFormData, setTempCategoryFormData] = useState<any>(null);

  // Drag & drop state
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [tempMenuItemFormData, setTempMenuItemFormData] = useState<any>(null);

  // Display status state
  const [isDisplaying, setIsDisplaying] = useState(true);
  const [savingDisplayStatus, setSavingDisplayStatus] = useState(false);
  const [vr360Link, setVr360Link] = useState('');
  const [vrTitle, setVrTitle] = useState('');
  const [savingVR, setSavingVR] = useState(false);

  useEffect(() => {
    loadCategories();
    loadLanguageSettings();
    loadMenuItems(); // Load items on mount
  }, []);

  // Restore category form when returning from media picker
  useEffect(() => {
    if (categoryModalVisible && tempCategoryFormData) {
      // Restore form values
      categoryForm.setFieldsValue(tempCategoryFormData.formValues);
      setCategoryTranslations(tempCategoryFormData.translations);
      setCurrentCategoryLocale(tempCategoryFormData.locale);
      setEditingCategory(tempCategoryFormData.editingCategory);
    }
  }, [categoryModalVisible, tempCategoryFormData]);

  // Restore menu item form when returning from media picker
  useEffect(() => {
    if (menuItemModalVisible && tempMenuItemFormData) {
      // Restore form values
      menuItemForm.setFieldsValue(tempMenuItemFormData.formValues);
      setItemTranslations(tempMenuItemFormData.translations);
      setCurrentItemLocale(tempMenuItemFormData.locale);
      setEditingMenuItem(tempMenuItemFormData.editingMenuItem);
    }
  }, [menuItemModalVisible, tempMenuItemFormData]);

  const loadLanguageSettings = async () => {
    try {
      const langs = await cafeLanguagesApi.getLanguageCodes();
      if (langs && langs.length > 0) {
        setSupportedLanguages(langs);
      }
      
      const settings = await cafeSettingsApi.getSettings();
      const displayStatus = settings.settings_json?.menu_is_displaying ?? true;
      setIsDisplaying(displayStatus);
      setVr360Link(settings.settings_json?.menu_vr360_link || '');
      setVrTitle(settings.settings_json?.menu_vr_title || '');
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await cafeMenuApi.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
      console.error(error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadMenuItems = async () => {
    setMenuItemsLoading(true);
    try {
      const data = await cafeMenuApi.getItems();
      setMenuItems(data);
    } catch (error) {
      toast.error('Failed to load menu items');
      console.error(error);
    } finally {
      setMenuItemsLoading(false);
    }
  };

  const convertToEmbedUrl = (url: string): string => {
    if (!url) return url;
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };

  const handleVR360Change = async (field: 'link' | 'title', value: string) => {
    try {
      setSavingVR(true);
      const currentSettings = await cafeSettingsApi.getSettings();
      const updates = { ...currentSettings.settings_json };
      
      if (field === 'link') {
        const embedUrl = convertToEmbedUrl(value);
        updates.menu_vr360_link = embedUrl;
        setVr360Link(embedUrl);
      } else {
        updates.menu_vr_title = value;
        setVrTitle(value);
      }
      
      await cafeSettingsApi.updateSettings({ settings_json: updates });
      toast.success('VR360 settings saved');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save VR360 settings');
    } finally {
      setSavingVR(false);
    }
  };

  // Category handlers
  const handleAddCategory = () => {
    setEditingCategory(null);
    categoryForm.resetFields();
    setSelectedCategoryIconId(null);
    const emptyTranslations: Record<string, CategoryTranslation> = {};
    supportedLanguages.forEach(lang => {
      emptyTranslations[lang] = { locale: lang, name: '', description: '' };
    });
    setCategoryTranslations(emptyTranslations);
    setCurrentCategoryLocale(supportedLanguages[0] || 'vi');
    categoryForm.setFieldsValue({ is_active: true, display_order: categories.length + 1 });
    setCategoryModalVisible(true);
  };

  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    setSelectedCategoryIconId(category.icon_media_id || null);
    const translationsObj: Record<string, CategoryTranslation> = {};
    category.translations.forEach(t => {
      translationsObj[t.locale] = t;
    });
    supportedLanguages.forEach(lang => {
      if (!translationsObj[lang]) {
        translationsObj[lang] = { locale: lang, name: '', description: '' };
      }
    });
    setCategoryTranslations(translationsObj);
    setCurrentCategoryLocale(supportedLanguages[0] || 'vi');
    categoryForm.setFieldsValue({
      code: category.code,
      display_order: category.display_order,
      is_active: category.is_active
    });
    setCategoryModalVisible(true);
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await cafeMenuApi.deleteCategory(id);
      toast.success('Category deleted successfully');
      loadCategories();
      loadMenuItems();
    } catch (error) {
      toast.error('Failed to delete category');
      console.error(error);
    }
  };

  const handleCategorySubmit = async (values: any) => {
    try {
      const translations = Object.values(categoryTranslations).filter(t => t.name.trim() !== '');
      
      if (translations.length === 0) {
        toast.error('Please provide at least one translation');
        return;
      }

      const submitData: MenuCategoryCreate = {
        code: values.code || `cat_${Date.now()}`,
        icon_media_id: selectedCategoryIconId || undefined,
        display_order: values.display_order,
        is_active: values.is_active,
        translations
      };

      console.log('📤 Submitting category:', submitData);

      if (editingCategory) {
        await cafeMenuApi.updateCategory(editingCategory.id, submitData);
        toast.success('Category updated successfully');
      } else {
        await cafeMenuApi.createCategory(submitData);
        toast.success('Category created successfully');
      }
      setCategoryModalVisible(false);
      setTempCategoryFormData(null);
      loadCategories();
    } catch (error: any) {
      console.error('❌ Category submit error:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to save category';
      toast.error(errorMsg);
    }
  };

  // Menu Item handlers
  const handleAddMenuItem = (categoryId?: number) => {
    setEditingMenuItem(null);
    menuItemForm.resetFields();
    const emptyTranslations: Record<string, ItemTranslation> = {};
    supportedLanguages.forEach(lang => {
      emptyTranslations[lang] = { locale: lang, name: '', description: '', ingredients: '' };
    });
    setItemTranslations(emptyTranslations);
    setCurrentItemLocale(supportedLanguages[0] || 'vi');
    
    // Get display order based on category
    const catItems = categoryId ? menuItems.filter(item => item.category_id === categoryId) : menuItems;
    
    menuItemForm.setFieldsValue({ 
      category_id: categoryId,
      status: 'available',
      is_bestseller: false,
      is_new: false,
      is_seasonal: false,
      display_order: catItems.length + 1 
    });
    setSelectedImageIds([]);
    setPrimaryImageId(null);
    setMenuItemModalVisible(true);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    const translationsObj: Record<string, ItemTranslation> = {};
    item.translations.forEach(t => {
      translationsObj[t.locale] = t;
    });
    supportedLanguages.forEach(lang => {
      if (!translationsObj[lang]) {
        translationsObj[lang] = { locale: lang, name: '', description: '', ingredients: '' };
      }
    });
    setItemTranslations(translationsObj);
    setCurrentItemLocale(supportedLanguages[0] || 'vi');
    
    // Load images if available
    if (item.image_media_id) {
      setSelectedImageIds([item.image_media_id]);
      setPrimaryImageId(item.image_media_id);
    } else {
      setSelectedImageIds([]);
      setPrimaryImageId(null);
    }
    
    menuItemForm.setFieldsValue({
      code: item.code,
      category_id: item.category_id,
      price: item.price,
      original_price: item.original_price,
      status: item.status,
      is_bestseller: item.is_bestseller,
      is_new: item.is_new,
      is_seasonal: item.is_seasonal,
      display_order: item.display_order,
      calories: item.calories
    });
    
    // Load images if available
    if (item.image_media_id) {
      setSelectedImageIds([item.image_media_id]);
      setPrimaryImageId(item.image_media_id);
    } else if (item.primary_image_media_id) {
      setSelectedImageIds([item.primary_image_media_id]);
      setPrimaryImageId(item.primary_image_media_id);
    } else {
      setSelectedImageIds([]);
      setPrimaryImageId(null);
    }
    
    setMenuItemModalVisible(true);
  };

  const handleDeleteMenuItem = async (id: number) => {
    try {
      await cafeMenuApi.deleteItem(id);
      toast.success('Menu item deleted successfully');
      loadMenuItems();
    } catch (error) {
      toast.error('Failed to delete menu item');
      console.error(error);
    }
  };

  const handleMenuItemSubmit = async (values: any) => {
    try {
      const translations = Object.values(itemTranslations).filter(t => t.name.trim() !== '');
      
      if (translations.length === 0) {
        toast.error('Please provide at least one translation');
        return;
      }

      const submitData: MenuItemCreate = {
        code: values.code || `item_${Date.now()}`,
        category_id: values.category_id,
        price: values.price,
        original_price: values.original_price,
        status: values.status,
        is_bestseller: values.is_bestseller,
        is_new: values.is_new,
        is_seasonal: values.is_seasonal,
        display_order: values.display_order,
        calories: values.calories,
        primary_image_media_id: primaryImageId || selectedImageIds[0] || undefined,
        translations
      };
      
      if (editingMenuItem) {
        await cafeMenuApi.updateItem(editingMenuItem.id, submitData);
        toast.success('Menu item updated successfully');
      } else {
        await cafeMenuApi.createItem(submitData);
        toast.success('Menu item created successfully');
      }
      setMenuItemModalVisible(false);
      loadMenuItems();
    } catch (error) {
      toast.error('Failed to save menu item');
      console.error(error);
    }
  };

  const handleMediaSelect = (mediaId: number) => {
    if (mediaPickerMode === 'category-icon') {
      setSelectedCategoryIconId(mediaId);
      // Restore category modal if it was temporarily closed
      if (tempCategoryFormData) {
        setCategoryModalVisible(true);
        setTempCategoryFormData(null);
      }
    }
    setMediaPickerVisible(false);
  };

  const handleMultipleMediaSelect = (mediaIds: number[]) => {
    // Add new images that aren't already selected
    const newImageIds = mediaIds.filter(id => !selectedImageIds.includes(id));
    if (newImageIds.length > 0) {
      setSelectedImageIds(prev => [...prev, ...newImageIds]);
      // Set first new image as primary if no primary exists
      if (!primaryImageId && newImageIds.length > 0) {
        setPrimaryImageId(newImageIds[0]);
      }
    }
    // Restore menu item modal if it was temporarily closed
    if (tempMenuItemFormData) {
      setMenuItemModalVisible(true);
      setTempMenuItemFormData(null);
    }
    setMediaPickerVisible(false);
  };

  const handleOpenMediaPickerForCategory = () => {
    // Save current form state
    const currentFormValues = categoryForm.getFieldsValue();
    setTempCategoryFormData({
      formValues: currentFormValues,
      translations: { ...categoryTranslations },
      locale: currentCategoryLocale,
      editingCategory: editingCategory
    });
    // Close category modal and open media picker
    setCategoryModalVisible(false);
    setMediaPickerMode('category-icon');
    setMediaPickerVisible(true);
  };

  const handleOpenMediaPickerForMenuItem = () => {
    // Save current form state
    const currentFormValues = menuItemForm.getFieldsValue();
    setTempMenuItemFormData({
      formValues: currentFormValues,
      translations: { ...itemTranslations },
      locale: currentItemLocale,
      editingMenuItem: editingMenuItem
    });
    // Close menu item modal and open media picker
    setMenuItemModalVisible(false);
    setMediaPickerMode('item-image');
    setMediaPickerVisible(true);
  };

  const handleCategoryModalClose = () => {
    setCategoryModalVisible(false);
    setTempCategoryFormData(null); // Clear temp data when manually closing
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCategoryIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedCategoryIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedCategoryIndex === null || draggedCategoryIndex === dropIndex) return;

    const newCategories = [...categories];
    const [draggedItem] = newCategories.splice(draggedCategoryIndex, 1);
    newCategories.splice(dropIndex, 0, draggedItem);

    // Update display_order for all affected categories
    const updatePromises = newCategories.map((cat, idx) => 
      cafeMenuApi.updateCategory(cat.id, { display_order: idx + 1 })
    );

    Promise.all(updatePromises)
      .then(() => {
        setCategories(newCategories);
        toast.success('Category order updated');
      })
      .catch((error) => {
        console.error('Failed to update order:', error);
        toast.error('Failed to update category order');
        loadCategories(); // Reload to reset
      });

    setDraggedCategoryIndex(null);
  };

  const getBadgeForItem = (item: MenuItem) => {
    if (item.is_new) return { text: 'NEW', class: 'bg-green-500' };
    if (item.is_bestseller) return { text: 'HOT', class: 'bg-red-500' };
    if (item.is_seasonal) return { text: 'SEASON', class: 'bg-yellow-500' };
    return null;
  };

  const handleMenuItemModalClose = () => {
    setMenuItemModalVisible(false);
    setTempMenuItemFormData(null); // Clear temp data when manually closing
  };

  return (
    <div className="space-y-6 pt-6 px-6 pb-6">
      {/* Display Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Display Status - Menu Section</h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isDisplaying ? 'text-green-600' : 'text-slate-500'}`}>
              {isDisplaying ? 'Displaying' : 'Hidden'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isDisplaying}
                onChange={async (e) => {
                  const newValue = e.target.checked;
                  try {
                    setSavingDisplayStatus(true);
                    const currentSettings = await cafeSettingsApi.getSettings();
                    await cafeSettingsApi.updateSettings({
                      settings_json: {
                        ...currentSettings.settings_json,
                        menu_is_displaying: newValue
                      }
                    });
                    setIsDisplaying(newValue);
                    toast.success(newValue ? 'Menu section enabled' : 'Menu section disabled');
                  } catch (error: any) {
                    toast.error(error.response?.data?.detail || 'Failed to update display status');
                  } finally {
                    setSavingDisplayStatus(false);
                  }
                }}
                disabled={savingDisplayStatus}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
            </label>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Coffee className="text-blue-600 text-xl mt-0.5" />
          <span className="text-blue-800 text-sm">
            When display is turned off, the "Menu" section will not appear on the website. You can still edit and manage menu items.
          </span>
        </div>
      </div>

      {/* VR360 Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center gap-3">
          <FontAwesomeIcon icon={faVrCardboard} className="text-purple-600 text-xl" />
          <h2 className="text-xl font-bold text-slate-800">VR360 Settings</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Link VR360 Panorama / YouTube Video
            </label>
            <input
              type="url"
              placeholder="https://example.com/panorama.jpg or https://youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={vr360Link}
              onChange={(e) => handleVR360Change('link', e.target.value)}
              disabled={savingVR}
            />
            <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
              <Info className="mt-0.5 w-4 h-4" />
              <span>
                Enter the URL to a 360° panorama image (equirectangular JPG, min 4096x2048px) or YouTube video URL
              </span>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">VR Tour Title</label>
            <input
              type="text"
              placeholder="Enter VR tour title"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={vrTitle}
              onChange={(e) => handleVR360Change('title', e.target.value)}
              disabled={savingVR}
            />
          </div>
          
          {vr360Link && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="text-slate-600 w-5 h-5" />
                <h3 className="text-sm font-medium text-slate-700">VR360 Preview</h3>
              </div>
              
              <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                <div className="relative w-full" style={{ height: '500px' }}>
                  <iframe
                    src={vr360Link}
                    className="absolute top-0 left-0 w-full h-full"
                    allowFullScreen
                    title="VR360 Preview"
                    allow="xr-spatial-tracking; gyroscope; accelerometer"
                  />
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => window.open(vr360Link, '_blank')}
                  className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  View Fullscreen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 mt-1">Manage your cafe menu categories and items with multi-language support</p>
        </div>
      </div>

      {/* Card-based Categories & Items */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAddCategory}
            className="bg-blue-600 hover:bg-blue-700"
            size="large"
          >
            Add Category
          </Button>
        </div>

        {categoriesLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-slate-500">Loading categories...</div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Coffee className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">No categories yet</p>
            <p className="text-sm">Click "Add Category" to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category, catIndex) => {
              const catItems = menuItems.filter(item => item.category_id === category.id);
              const catName = category.translations.find(t => t.locale === 'vi')?.name || 
                            category.translations.find(t => t.locale === 'en')?.name || 
                            category.code;
              const catDesc = category.translations.find(t => t.locale === 'vi')?.description || '';

              return (
                <div
                  key={category.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, catIndex)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, catIndex)}
                  className={`border-2 rounded-xl transition-all duration-200 ${
                    draggedCategoryIndex === catIndex 
                      ? 'border-blue-500 shadow-2xl opacity-50' 
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Category Header */}
                  <div className="bg-gradient-to-r from-slate-50 to-white p-5 border-b border-slate-200 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="cursor-move text-slate-400 hover:text-slate-600">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                          </svg>
                        </div>
                        
                        {category.icon_media_id ? (
                          <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md bg-white border-2 border-slate-200">
                            <img 
                              src={`${getApiBaseUrl()}/media/${category.icon_media_id}/view`}
                              alt={catName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-md">
                            <Coffee className="w-7 h-7 text-blue-600" />
                          </div>
                        )}

                        <div>
                          <h3 className="text-xl font-bold text-slate-800">{catName}</h3>
                          {catDesc && <p className="text-sm text-slate-500 mt-0.5">{catDesc}</p>}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {catItems.length} món
                            </span>
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                              {category.code}
                            </code>
                            {!category.is_active && (
                              <Tag color="red" className="text-xs">Inactive</Tag>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAddMenuItem(category.id)}
                          icon={<Plus className="w-4 h-4" />}
                          className="bg-green-600 hover:bg-green-700 text-white border-0"
                        >
                          Thêm Món
                        </Button>
                        <Button
                          onClick={() => handleEditCategory(category)}
                          icon={<Edit className="w-4 h-4" />}
                          className="border-slate-300 hover:border-blue-500"
                        />
                        <Popconfirm
                          title="Delete Category"
                          description="Xóa danh mục này? Tất cả món ăn trong danh mục sẽ bị ảnh hưởng."
                          onConfirm={() => handleDeleteCategory(category.id)}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            danger
                            icon={<Trash2 className="w-4 h-4" />}
                          />
                        </Popconfirm>
                      </div>
                    </div>
                  </div>

                  {/* Items Grid */}
                  <div className="p-5 bg-white rounded-b-xl">
                    {catItems.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                        <Coffee className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Chưa có món nào trong danh mục này</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {catItems.map((item) => {
                          const itemName = item.translations.find(t => t.locale === 'vi')?.name || 
                                         item.translations.find(t => t.locale === 'en')?.name || 
                                         'Untitled';
                          const itemDesc = item.translations.find(t => t.locale === 'vi')?.description || '';
                          const badge = getBadgeForItem(item);

                          return (
                            <div
                              key={item.id}
                              className="group border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 bg-white relative"
                            >
                              {badge && (
                                <span className={`absolute top-2 right-2 z-10 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg ${badge.class}`}>
                                  {badge.text}
                                </span>
                              )}

                              {item.primary_image_media_id ? (
                                <div className="aspect-square overflow-hidden bg-slate-100">
                                  <img 
                                    src={`${getApiBaseUrl()}/media/${item.primary_image_media_id}/view`}
                                    alt={itemName}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                </div>
                              ) : (
                                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                  <Coffee className="w-12 h-12 text-slate-400" />
                                </div>
                              )}

                              <div className="p-3">
                                <h4 className="font-semibold text-slate-800 mb-1 line-clamp-1">{itemName}</h4>
                                {itemDesc && (
                                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">{itemDesc}</p>
                                )}
                                
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold text-blue-600">
                                      {item.price?.toLocaleString()}đ
                                    </span>
                                    {item.original_price && item.original_price > item.price && (
                                      <span className="text-xs text-slate-400 line-through">
                                        {item.original_price.toLocaleString()}đ
                                      </span>
                                    )}
                                  </div>
                                  {item.status !== 'available' && (
                                    <Tag color={item.status === 'sold_out' ? 'red' : 'orange'} className="text-xs">
                                      {item.status === 'sold_out' ? 'Hết' : 'Ngừng'}
                                    </Tag>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    size="small"
                                    onClick={() => handleEditMenuItem(item)}
                                    icon={<Edit className="w-3 h-3" />}
                                    className="flex-1 text-xs"
                                  >
                                    Sửa
                                  </Button>
                                  <Popconfirm
                                    title="Xóa món này?"
                                    onConfirm={() => handleDeleteMenuItem(item.id)}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                  >
                                    <Button
                                      size="small"
                                      danger
                                      icon={<Trash2 className="w-3 h-3" />}
                                      className="text-xs"
                                    />
                                  </Popconfirm>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Modal */}
      {categoryModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header - Sticky */}
            <div className="border-b border-slate-200 p-6 flex items-center justify-between bg-white sticky top-0 z-10">
              <h3 className="text-xl font-bold text-slate-800">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <button
                onClick={handleCategoryModalClose}
                className="text-slate-400 hover:text-slate-600 text-2xl transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6">
              {/* Language Tabs */}
              <div className="flex gap-2 mb-6 border-b border-slate-200">
                {supportedLanguages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setCurrentCategoryLocale(lang)}
                    className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                      currentCategoryLocale === lang
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <span className="text-lg">{LANGUAGE_CONFIG[lang]?.flag}</span>
                    {LANGUAGE_CONFIG[lang]?.name}
                  </button>
                ))}
              </div>

              <Form
                form={categoryForm}
                layout="vertical"
                onFinish={handleCategorySubmit}
              >
                {/* Translation Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category Name {currentCategoryLocale === 'vi' && <span className="text-red-500">*</span>}
                    </label>
                    <Input
                      placeholder={`Ex: Coffee, Tea, Desserts`}
                      value={categoryTranslations[currentCategoryLocale]?.name || ''}
                      onChange={(e) => {
                        setCategoryTranslations(prev => ({
                          ...prev,
                          [currentCategoryLocale]: { ...prev[currentCategoryLocale], locale: currentCategoryLocale, name: e.target.value }
                        }));
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description (Optional)
                    </label>
                    <TextArea
                      rows={3}
                      placeholder={`Enter a brief description...`}
                      value={categoryTranslations[currentCategoryLocale]?.description || ''}
                      onChange={(e) => {
                        setCategoryTranslations(prev => ({
                          ...prev,
                          [currentCategoryLocale]: { ...prev[currentCategoryLocale], locale: currentCategoryLocale, description: e.target.value }
                        }));
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Settings Section */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Code (Internal) *</label>
                    <Input
                      placeholder="e.g., CAT-01"
                      defaultValue={editingCategory?.code || ''}
                      onChange={(e) => categoryForm.setFieldValue('code', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Display Order</label>
                    <InputNumber 
                      min={1}
                      className="w-full"
                      defaultValue={editingCategory?.display_order || 1}
                      onChange={(value) => categoryForm.setFieldValue('display_order', value)}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      Status
                    </label>
                    <Select
                      defaultValue={editingCategory?.is_active ? 'active' : 'inactive'}
                      onChange={(value) => categoryForm.setFieldValue('is_active', value === 'active')}
                      className="w-full"
                    >
                      <Select.Option value="active">Active</Select.Option>
                      <Select.Option value="inactive">Inactive</Select.Option>
                    </Select>
                  </div>
                </div>

                {/* Image Section */}
                <div className="mt-6 space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    🖼️ Category Image
                  </label>
                  <div className="mb-3">
                    <Button 
                      onClick={handleOpenMediaPickerForCategory}
                      type="primary"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2"
                    >
                      Select Image
                    </Button>
                  </div>
                  {selectedCategoryIconId && (
                    <div className="mt-4">
                      <div className="relative group">
                        <img 
                          src={`${getApiBaseUrl()}/media/${selectedCategoryIconId}/view`}
                          alt="Category Image"
                          className="w-full h-24 object-cover rounded-md border-2 border-slate-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                          <Button
                            danger
                            size="small"
                            onClick={() => setSelectedCategoryIconId(null)}
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
                    <span>ℹ️</span>
                    <span>Recommended: Square image (1:1 ratio) for best display</span>
                  </p>
                </div>
              </Form>
            </div>

            {/* Footer - Sticky */}
            <div className="border-t border-slate-200 p-6 bg-slate-50 flex justify-end gap-4 sticky bottom-0">
              <Button 
                onClick={handleCategoryModalClose}
                className="px-6 py-2 border border-slate-600 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={() => categoryForm.submit()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Item Modal */}
      {menuItemModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header - Sticky */}
            <div className="border-b border-slate-200 p-6 flex items-center justify-between bg-white sticky top-0 z-10">
              <h3 className="text-xl font-bold text-slate-800">
                {editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h3>
              <button
                onClick={handleMenuItemModalClose}
                className="text-slate-400 hover:text-slate-600 text-2xl transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6">
              {/* Language Tabs */}
              <div className="flex gap-2 mb-6 border-b border-slate-200 pb-0">
                {supportedLanguages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setCurrentItemLocale(lang)}
                    className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                      currentItemLocale === lang
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <span className="text-lg">{LANGUAGE_CONFIG[lang]?.flag}</span>
                    {LANGUAGE_CONFIG[lang]?.name}
                  </button>
                ))}
              </div>

              <Form
                form={menuItemForm}
                layout="vertical"
                onFinish={handleMenuItemSubmit}
              >
                {/* Translation Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Item Name {currentItemLocale === 'vi' && <span className="text-red-500">*</span>}
                    </label>
                    <Input
                      placeholder="e.g., Iced Coffee"
                      value={itemTranslations[currentItemLocale]?.name || ''}
                      onChange={(e) => {
                        setItemTranslations(prev => ({
                          ...prev,
                          [currentItemLocale]: { ...prev[currentItemLocale], locale: currentItemLocale, name: e.target.value }
                        }));
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description (Optional)
                    </label>
                    <TextArea
                      rows={3}
                      placeholder="Enter a brief description..."
                      value={itemTranslations[currentItemLocale]?.description || ''}
                      onChange={(e) => {
                        setItemTranslations(prev => ({
                          ...prev,
                          [currentItemLocale]: { ...prev[currentItemLocale], locale: currentItemLocale, description: e.target.value }
                        }));
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ingredients (Optional)
                    </label>
                    <TextArea
                      rows={2}
                      placeholder="e.g., Coffee, Milk, Sugar"
                      value={itemTranslations[currentItemLocale]?.ingredients || ''}
                      onChange={(e) => {
                        setItemTranslations(prev => ({
                          ...prev,
                          [currentItemLocale]: { ...prev[currentItemLocale], locale: currentItemLocale, ingredients: e.target.value }
                        }));
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Settings Section */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                    <Select 
                      placeholder="Select category"
                      defaultValue={editingMenuItem?.category_id}
                      onChange={(value) => menuItemForm.setFieldValue('category_id', value)}
                      className="w-full"
                    >
                      {categories.map((cat) => {
                        const catName = cat.translations.find(t => t.locale === 'vi')?.name || cat.code;
                        return (
                          <Select.Option key={cat.id} value={cat.id}>
                            {catName}
                          </Select.Option>
                        );
                      })}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Code (Internal)</label>
                    <Input
                      placeholder="e.g., ITEM-01"
                      defaultValue={editingMenuItem?.code || ''}
                      onChange={(e) => menuItemForm.setFieldValue('code', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Price (VND)</label>
                    <InputNumber 
                      min={0}
                      className="w-full"
                      defaultValue={editingMenuItem?.price}
                      onChange={(value) => menuItemForm.setFieldValue('price', value)}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Original Price (VND)</label>
                    <InputNumber 
                      min={0}
                      className="w-full"
                      defaultValue={editingMenuItem?.original_price}
                      onChange={(value) => menuItemForm.setFieldValue('original_price', value)}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <Select 
                      defaultValue={editingMenuItem?.status || 'available'}
                      onChange={(value) => menuItemForm.setFieldValue('status', value)}
                      className="w-full"
                    >
                      <Select.Option value="available">Available</Select.Option>
                      <Select.Option value="unavailable">Unavailable</Select.Option>
                      <Select.Option value="sold_out">Sold Out</Select.Option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Display Order</label>
                    <InputNumber 
                      min={1}
                      className="w-full"
                      defaultValue={editingMenuItem?.display_order || 1}
                      onChange={(value) => menuItemForm.setFieldValue('display_order', value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Calories (Optional)</label>
                    <InputNumber 
                      min={0}
                      className="w-full"
                      defaultValue={editingMenuItem?.calories}
                      onChange={(value) => menuItemForm.setFieldValue('calories', value)}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input 
                        type="checkbox" 
                        defaultChecked={editingMenuItem?.is_bestseller} 
                        onChange={(e) => menuItemForm.setFieldValue('is_bestseller', e.target.checked)}
                      />
                      Bestseller
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input 
                        type="checkbox" 
                        defaultChecked={editingMenuItem?.is_new} 
                        onChange={(e) => menuItemForm.setFieldValue('is_new', e.target.checked)}
                      />
                      New Item
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input 
                        type="checkbox" 
                        defaultChecked={editingMenuItem?.is_seasonal} 
                        onChange={(e) => menuItemForm.setFieldValue('is_seasonal', e.target.checked)}
                      />
                      Seasonal
                    </label>
                  </div>
                </div>

                {/* Item Image Section */}
                <div className="mt-6 space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <FontAwesomeIcon icon={faImages} />
                    Dining Images
                  </label>
                  
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={handleOpenMediaPickerForMenuItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                      <FontAwesomeIcon icon={faImages} />
                      Select Images
                    </button>
                  </div>
                  
                  {selectedImageIds.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      {selectedImageIds.map((imageId, index) => {
                        const isPrimary = imageId === primaryImageId;
                        return (
                          <div key={imageId} className="relative group">
                            <img 
                              src={`${getApiBaseUrl()}/media/${imageId}/view`}
                              alt={`Dining ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md border-2 border-slate-200"
                            />
                            {isPrimary && (
                              <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                                Primary
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                              {!isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => setPrimaryImageId(imageId)}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                >
                                  Set Primary
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedImageIds(prev => prev.filter(id => id !== imageId));
                                  if (primaryImageId === imageId) {
                                    setPrimaryImageId(selectedImageIds.filter(id => id !== imageId)[0] || null);
                                  }
                                }}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Form>
            </div>

            {/* Footer - Sticky */}
            <div className="border-t border-slate-200 p-6 bg-slate-50 flex justify-end gap-4 sticky bottom-0">
              <Button 
                onClick={handleMenuItemModalClose}
                className="px-6 py-2 border border-slate-600 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={() => menuItemForm.submit()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerVisible}
        onClose={() => {
          setMediaPickerVisible(false);
          // Restore category modal if it was temporarily closed
          if (tempCategoryFormData) {
            setCategoryModalVisible(true);
            setTempCategoryFormData(null);
          }
          // Restore menu item modal if it was temporarily closed
          if (tempMenuItemFormData) {
            setMenuItemModalVisible(true);
            setTempMenuItemFormData(null);
          }
        }}
        onSelect={mediaPickerMode === 'category-icon' ? handleMediaSelect : undefined}
        onSelectMultiple={mediaPickerMode === 'item-image' ? handleMultipleMediaSelect : undefined}
        allowMultiple={mediaPickerMode === 'item-image'}
        title={mediaPickerMode === 'category-icon' ? 'Select Category Image' : 'Select Menu Item Images'}
        kind="image"
        source="cafe"
        folder={mediaPickerMode === 'category-icon' ? 'menu/categories' : 'menu/items'}
      />
    </div>
  );
};

export default CafeMenu;
