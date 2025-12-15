import React, { useState } from 'react';
import { ConfirmationModal } from './ConfirmationModal';

const NOTIFICATION_KEY = 'bathlance_notification_days';

interface SettingsScreenProps {
    onClearAllData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClearAllData }) => {
    const [notificationDays, setNotificationDays] = useState(() => {
        return localStorage.getItem(NOTIFICATION_KEY) || '7';
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleNotificationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const days = e.target.value;
        setNotificationDays(days);
        localStorage.setItem(NOTIFICATION_KEY, days);
        alert(`알림이 교체 ${days}일 전에 오도록 설정되었어요! (실제 알림은 지원되지 않아요)`);
    };
    
    const handleConfirmClearData = () => {
        setIsDeleteModalOpen(false);
        onClearAllData();
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