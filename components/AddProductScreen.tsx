import React, { useState, useCallback } from "react";
import {
  Product,
  ProductCategory,
  GeminiResponse,
  GeminiIngredientsResponse,
} from "../types";
import { fileToBase64, fileToResizedBase64 } from "../utils/imageUtils";
import { calculateExpiryDate } from "../utils/dateUtils";
import { AVERAGE_USAGE_PERIODS } from "../constants";
import { TroubleWarningModal } from "./TroubleWarningModal";
import { useProducts } from "../hooks/useProducts";

interface AddProductScreenProps {
  onAddMultipleProducts: (products: Omit<Product, "id">[]) => Promise<void>;
  onCancel: () => void;
}

const MAX_FILES = 10;

export const AddProductScreen: React.FC<AddProductScreenProps> = ({
  onAddMultipleProducts,
  onCancel,
}) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // 트러블 경고 모달 관련 상태
  const [showTroubleWarning, setShowTroubleWarning] = useState(false);
  const [pendingProducts, setPendingProducts] = useState<Omit<Product, "id">[]>(
    []
  );
  const [troubleProduct, setTroubleProduct] = useState<Product | null>(null);
  const [currentProductName, setCurrentProductName] = useState<string>("");

  const { checkTroubleHistory } = useProducts();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      let selectedFiles = Array.from(files);
      if (selectedFiles.length > MAX_FILES) {
        setError(`사진은 최대 ${MAX_FILES}장까지 선택할 수 있어요!`);
        selectedFiles = selectedFiles.slice(0, MAX_FILES);
      } else {
        setError(null);
      }

      setImageFiles(selectedFiles);
      const newPreviews: string[] = [];
      selectedFiles.forEach((file) => {
        // FIX: Added a type guard to prevent errors if a list item is not a valid file.
        // This robustly handles the reported "Argument of type 'unknown' is not assignable to parameter of type 'Blob'" error.
        if (file instanceof File) {
          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviews.push(reader.result as string);
            if (newPreviews.length === selectedFiles.length) {
              setImagePreviews(newPreviews);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const handleSubmit = async () => {
    if (imageFiles.length === 0) {
      setError("먼저 제품 사진을 선택해주세요!");
      return;
    }
    setIsLoading(true);
    setError(null);
    setProgress({ current: 0, total: imageFiles.length });

    const newProducts: Omit<Product, "id">[] = [];
    let successCount = 0;
    let foundTrouble = false;
    let troubleProductFound: Product | null = null;
    let troubleProductName = "";

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      setProgress({ current: i + 1, total: imageFiles.length });
      try {
        const base64Image = await fileToBase64(file);
        const resizedImagePreview = await fileToResizedBase64(file);

        // API Route를 통해 서버 사이드에서 Gemini API 호출
        const response = await fetch("/api/gemini/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Image, type: "product" }),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "알 수 없는 오류가 발생했습니다." }));
          const errorMessage = errorData.error || "제품 분석에 실패했어요.";

          // 429 에러 (할당량 초과) 처리
          if (response.status === 429) {
            const retryAfter = errorData.retryAfter || 60;
            const quotaError = `Gemini API 일일 사용량 제한에 도달했습니다.\n\n무료 티어는 하루 20회까지 사용 가능합니다.\n약 ${retryAfter}초 후에 다시 시도해주세요.\n\n또는 내일 다시 시도하시거나, Google AI Studio에서 유료 플랜으로 업그레이드하실 수 있습니다.`;
            setError(quotaError);
            setIsLoading(false);
            throw new Error(quotaError);
          }

          // 503 에러 (서버 과부하)인 경우 특별 처리
          if (response.status === 503) {
            throw new Error(
              "Gemini API 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요."
            );
          }

          throw new Error(errorMessage);
        }

        const geminiResult = (await response.json()) as GeminiResponse;

        // 성분 분석도 함께 수행 (실패해도 제품 등록은 진행)
        let ingredientAnalysis = undefined;
        try {
          const ingredientsResponse = await fetch("/api/gemini/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: base64Image,
              type: "ingredients",
            }),
          });

          if (ingredientsResponse.ok) {
            const ingredientsResult =
              (await ingredientsResponse.json()) as GeminiIngredientsResponse;
            ingredientAnalysis = ingredientsResult.ingredients;
          } else {
            // 429 에러인 경우에도 제품 등록은 계속 진행
            if (ingredientsResponse.status === 429) {
              // 성분 분석 할당량 초과 (제품 등록은 계속 진행)
            }
          }
        } catch (ingredientsError) {
          // 성분 분석 실패해도 제품 등록은 계속 진행
          console.error("성분 분석 중 오류 발생:", ingredientsError);
        }

        // 🔍 트러블 발생 이력 확인
        const history = await checkTroubleHistory(geminiResult.제품명);
        if (history && !foundTrouble) {
          foundTrouble = true;
          troubleProductFound = history;
          troubleProductName = geminiResult.제품명;
        }

        const registrationDate = new Date();
        const category = geminiResult.분류 as ProductCategory;

        const monthsToAdd =
          geminiResult.개봉후사용기한 || AVERAGE_USAGE_PERIODS[category] || 6;

        const finalExpiryDate = calculateExpiryDate(
          registrationDate.toISOString(),
          monthsToAdd,
          geminiResult.제조일자,
          geminiResult.개봉전유효기간
        );

        newProducts.push({
          name: geminiResult.제품명,
          category: category,
          registrationDate: registrationDate.toISOString(),
          expiryDate: finalExpiryDate,
          imageUrl: resizedImagePreview, // Use resized image to save space
          manufacturingDate: geminiResult.제조일자,
          expiryPeriodBeforeOpening: geminiResult.개봉전유효기간,
          periodAfterOpening: geminiResult.개봉후사용기한,
          ingredientAnalysis: ingredientAnalysis, // 성분 분석 결과 추가
          review: "",
          hasTrouble: false,
          stock: 1, // 기본 재고 1로 설정
        });
        successCount++;
      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err);

        // 429 에러인 경우 사용자에게 명확히 표시
        if (err instanceof Error && err.message.includes("일일 사용량 제한")) {
          // 이미 setError로 설정했으므로 여기서는 중단만
          return;
        }

        // 다른 에러는 기존대로 처리 (조용히 실패하고 다음 이미지 계속)
      }
    }

    if (newProducts.length > 0) {
      // 트러블 이력이 발견되면 경고 모달 표시
      if (foundTrouble && troubleProductFound) {
        setPendingProducts(newProducts);
        setTroubleProduct(troubleProductFound);
        setCurrentProductName(troubleProductName);
        setShowTroubleWarning(true);
        setIsLoading(false);
        return;
      }

      // 트러블 이력이 없으면 바로 등록
      try {
        await onAddMultipleProducts(newProducts);
        alert(
          `총 ${imageFiles.length}개 중 ${successCount}개의 제품을 성공적으로 등록했어요!`
        );
        setIsLoading(false);
      } catch (error) {
        console.error("제품 등록 중 오류:", error);
        setError("제품 등록에 실패했어요. 다시 시도해주세요.");
        alert("제품 등록에 실패했어요. 콘솔을 확인해주세요.");
        setIsLoading(false);
      }
    } else {
      setError("제품을 분석할 수 없었어요. 다른 사진을 시도해주세요.");
      setIsLoading(false);
    }
  };

  const handleContinueWithTrouble = async () => {
    setShowTroubleWarning(false);
    setIsLoading(true);

    try {
      await onAddMultipleProducts(pendingProducts);
      alert(`총 ${pendingProducts.length}개의 제품을 성공적으로 등록했어요!`);
      setIsLoading(false);
      // 상태 초기화
      setPendingProducts([]);
      setTroubleProduct(null);
      setCurrentProductName("");
    } catch (error) {
      console.error("제품 등록 중 오류:", error);
      setError("제품 등록에 실패했어요. 다시 시도해주세요.");
      alert("제품 등록에 실패했어요. 콘솔을 확인해주세요.");
      setIsLoading(false);
    }
  };

  const handleCancelTrouble = () => {
    setShowTroubleWarning(false);
    setPendingProducts([]);
    setTroubleProduct(null);
    setCurrentProductName("");
    setIsLoading(false);
  };

  return (
    <>
      <div className="p-4 flex flex-col h-full">
        <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">
          새로운 용품 등록하기 📸
        </h2>
        <div className="flex-grow flex flex-col items-center justify-center">
          <label
            htmlFor="file-upload"
            className="cursor-pointer w-full max-w-sm"
          >
            <div className="border-4 border-dashed border-bathlance-gray rounded-2xl p-6 text-center hover:border-bathlance-orange transition-colors">
              {imagePreviews.length > 0 ? (
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((src, index) => (
                      <img
                        key={index}
                        src={src}
                        alt={`미리보기 ${index + 1}`}
                        className="w-full h-20 object-cover rounded-md"
                      />
                    ))}
                  </div>
                  <p className="mt-4 font-bold text-gray-700">
                    {imagePreviews.length}개의 사진이 선택되었어요.
                  </p>
                  <p className="text-sm text-gray-500">
                    다시 누르면 사진을 변경할 수 있어요.
                  </p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <p className="text-6xl">📷</p>
                  <p className="mt-2 font-bold text-lg">
                    여기를 눌러 사진을 추가하세요
                  </p>
                  <p className="text-sm">최대 10장까지 선택할 수 있어요.</p>
                </div>
              )}
            </div>
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        </div>

        <div className="mt-auto">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-bathlance-orange mx-auto"></div>
              <p className="mt-4 text-gray-600 font-bold text-lg">
                AI가 사진을 분석하고 있어요... ({progress.current}/
                {progress.total})
              </p>
              <p className="text-sm text-gray-500">
                제품 정보와 성분을 분석 중입니다. 잠시만 기다려주세요!
              </p>
            </div>
          ) : (
            <div className="flex space-x-4">
              <button
                onClick={onCancel}
                className="w-1/3 bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-full shadow-md hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={imageFiles.length === 0}
                className="w-2/3 bg-bathlance-orange text-white font-bold py-3 px-4 rounded-full shadow-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {imageFiles.length > 0
                  ? `${imageFiles.length}개 제품 등록하기`
                  : "자동으로 등록하기"}
              </button>
            </div>
          )}
        </div>
      </div>

      <TroubleWarningModal
        isOpen={showTroubleWarning}
        onClose={handleCancelTrouble}
        onContinue={handleContinueWithTrouble}
        productName={currentProductName}
        troubleProduct={troubleProduct}
      />
    </>
  );
};
