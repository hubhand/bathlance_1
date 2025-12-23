import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, GeminiIngredientsResponse } from '../types';
import { formatDate, calculateExpiryDate } from '../utils/dateUtils';
import { AVERAGE_USAGE_PERIODS } from '../constants';

interface EditProductScreenProps {
  product: Product;
  onUpdateProduct: (product: Product) => void;
  onCancel: () => void;
}

export const EditProductScreen: React.FC<EditProductScreenProps> = ({ product, onUpdateProduct, onCancel }) => {
  const [formData, setFormData] = useState(product);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(product);
  }, [product]);
  
  // Add a useEffect to automatically update the expiry date when relevant fields change.
  useEffect(() => {
    const { registrationDate, periodAfterOpening, manufacturingDate, expiryPeriodBeforeOpening, category } = formData;
    
    // Use the specific period after opening if available, otherwise fall back to the category average.
    const monthsToAdd = periodAfterOpening || AVERAGE_USAGE_PERIODS[category] || 6;

    if (registrationDate) {
      const newExpiryDate = calculateExpiryDate(
        registrationDate,
        monthsToAdd,
        manufacturingDate,
        expiryPeriodBeforeOpening
      );
      // Update only the expiry date to avoid re-render loops.
      // Check if the date has actually changed before setting state.
      if (newExpiryDate !== formData.expiryDate) {
          setFormData(prev => ({ ...prev, expiryDate: newExpiryDate }));
      }
    }
  }, [formData.registrationDate, formData.periodAfterOpening, formData.manufacturingDate, formData.expiryPeriodBeforeOpening, formData.category, formData.expiryDate]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({...prev, [name]: checked}));
        return;
    }
    
    if (name === 'periodAfterOpening' || name === 'expiryPeriodBeforeOpening' || name === 'stock') {
      // stock의 경우 숫자 입력 처리
      if (name === 'stock') {
        // type="number" input은 빈 문자열이거나 숫자 문자열만 반환
        if (value === '' || value === null || value === undefined) {
          setFormData(prev => ({ ...prev, stock: undefined }));
          return;
        }
        const numValue = Number(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
          const finalValue = Math.max(0, Math.min(50, Math.floor(numValue)));
          setFormData(prev => ({ ...prev, stock: finalValue }));
        }
      } else {
        // 다른 숫자 필드는 기존 로직 유지
        if (value === '') {
          setFormData(prev => ({ ...prev, [name]: undefined }));
          return;
        }
        let numValue = parseInt(value, 10);
        if (isNaN(numValue)) {
          return;
        }
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
    } else {
       // When changing a date, the value will be like "2024-10-23".
       // To maintain consistency, we convert it to an ISO string at midnight UTC.
       if (type === 'date' && value) {
         const date = new Date(value);
         const isoString = new Date(date.getTime() + date.getTimezoneOffset() * 60000).toISOString();
         setFormData(prev => ({ ...prev, [name]: isoString }));
       } else {
         setFormData(prev => ({ ...prev, [name]: value }));
       }
    }
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
        ...prev,
        category: e.target.value as ProductCategory,
    }));
  };

  const handleAnalyzeIngredients = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      // Data URL 형식인지 확인하고 base64 부분만 추출
      let base64Image: string;
      if (formData.imageUrl.startsWith('data:')) {
        // Data URL 형식: data:image/jpeg;base64,xxxxx
        base64Image = formData.imageUrl.split(',')[1];
      } else {
        // 이미 base64 문자열인 경우
        base64Image = formData.imageUrl;
      }
      
      if (!base64Image || base64Image.trim() === '') {
        throw new Error('이미지 데이터가 올바르지 않아요.');
      }
      
      // API Route를 통해 서버 사이드에서 Gemini API 호출
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image, type: 'ingredients' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류가 발생했습니다.' }));
        const errorMessage = errorData.error || '성분 분석에 실패했어요.';
        
        // 503 에러 (서버 과부하)인 경우 특별 처리
        if (response.status === 503) {
          throw new Error('Gemini API 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.');
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json() as GeminiIngredientsResponse;
      setFormData(prev => ({ ...prev, ingredientAnalysis: result.ingredients }));
    } catch (error: any) {
      console.error('성분 분석 에러:', error);
      
      // 에러 메시지 처리
      let errorMessage = '성분 분석에 실패했어요. 이미지에 전성분표가 잘 보이는지 확인 후 다시 시도해주세요.';
      
      if (error?.message) {
        errorMessage = error.message;
      }
      
      setAnalysisError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getEwgClass = (grade: string): string => {
      if (grade.toLowerCase().includes('주의') || grade.toLowerCase().includes('caution')) {
        return 'bg-red-100 text-red-800 border border-red-200';
      }
      const match = grade.match(/(\d+)/);
      if (match) {
          const gradeNum = parseInt(match[1], 10);
          if (gradeNum >= 7) return 'bg-red-100 text-red-800 border border-red-200';
          if (gradeNum >= 3) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
          if (gradeNum >= 1) return 'bg-green-100 text-green-800 border border-green-200';
      }
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 저장 전에 stock이 undefined이거나 null이면 기본값 1로 설정 (0은 유지)
    const stockValue = formData.stock !== undefined && formData.stock !== null ? formData.stock : 1;
    const finalStock = Math.max(0, Math.min(50, stockValue));
    
    const productToSave: Product = {
      ...formData,
      stock: finalStock,
    };
    
    try {
      await onUpdateProduct(productToSave);
    } catch (error) {
      console.error('재고 수량 수정 실패:', error);
      alert('재고 수량 수정에 실패했어요. 콘솔을 확인해주세요.');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-gray-700 mb-6 text-center">제품 정보 수정하기 ✏️</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center">
            <img src={formData.imageUrl} alt={formData.name} className="w-32 h-32 object-cover rounded-lg mx-auto border-4 border-white shadow-lg"/>
        </div>
        <div>
          <label htmlFor="name" className="block text-md font-bold text-gray-600 mb-1">제품 이름</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-bathlance-orange focus:border-bathlance-orange"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-md font-bold text-gray-600 mb-1">분류</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleCategoryChange}
            className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-bathlance-orange focus:border-bathlance-orange"
          >
            {Object.keys(AVERAGE_USAGE_PERIODS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="periodAfterOpening" className="block text-md font-bold text-gray-600 mb-1">개봉 후 사용기한 (개월)</label>
          <input
            type="number"
            id="periodAfterOpening"
            name="periodAfterOpening"
            value={formData.periodAfterOpening || ''}
            onChange={handleChange}
            placeholder="예: 12 (AI가 자동 입력해요)"
            className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-bathlance-orange focus:border-bathlance-orange"
          />
        </div>
        <div>
          <label htmlFor="manufacturingDate" className="block text-md font-bold text-gray-600 mb-1">제조일</label>
          <input
            type="date"
            id="manufacturingDate"
            name="manufacturingDate"
            value={formData.manufacturingDate ? formatDate(formData.manufacturingDate) : ''}
            onChange={handleChange}
            className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-bathlance-orange focus:border-bathlance-orange"
          />
        </div>
        <div>
          <label htmlFor="expiryPeriodBeforeOpening" className="block text-md font-bold text-gray-600 mb-1">개봉 전 유효기간 (개월 수)</label>
          <input
            type="number"
            id="expiryPeriodBeforeOpening"
            name="expiryPeriodBeforeOpening"
            value={formData.expiryPeriodBeforeOpening || ''}
            onChange={handleChange}
            placeholder="예: 36 (제조일로부터)"
            className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-bathlance-orange focus:border-bathlance-orange"
          />
        </div>
         <div>
          <label htmlFor="stock" className="block text-md font-bold text-gray-600 mb-1">재고 수량</label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock !== undefined && formData.stock !== null ? String(formData.stock) : ''}
            onChange={handleChange}
            min="0"
            max="50"
            placeholder="1"
            className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-bathlance-orange focus:border-bathlance-orange"
          />
        </div>
        <div>
          <label htmlFor="registrationDate" className="block text-md font-bold text-gray-600 mb-1">등록일 (개봉일)</label>
          <input
            type="date"
            id="registrationDate"
            name="registrationDate"
            value={formatDate(formData.registrationDate)}
            onChange={handleChange}
            className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-bathlance-orange focus:border-bathlance-orange"
          />
        </div>
        <div>
          <label htmlFor="expiryDate" className="block text-md font-bold text-gray-600 mb-1">교체 예정일 (자동 계산)</label>
          <input
            type="date"
            id="expiryDate"
            name="expiryDate"
            value={formatDate(formData.expiryDate)}
            readOnly
            className="block w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-bathlance-orange focus:border-bathlance-orange cursor-not-allowed"
          />
        </div>

        <div className="pt-2">
            <h3 className="text-md font-bold text-gray-600 mb-2 flex items-center">AI 성분 분석 🔬 <span className="text-xs font-normal text-gray-500 ml-2">(제품 뒷면 사진 필요)</span></h3>
            {formData.ingredientAnalysis && formData.ingredientAnalysis.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2 max-h-60 overflow-y-scroll custom-scrollbar">
                {formData.ingredientAnalysis.map((ing, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-gray-50">
                        <div className="flex-1 mr-2">
                            <p className="font-bold text-gray-700">{ing.name}</p>
                            {ing.description && <p className="text-xs text-gray-500 mt-1">{ing.description}</p>}
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                            {ing.isAllergen && (
                                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">알러지주의</span>
                            )}
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getEwgClass(ing.ewgGrade)}`}>
                                EWG {ing.ewgGrade}
                            </span>
                        </div>
                    </div>
                ))}
                </div>
            ) : (
                <div className="text-center p-4 bg-gray-50 border-2 border-dashed rounded-2xl">
                <p className="text-gray-500 mb-3">제품 뒷면의 전성분표를 분석하여<br />안전 등급과 알레르기 정보를 알려드려요.</p>
                {isAnalyzing ? (
                    <div className="flex items-center justify-center h-[36px]">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-bathlance-orange"></div>
                        <span className="ml-3 text-gray-600">분석 중...</span>
                    </div>
                ) : (
                    <button 
                    type="button" 
                    onClick={handleAnalyzeIngredients}
                    className="bg-bathlance-yellow text-bathlance-orange font-bold py-2 px-5 rounded-full shadow-md hover:bg-yellow-400 transition-colors"
                    >
                    AI로 성분 분석하기
                    </button>
                )}
                </div>
            )}
            {analysisError && <p className="text-red-500 mt-2 text-sm text-center">{analysisError}</p>}
        </div>

         <div>
          <label htmlFor="review" className="block text-md font-bold text-gray-600 mb-1">간단 후기 📝</label>
          <textarea
            id="review"
            name="review"
            value={formData.review || ''}
            onChange={handleChange}
            rows={3}
            placeholder="제품 사용 후기를 간단하게 남겨보세요. (예: 향이 좋았어요!)"
            className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl shadow-sm focus:outline-none focus:ring-bathlance-orange focus:border-bathlance-orange"
          />
        </div>

        <div className="flex items-center justify-between bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <div className="flex-1">
            <label htmlFor="hasTrouble" className="font-bold text-red-700">피부 트러블 발생! 😥</label>
            <p className="text-sm text-red-600">다음에 사용하지 않도록 체크해둘게요.</p>
          </div>
          <input
            type="checkbox"
            id="hasTrouble"
            name="hasTrouble"
            checked={!!formData.hasTrouble}
            onChange={handleChange}
            className="h-6 w-6 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
          />
        </div>
        <div className="flex space-x-4 pt-4">
          <button type="button" onClick={onCancel} className="w-1/2 bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-full shadow-md hover:bg-gray-400 transition-colors">취소</button>
          <button type="submit" className="w-1/2 bg-bathlance-orange text-white font-bold py-3 px-4 rounded-full shadow-lg hover:bg-orange-600 transition-colors">저장하기</button>
        </div>
      </form>
    </div>
  );
};