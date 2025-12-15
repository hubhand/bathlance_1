import { ProductCategory } from './types';

export const AVERAGE_USAGE_PERIODS: Record<ProductCategory, number> = {
  '칫솔': 3,
  '샴푸': 12,
  '린스': 12,
  '세안제': 6,
  '바디워시': 12,
  '수건': 6,
  '면도기 헤드': 1,
  '샤워볼': 1,
  '샤워기 필터': 3,
  '기타': 6,
};

export const NOTIFICATION_DAYS_BEFORE = 7;