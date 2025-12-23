'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Product, Screen } from '../types';
import { useProducts } from '../hooks/useProducts';
import { useMemos } from '../hooks/useMemos';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { HomeScreen } from '../components/HomeScreen';
import { AddProductScreen } from '../components/AddProductScreen';
import { EditProductScreen } from '../components/EditProductScreen';
import { SettingsScreen } from '../components/SettingsScreen';
import { MemoScreen } from '../components/MemoScreen';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { getDaysRemaining, calculateExpiryDate } from '../utils/dateUtils';
import { AVERAGE_USAGE_PERIODS, NOTIFICATION_DAYS_BEFORE } from '../constants';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';
import { PWARegister } from './pwa-register';

export default function HomePage() {
  const { products, addMultipleProducts, updateProduct, deleteProduct, reorderProducts, clearAllProducts } = useProducts();
  const { 
    shoppingList, 
    addShoppingListItem, 
    toggleShoppingListItem, 
    deleteShoppingListItem,
    diaryEntries,
    addDiaryEntry,
    deleteDiaryEntry,
    clearAllMemos,
    isLoading: isShoppingListLoading,
  } = useMemos();
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    // shoppingList가 아직 로드되지 않았으면 실행하지 않음
    if (isShoppingListLoading) return;
    
    // products가 비어있으면 실행하지 않음
    if (products.length === 0) return;
    
    // FIX: Use notification days from localStorage to respect user settings.
    const notificationDays = parseInt(
        localStorage.getItem('bathlance_notification_days') || `${NOTIFICATION_DAYS_BEFORE}`,
        10
    );
    const notifiedProducts = new Set(JSON.parse(localStorage.getItem('notifiedProducts') || '[]'));
    const autoAddedToShoppingList = new Set(JSON.parse(localStorage.getItem('autoAddedToShoppingList') || '[]'));
    
    products.forEach(product => {
      const daysRemaining = getDaysRemaining(product.expiryDate);
      if (daysRemaining > 0 && daysRemaining <= notificationDays && !notifiedProducts.has(product.id)) {
        const message = `🧴 "${product.name}" 교체 시기가 ${daysRemaining}일 남았어요! 새 제품으로 상쾌하게 시작할 시간이에요! ✨`;
        alert(message);
        
        // 지금 바로 구매하기 옵션 제공
        const shouldBuy = confirm('🛒 지금 바로 구매하시겠어요?');
        if (shouldBuy) {
          const searchQuery = encodeURIComponent(`${product.name} ${product.category}`);
          window.open(`https://search.shopping.naver.com/search/all?query=${searchQuery}&sort=price_asc`, '_blank');
        }
        
        notifiedProducts.add(product.id);
      }
      
      // 재고가 0인 제품을 자동으로 쇼핑 리스트에 추가
      // shoppingList를 먼저 확인하여 이미 추가된 항목은 건너뛰기
      // autoAddedToShoppingList도 확인하여 이미 처리된 항목은 건너뛰기
      const alreadyInList = shoppingList.some(item => item.productId === product.id);
      if (product.stock === 0 && !alreadyInList && !autoAddedToShoppingList.has(product.id)) {
        addShoppingListItem({ name: product.name, productId: product.id });
        autoAddedToShoppingList.add(product.id);
        
        // 이미 쇼핑 리스트에 있는 제품이 아닌 경우에만 모달 표시
        // (새로 추가된 경우에만 모달 표시)
        const shouldBuy = confirm(`🛒 "${product.name}"이(가) 구매 목록에 추가되었어요!\n\n지금 바로 구매하시겠어요?`);
        if (shouldBuy) {
          const searchQuery = encodeURIComponent(`${product.name} ${product.category}`);
          window.open(`https://search.shopping.naver.com/search/all?query=${searchQuery}&sort=price_asc`, '_blank');
        }
      }
    });

    localStorage.setItem('notifiedProducts', JSON.stringify(Array.from(notifiedProducts)));
    localStorage.setItem('autoAddedToShoppingList', JSON.stringify(Array.from(autoAddedToShoppingList)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, isShoppingListLoading]);

  const handleAddMultipleProducts = useCallback(async (productsToAdd: Omit<Product, 'id'>[]) => {
    try {
      await addMultipleProducts(productsToAdd);
      setActiveScreen('home');
    } catch (error) {
      console.error('제품 등록 실패:', error);
      // 에러는 AddProductScreen에서 처리하므로 여기서는 화면 전환만 하지 않음
      throw error; // AddProductScreen에서 에러를 잡을 수 있도록 다시 throw
    }
  }, [addMultipleProducts]);

  const handleOpenAddScreen = useCallback(() => {
    setActiveScreen('add');
  }, []);

  const handleUpdateProduct = useCallback(async (product: Product) => {
    try {
      await updateProduct(product);
      // 수정된 제품으로 selectedProduct 업데이트 (다시 편집 화면으로 돌아갔을 때 최신 데이터 표시)
      const updatedProduct = products.find(p => p.id === product.id) || product;
      setSelectedProduct(updatedProduct);
      setActiveScreen('home');
      // 잠시 후 selectedProduct 초기화하여 다음 편집 시 최신 데이터 로드
      setTimeout(() => {
        setSelectedProduct(null);
      }, 100);
    } catch (error) {
      console.error('제품 수정 실패:', error);
      // 에러가 발생해도 화면은 전환하지 않음
    }
  }, [updateProduct, products]);

  const handleDeleteProduct = useCallback((productId: string) => {
    setProductToDelete(productId);
    setIsDeleteModalOpen(true);
  }, []);

  const handleReplaceProduct = useCallback((productId: string) => {
    const productToReplace = products.find(p => p.id === productId);
    if (!productToReplace) return;

    const currentStock = productToReplace.stock ?? 1;
    if (currentStock <= 0) {
      alert("재고가 없는 제품은 교체할 수 없어요. 쇼핑 리스트를 확인해보세요!");
      return;
    }

    const newStock = currentStock - 1;
    const newRegistrationDate = new Date().toISOString();
    const monthsToAdd = productToReplace.periodAfterOpening || AVERAGE_USAGE_PERIODS[productToReplace.category] || 6;

    const newExpiryDate = calculateExpiryDate(
      newRegistrationDate,
      monthsToAdd,
      productToReplace.manufacturingDate,
      productToReplace.expiryPeriodBeforeOpening,
    );
    
    const updatedProduct: Product = {
      ...productToReplace,
      stock: newStock,
      registrationDate: newRegistrationDate,
      expiryDate: newExpiryDate,
    };
    
    updateProduct(updatedProduct);

    if (newStock === 0) {
        // Prevent adding duplicates to the shopping list.
        const alreadyInList = shoppingList.some(item => item.productId === productToReplace.id);
        if(!alreadyInList){
            addShoppingListItem({ name: productToReplace.name, productId: productToReplace.id });
            alert(`"${productToReplace.name}"의 마지막 재고를 사용했어요. 쇼핑 리스트에 추가해둘게요! 🛒`);
        }
    }

  }, [products, updateProduct, addShoppingListItem, shoppingList]);

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(productToDelete);
        // 삭제 성공 시에만 모달 닫기
        setIsDeleteModalOpen(false);
        setProductToDelete(null);
      } catch (error) {
        console.error('제품 삭제 실패:', error);
        alert('제품 삭제에 실패했어요. 다시 시도해주세요.');
        // 에러 발생 시 모달은 열어두기
      }
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveScreen('edit');
  };

  const handleCancel = () => {
    setActiveScreen('home');
    setSelectedProduct(null);
  };
  
  const handleToggleShoppingList = useCallback((product: Product) => {
      const existingItem = shoppingList.find(item => item.productId === product.id);
      if (existingItem) {
          deleteShoppingListItem(existingItem.id);
      } else {
          addShoppingListItem({ name: product.name, productId: product.id });
      }
  }, [shoppingList, addShoppingListItem, deleteShoppingListItem]);

  const handleAddShoppingItemManually = (name: string) => {
      addShoppingListItem({ name });
  };
  
  const handleClearAllData = () => {
    localStorage.clear();
    sessionStorage.clear();
    
    clearAllProducts();
    clearAllMemos();

    setActiveScreen('home');
    setSelectedProduct(null);
    setProductToDelete(null);
    setIsDeleteModalOpen(false);
  };


  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen 
          products={products} 
          onEditProduct={handleEditProduct} 
          onDeleteProduct={handleDeleteProduct} 
          onReorderProducts={reorderProducts} 
          onToggleShoppingList={handleToggleShoppingList}
          onReplaceProduct={handleReplaceProduct}
          shoppingList={shoppingList}
          onAddProductRequest={handleOpenAddScreen}
        />;
      case 'add':
        return <AddProductScreen onAddMultipleProducts={handleAddMultipleProducts} onCancel={handleCancel} />;
      case 'edit':
        if (selectedProduct) {
          return <EditProductScreen product={selectedProduct} onUpdateProduct={handleUpdateProduct} onCancel={handleCancel} />;
        }
        // Fallback to home if no product is selected
        setActiveScreen('home');
        return <HomeScreen 
          products={products} 
          onEditProduct={handleEditProduct} 
          onDeleteProduct={handleDeleteProduct} 
          onReorderProducts={reorderProducts} 
          onToggleShoppingList={handleToggleShoppingList}
          onReplaceProduct={handleReplaceProduct}
          shoppingList={shoppingList}
          onAddProductRequest={handleOpenAddScreen}
        />;
       case 'memo':
        return <MemoScreen
            shoppingList={shoppingList}
            onAddItem={handleAddShoppingItemManually}
            onToggleItem={toggleShoppingListItem}
            onDeleteItem={deleteShoppingListItem}
            diaryEntries={diaryEntries}
            onAddEntry={addDiaryEntry}
            onDeleteEntry={deleteDiaryEntry}
         />;
      case 'settings':
        return <SettingsScreen onClearAllData={handleClearAllData} />;
      default:
        return <HomeScreen 
          products={products} 
          onEditProduct={handleEditProduct} 
          onDeleteProduct={handleDeleteProduct} 
          onReorderProducts={reorderProducts}
          onToggleShoppingList={handleToggleShoppingList}
          onReplaceProduct={handleReplaceProduct}
          shoppingList={shoppingList}
          onAddProductRequest={handleOpenAddScreen}
        />;
    }
  };

  return (
    <div className="bg-gradient-to-b from-bathlance-cream/30 via-white to-bathlance-cream/20 min-h-screen font-gaegu">
      <PWARegister />
      <Header />
      <SignedIn>
        <main className="pb-16">
          {renderScreen()}
        </main>
        <BottomNav activeScreen={activeScreen} setScreen={setActiveScreen} />
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="정말 삭제할까요?"
          message="이 제품을 목록에서 삭제하면 되돌릴 수 없어요."
        />
      </SignedIn>
      <SignedOut>
        <main className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <div className="text-center max-w-md bg-gradient-to-br from-white to-bathlance-cream/40 p-8 rounded-cute shadow-cute-lg border-2 border-bathlance-cream">
            <p className="text-6xl mb-6 animate-bounce">🧼</p>
            <h2 className="text-3xl font-bold text-bathlance-orange mb-4">
              BATHLANCE에 오신 것을 환영해요!
            </h2>
            <p className="text-lg text-bathlance-brown/80 mb-8">
              로그인하시면 욕실용품을 관리하고 교체 시기를 알림받을 수 있어요. ✨
            </p>
            <div className="flex flex-col gap-4 items-center">
              <SignInButton mode="modal">
                <button className="w-full bg-gradient-to-r from-bathlance-orange to-bathlance-brown text-white font-bold py-3 px-6 rounded-cute shadow-cute hover:shadow-cute-lg transition-all hover:scale-105">
                  로그인하기
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full bg-white text-bathlance-orange font-bold py-3 px-6 rounded-cute border-2 border-bathlance-orange hover:bg-bathlance-cream transition-all hover:scale-105 shadow-sm">
                  회원가입하기
                </button>
              </SignUpButton>
            </div>
          </div>
        </main>
      </SignedOut>
    </div>
  );
}

