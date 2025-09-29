// src/hooks/useProperties.ts
import { useState, useEffect } from 'react';
import type { Hotel, HotelFormData, HotelPost, TranslationData } from '../types/properties';

// Mock data
const mockHotels: Hotel[] = [
  {
    id: 'tabi-tower',
    name: 'Tabi Tower Hotel',
    phone: '+84 28 3825 1234',
    email: 'info@tabitower.com',
    address: '123 Nguyen Hue Street, District 1, Ho Chi Minh City',
    vrLink: 'https://tabi-tower.com/vr-tour',
    description: '<p>A luxurious 5-star hotel in the heart of Ho Chi Minh City offering world-class amenities and exceptional service.</p>',
    icon: 'fa-building',
    color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    status: 'active',
    posts: [
      {
        id: 1,
        hotelId: 'tabi-tower',
        title: 'Welcome to Tabi Tower Hotel',
        content: '<p><strong>Experience luxury and comfort at the heart of Ho Chi Minh City.</strong></p><p>Our 5-star hotel offers world-class amenities, stunning city views, and exceptional service. Located in the vibrant District 1, Tabi Tower Hotel provides easy access to major attractions, shopping centers, and business districts.</p><ul><li>Rooftop infinity pool</li><li>Full-service spa</li><li>Multiple dining options</li><li>State-of-the-art fitness center</li></ul>',
        locale: 'en',
        status: 'published',
        address: '123 Nguyen Hue Street, District 1, Ho Chi Minh City',
        phone: '+84 28 3825 1234',
        vrLink: 'https://tabi-tower.com/vr-tour',
        updatedAt: 'Dec 15, 2024'
      },
      {
        id: 2,
        hotelId: 'tabi-tower',
        title: 'Chào mừng đến với Khách sạn Tabi Tower',
        content: '<p><strong>Trải nghiệm sự sang trọng và thoải mái ngay trung tâm thành phố Hồ Chí Minh.</strong></p><p>Khách sạn 5 sao của chúng tôi cung cấp các tiện nghi đẳng cấp thế giới, tầm nhìn tuyệt đẹp ra thành phố và dịch vụ đặc biệt.</p><ul><li>Bể bơi vô cực trên sân thượng</li><li>Spa đầy đủ dịch vụ</li><li>Nhiều lựa chọn ẩm thực</li><li>Trung tâm thể dục hiện đại</li></ul>',
        locale: 'vi',
        status: 'published',
        address: '123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
        phone: '+84 28 3825 1234',
        vrLink: 'https://tabi-tower.com/vr-tour',
        updatedAt: 'Dec 15, 2024'
      },
      {
        id: 3,
        hotelId: 'tabi-tower',
        title: 'タビタワーホテルへようこそ',
        content: '<p><strong>ホーチミン市の中心部で贅沢と快適さを体験してください。</strong></p><p>5つ星ホテルは世界クラスの設備、素晴らしい街の景色、優れたサービスを提供します。</p><ul><li>屋上インフィニティプール</li><li>フルサービススパ</li><li>複数のダイニングオプション</li><li>最新のフィットネスセンター</li></ul>',
        locale: 'ja',
        status: 'draft',
        address: '123ホーチミン市1区グエンフエ通り',
        phone: '+84 28 3825 1234',
        vrLink: 'https://tabi-tower.com/vr-tour',
        updatedAt: 'Dec 14, 2024'
      }
    ]
  },
  {
    id: 'saigon-grand',
    name: 'Saigon Grand Hotel',
    phone: '+84 28 3823 5678',
    email: 'contact@saigongrand.com',
    address: '456 Dong Khoi Street, District 1, Ho Chi Minh City',
    description: '<p>A boutique hotel combining colonial elegance with modern comfort in the historic heart of Ho Chi Minh City.</p>',
    icon: 'fa-crown',
    color: 'linear-gradient(135deg, #10b981, #059669)',
    status: 'inactive',
    posts: [
      {
        id: 4,
        hotelId: 'saigon-grand',
        title: 'Saigon Grand Hotel Overview',
        content: '<p><strong>Located in the historic heart of Ho Chi Minh City</strong></p><p>Saigon Grand Hotel offers classic elegance combined with modern comfort. Our boutique property features colonial architecture and contemporary amenities.</p>',
        locale: 'en',
        status: 'draft',
        address: '456 Dong Khoi Street, District 1, Ho Chi Minh City',
        phone: '+84 28 3823 5678',
        updatedAt: 'Dec 10, 2024'
      }
    ]
  }
];

export const useProperties = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedHotels, setExpandedHotels] = useState<Set<string>>(new Set());

  // Load hotels on mount
  useEffect(() => {
    const loadHotels = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHotels(mockHotels);
      setLoading(false);
    };

    loadHotels();
  }, []);

  // Filter hotels based on search and status
  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hotel.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || hotel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Hotel management functions
  const createHotel = async (formData: HotelFormData): Promise<void> => {
    const newHotel: Hotel = {
      id: formData.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      vrLink: formData.vrLink,
      description: formData.description,
      status: formData.status,
      icon: formData.icon,
      color: formData.color,
      posts: []
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setHotels(prev => [...prev, newHotel]);
  };

  const updateHotel = async (id: string, formData: Partial<HotelFormData>): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setHotels(prev => prev.map(hotel => 
      hotel.id === id ? { ...hotel, ...formData } : hotel
    ));
  };

  const deleteHotel = async (id: string): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setHotels(prev => prev.filter(hotel => hotel.id !== id));
    setExpandedHotels(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  // CRUD operations for Hotel Posts
  const createHotelPost = async (hotelId: string, postData: Partial<HotelPost>) => {
    setHotels(currentHotels => {
      return currentHotels.map(hotel => {
        if (hotel.id === hotelId) {
          const newPost: HotelPost = {
            id: Date.now(), // Simple unique ID
            hotelId,
            title: postData.title || 'Untitled Post',
            content: postData.content || '',
            locale: postData.locale || 'en',
            status: postData.status || 'draft',
            address: postData.address || hotel.address,
            phone: postData.phone || hotel.phone,
            vrLink: postData.vrLink || hotel.vrLink,
            updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          };
          return { ...hotel, posts: [...hotel.posts, newPost] };
        }
        return hotel;
      });
    });
  };

  const updateHotelPost = async (updatedPost: HotelPost) => {
    setHotels(currentHotels => {
      return currentHotels.map(hotel => {
        if (hotel.id === updatedPost.hotelId) {
          const postIndex = hotel.posts.findIndex(p => p.id === updatedPost.id);
          if (postIndex !== -1) {
            const newPosts = [...hotel.posts];
            newPosts[postIndex] = {
              ...updatedPost,
              updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            };
            return { ...hotel, posts: newPosts };
          }
        }
        return hotel;
      });
    });
  };

  const deleteHotelPost = async (postId: number) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setHotels(prev => prev.map(hotel => ({
      ...hotel,
      posts: hotel.posts.filter(post => post.id !== postId)
    })));
  };

  const translatePost = async (postId: number, translationData: TranslationData): Promise<void> => {
    const originalPost = hotels
      .flatMap(hotel => hotel.posts)
      .find(post => post.id === postId);

    if (!originalPost) {
      throw new Error('Post not found');
    }

    const translatedPost: HotelPost = {
      id: Date.now(),
      hotelId: originalPost.hotelId,
      title: `[${translationData.targetLanguage.toUpperCase()}] ${originalPost.title}`,
      content: translationData.translatedContent,
      locale: translationData.targetLanguage,
      status: 'draft',
      address: translationData.translatedAddress,
      phone: translationData.translatedPhone,
      vrLink: originalPost.vrLink,
      updatedAt: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setHotels(prev => prev.map(hotel => 
      hotel.id === originalPost.hotelId 
        ? { ...hotel, posts: [...hotel.posts, translatedPost] }
        : hotel
    ));
  };

  // Hotel expansion state management
  const toggleHotelExpansion = (hotelId: string) => {
    setExpandedHotels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hotelId)) {
        newSet.delete(hotelId);
      } else {
        newSet.add(hotelId);
      }
      return newSet;
    });
  };

  const isHotelExpanded = (hotelId: string) => {
    return expandedHotels.has(hotelId);
  };

  // Get hotel by ID
  const getHotelById = (id: string): Hotel | undefined => {
    return hotels.find(hotel => hotel.id === id);
  };

  // Get post by ID
  const getPostById = (postId: number): HotelPost | undefined => {
    return hotels
      .flatMap(hotel => hotel.posts)
      .find(post => post.id === postId);
  };

  // Statistics
  const getStats = () => {
    const totalHotels = filteredHotels.length;
    const activeHotels = filteredHotels.filter(hotel => hotel.status === 'active').length;
    const totalPosts = filteredHotels.reduce((acc, hotel) => acc + hotel.posts.length, 0);
    const publishedPosts = filteredHotels
      .flatMap(hotel => hotel.posts)
      .filter(post => post.status === 'published').length;

    return {
      totalHotels,
      activeHotels,
      totalPosts,
      publishedPosts
    };
  };

  return {
    // Data
    hotels: filteredHotels,
    loading,
    searchQuery,
    statusFilter,
    
    // Search and filter
    setSearchQuery,
    setStatusFilter,
    
    // Hotel management
    createHotel,
    updateHotel,
    deleteHotel,
    getHotelById,
    
    // Post management
    createHotelPost,
    updateHotelPost,
    deleteHotelPost,
    translatePost,
    getPostById,
    
    // UI state
    toggleHotelExpansion,
    isHotelExpanded,
    
    // Statistics
    getStats
  };
};