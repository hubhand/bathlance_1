import React, { useState, useRef, useEffect } from "react";
import { Product, ShoppingListItem } from "../types";
import { ProductCard } from "./ProductCard";
import { PlusCircleIcon } from "./icons/PlusCircleIcon";

interface HomeScreenProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onReorderProducts: (products: Product[]) => void;
  onToggleShoppingList: (product: Product) => void;
  onReplaceProduct: (productId: string) => void;
  shoppingList: ShoppingListItem[];
  onAddProductRequest: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  products,
  onEditProduct,
  onDeleteProduct,
  onReorderProducts,
  onToggleShoppingList,
  onReplaceProduct,
  shoppingList,
  onAddProductRequest,
}) => {
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(
    null
  );

  // 터치 이벤트를 위한 상태
  const touchStartY = useRef<number | null>(null);
  const touchStartIndex = useRef<number | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressCompleted = useRef<boolean>(false);
  const currentTouchElement = useRef<HTMLElement | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const lastDragOverIndex = useRef<number | null>(null);
  const isLongPressingRef = useRef<boolean>(false);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (index: number) => {
    setDragOverItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = () => {
    if (
      draggedItemIndex === null ||
      dragOverItemIndex === null ||
      draggedItemIndex === dragOverItemIndex
    ) {
      setDraggedItemIndex(null);
      return;
    }

    const newProducts = [...products];
    const [draggedItem] = newProducts.splice(draggedItemIndex, 1);
    newProducts.splice(dragOverItemIndex, 0, draggedItem);

    onReorderProducts(newProducts);
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (
    e: React.TouchEvent<HTMLDivElement>,
    index: number
  ) => {
    // 화살표 버튼이나 다른 버튼을 클릭한 경우 드래그 시작하지 않음
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.tagName === "BUTTON" ||
      target.closest("svg")?.closest("button")
    ) {
      return; // 버튼 클릭은 무시
    }

    touchStartY.current = e.touches[0].clientY;
    touchStartIndex.current = index;
    currentTouchElement.current = e.currentTarget;

    // 길게 누르기 감지 (300ms로 단축하여 더 빠르게 반응)
    longPressCompleted.current = false; // 초기화
    lastDragOverIndex.current = null; // 드래그 오버 인덱스 초기화
    longPressTimer.current = setTimeout(() => {
      isLongPressingRef.current = true;
      setIsLongPressing(true);
      setDraggedItemIndex(index);
      longPressCompleted.current = true; // 타이머 완료 플래그 설정

      // 즉시 해당 요소의 touchAction을 'none'으로 변경 (state 업데이트 지연 문제 해결)
      if (currentTouchElement.current) {
        currentTouchElement.current.style.touchAction = "none";
      }
    }, 300);
  };

  // 터치 이동 중 타이머 취소 (스크롤 시)
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // 길게 누르기 전에 움직이면 타이머 취소 (스크롤로 간주)
    // ref를 사용하여 최신 상태 확인 (state 업데이트 지연 문제 해결)
    if (
      !isLongPressingRef.current &&
      !longPressCompleted.current &&
      longPressTimer.current &&
      touchStartY.current !== null
    ) {
      const touchY = e.touches[0].clientY;
      if (Math.abs(touchY - touchStartY.current) > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        longPressCompleted.current = false; // 플래그 초기화
      }
    }
  };

  // 터치 이동을 non-passive 이벤트 리스너로 처리
  useEffect(() => {
    const handleTouchMoveNonPassive = (e: TouchEvent) => {
      // touchStartIndex가 있고, 타이머가 완료되었는지 확인 (state 업데이트 지연 문제 해결)
      const currentDragIndex = touchStartIndex.current;
      if (currentDragIndex === null) return;

      // isLongPressing이 true이거나, 타이머가 완료되었는지 확인
      if (!isLongPressingRef.current && !longPressCompleted.current) {
        // 아직 길게 누르기가 완료되지 않음
        return;
      }

      e.preventDefault();

      const touchY = e.touches[0].clientY;
      const touchX = e.touches[0].clientX;

      // 터치 위치의 요소 찾기
      const elementBelow = document.elementFromPoint(touchX, touchY);
      if (!elementBelow) return;

      // 가장 가까운 제품 카드 컨테이너 찾기
      const productContainer = elementBelow.closest(
        "[data-product-index]"
      ) as HTMLElement;
      if (!productContainer) return;

      const targetIndex = parseInt(
        productContainer.getAttribute("data-product-index") || "-1",
        10
      );

      // currentDragIndex를 사용하여 비교 (state 업데이트 지연 문제 해결)
      // 같은 인덱스로 이미 설정되어 있으면 업데이트하지 않음 (불필요한 리렌더링 방지)
      if (
        targetIndex >= 0 &&
        targetIndex !== currentDragIndex &&
        lastDragOverIndex.current !== targetIndex
      ) {
        lastDragOverIndex.current = targetIndex;
        setDragOverItemIndex(targetIndex);
      }
    };

    // non-passive 이벤트 리스너 등록
    document.addEventListener("touchmove", handleTouchMoveNonPassive, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", handleTouchMoveNonPassive);
    };
  }, []); // ref를 사용하므로 의존성 배열이 비어있어도 됨

  const handleTouchEnd = () => {
    const currentDragIndex = touchStartIndex.current;

    // 타이머 정리
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // touchStartIndex.current를 사용하여 순서 변경 (state 업데이트 지연 문제 해결)
    // ref를 사용하여 최신 상태 확인 (state 업데이트 지연 문제 해결)
    if (
      isLongPressingRef.current &&
      currentDragIndex !== null &&
      dragOverItemIndex !== null &&
      currentDragIndex !== dragOverItemIndex
    ) {
      const newProducts = [...products];
      const [draggedItem] = newProducts.splice(currentDragIndex, 1);
      newProducts.splice(dragOverItemIndex, 0, draggedItem);

      onReorderProducts(newProducts);
    }

    isLongPressingRef.current = false;
    setIsLongPressing(false);
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
    longPressCompleted.current = false; // 플래그 초기화
    lastDragOverIndex.current = null; // 드래그 오버 인덱스 초기화

    // touchAction 복원
    if (currentTouchElement.current) {
      currentTouchElement.current.style.touchAction = "";
    }

    touchStartY.current = null;
    touchStartIndex.current = null;
    currentTouchElement.current = null;
  };

  const handleTouchCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    isLongPressingRef.current = false;
    setIsLongPressing(false);
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
    longPressCompleted.current = false; // 플래그 초기화
    lastDragOverIndex.current = null; // 드래그 오버 인덱스 초기화

    // touchAction 복원
    if (currentTouchElement.current) {
      currentTouchElement.current.style.touchAction = "";
    }

    touchStartY.current = null;
    touchStartIndex.current = null;
    currentTouchElement.current = null;
  };

  return (
    <div className="relative p-4 pb-32" onDragOver={handleDragOver}>
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center mt-20 p-8 bg-white/60 rounded-cute shadow-cute border-2 border-dashed border-bathlance-orange/30">
          <p className="text-6xl mb-4 animate-bounce">🧼</p>
          <h2 className="text-2xl font-bold text-bathlance-brown mb-2">
            등록된 제품이 없어요.
          </h2>
          <p className="text-bathlance-brown/80">
            오른쪽 아래 등록 버튼을 눌러 첫 욕실용품을 추가해보세요! ✨
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap bg-white/60 p-3 rounded-cute shadow-cute border border-bathlance-cream">
            <h2 className="text-2xl font-bold text-bathlance-orange">
              내 욕실용품 목록 ✨
            </h2>
          </div>
          {products.map((product, index) => (
            <div
              key={product.id}
              data-product-index={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={() => handleDragEnter(index)}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              className={`transition-all duration-200 ${
                draggedItemIndex === index
                  ? "opacity-60 scale-[0.98] shadow-2xl z-50 rotate-1 border-2 border-bathlance-orange bg-bathlance-cream/50"
                  : dragOverItemIndex === index && draggedItemIndex !== null
                  ? "translate-y-3 border-2 border-bathlance-orange bg-bathlance-orange/10 scale-[1.02]"
                  : "opacity-100"
              }`}
              style={{
                touchAction: isLongPressing ? "none" : "pan-y",
                userSelect: "none",
              }}
            >
              <ProductCard
                product={product}
                onEdit={onEditProduct}
                onDelete={onDeleteProduct}
                onToggleShoppingList={onToggleShoppingList}
                onReplace={onReplaceProduct}
                isOnShoppingList={shoppingList.some(
                  (item) => item.productId === product.id
                )}
              />
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onAddProductRequest}
        aria-label="욕실용품 등록 화면으로 이동"
        className="fixed bottom-28 right-4 z-50 flex items-center gap-2 rounded-cute bg-gradient-to-r from-bathlance-orange to-bathlance-brown px-6 py-4 text-white shadow-cute-lg transition-all duration-300 hover:scale-110 hover:shadow-[0_12px_32px_rgba(225,98,28,0.5)] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bathlance-orange focus-visible:ring-offset-2 md:right-8 md:bottom-32 border-2 border-white/20"
      >
        <PlusCircleIcon className="w-7 h-7" />
        <span className="text-lg font-bold">등록하기</span>
      </button>
    </div>
  );
};
