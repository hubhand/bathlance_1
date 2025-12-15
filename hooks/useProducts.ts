import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Product } from '../types';
import { supabase } from '../lib/supabase';

export const useProducts = () => {
  const { user, isLoaded } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase에서 제품 목록 불러오기
  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('display_order', { ascending: true });

        if (error) {
          console.error('제품을 불러오는 데 실패했습니다:', error);
          return;
        }

        // Supabase 데이터를 Product 타입으로 변환
        const convertedProducts: Product[] = (data || []).map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          registrationDate: item.registration_date,
          expiryDate: item.expiry_date,
          imageUrl: item.image_url,
          manufacturingDate: item.manufacturing_date || undefined,
          expiryPeriodBeforeOpening: item.expiry_period_before_opening || undefined,
          periodAfterOpening: item.period_after_opening || undefined,
          ingredientAnalysis: item.ingredient_analysis || undefined,
          review: item.review || undefined,
          hasTrouble: item.has_trouble || false,
          stock: item.stock || 1,
        }));

        setProducts(convertedProducts);
      } catch (error) {
        console.error('제품을 불러오는 데 실패했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();

    // 실시간 업데이트 구독
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isLoaded]);

  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: product.name,
          category: product.category,
          registration_date: product.registrationDate,
          expiry_date: product.expiryDate,
          image_url: product.imageUrl,
          manufacturing_date: product.manufacturingDate || null,
          expiry_period_before_opening: product.expiryPeriodBeforeOpening || null,
          period_after_opening: product.periodAfterOpening || null,
          ingredient_analysis: product.ingredientAnalysis || null,
          review: product.review || null,
          has_trouble: product.hasTrouble || false,
          stock: product.stock || 1,
          display_order: products.length,
        })
        .select()
        .single();

      if (error) {
        console.error('제품을 추가하는 데 실패했습니다:', error);
        throw error;
      }

      // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
    } catch (error) {
      console.error('제품 추가 중 오류:', error);
      throw error;
    }
  }, [user, products.length]);

  const addMultipleProducts = useCallback(async (newProducts: Omit<Product, 'id'>[]) => {
    if (!user) return;

    try {
      const productsToInsert = newProducts.map((product, index) => ({
        user_id: user.id,
        name: product.name,
        category: product.category,
        registration_date: product.registrationDate,
        expiry_date: product.expiryDate,
        image_url: product.imageUrl,
        manufacturing_date: product.manufacturingDate || null,
        expiry_period_before_opening: product.expiryPeriodBeforeOpening || null,
        period_after_opening: product.periodAfterOpening || null,
        ingredient_analysis: product.ingredientAnalysis || null,
        review: product.review || null,
        has_trouble: product.hasTrouble || false,
        stock: product.stock || 1,
        display_order: products.length + index,
      }));

      const { error } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (error) {
        console.error('제품들을 추가하는 데 실패했습니다:', error);
        throw error;
      }

      // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
    } catch (error) {
      console.error('제품 추가 중 오류:', error);
      throw error;
    }
  }, [user, products.length]);

  const updateProduct = useCallback(async (updatedProduct: Product) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: updatedProduct.name,
          category: updatedProduct.category,
          registration_date: updatedProduct.registrationDate,
          expiry_date: updatedProduct.expiryDate,
          image_url: updatedProduct.imageUrl,
          manufacturing_date: updatedProduct.manufacturingDate || null,
          expiry_period_before_opening: updatedProduct.expiryPeriodBeforeOpening || null,
          period_after_opening: updatedProduct.periodAfterOpening || null,
          ingredient_analysis: updatedProduct.ingredientAnalysis || null,
          review: updatedProduct.review || null,
          has_trouble: updatedProduct.hasTrouble || false,
          stock: updatedProduct.stock || 1,
        })
        .eq('id', updatedProduct.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('제품을 수정하는 데 실패했습니다:', error);
        throw error;
      }

      // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
    } catch (error) {
      console.error('제품 수정 중 오류:', error);
      throw error;
    }
  }, [user]);

  const deleteProduct = useCallback(async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', user.id);

      if (error) {
        console.error('제품을 삭제하는 데 실패했습니다:', error);
        throw error;
      }

      // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
    } catch (error) {
      console.error('제품 삭제 중 오류:', error);
      throw error;
    }
  }, [user]);

  const reorderProducts = useCallback(async (reorderedProducts: Product[]) => {
    if (!user) return;

    try {
      // 모든 제품의 display_order를 업데이트
      const updates = reorderedProducts.map((product, index) =>
        supabase
          .from('products')
          .update({ display_order: index })
          .eq('id', product.id)
          .eq('user_id', user.id)
      );

      await Promise.all(updates);

      // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
    } catch (error) {
      console.error('제품 순서 변경 중 오류:', error);
      throw error;
    }
  }, [user]);

  const clearAllProducts = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('모든 제품을 삭제하는 데 실패했습니다:', error);
        throw error;
      }

      // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
    } catch (error) {
      console.error('제품 전체 삭제 중 오류:', error);
      throw error;
    }
  }, [user]);

  return { 
    products, 
    addProduct, 
    addMultipleProducts, 
    updateProduct, 
    deleteProduct, 
    reorderProducts, 
    clearAllProducts,
    isLoading,
  };
};
