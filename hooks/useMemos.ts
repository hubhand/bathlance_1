import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { ShoppingListItem, DiaryEntry } from '../types';
import { supabase } from '../lib/supabase';

export const useMemos = () => {
  const { user, isLoaded } = useUser();
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const updatingItemsRef = useRef<Set<string>>(new Set()); // 업데이트 중인 항목 추적
  const isAddingDiaryRef = useRef<boolean>(false); // 일기 추가 중인지 추적
  const deletingDiaryEntriesRef = useRef<Set<string>>(new Set()); // 삭제 중인 일기 항목 추적

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
      // ⚠️ 핵심: 업데이트 중인 항목이 있으면 로드 건너뛰기
      if (updatingItemsRef.current.size > 0) {
        return;
      }

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

        // 일기 불러오기 (일기 추가 중이 아니고 삭제 중인 항목이 없을 때만)
        if (!isAddingDiaryRef.current && deletingDiaryEntriesRef.current.size === 0) {
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
        (payload) => {
          // ⚠️ 핵심: 업데이트 중인 항목이 있으면 전체 로드도 건너뛰기
          if (updatingItemsRef.current.size > 0) {
            return;
          }
          
          // 업데이트 중인 항목이면 무시
          const itemId = (payload.new as { id?: string } | null)?.id || (payload.old as { id?: string } | null)?.id;
          if (itemId && updatingItemsRef.current.has(itemId)) {
            return;
          }
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
        (payload) => {
          // 일기 추가 중이거나 삭제 중이면 무시
          const entryId = (payload.new as { id?: string } | null)?.id || (payload.old as { id?: string } | null)?.id;
          if (isAddingDiaryRef.current) {
            return;
          }
          if (entryId && deletingDiaryEntriesRef.current.has(entryId)) {
            return;
          }
          if (deletingDiaryEntriesRef.current.size > 0) {
            return;
          }
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
      // 임시 ID 생성 (서버 응답 전까지 사용)
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempItem: ShoppingListItem = {
        id: tempId,
        name: item.name,
        checked: false,
        productId: item.productId,
      };

      // 즉시 로컬 상태에 추가 (낙관적 업데이트)
      setShoppingList(prevList => [...prevList, tempItem]);

      const { data, error } = await supabase
        .from('shopping_list')
        .insert({
          user_id: user.id,
          name: item.name,
          checked: false,
          product_id: item.productId || null,
        })
        .select()
        .single();

      if (error) {
        // 에러 발생 시 롤백
        setShoppingList(prevList => prevList.filter(i => i.id !== tempId));
        console.error('쇼핑 리스트 항목을 추가하는 데 실패했습니다:', error);
        alert('항목 추가에 실패했어요. 콘솔을 확인해주세요.');
        throw error;
      }

      // 서버에서 받은 실제 ID로 업데이트
      if (data) {
        setShoppingList(prevList => 
          prevList.map(i => i.id === tempId ? {
            id: data.id,
            name: data.name,
            checked: data.checked,
            productId: data.product_id || undefined,
          } : i)
        );
      }

      // 상태 업데이트는 실시간 구독에서도 처리되지만, 이미 업데이트했으므로 중복 업데이트는 괜찮음
    } catch (error) {
      console.error('쇼핑 리스트 추가 중 오류:', error);
      throw error;
    }
  }, [user]);

  const toggleShoppingListItem = useCallback(async (itemId: string) => {
    if (!user) {
      console.error('사용자가 로그인되지 않았습니다.');
      return;
    }

    try {
      const item = shoppingList.find(i => i.id === itemId);
      if (!item) {
        console.error('항목을 찾을 수 없습니다:', itemId);
        return;
      }

      // 이미 체크되어 있으면 해제만 하고, 체크되지 않았으면 다른 항목들을 모두 해제하고 이 항목만 체크
      const newCheckedState = !item.checked;
      

      // 업데이트할 항목들 수집 (현재 항목 + 다른 체크된 항목들)
      const itemsToUpdate: string[] = [];
      if (newCheckedState) {
        // 체크하려는 경우: 현재 항목 + 다른 체크된 항목들
        itemsToUpdate.push(itemId);
        shoppingList.forEach(i => {
          if (i.id !== itemId && i.checked) {
            itemsToUpdate.push(i.id);
          }
        });
      } else {
        // 해제하려는 경우: 현재 항목만
        itemsToUpdate.push(itemId);
      }

      // 모든 업데이트할 항목에 플래그 설정
      itemsToUpdate.forEach(id => updatingItemsRef.current.add(id));

      // 즉시 로컬 상태 업데이트 (낙관적 업데이트)
      setShoppingList(prevList => 
        prevList.map(i => {
          if (i.id === itemId) {
            return { ...i, checked: newCheckedState };
          } else if (newCheckedState && i.checked) {
            // 다른 항목들은 해제
            return { ...i, checked: false };
          }
          return i;
        })
      );

      // 모든 항목 업데이트
      const updatePromises = itemsToUpdate.map(async (id) => {
        const targetItem = shoppingList.find(i => i.id === id);
        if (!targetItem) return;
        
        const shouldBeChecked = id === itemId ? newCheckedState : false;
        
        const { data, error } = await supabase
          .from('shopping_list')
          .update({ checked: shouldBeChecked })
          .eq('id', id)
          .eq('user_id', user.id)
          .select();

        if (error) {
          console.error(`쇼핑 리스트 항목 ${id} 수정 실패:`, error);
          throw error;
        }
        return data;
      });

      const results = await Promise.all(updatePromises);

      // 잠시 후 업데이트 플래그 제거 (실시간 구독이 다시 작동하도록)
      setTimeout(() => {
        itemsToUpdate.forEach(id => updatingItemsRef.current.delete(id));
      }, 1000);
    } catch (error) {
      // 에러 발생 시 롤백
      const item = shoppingList.find(i => i.id === itemId);
      if (item) {
        setShoppingList(prevList => 
          prevList.map(i => {
            if (i.id === itemId) {
              return { ...i, checked: item.checked };
            }
            return i;
          })
        );
      }
      // 모든 플래그 제거
      shoppingList.forEach(i => {
        if (i.id !== itemId && i.checked) {
          updatingItemsRef.current.delete(i.id);
        }
      });
      updatingItemsRef.current.delete(itemId);
      console.error('쇼핑 리스트 수정 중 오류:', error);
      alert('체크 상태 변경에 실패했어요. 콘솔을 확인해주세요.');
      throw error;
    }
  }, [user, shoppingList]);

  const deleteShoppingListItem = useCallback(async (itemId: string) => {
    if (!user) {
      console.error('사용자가 로그인되지 않았습니다.');
      return;
    }

    try {

      // 삭제할 항목 저장 (에러 시 복구용)
      const itemToDelete = shoppingList.find(i => i.id === itemId);

      // 업데이트 중 플래그 설정
      updatingItemsRef.current.add(itemId);

      // 즉시 로컬 상태에서 제거 (낙관적 업데이트)
      setShoppingList(prevList => prevList.filter(i => i.id !== itemId));

      const { data, error } = await supabase
        .from('shopping_list')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id)
        .select();

      if (error) {
        // 에러 발생 시 롤백
        if (itemToDelete) {
          setShoppingList(prevList => [...prevList, itemToDelete]);
        }
        updatingItemsRef.current.delete(itemId);
        console.error('쇼핑 리스트 항목을 삭제하는 데 실패했습니다:', error);
        alert('삭제에 실패했어요. 콘솔을 확인해주세요.');
        throw error;
      }

      // 잠시 후 업데이트 플래그 제거
      setTimeout(() => {
        updatingItemsRef.current.delete(itemId);
      }, 1000);
    } catch (error) {
      // 에러 발생 시 플래그 제거
      updatingItemsRef.current.delete(itemId);
      console.error('쇼핑 리스트 삭제 중 오류:', error);
      throw error;
    }
  }, [user, shoppingList]);

  // Diary Entry functions
  const addDiaryEntry = useCallback(async (content: string) => {
    if (!user) return;

    if (diaryEntries.length >= 10) {
      alert('일기장은 10개까지 작성할 수 있어요.');
      return;
    }

    try {
      // 일기 추가 중 플래그 설정
      isAddingDiaryRef.current = true;

      const now = new Date().toISOString();
      // 임시 ID 생성 (서버 응답 전까지 사용)
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempEntry: DiaryEntry = {
        id: tempId,
        content,
        date: now,
      };

      // 즉시 로컬 상태에 추가 (낙관적 업데이트)
      setDiaryEntries(prevEntries => [tempEntry, ...prevEntries]);

      const { data, error } = await supabase
        .from('diary_entries')
        .insert({
          user_id: user.id,
          content,
          date: now,
        })
        .select()
        .single();

      if (error) {
        // 에러 발생 시 롤백
        setDiaryEntries(prevEntries => prevEntries.filter(e => e.id !== tempId));
        isAddingDiaryRef.current = false;
        console.error('일기를 추가하는 데 실패했습니다:', error);
        alert('일기 추가에 실패했어요. 콘솔을 확인해주세요.');
        throw error;
      }

      // 서버에서 받은 실제 ID로 업데이트
      if (data) {
        setDiaryEntries(prevEntries => 
          prevEntries.map(e => e.id === tempId ? {
            id: data.id,
            content: data.content,
            date: data.date,
          } : e)
        );
      }

      // 잠시 후 플래그 제거 (실시간 구독이 다시 작동하도록)
      setTimeout(() => {
        isAddingDiaryRef.current = false;
      }, 1000);
    } catch (error) {
      isAddingDiaryRef.current = false;
      console.error('일기 추가 중 오류:', error);
      throw error;
    }
  }, [user, diaryEntries.length]);

  const deleteDiaryEntry = useCallback(async (entryId: string) => {
    if (!user) return;

    try {

      // 삭제할 항목 저장 (에러 시 복구용)
      const entryToDelete = diaryEntries.find(e => e.id === entryId);
      if (!entryToDelete) {
        console.error('삭제할 일기를 찾을 수 없습니다:', entryId);
        return;
      }

      // 삭제 중 플래그 설정
      deletingDiaryEntriesRef.current.add(entryId);

      // 즉시 로컬 상태에서 제거 (낙관적 업데이트)
      setDiaryEntries(prevEntries => prevEntries.filter(e => e.id !== entryId));

      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) {
        // 에러 발생 시 롤백
        setDiaryEntries(prevEntries => [...prevEntries, entryToDelete].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
        deletingDiaryEntriesRef.current.delete(entryId);
        console.error('일기를 삭제하는 데 실패했습니다:', error);
        alert('일기 삭제에 실패했어요. 콘솔을 확인해주세요.');
        throw error;
      }

      // 잠시 후 삭제 플래그 제거
      setTimeout(() => {
        deletingDiaryEntriesRef.current.delete(entryId);
      }, 1000);
    } catch (error) {
      deletingDiaryEntriesRef.current.delete(entryId);
      console.error('일기 삭제 중 오류:', error);
      throw error;
    }
  }, [user, diaryEntries]);

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
