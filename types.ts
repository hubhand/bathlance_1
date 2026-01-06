export type ProductCategory = '칫솔' | '샴푸' | '린스' | '세안제' | '바디워시' | '수건' | '면도기 헤드' | '샤워볼' | '샤워기 필터' | '기타';

export interface Ingredient {
  name: string;
  safetyGrade: "안전" | "보통" | "주의" | "위험"; // 자체 안전성 평가 등급
  isAllergen: boolean;
  description?: string;
  // 규제정보 (공공데이터 API에서 제공)
  isProhibited?: boolean;      // 금지 여부
  hasLimitation?: boolean;     // 제한 여부
  limitationInfo?: string;     // 제한 정보
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  registrationDate: string; // ISO String
  expiryDate: string; // ISO String
  imageUrl: string; // Data URL
  manufacturingDate?: string; // 제조일자 (Optional ISO String)
  expiryPeriodBeforeOpening?: number; // 개봉 전 유효기간 (Optional, in months)
  periodAfterOpening?: number; // 개봉 후 사용기한 (Optional, in months)
  ingredientAnalysis?: Ingredient[];
  review?: string; // 간단 후기
  hasTrouble?: boolean; // 트러블 발생 여부
  stock?: number; // 재고 수량
}

export type Screen = 'home' | 'add' | 'edit' | 'settings' | 'memo';

export interface GeminiResponse {
  제품명: string;
  분류: ProductCategory;
  제조일자?: string; // 예: "2023-05-10"
  개봉전유효기간?: number; // 예: 36 (개월 단위 숫자)
  개봉후사용기한?: number; // 예: 12 (개월 단위 숫자)
}

export interface GeminiIngredientsResponse {
  ingredients: Ingredient[];
}

export interface ShoppingListItem {
  id: string;
  name: string;
  checked: boolean;
  productId?: string; // Link to a product
}

export interface DiaryEntry {
  id: string;
  content: string;
  date: string; // ISO String
}

export interface TroubleHistory {
  id: string;
  userId: string;
  productName: string;
  category: ProductCategory;
  ingredientAnalysis?: Ingredient[];
  review?: string;
  productId?: string; // 원본 제품 ID (제품 삭제 시 null)
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}