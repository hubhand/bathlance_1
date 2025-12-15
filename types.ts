export type ProductCategory = '칫솔' | '샴푸' | '린스' | '세안제' | '바디워시' | '수건' | '면도기 헤드' | '샤워볼' | '샤워기 필터' | '기타';

export interface Ingredient {
  name: string;
  ewgGrade: string; // e.g., '1', '2', '3-6', 'Caution'
  isAllergen: boolean;
  description?: string;
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