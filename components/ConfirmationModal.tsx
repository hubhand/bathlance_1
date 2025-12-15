import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 m-4 max-w-sm w-full text-center transform transition-all duration-300 scale-95 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="text-5xl mb-4">🗑️</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-center space-x-4">
          <button onClick={onClose} className="w-1/2 bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-full shadow-md hover:bg-gray-400 transition-colors">
            취소
          </button>
          <button onClick={onConfirm} className="w-1/2 bg-red-500 text-white font-bold py-3 px-4 rounded-full shadow-lg hover:bg-red-600 transition-colors">
            삭제
          </button>
        </div>
      </div>
      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};
