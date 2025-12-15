import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { ShoppingListItem, DiaryEntry } from '../types';
import { supabase } from '../lib/supabase';

export const useMemos = () => {
  const { user, isLoaded } = useUser();
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase에서 쇼핑 리스트와 일기 불러오기
  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      setShoppingList([]);
      setDiaryEntries([]);
      setIsLoading(false);
      return;
    }

    const loadMemos = async () => {
      try {
        setIsLoading(true);

        // 쇼핑 리스트 불러오기
        const { data: shoppingData, error: shoppingError } = await supabase
          .from('shopping_list')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (shoppingError) {
          console.error('쇼핑 리스트를 불러오는 데 실패했습니다:', shoppingError);
        } else {
          const convertedShoppingList: ShoppingListItem[] = (shoppingData || []).map((item) => ({
            id: item.id,
            name: item.name,
            checked: item.checked,
            productId: item.product_id || undefined,
          }));
          setShoppingList(convertedShoppingList);
        }

        // 일기 불러오기
        const { data: diaryData, error: diaryError } = await supabase
          .from('diary_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(10);

        if (diaryError) {
          console.error('일기를 불러오는 데 실패했습니다:', diaryError);
        } else {
          const convertedDiaryEntries: DiaryEntry[] = (diaryData || []).map((item) => ({
            id: item.id,
            content: item.content,
            date: item.date,
          }));
          setDiaryEntries(convertedDiaryEntries);
        }
      } catch (error) {
        console.error('메모를 불러오는 데 실패했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMemos();

    // 실시간 업데이트 구독
    const shoppingChannel = supabase
      .channel('shopping-list-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadMemos();
        }
      )
      .subscribe();

    const diaryChannel = supabase
      .channel('diary-entries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'diary_entries',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadMemos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(shoppingChannel);
      supabase.removeChannel(diaryChannel);
    };
  }, [user, isLoaded]);

  // Shopping List functions
  const addShoppingListItem = useCallback(async (item: Omit<ShoppingListItem, 'id' | 'checked'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('shopping_list')
        .insert({
          user_id: user.id,
          name: item.name,
          checked: false,
          product_id: item.productId || null,
        });

      if (error) {
        console.error('쇼핑 리스트 항목을 추가하는 데 실패했습니다:', error);
        throw error;
      }

      // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
    } catch (error) {
      console.error('쇼핑 리스트 추가 중 오류:', error);
      throw error;
    }
  }, [user]);

  const toggleShoppingListItem = useCallback(async (itemId: string) => {
    if (!user) return;

    try {
      const item = shoppingList.find(i => i.id === itemId);
      if (!item) return;

      const { error } = await supabase
        .from('shopping_list')
        .update({ checked: !item.checked })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        console.error('쇼핑 리스트 항목을 수정하는 데 실패했습니다:', error);
        throw error;
      }

      // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
    } catch (error) {
      console.error('쇼핑 리스트 수정 중 오류:', error);
      throw error;
    }
  }, [user, shoppingList]);

  const deleteShoppingListItem = useCallback(async (itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('shopping_list')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        console.error('쇼핑 리스트 항목을 삭제하는 데 실패했습니다:', error);
        throw error;
      }

      // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
    } catch (error) {
      console.error('쇼핑 리스트 삭제 중 오류:', error);
      throw error;
    }
  }, [user]);

  // Diary Entry functions
  const addDiaryEntry = useCallback(async (content: string) => {
    if (!user) return;

    if (diaryEntries.length >= 10) {
      alert('일기장은 10개까지 작성할 수 있어요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('diary_entries')
        .insert({
          user_id: user.id,
          content,
          date: new Date().toISOString(),
        });

      if (error) {
        console.error('일기를 추가하는 데 실패했습니다:', error);
        throw error;
      }

      // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
    } catch (error) {
      console.error('일기 추가 중 오류:', error);
      throw error;
    }
  }, [user, diaryEntries.length]);

  const deleteDiaryEntry = useCallback(async (entryId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) {
        console.error('일기를 삭제하는 데 실패했습니다:', error);
        throw error;
      }

      // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
    } catch (error) {
      console.error('일기 삭제 중 오류:', error);
      throw error;
    }
  }, [user]);

  const clearAllMemos = useCallback(async () => {
    if (!user) return;

    try {
      const [shoppingResult, diaryResult] = await Promise.all([
        supabase
          .from('shopping_list')
          .delete()
          .eq('user_id', user.id),
        supabase
          .from('diary_entries')
          .delete()
          .eq('user_id', user.id),
      ]);

      if (shoppingResult.error) {
        console.error('쇼핑 리스트를 삭제하는 데 실패했습니다:', shoppingResult.error);
      }

      if (diaryResult.error) {
        console.error('일기를 삭제하는 데 실패했습니다:', diaryResult.error);
      }

      // 상태 업데이트는 실시간 구독에서 자동으로 처리됨
    } catch (error) {
      console.error('메모 전체 삭제 중 오류:', error);
      throw error;
    }
  }, [user]);

  return {
    shoppingList,
    addShoppingListItem,
    toggleShoppingListItem,
    deleteShoppingListItem,
    diaryEntries,
    addDiaryEntry,
    deleteDiaryEntry,
    clearAllMemos,
    isLoading,
  };
};
