import React, { useState } from 'react';
import { ConfirmationModal } from './ConfirmationModal';
import { useProducts } from '../hooks/useProducts';
import { Product } from '../types';

const NOTIFICATION_KEY = 'bathlance_notification_days';

interface SettingsScreenProps {
    onClearAllData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClearAllData }) => {
    const [notificationDays, setNotificationDays] = useState(() => {
        return localStorage.getItem(NOTIFICATION_KEY) || '7';
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [showCommonIngredients, setShowCommonIngredients] = useState(false);
    const [commonIngredients, setCommonIngredients] = useState<Array<{ name: string; count: number; products: string[] }>>([]);
    const [troubleProducts, setTroubleProducts] = useState<Product[]>([]);
    const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);

    const { findCommonTroubleIngredients } = useProducts();

    const handleNotificationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const days = e.target.value;
        setNotificationDays(days);
        localStorage.setItem(NOTIFICATION_KEY, days);
        alert(`알림이 교체 ${days}일 전에 표시되도록 설정되었어요! 앱을 열 때 알림이 표시됩니다. ✨`);
    };
    
    const handleConfirmClearData = () => {
        setIsDeleteModalOpen(false);
        onClearAllData();
    };

    const handleAnalyzeCommonIngredients = async () => {
        setIsLoadingIngredients(true);
        try {
            const result = await findCommonTroubleIngredients();
            setCommonIngredients(result.commonIngredients);
            setTroubleProducts(result.allTroubleProducts);
            setShowCommonIngredients(true);
        } catch (error) {
            console.error('공통 성분 분석 중 오류:', error);
            alert('공통 성분 분석에 실패했어요. 다시 시도해주세요.');
        } finally {
            setIsLoadingIngredients(false);
        }
    };

    return (
        <>
            <div className="p-4">
                <h2 className="text-2xl font-bold text-gray-700 mb-6 text-center">설정 ⚙️</h2>
                <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                    <div>
                        <label htmlFor="notification" className="block text-md font-bold text-gray-600">알림 설정</label>
                        <p className="text-sm text-gray-500 mb-2">교체일 며칠 전에 알림을 받을지 선택하세요.</p>
                        <select
                            id="notification"
                            value={notificationDays}
                            onChange={handleNotificationChange}
                            className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-bathlance-orange focus:border-bathlance-orange"
                        >
                            <option value="1">1일 전</option>
                            <option value="3">3일 전</option>
                            <option value="7">7일 전</option>
                            <option value="14">14일 전</option>
                        </select>
                    </div>

                    <div>
                        <h3 className="text-md font-bold text-gray-600 mb-2">피부 트러블 분석 🔬</h3>
                        <p className="text-sm text-gray-500 mb-3">
                            트러블 발생 제품들의 공통 성분을 분석해서 피부 트러블 원인을 찾아드려요.
                        </p>
                        <button 
                            onClick={handleAnalyzeCommonIngredients}
                            disabled={isLoadingIngredients}
                            className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 px-4 rounded-full shadow-lg hover:from-red-600 hover:to-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoadingIngredients ? '분석 중...' : '공통 성분 분석하기'}
                        </button>

                        {showCommonIngredients && (
                            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                                {troubleProducts.length < 2 ? (
                                    <p className="text-sm text-gray-600">
                                        트러블 발생 제품이 2개 이상 있어야 공통 성분을 분석할 수 있어요. 
                                        현재 {troubleProducts.length}개의 트러블 제품이 등록되어 있어요.
                                    </p>
                                ) : commonIngredients.length === 0 ? (
                                    <p className="text-sm text-gray-600">
                                        공통 성분을 찾지 못했어요. 제품들의 성분 분석 정보가 없거나 서로 다른 성분을 사용하고 있을 수 있어요.
                                    </p>
                                ) : (
                                    <div>
                                        <p className="text-sm font-bold text-red-700 mb-2">
                                            {troubleProducts.length}개의 트러블 제품에서 발견된 공통 성분:
                                        </p>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {commonIngredients.map((ingredient, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-lg border border-red-200">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-red-800">{ingredient.name}</span>
                                                        <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                                                            {ingredient.count}개 제품 공통
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600">
                                                        포함된 제품: {ingredient.products.join(', ')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-3 italic">
                                            💡 이 성분들이 피부 트러블의 원인일 가능성이 높아요. 다음 제품 구매 시 참고하세요!
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-md font-bold text-gray-600">데이터 관리</h3>
                        <p className="text-sm text-gray-500 mb-2">앱에 저장된 모든 제품 정보를 삭제합니다.</p>
                         <button 
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        >
                            모든 데이터 삭제하기
                        </button>
                    </div>

                    <div className="text-center text-gray-400 pt-4">
                        <p>BATHLANCE v1.0</p>
                        <p>귀여운 욕실 관리 도우미</p>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmClearData}
                title="정말 모든 데이터를 삭제할까요?"
                message="제품, 메모, 설정 등 모든 정보가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없어요!"
            />
        </>
    );
};