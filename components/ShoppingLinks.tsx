import React from 'react';

interface ShoppingLinksProps {
  productName: string;
  category: string;
}

export const ShoppingLinks: React.FC<ShoppingLinksProps> = ({ productName, category }) => {
  // 검색어 생성: 제품명 + 카테고리
  const searchQuery = encodeURIComponent(`${productName} ${category}`);
  
  // 네이버 쇼핑 최저가 검색 URL
  const naverShoppingUrl = `https://search.shopping.naver.com/search/all?query=${searchQuery}&sort=price_asc`;
  
  // 쿠팡 검색 URL
  const coupangUrl = `https://www.coupang.com/np/search?component=&q=${searchQuery}&channel=user`;

  return (
    <div className="flex gap-2 mt-2">
      <a
        href={naverShoppingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#03C75A] hover:bg-[#02b350] text-white text-xs font-bold rounded-full transition-all hover:scale-105 shadow-sm"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
        </svg>
        네이버 최저가
      </a>
      <a
        href={coupangUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E31937] hover:bg-[#c91530] text-white text-xs font-bold rounded-full transition-all hover:scale-105 shadow-sm"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 7.556c-.144.551-.548.703-1.111.438l-3.073-2.265-1.483 1.429c-.164.164-.302.302-.619.302l.221-3.128 5.694-5.146c.247-.221-.054-.344-.384-.123l-7.039 4.434-3.032-.947c-.659-.206-.672-.659.137-.975l11.848-4.565c.549-.199 1.03.134.851.99z"/>
        </svg>
        쿠팡
      </a>
    </div>
  );
};







