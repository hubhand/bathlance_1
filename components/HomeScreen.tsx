import React, { useState, useRef } from 'react';
import { Product, ShoppingListItem } from '../types';
import { ProductCard } from './ProductCard';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

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
  const dragOverItemIndex = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (index: number) => {
    dragOverItemIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = () => {
    if (draggedItemIndex === null || dragOverItemIndex.current === null || draggedItemIndex === dragOverItemIndex.current) {
        setDraggedItemIndex(null);
        return;
    }
    
    const newProducts = [...products];
    const [draggedItem] = newProducts.splice(draggedItemIndex, 1);
    newProducts.splice(dragOverItemIndex.current, 0, draggedItem);
    
    onReorderProducts(newProducts);
    setDraggedItemIndex(null);
    dragOverItemIndex.current = null;
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    dragOverItemIndex.current = null;
  }

  return (
    <div className="relative p-4 pb-32" onDragOver={handleDragOver}>
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center mt-20 p-8 bg-white/60 rounded-cute shadow-cute border-2 border-dashed border-bathlance-orange/30">
          <p className="text-6xl mb-4 animate-bounce">🧼</p>
          <h2 className="text-2xl font-bold text-bathlance-brown mb-2">등록된 제품이 없어요.</h2>
          <p className="text-bathlance-brown/80">오른쪽 아래 등록 버튼을 눌러 첫 욕실용품을 추가해보세요! ✨</p>
        </div>
      ) : (
        <div>
           <div className="flex items-center justify-between mb-4 flex-wrap bg-white/60 p-3 rounded-cute shadow-cute border border-bathlance-cream">
              <h2 className="text-2xl font-bold text-bathlance-orange">내 욕실용품 목록 ✨</h2>
              <p className="text-sm text-bathlance-brown/70">꾹 눌러서 순서를 바꿀 수 있어요!</p>
           </div>
          {products.map((product, index) => (
            <div
              key={product.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={() => handleDragEnter(index)}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              className={`transition-opacity duration-300 ${draggedItemIndex === index ? 'opacity-50' : 'opacity-100'}`}
            >
              <ProductCard 
                product={product}
                onEdit={onEditProduct}
                onDelete={onDeleteProduct}
                onToggleShoppingList={onToggleShoppingList}
                onReplace={onReplaceProduct}
                isOnShoppingList={shoppingList.some(item => item.productId === product.id)}
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