import React from 'react';
import { Product } from '../types';

interface TroubleWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  productName: string;
  troubleProduct: Product | null;
}

export const TroubleWarningModal: React.FC<TroubleWarningModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  productName,
  troubleProduct,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 m-4 max-w-md w-full transform transition-all duration-300 scale-95 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="text-5xl mb-4 text-center">⚠️</div>
        <h3 className="text-2xl font-bold text-red-600 mb-2 text-center">피부 트러블 발생 이력이 있어요!</h3>
        
        {troubleProduct && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-r-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong className="text-red-700">이전에 등록한 제품:</strong>
            </p>
            <p className="text-lg font-bold text-red-800 mb-2">{troubleProduct.name}</p>
            {troubleProduct.review && (
              <p className="text-sm text-gray-600 italic">"{troubleProduct.review}"</p>
            )}
            {troubleProduct.ingredientAnalysis && troubleProduct.ingredientAnalysis.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold text-gray-600 mb-1">주요 성분:</p>
                <div className="flex flex-wrap gap-1">
                  {troubleProduct.ingredientAnalysis.slice(0, 5).map((ing, idx) => (
                    <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-red-200">
                      {ing.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-gray-700 mb-6 text-center">
          <strong>"{productName}"</strong>은(는) 이전에 피부 트러블이 발생했던 제품과 유사해 보여요. 
          <br />그래도 등록하시겠어요?
        </p>
        
        <div className="flex justify-center space-x-4">
          <button 
            onClick={onClose} 
            className="w-1/2 bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-full shadow-md hover:bg-gray-400 transition-colors"
          >
            취소
          </button>
          <button 
            onClick={onContinue} 
            className="w-1/2 bg-red-500 text-white font-bold py-3 px-4 rounded-full shadow-lg hover:bg-red-600 transition-colors"
          >
            그래도 등록하기
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

