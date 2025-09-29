// src/data/mockCategories.ts
import type { Category } from "../types/categories";

export const mockCategories: Category[] = [
  {
    id: 1,
    // tenant_id: 100,
    name: "General",
    slug: "general",
    icon: 'info-circle',
    status: 'active',
    type: 'system',
    featureCount: 7,
    // icon_key: "info",
    // created_at: "2025-09-25T08:00:00Z",
    translations: {
      en: {
        title: "General",
        description:
          "Basic hotel information like check-in/out, policies, and general guidance",
      },
      vi: {
        title: "Chung",
        description:
          "Thông tin cơ bản về khách sạn như nhận/trả phòng, chính sách và hướng dẫn chung",
      },
      ja: {
        title: "一般",
        description:
          "チェックイン/アウト、ポリシー、一般的なガイダンスなどの基本的なホテル情報",
      },
      kr: {
        title: "일반",
        description:
          "체크인/체크아웃, 정책 및 일반 안내와 같은 기본 호텔 정보",
      },
      fr: {
        title: "Général",
        description:
          "Informations de base sur l’hôtel comme l’enregistrement/le départ, les politiques et les directives générales",
      },
    },
  },
  {
    id: 2,
    // tenant_id: 100,
    name: "Services",
    slug: "services",
    icon: 'concierge-bell',
    status: 'active',
    type: 'system',
    featureCount: 7,
    // icon_key: "concierge-bell",
    // created_at: "2025-09-25T08:00:00Z",
    translations: {
      en: {
        title: "Services",
        description:
          "Hotel services like room service, concierge, laundry, and guest assistance",
      },
      vi: {
        title: "Dịch vụ",
        description:
          "Các dịch vụ khách sạn như phục vụ phòng, lễ tân, giặt ủi và hỗ trợ khách",
      },
      ja: {
        title: "サービス",
        description:
          "ルームサービス、コンシェルジュ、ランドリー、ゲストサポートなどのホテルサービス",
      },
      kr: {
        title: "서비스",
        description: "룸서비스, 컨시어지, 세탁, 고객 지원과 같은 호텔 서비스",
      },
      fr: {
        title: "Services",
        description:
          "Services hôteliers comme le service en chambre, la conciergerie, la blanchisserie et l’assistance aux clients",
      },
    },
  },
  {
    id: 3,
    // tenant_id: 100,
    name: "Facilities",
    slug: "facilities",
    icon: 'building',
    status: 'active',
    type: 'system',
    featureCount: 7,
    // icon_key: "building",
    // created_at: "2025-09-25T08:00:00Z",
    translations: {
      en: {
        title: "Facilities",
        description:
          "Hotel facilities such as gym, pool, spa, and conference rooms",
      },
      vi: {
        title: "Tiện nghi",
        description: "Các tiện nghi khách sạn như phòng gym, hồ bơi, spa, phòng họp",
      },
      ja: {
        title: "施設",
        description: "ジム、プール、スパ、会議室などのホテル施設",
      },
      kr: {
        title: "시설",
        description: "호텔 시설에는 체육관, 수영장, 스파 및 회의실이 포함됩니다",
      },
      fr: {
        title: "Installations",
        description:
          "Équipements de l’hôtel tels que salle de sport, piscine, spa et salles de conférence",
      },
    },
  },
  {
    id: 4,
    // tenant_id: 100,
    name: "Activities",
    slug: "activities",
    icon: 'hiking',
    status: 'active',
    type: 'system',
    featureCount: 7,
    // icon_key: "activity",
    // created_at: "2025-09-25T08:00:00Z",
    translations: {
      en: {
        title: "Activities",
        description:
          "Guest activities like tours, excursions, cultural events, and workshops",
      },
      vi: {
        title: "Hoạt động",
        description:
          "Các hoạt động cho khách như tour, tham quan, sự kiện văn hóa và workshop",
      },
      ja: {
        title: "アクティビティ",
        description: "ツアー、エクスカーション、文化イベント、ワークショップなどのゲスト向けアクティビティ",
      },
      kr: {
        title: "활동",
        description: "투어, 소풍, 문화 행사 및 워크숍과 같은 게스트 활동",
      },
      fr: {
        title: "Activités",
        description:
          "Activités pour les clients comme visites, excursions, événements culturels et ateliers",
      },
    },
  },
  {
    id: 5,
    // tenant_id: 100,
    name: "VIP Services",
    slug: "vip-services",
    // icon_key: "star",
    icon: 'star',
    status: 'active',
    type: 'system',
    featureCount: 7,
    // created_at: "2025-09-25T08:00:00Z",
    translations: {
      en: {
        title: "VIP Services",
        description:
          "Exclusive services such as limousine, private dining, and premium lounge access",
      },
      vi: {
        title: "Dịch vụ VIP",
        description:
          "Dịch vụ độc quyền như xe limousine, ăn tối riêng và sử dụng phòng chờ hạng sang",
      },
      ja: {
        title: "VIPサービス",
        description:
          "リムジン、プライベートダイニング、プレミアムラウンジ利用などの特別サービス",
      },
      kr: {
        title: "VIP 서비스",
        description: "리무진, 프라이빗 다이닝, 프리미엄 라운지 이용과 같은 독점 서비스",
      },
      fr: {
        title: "Services VIP",
        description:
          "Services exclusifs comme limousine, repas privés et accès au salon premium",
      },
    },
  },
];