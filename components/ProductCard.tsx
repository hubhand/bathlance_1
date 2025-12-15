import React, { useState } from 'react';
import { Product } from '../types';
import { getDaysRemaining, formatDate } from '../utils/dateUtils';
import { GripVerticalIcon } from './icons/GripVerticalIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';
import { ReplaceIcon } from './icons/ReplaceIcon';
import { ShoppingLinks } from './ShoppingLinks';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onToggleShoppingList: (product: Product) => void;
  onReplace: (productId: string) => void;
  isOnShoppingList: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete, onToggleShoppingList, onReplace, isOnShoppingList }) => {
  const [showShoppingLinks, setShowShoppingLinks] = useState(false);
  const daysRemaining = getDaysRemaining(product.expiryDate);
  const totalDays = getDaysRemaining(product.registrationDate) + 1;
  const progressPercentage = Math.max(0, 100 - (daysRemaining / totalDays) * 100);
  const stockCount = product.stock ?? 1;

  // 교체 필요 여부 (만료됨 또는 7일 이내 만료 예정)
  const needsReplacement = daysRemaining <= 7;

  const getProgressBarColor = () => {
    if (daysRemaining <= 7) return 'bg-red-500';
    if (daysRemaining <= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const emoji = product.category === '샴푸' ? '🧴' : product.category === '칫솔' ? '🪥' : '🛁';

  const hasExtraInfo = product.manufacturingDate || product.expiryPeriodBeforeOpening || product.periodAfterOpening;

  return (
    <div className="bg-gradient-to-br from-white to-bathlance-cream/30 rounded-cute shadow-cute p-4 mb-4 relative flex items-stretch border border-bathlance-cream/50 hover:shadow-cute-lg transition-all duration-300">
      <div className="flex items-center justify-center pr-2 text-gray-300 cursor-move">
        <GripVerticalIcon className="w-6 h-6" />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-start space-x-4">
          <img src={product.imageUrl} alt={product.name} className="w-24 h-24 object-cover rounded-lg border-2 border-bathlance-gray" />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-bathlance-brown flex items-center flex-wrap">
              {emoji} <span title={product.name}>{product.name.length > 5 ? `${product.name.slice(0, 5)}...` : product.name}</span>
              {product.hasTrouble && (
                <span title="트러블 발생 제품" className="ml-2 text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                  ! 주의
                </span>
              )}
            </h3>
            <p className="text-sm text-bathlance-brown/70 font-medium">{product.category}</p>
            
            {hasExtraInfo && (
              <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-md border border-gray-200">
                {product.manufacturingDate && <p><strong>제조:</strong> {formatDate(product.manufacturingDate)}</p>}
                {product.expiryPeriodBeforeOpening && <p><strong>유통기한:</strong> 제조일로부터 {product.expiryPeriodBeforeOpening}개월</p>}
                {product.periodAfterOpening && <p><strong>개봉 후:</strong> {product.periodAfterOpening}개월 사용</p>}
              </div>
            )}
             {product.review && (
              <div className="mt-2 text-sm text-gray-700 bg-yellow-50 p-2 rounded-md border border-yellow-200">
                  <p><strong>📝 내 후기:</strong> {product.review}</p>
              </div>
            )}
            
            <div className="flex justify-between items-end mt-2">
              <div>
                <p className="text-sm text-gray-600">교체 예정일: {formatDate(product.expiryDate)}</p>
                <div className={`mt-1 text-2xl font-bold ${daysRemaining <= 7 ? 'text-red-600' : 'text-bathlance-orange'}`}>
                  {daysRemaining > 0 ? `${daysRemaining}일 남음!` : '교체해주세요!'}
                </div>
              </div>
              <div className="text-center bg-gradient-to-br from-bathlance-cream to-bathlance-cream/50 border-2 border-bathlance-orange/20 rounded-cute p-2 shadow-sm">
                  <p className="text-xs font-bold text-bathlance-brown">남은 재고</p>
                  <p className="text-2xl font-bold text-bathlance-orange">{stockCount}개</p>
              </div>
            </div>

          </div>
        </div>
        
        {daysRemaining > 0 ? (
          <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
            <div className={`${getProgressBarColor()} h-4 rounded-full transition-all duration-500`} style={{ width: `${progressPercentage}%` }}></div>
          </div>
        ) : (
          <button
            onClick={() => onReplace(product.id)}
            disabled={stockCount <= 0}
            className="w-full bg-gradient-to-r from-bathlance-orange to-bathlance-brown text-white font-bold py-2 mt-4 rounded-cute shadow-cute hover:shadow-cute-lg transition-all flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed hover:scale-[1.02]"
          >
            <ReplaceIcon className="w-5 h-5 mr-2" />
            {stockCount > 0 ? '새걸로 교체하기!' : '재고 없음!'}
          </button>
        )}

        {/* 교체 필요 시 구매 링크 표시 */}
        {needsReplacement && (
          <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
            <button
              onClick={() => setShowShoppingLinks(!showShoppingLinks)}
              className="w-full flex items-center justify-between text-sm font-bold text-red-600"
            >
              <span className="flex items-center gap-2">
                🛒 지금 바로 구매하기
              </span>
              <span className={`transform transition-transform ${showShoppingLinks ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {showShoppingLinks && (
              <ShoppingLinks productName={product.name} category={product.category} />
            )}
          </div>
        )}


        <div className="absolute top-2 right-2 flex space-x-1">
           <button 
             onClick={() => onToggleShoppingList(product)} 
             className={`p-1 rounded-full transition-colors ${
                isOnShoppingList 
                ? 'text-white bg-bathlance-orange' 
                : 'text-gray-400 hover:text-bathlance-orange'
             }`}
             title={isOnShoppingList ? "구매 목록에서 제거" : "구매 목록에 추가"}
           >
            <ShoppingCartIcon className="w-5 h-5" />
          </button>
           <button onClick={() => onEdit(product)} className="text-gray-400 hover:text-blue-600 p-1 rounded-full transition-colors">
            <EditIcon className="w-5 h-5" />
          </button>
          <button onClick={() => onDelete(product.id)} className="text-gray-400 hover:text-red-600 p-1 rounded-full transition-colors">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};