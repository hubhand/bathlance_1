import React, { useState } from "react";
import { Product } from "../types";
import { getDaysRemaining, formatDate } from "../utils/dateUtils";
import { EditIcon } from "./icons/EditIcon";
import { TrashIcon } from "./icons/TrashIcon";
import { ShoppingCartIcon } from "./icons/ShoppingCartIcon";
import { ReplaceIcon } from "./icons/ReplaceIcon";
import { ShoppingLinks } from "./ShoppingLinks";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onToggleShoppingList: (product: Product) => void;
  onReplace: (productId: string) => void;
  isOnShoppingList: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onToggleShoppingList,
  onReplace,
  isOnShoppingList,
}) => {
  const [showShoppingLinks, setShowShoppingLinks] = useState(false);
  const daysRemaining = getDaysRemaining(product.expiryDate);
  const totalDays = getDaysRemaining(product.registrationDate) + 1;
  const progressPercentage = Math.max(
    0,
    100 - (daysRemaining / totalDays) * 100
  );
  const stockCount =
    product.stock !== null && product.stock !== undefined ? product.stock : 1;
  const isOutOfStock = product.stock === 0; // 재고가 정확히 0인지 확인 (undefined/null이 아닌 경우만)

  // 교체 필요 여부 (만료됨 또는 7일 이내 만료 예정)
  const needsReplacement = daysRemaining <= 7;

  const getProgressBarColor = () => {
    if (daysRemaining <= 7) return "bg-red-500";
    if (daysRemaining <= 30) return "bg-yellow-500";
    return "bg-green-500";
  };

  const hasExtraInfo =
    product.manufacturingDate ||
    product.expiryPeriodBeforeOpening ||
    product.periodAfterOpening;

  return (
    <div className="bg-gradient-to-br from-white to-bathlance-cream/30 rounded-cute shadow-cute p-4 mb-4 relative flex items-stretch border border-bathlance-cream/50 hover:shadow-cute-lg transition-all duration-300">
      <div className="flex-1 flex flex-col">
        <div className="flex items-start space-x-4">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-24 h-24 object-cover rounded-lg border-2 border-bathlance-gray"
          />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-bathlance-brown flex items-center flex-wrap">
              <span title={product.name}>
                {product.name.length > 2
                  ? `${product.name.slice(0, 2)}...`
                  : product.name}
              </span>
            </h3>
            <p className="text-sm text-bathlance-brown/70 font-medium flex items-center gap-2">
              {product.category}
              {product.hasTrouble && (
                <span
                  title="트러블 발생 제품"
                  className="text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse"
                >
                  ! 주의
                </span>
              )}
            </p>

            {hasExtraInfo && (
              <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-md border border-gray-200">
                {product.manufacturingDate && (
                  <p>
                    <strong>제조:</strong>{" "}
                    {formatDate(product.manufacturingDate)}
                  </p>
                )}
                {product.expiryPeriodBeforeOpening && (
                  <p>
                    <strong>유통기한:</strong> 제조일로부터{" "}
                    {product.expiryPeriodBeforeOpening}개월
                  </p>
                )}
                {product.periodAfterOpening && (
                  <p>
                    <strong>개봉 후:</strong> {product.periodAfterOpening}개월
                    사용
                  </p>
                )}
              </div>
            )}
            {product.review && (
              <div className="mt-2 text-sm text-gray-700 bg-yellow-50 p-2 rounded-md border border-yellow-200">
                <p>
                  <strong>📝 내 후기:</strong> {product.review}
                </p>
              </div>
            )}

            <div className="flex justify-between items-end mt-2">
              <div>
                <p className="text-sm text-gray-600">
                  교체 예정일: {formatDate(product.expiryDate)}
                </p>
                <div
                  className={`mt-1 text-2xl font-bold ${
                    daysRemaining <= 7
                      ? "text-red-600"
                      : "text-bathlance-orange"
                  }`}
                >
                  {daysRemaining > 0
                    ? `${daysRemaining}일 남음!`
                    : "교체해주세요!"}
                </div>
              </div>
              <div
                className={`text-center bg-gradient-to-br ${
                  isOutOfStock
                    ? "from-red-100 to-red-50 border-2 border-red-300"
                    : "from-bathlance-cream to-bathlance-cream/50 border-2 border-bathlance-orange/20"
                } rounded-cute p-2 shadow-sm`}
              >
                <p className="text-xs font-bold text-bathlance-brown">
                  남은 재고
                </p>
                {isOutOfStock ? (
                  <p className="text-xl font-bold text-red-600">재고 없음</p>
                ) : (
                  <p className="text-2xl font-bold text-bathlance-orange">
                    {stockCount}개
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {isOutOfStock ? (
          // 재고가 0인 경우 항상 쇼핑 리스트에 추가할 수 있는 버튼 표시
          <button
            onClick={() => onToggleShoppingList(product)}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-2 mt-4 rounded-cute shadow-cute hover:shadow-cute-lg transition-all flex items-center justify-center hover:scale-[1.02]"
          >
            <ShoppingCartIcon className="w-5 h-5 mr-2" />
            {isOnShoppingList
              ? "구매 목록에 추가됨 ✓"
              : "재고 없음 - 구매 목록에 추가하기 🛒"}
          </button>
        ) : daysRemaining > 0 ? (
          // 재고가 있고 만료일이 남은 경우 진행 바 표시
          <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
            <div
              className={`${getProgressBarColor()} h-4 rounded-full transition-all duration-500`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        ) : (
          // 재고가 있고 만료일이 지난 경우 교체 버튼 표시
          <button
            onClick={() => onReplace(product.id)}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="w-full bg-gradient-to-r from-bathlance-orange to-bathlance-brown text-white font-bold py-2 mt-4 rounded-cute shadow-cute hover:shadow-cute-lg transition-all flex items-center justify-center hover:scale-[1.02]"
          >
            <ReplaceIcon className="w-5 h-5 mr-2" />
            새걸로 교체하기!
          </button>
        )}

        {/* 교체 필요 시 또는 구매 목록에 추가된 경우 구매 링크 표시 */}
        {(needsReplacement || isOnShoppingList) && (
          <div
            className={`mt-3 p-3 rounded-lg border ${
              isOnShoppingList && !needsReplacement
                ? "bg-gradient-to-r from-bathlance-cream/50 to-orange-50 border-bathlance-orange/30"
                : "bg-gradient-to-r from-red-50 to-orange-50 border-red-200"
            }`}
          >
            <button
              onClick={() => setShowShoppingLinks(!showShoppingLinks)}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className={`w-full flex items-center justify-between text-sm font-bold ${
                isOnShoppingList && !needsReplacement
                  ? "text-bathlance-orange"
                  : "text-red-600"
              }`}
            >
              <span className="flex items-center gap-2">
                🛒 지금 바로 구매하기
              </span>
              <span
                className={`transform transition-transform ${
                  showShoppingLinks ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>
            {showShoppingLinks && (
              <ShoppingLinks
                productName={product.name}
                category={product.category}
              />
            )}
          </div>
        )}

        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={() => onToggleShoppingList(product)}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className={`p-1 rounded-full transition-colors ${
              isOnShoppingList
                ? "text-white bg-bathlance-orange"
                : "text-gray-400 hover:text-bathlance-orange"
            }`}
            title={isOnShoppingList ? "구매 목록에서 제거" : "구매 목록에 추가"}
          >
            <ShoppingCartIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onEdit(product)}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-blue-600 p-1 rounded-full transition-colors"
          >
            <EditIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-red-600 p-1 rounded-full transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
