import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useUser, useSession } from "@clerk/nextjs";
import { Product } from "../types";
import { createClient } from "../lib/supabase/client";

export const useProducts = () => {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const deletingProductsRef = useRef<Set<string>>(new Set());

  // Clerk session이 있을 때만 Supabase 클라이언트 생성
  const supabase = useMemo(() => {
    return createClient(session);
  }, [session]);

  // Supabase에서 제품 목록 불러오기
  useEffect(() => {
    if (!isLoaded) return;

    if (!user || !session) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", user.id)
          .order("display_order", { ascending: true });

        if (error) {
          console.error("제품을 불러오는 데 실패했습니다:", error);
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
          expiryPeriodBeforeOpening:
            item.expiry_period_before_opening || undefined,
          periodAfterOpening: item.period_after_opening || undefined,
          ingredientAnalysis: item.ingredient_analysis || undefined,
          review: item.review || undefined,
          hasTrouble: item.has_trouble || false,
          stock:
            item.stock !== null && item.stock !== undefined ? item.stock : 1,
        }));

        setProducts(convertedProducts);
      } catch (error) {
        console.error("제품을 불러오는 데 실패했습니다:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();

    // 실시간 업데이트 구독
    const channel = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log(
            "실시간 업데이트 수신:",
            payload.eventType,
            payload.new || payload.old
          );

          // 삭제 이벤트이고 삭제 중인 제품이면 무시
          if (payload.eventType === "DELETE") {
            const deletedId = payload.old?.id;
            if (deletedId && deletingProductsRef.current.has(deletedId)) {
              deletingProductsRef.current.delete(deletedId);
              return;
            }
          }

          loadProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isLoaded, session, supabase]);

  const addProduct = useCallback(
    async (product: Omit<Product, "id">) => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("products")
          .insert({
            user_id: user.id,
            name: product.name,
            category: product.category,
            registration_date: product.registrationDate,
            expiry_date: product.expiryDate,
            image_url: product.imageUrl,
            manufacturing_date: product.manufacturingDate || null,
            expiry_period_before_opening:
              product.expiryPeriodBeforeOpening || null,
            period_after_opening: product.periodAfterOpening || null,
            ingredient_analysis: product.ingredientAnalysis || null,
            review: product.review || null,
            has_trouble: product.hasTrouble || false,
            stock:
              product.stock !== null && product.stock !== undefined
                ? product.stock
                : 1,
            display_order: products.length,
          })
          .select()
          .single();

        if (error) {
          console.error("제품을 추가하는 데 실패했습니다:", error);
          throw error;
        }

        // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
      } catch (error) {
        console.error("제품 추가 중 오류:", error);
        throw error;
      }
    },
    [user, products.length, supabase]
  );

  const addMultipleProducts = useCallback(
    async (newProducts: Omit<Product, "id">[]) => {
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
          expiry_period_before_opening:
            product.expiryPeriodBeforeOpening || null,
          period_after_opening: product.periodAfterOpening || null,
          ingredient_analysis: product.ingredientAnalysis || null,
          review: product.review || null,
          has_trouble: product.hasTrouble || false,
          stock:
            product.stock !== null && product.stock !== undefined
              ? product.stock
              : 1,
          display_order: products.length + index,
        }));

        const { error } = await supabase
          .from("products")
          .insert(productsToInsert);

        if (error) {
          console.error("제품들을 추가하는 데 실패했습니다:", error);
          throw error;
        }

        // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
      } catch (error) {
        console.error("제품 추가 중 오류:", error);
        throw error;
      }
    },
    [user, products.length, supabase]
  );

  const updateProduct = useCallback(
    async (updatedProduct: Product) => {
      if (!user) {
        console.error("사용자가 로그인되지 않았습니다.");
        return;
      }

      try {
        console.log("제품 수정 시도:", {
          id: updatedProduct.id,
          stock: updatedProduct.stock,
          전체데이터: updatedProduct,
        });

        const { data, error } = await supabase
          .from("products")
          .update({
            name: updatedProduct.name,
            category: updatedProduct.category,
            registration_date: updatedProduct.registrationDate,
            expiry_date: updatedProduct.expiryDate,
            image_url: updatedProduct.imageUrl,
            manufacturing_date: updatedProduct.manufacturingDate || null,
            expiry_period_before_opening:
              updatedProduct.expiryPeriodBeforeOpening || null,
            period_after_opening: updatedProduct.periodAfterOpening || null,
            ingredient_analysis: updatedProduct.ingredientAnalysis || null,
            review: updatedProduct.review || null,
            has_trouble: updatedProduct.hasTrouble || false,
            stock:
              updatedProduct.stock !== undefined &&
              updatedProduct.stock !== null
                ? updatedProduct.stock
                : 1,
          })
          .eq("id", updatedProduct.id)
          .eq("user_id", user.id)
          .select();

        if (error) {
          console.error("제품을 수정하는 데 실패했습니다:", error);
          alert(
            `제품 수정에 실패했어요: ${error.message || "알 수 없는 오류"}`
          );
          throw error;
        }

        // 🔍 트러블 발생으로 체크된 경우 트러블 이력에 저장
        if (updatedProduct.hasTrouble && data && data.length > 0) {
          const updatedItem = data[0];

          // 이미 트러블 이력이 있는지 확인
          const { data: existingHistory } = await supabase
            .from("trouble_history")
            .select("id")
            .eq("user_id", user.id)
            .eq("product_id", updatedProduct.id)
            .single();

          if (!existingHistory || existingHistory === null) {
            // 트러블 이력이 없으면 새로 생성
            await supabase.from("trouble_history").insert({
              user_id: user.id,
              product_name: updatedProduct.name,
              category: updatedProduct.category,
              ingredient_analysis: updatedProduct.ingredientAnalysis || null,
              review: updatedProduct.review || null,
              product_id: updatedProduct.id,
            });
          } else {
            // 트러블 이력이 있으면 업데이트
            await supabase
              .from("trouble_history")
              .update({
                product_name: updatedProduct.name,
                category: updatedProduct.category,
                ingredient_analysis: updatedProduct.ingredientAnalysis || null,
                review: updatedProduct.review || null,
              })
              .eq("id", existingHistory.id);
          }
        }
        // 트러블 체크를 해제한 경우에도 이력은 보존 (삭제하지 않음)

        // 즉시 로컬 상태 업데이트 (실시간 구독을 기다리지 않음)
        if (data && data.length > 0) {
          const updatedItem = data[0];
          const convertedItem: Product = {
            id: updatedItem.id,
            name: updatedItem.name,
            category: updatedItem.category,
            registrationDate: updatedItem.registration_date,
            expiryDate: updatedItem.expiry_date,
            imageUrl: updatedItem.image_url,
            manufacturingDate: updatedItem.manufacturing_date || undefined,
            expiryPeriodBeforeOpening:
              updatedItem.expiry_period_before_opening || undefined,
            periodAfterOpening: updatedItem.period_after_opening || undefined,
            ingredientAnalysis: updatedItem.ingredient_analysis || undefined,
            review: updatedItem.review || undefined,
            hasTrouble: updatedItem.has_trouble || false,
            stock:
              updatedItem.stock !== null && updatedItem.stock !== undefined
                ? updatedItem.stock
                : 1,
          };

          setProducts((prevProducts) =>
            prevProducts.map((p) =>
              p.id === convertedItem.id ? convertedItem : p
            )
          );
          console.log("로컬 상태 즉시 업데이트 완료:", convertedItem);
        }

        // 실시간 구독도 백업으로 작동하지만, 이미 업데이트했으므로 중복 업데이트는 괜찮음
      } catch (error) {
        console.error("제품 수정 중 오류:", error);
        throw error;
      }
    },
    [user, supabase]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      if (!user) return;

      // 삭제할 제품 저장 (에러 시 복구용)
      const productToDelete = products.find((p) => p.id === productId);

      // 삭제 중인 제품 추적
      deletingProductsRef.current.add(productId);

      // 즉시 로컬 상태에서 제거 (낙관적 업데이트)
      setProducts((prevProducts) =>
        prevProducts.filter((p) => p.id !== productId)
      );

      try {
        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", productId)
          .eq("user_id", user.id);

        if (error) {
          console.error("제품을 삭제하는 데 실패했습니다:", error);
          deletingProductsRef.current.delete(productId);
          // 에러 발생 시 롤백
          if (productToDelete) {
            setProducts((prevProducts) =>
              [...prevProducts, productToDelete].sort((a, b) => {
                // display_order로 정렬 (없으면 0)
                const orderA = (a as any).display_order || 0;
                const orderB = (b as any).display_order || 0;
                return orderA - orderB;
              })
            );
          }
          throw error;
        }

        // 삭제 성공 후 잠시 후 추적 제거 (실시간 구독 처리 대기)
        setTimeout(() => {
          deletingProductsRef.current.delete(productId);
        }, 1000);
      } catch (error) {
        console.error("제품 삭제 중 오류:", error);
        deletingProductsRef.current.delete(productId);
        throw error;
      }
    },
    [user, products, supabase]
  );

  const reorderProducts = useCallback(
    async (reorderedProducts: Product[]) => {
      if (!user) return;

      try {
        // 모든 제품의 display_order를 업데이트
        const updates = reorderedProducts.map((product, index) =>
          supabase
            .from("products")
            .update({ display_order: index })
            .eq("id", product.id)
            .eq("user_id", user.id)
        );

        await Promise.all(updates);

        // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
      } catch (error) {
        console.error("제품 순서 변경 중 오류:", error);
        throw error;
      }
    },
    [user, supabase]
  );

  const clearAllProducts = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("모든 제품을 삭제하는 데 실패했습니다:", error);
        throw error;
      }

      // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
    } catch (error) {
      console.error("제품 전체 삭제 중 오류:", error);
      throw error;
    }
  }, [user, supabase]);

  // 🔍 트러블 발생 이력 확인 함수 (트러블 이력 테이블에서 조회)
  const checkTroubleHistory = useCallback(
    async (productName: string): Promise<Product | null> => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from("trouble_history")
          .select("*")
          .eq("user_id", user.id)
          .ilike("product_name", `%${productName}%`) // 대소문자 구분 없이 부분 일치 검색
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("트러블 이력 확인 중 오류:", error);
          return null;
        }

        if (!data) return null;

        // TroubleHistory를 Product 타입으로 변환 (호환성을 위해)
        const troubleProduct: Product = {
          id: data.id, // trouble_history의 id 사용
          name: data.product_name,
          category: data.category,
          registrationDate: data.created_at, // 생성일을 등록일로 사용
          expiryDate: data.created_at, // 임시값
          imageUrl: "", // 이미지는 저장하지 않음
          ingredientAnalysis: data.ingredient_analysis || undefined,
          review: data.review || undefined,
          hasTrouble: true,
          stock: 0, // 트러블 이력은 재고 없음
        };

        return troubleProduct;
      } catch (error) {
        console.error("트러블 이력 확인 중 오류:", error);
        return null;
      }
    },
    [user, supabase]
  );

  // 🔍 트러블 발생한 모든 제품 가져오기 (트러블 이력 테이블에서 조회)
  const getTroubleProducts = useCallback(async (): Promise<Product[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("trouble_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("트러블 제품 조회 중 오류:", error);
        return [];
      }

      if (!data || data.length === 0) return [];

      // TroubleHistory를 Product 타입으로 변환
      const troubleProducts: Product[] = data.map((item) => ({
        id: item.id,
        name: item.product_name,
        category: item.category,
        registrationDate: item.created_at,
        expiryDate: item.created_at, // 임시값
        imageUrl: "",
        ingredientAnalysis: item.ingredient_analysis || undefined,
        review: item.review || undefined,
        hasTrouble: true,
        stock: 0,
      }));

      return troubleProducts;
    } catch (error) {
      console.error("트러블 제품 조회 중 오류:", error);
      return [];
    }
  }, [user, supabase]);

  // 🔍 트러블 발생 제품들의 공통 성분 찾기
  const findCommonTroubleIngredients = useCallback(async (): Promise<{
    commonIngredients: Array<{
      name: string;
      count: number;
      products: string[];
    }>;
    allTroubleProducts: Product[];
  }> => {
    const troubleProducts = await getTroubleProducts();

    if (troubleProducts.length < 2) {
      return { commonIngredients: [], allTroubleProducts: troubleProducts };
    }

    // 모든 트러블 제품의 성분을 수집
    const ingredientMap = new Map<
      string,
      { count: number; products: string[] }
    >();

    troubleProducts.forEach((product) => {
      if (product.ingredientAnalysis && product.ingredientAnalysis.length > 0) {
        product.ingredientAnalysis.forEach((ingredient) => {
          const ingredientName = ingredient.name.toLowerCase().trim();
          if (ingredientMap.has(ingredientName)) {
            const existing = ingredientMap.get(ingredientName)!;
            if (!existing.products.includes(product.name)) {
              existing.count += 1;
              existing.products.push(product.name);
            }
          } else {
            ingredientMap.set(ingredientName, {
              count: 1,
              products: [product.name],
            });
          }
        });
      }
    });

    // 2개 이상의 제품에 공통으로 포함된 성분만 필터링
    const commonIngredients = Array.from(ingredientMap.entries())
      .filter(([_, data]) => data.count >= 2)
      .map(([name, data]) => ({
        name,
        count: data.count,
        products: data.products,
      }))
      .sort((a, b) => b.count - a.count); // 많이 공통된 순서로 정렬

    return { commonIngredients, allTroubleProducts: troubleProducts };
  }, [getTroubleProducts]);

  return {
    products,
    addProduct,
    addMultipleProducts,
    updateProduct,
    deleteProduct,
    reorderProducts,
    clearAllProducts,
    checkTroubleHistory,
    getTroubleProducts,
    findCommonTroubleIngredients,
    isLoading,
  };
};
