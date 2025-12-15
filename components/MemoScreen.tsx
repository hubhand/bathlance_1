import React, { useState } from 'react';
import { ShoppingListItem, DiaryEntry } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { formatDate } from '../utils/dateUtils';

interface MemoScreenProps {
    shoppingList: ShoppingListItem[];
    onAddItem: (name: string) => void;
    onToggleItem: (id: string) => void;
    onDeleteItem: (id: string) => void;
    diaryEntries: DiaryEntry[];
    onAddEntry: (content: string) => void;
    onDeleteEntry: (id: string) => void;
}

const ShoppingList: React.FC<Omit<MemoScreenProps, 'diaryEntries' | 'onAddEntry' | 'onDeleteEntry'>> = 
  ({ shoppingList, onAddItem, onToggleItem, onDeleteItem }) => {
    const [newItemName, setNewItemName] = useState('');

    // 체크된 품목들만 필터링
    const checkedItems = shoppingList.filter(item => item.checked);
    const hasCheckedItems = checkedItems.length > 0;

    // 네이버 쇼핑 최저가 검색 - 각 품목을 개별 탭으로 열기
    const openNaverShopping = () => {
        if (checkedItems.length === 0) return;
        
        // 각 품목을 개별 탭으로 열기
        checkedItems.forEach((item, index) => {
            const query = encodeURIComponent(item.name);
            // 첫 번째 탭은 즉시 열고, 나머지는 약간의 지연을 두어 팝업 차단 방지
            setTimeout(() => {
                window.open(`https://search.shopping.naver.com/search/all?query=${query}&sort=price_asc`, '_blank');
            }, index * 200); // 200ms 간격으로 열기
        });
    };

    // 쿠팡 검색 - 각 품목을 개별 탭으로 열기
    const openCoupang = () => {
        if (checkedItems.length === 0) return;
        
        // 각 품목을 개별 탭으로 열기
        checkedItems.forEach((item, index) => {
            const query = encodeURIComponent(item.name);
            // 첫 번째 탭은 즉시 열고, 나머지는 약간의 지연을 두어 팝업 차단 방지
            setTimeout(() => {
                window.open(`https://www.coupang.com/np/search?component=&q=${query}&channel=user`, '_blank');
            }, index * 200); // 200ms 간격으로 열기
        });
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemName.trim()) {
            onAddItem(newItemName.trim());
            setNewItemName('');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">새로 구매해야 할 용품 리스트 🛒</h3>
            <form onSubmit={handleAddItem} className="flex space-x-2 mb-4">
                <input 
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="사고 싶은 제품을 입력하세요..."
                    className="flex-grow px-4 py-2 bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-bathlance-yellow"
                />
                <button type="submit" className="bg-bathlance-orange text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-orange-600 transition-colors">
                    추가
                </button>
            </form>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
                {shoppingList.length > 0 ? shoppingList.map(item => (
                    <li key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                        <label className="flex items-center cursor-pointer flex-grow">
                            <input 
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => onToggleItem(item.id)}
                                className="h-5 w-5 rounded border-gray-300 text-bathlance-orange focus:ring-bathlance-orange"
                            />
                            <span className={`ml-3 text-gray-700 ${item.checked ? 'line-through text-gray-400' : ''}`}>
                                {item.name}
                            </span>
                        </label>
                        <button onClick={() => onDeleteItem(item.id)} className="text-gray-400 hover:text-red-600 ml-2">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </li>
                )) : (
                    <p className="text-center text-gray-400 py-4">구매할 용품이 없어요!</p>
                )}
            </ul>

            {/* 체크된 품목 바로 구매하기 섹션 - 항상 표시 */}
            <div className="mt-4 pt-4 border-t-2 border-dashed border-bathlance-orange/30 bg-gradient-to-r from-bathlance-cream/30 to-orange-50 rounded-xl p-4">
                <h4 className="text-lg font-bold text-bathlance-orange mb-2 text-center">🛒 바로 구매하기</h4>
                <p className="text-sm text-gray-600 mb-3 text-center">
                    {shoppingList.length === 0 
                        ? '📝 먼저 구매할 품목을 추가해주세요!'
                        : hasCheckedItems 
                            ? `✅ ${checkedItems.length}개 품목 선택됨 - 바로 구매하러 가기!`
                            : '💡 구매할 품목을 체크하면 바로 검색할 수 있어요!'
                    }
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={openNaverShopping}
                        disabled={!hasCheckedItems}
                        className={`flex items-center gap-2 px-5 py-3 text-white text-sm font-bold rounded-full transition-all shadow-lg ${
                            hasCheckedItems 
                                ? 'bg-[#03C75A] hover:bg-[#02b350] hover:scale-105 cursor-pointer hover:shadow-xl' 
                                : 'bg-gray-300 cursor-not-allowed opacity-60'
                        }`}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
                        </svg>
                        네이버 최저가
                    </button>
                    <button
                        onClick={openCoupang}
                        disabled={!hasCheckedItems}
                        className={`flex items-center gap-2 px-5 py-3 text-white text-sm font-bold rounded-full transition-all shadow-lg ${
                            hasCheckedItems 
                                ? 'bg-[#E31937] hover:bg-[#c91530] hover:scale-105 cursor-pointer hover:shadow-xl' 
                                : 'bg-gray-300 cursor-not-allowed opacity-60'
                        }`}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 7.556c-.144.551-.548.703-1.111.438l-3.073-2.265-1.483 1.429c-.164.164-.302.302-.619.302l.221-3.128 5.694-5.146c.247-.221-.054-.344-.384-.123l-7.039 4.434-3.032-.947c-.659-.206-.672-.659.137-.975l11.848-4.565c.549-.199 1.03.134.851.99z"/>
                        </svg>
                        쿠팡
                    </button>
                </div>
            </div>
        </div>
    );
};

const ShowerDiary: React.FC<Omit<MemoScreenProps, 'shoppingList' | 'onAddItem' | 'onToggleItem' | 'onDeleteItem'>> = 
  ({ diaryEntries, onAddEntry, onDeleteEntry }) => {
    const [newEntryContent, setNewEntryContent] = useState('');

    const handleAddEntry = () => {
        if (newEntryContent.trim()) {
            onAddEntry(newEntryContent.trim());
            setNewEntryContent('');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
             <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">샤워 일기장 💡</h3>
             {diaryEntries.length < 10 ? (
                <div className="mb-4">
                    <textarea
                        value={newEntryContent}
                        onChange={(e) => setNewEntryContent(e.target.value)}
                        rows={4}
                        placeholder="샤워 중 떠오른 생각, 아이디어, 할 일 등을 기록해보세요..."
                        className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bathlance-yellow"
                    />
                    <button onClick={handleAddEntry} className="w-full mt-2 bg-bathlance-yellow text-bathlance-orange font-bold py-2 px-4 rounded-full shadow-md hover:bg-yellow-400 transition-colors">
                        일기 추가하기
                    </button>
                </div>
             ) : (
                <p className="text-center text-gray-500 bg-gray-100 p-3 rounded-lg mb-4">일기장은 10개까지 작성할 수 있어요.</p>
             )}
             <div className="space-y-4 max-h-80 overflow-y-auto">
                {diaryEntries.length > 0 ? diaryEntries.map(entry => (
                    <div key={entry.id} className="bg-gray-50 p-4 rounded-lg relative">
                        <p className="text-xs text-gray-400 mb-1">{formatDate(entry.date)}</p>
                        <p className="text-gray-800 whitespace-pre-wrap">{entry.content}</p>
                        <button onClick={() => onDeleteEntry(entry.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-600">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                )) : (
                    <p className="text-center text-gray-400 py-4">아직 작성된 일기가 없어요.</p>
                )}
             </div>
        </div>
    );
};


export const MemoScreen: React.FC<MemoScreenProps> = (props) => {
    return (
        <div className="p-4 space-y-6">
             <h2 className="text-2xl font-bold text-gray-700 text-center">메모장 📝</h2>
            <ShoppingList 
                shoppingList={props.shoppingList}
                onAddItem={props.onAddItem}
                onToggleItem={props.onToggleItem}
                onDeleteItem={props.onDeleteItem}
            />
            <ShowerDiary 
                diaryEntries={props.diaryEntries}
                onAddEntry={props.onAddEntry}
                onDeleteEntry={props.onDeleteEntry}
            />
        </div>
    );
};
