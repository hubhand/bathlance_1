import { GoogleGenAI, Type } from "@google/genai";
import {
  GeminiResponse,
  ProductCategory,
  GeminiIngredientsResponse,
  Ingredient,
} from "../types";
import {
  getMultipleIngredientInfo,
  getIngredientInfoFromPublicData,
  // getMultipleIngredientRegulationInfo, // 규제정보 API는 검색 파라미터를 지원하지 않으므로 비활성화
} from "./publicDataService";

// API 키는 서버 사이드에서만 사용 (클라이언트에 노출하지 않음)
// 이 파일은 app/api/gemini/analyze/route.ts에서만 호출됨
// 지연 초기화: 함수가 호출될 때만 API 키를 체크하고 인스턴스를 생성
let aiInstance: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!aiInstance) {
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. .env.local 파일에 GEMINI_API_KEY를 추가해주세요."
  );
}
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

const model = "gemini-2.5-flash";

const schema = {
  type: Type.OBJECT,
  properties: {
    제품명: {
      type: Type.STRING,
      description: '사진 속 제품의 브랜드와 전체 이름. 예: "해피바스 바디워시"',
    },
    분류: {
      type: Type.STRING,
      description:
        '제품의 종류. 다음 중 하나여야 함: "칫솔", "샴푸", "린스", "세안제", "바디워시", "수건", "면도기 헤드", "샤워볼", "샤워기 필터", "기타".',
    },
    제조일자: {
      type: Type.STRING,
      description: "제품에 표기된 제조일자. 형식은 YYYY-MM-DD. 없으면 생략.",
    },
    개봉전유효기간: {
      type: Type.NUMBER,
      description:
        '제품에 표기된 개봉 전 유효기간. 개월 단위의 숫자. 예: "36M" 또는 "3년"은 36으로 표기. 없으면 생략.',
    },
    개봉후사용기한: {
      type: Type.NUMBER,
      description:
        "제품에 표기된 개봉 후 사용기한 (PAO) 또는 AI가 제품 종류를 기반으로 추정한 권장 사용기한. 개월 단위의 숫자. 예: 12.",
    },
  },
  required: ["제품명", "분류", "개봉후사용기한"],
};

// 단순화된 스키마: 성분명만 추출 (비용 절감)
// 공공데이터 API로 상세 정보를 조회하므로 Gemini에서는 성분명만 추출
const simpleIngredientsSchema = {
  type: Type.OBJECT,
  properties: {
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: '성분명 (한국어 또는 영문명). 예: "정제수", "Water"',
          },
        },
        required: ["name"],
      },
    },
  },
  required: ["ingredients"],
};

export const analyzeProductImage = async (
  imageBase64: string
): Promise<GeminiResponse> => {
  const ai = getAI(); // 함수 호출 시점에 초기화
  const prompt =
    "이 욕실용품 사진을 분석해서 JSON 형식으로 응답해줘. '제품명', '분류', '개봉후사용기한' 필드는 반드시 포함해야 해. 만약 사진에 '개봉후사용기한(PAO)' 정보가 명확하게 보이지 않으면, 제품 종류를 분석해서 위생을 최우선으로 고려한 가장 이상적인 교체 주기를 개월 단위 숫자로 추정해서 '개봉후사용기한' 값으로 입력해줘. (예: 칫솔은 2개월, 수건은 6개월, 샤워볼은 1개월, 면도날은 1개월). 추가로 사진에 '제조일자'나 '개봉전유효기간'이 보인다면 그 정보도 함께 추출해줘. 분류는 '칫솔', '샴푸', '린스', '세안제', '바디워시', '수건', '면도기 헤드', '샤워볼', '샤워기 필터', '기타' 중에서 선택해줘.";

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: "image/jpeg",
    },
  };

  const textPart = {
    text: prompt,
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonString = response.text?.trim() || "";
    if (!jsonString) {
      throw new Error("응답 데이터가 없습니다.");
    }
    const parsedResponse = JSON.parse(jsonString) as GeminiResponse;

    const validCategories: ProductCategory[] = [
      "칫솔",
      "샴푸",
      "린스",
      "세안제",
      "바디워시",
      "수건",
      "면도기 헤드",
      "샤워볼",
      "샤워기 필터",
      "기타",
    ];
    if (!validCategories.includes(parsedResponse.분류)) {
      parsedResponse.분류 = "기타";
    }

    return parsedResponse;
  } catch (error) {
    console.error("Gemini API 호출 중 오류 발생:", error);

    // Gemini API 과부하 에러 감지
    if (error instanceof Error) {
      const errorMessage = error.message || String(error);
      if (
        errorMessage.includes("overloaded") ||
        errorMessage.includes("UNAVAILABLE") ||
        errorMessage.includes("503")
      ) {
        throw new Error(
          "Gemini API 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해 주세요."
        );
      }
      // 기존 에러 메시지가 있으면 그대로 사용
      if (
        errorMessage &&
        !errorMessage.includes("제품 정보를 분석하는 데 실패")
      ) {
        throw error;
      }
    }

    throw new Error("제품 정보를 분석하는 데 실패했어요. 다시 시도해 주세요.");
  }
};

export const analyzeIngredients = async (
  imageBase64: string
): Promise<GeminiIngredientsResponse> => {
  const ai = getAI(); // 함수 호출 시점에 초기화
  
  // 단순화된 프롬프트: 성분명만 추출 (비용 절감)
  const prompt =
    "이 제품 사진 뒷면의 전성분 목록을 읽어서 성분명만 추출해줘. 각 성분의 이름만 JSON 형식으로 응답해줘. 성분이 너무 많으면 주요 성분 20개까지만 추출해줘. 성분명은 한국어 또는 영문명으로 표기해줘.";

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: "image/jpeg",
    },
  };

  const textPart = {
    text: prompt,
  };

  try {
    // 단순화된 스키마 사용 (성분명만 추출)
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: simpleIngredientsSchema,
      },
    });

    const jsonString = response.text?.trim() || "";
    if (!jsonString) {
      console.error("Gemini API 응답이 비어있습니다.");
      throw new Error("응답 데이터가 없습니다.");
    }

    // JSON 파싱을 더 안전하게 처리
    let cleanedJsonString = jsonString
      .replace(/^```json\n?/, "")
      .replace(/\n?```$/, "")
      .replace(/^```\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    let parsedResponse: GeminiIngredientsResponse;
    try {
      parsedResponse = JSON.parse(
        cleanedJsonString
      ) as GeminiIngredientsResponse;
    } catch (parseError) {
      console.error("JSON 파싱 실패:", parseError);
      console.error("원본 응답:", jsonString.substring(0, 500)); // 처음 500자만 로그
      throw new Error("응답 형식이 올바르지 않습니다.");
    }

    if (
      !parsedResponse.ingredients ||
      !Array.isArray(parsedResponse.ingredients)
    ) {
      console.error("응답 형식 오류:", parsedResponse);
      throw new Error("Invalid response format from Gemini API.");
    }

    // 공공데이터 API와 결합하여 상세 정보 조회
    const enrichedIngredients = await enrichIngredientsWithPublicData(
      parsedResponse.ingredients
    );

    return { ingredients: enrichedIngredients };
  } catch (error) {
    console.error("Gemini API (ingredients) 호출 중 오류 발생:", error);

    // 에러가 이미 Error 객체인 경우
    if (error instanceof Error) {
      console.error("에러 상세:", error.message);
      console.error("에러 스택:", error.stack);

      // Gemini API 과부하 에러 감지
      const errorMessage = error.message || String(error);
      if (
        errorMessage.includes("overloaded") ||
        errorMessage.includes("UNAVAILABLE") ||
        errorMessage.includes("503")
      ) {
        throw new Error(
          "Gemini API 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해 주세요."
        );
      }

      // 기존 에러 메시지가 있으면 그대로 사용
      throw error;
    }

    throw new Error(
      "성분 정보를 분석하는 데 실패했어요. 전성분표가 잘 보이는 사진으로 다시 시도해 주세요."
    );
  }
};

/**
 * Gemini에서 추출한 성분명을 공공데이터 API로 보강합니다.
 * 공공데이터 API가 설정되지 않았거나 실패하면 기본 정보만 반환합니다.
 * @param simpleIngredients 성분명만 있는 배열
 * @returns 보강된 성분 정보 배열
 */
const enrichIngredientsWithPublicData = async (
  simpleIngredients: Array<{ name: string }>
): Promise<Ingredient[]> => {
  const ingredientNames = simpleIngredients.map((ing) => ing.name);

  // 공공데이터 API에서 일괄 조회 (설정되지 않았으면 빈 맵 반환)
  let publicDataMap: Map<string, any> = new Map();
  
  try {
    publicDataMap = await getMultipleIngredientInfo(ingredientNames);
  } catch (error) {
    console.warn("공공데이터 API 조회 실패, 기본 정보만 사용:", error);
  }

  // 규제정보 API는 검색 파라미터를 지원하지 않으므로 비활성화
  // (API가 전체 목록만 반환하며 검색 기능이 없음)
  // try {
  //   regulationMap = await getMultipleIngredientRegulationInfo(ingredientNames);
  // } catch (error) {
  //   // 규제정보는 선택사항이므로 에러가 나도 무시
  // }

  // 알레르기 유발 성분 목록 (식약처 고시 - 주요 성분만)
  // 실제로는 공공데이터 API에서 제공하거나 별도 DB에서 조회해야 함
  const allergenKeywords = [
    "파라벤",
    "설페이트",
    "알코올",
    "향료",
    "색소",
    "보존제",
    "실리콘",
    "미네랄오일",
    "벤질알코올",
    "리날룰",
    "시트로넬올",
    "제라니올",
    "linalool",
    "citronellol",
    "geraniol",
    "benzylalcohol",
    // 추가 알레르기 유발 성분
    "살리실릭애씨드",
    "살리실산",
    "salicylic acid",
  ];

  // 공공데이터 API 응답에서 알레르기 관련 키워드
  const allergenKeywordsInDescription = [
    "알레르기",
    "알러지",
    "알레르기 유발",
    "알레르기 반응",
    "민감성",
    "자극성",
    "알레르기성",
  ];

  // 자체 안전성 평가 등급 매핑
  // 평가 기준: 알레르기 유발 여부, 규제 정보, 일반적인 안전성
  // "안전": 일반적으로 안전한 성분
  // "보통": 약간의 주의 필요
  // "주의": 알레르기 유발 가능, 민감한 피부에 주의 필요
  // "위험": 금지 성분 또는 높은 알레르기 유발 가능성
  const safetyGradeMap: Record<string, "안전" | "보통" | "주의" | "위험"> = {
    정제수: "안전",
    물: "안전",
    Water: "안전",
    글리세린: "안전",
    Glycerin: "안전",
    알란토인: "안전",
    Allantoin: "안전",
    "소듐라우레스설페이트": "보통",
    "Sodium Laureth Sulfate": "보통",
    "코카미도프로필베타인": "안전",
    "Cocamidopropyl Betaine": "안전",
    "소듐클로라이드": "안전",
    "Sodium Chloride": "안전",
    "소듐라우로일사코시네이트": "안전",
    "Sodium Lauroyl Sarcosinate": "안전",
    "피이지-7글리세릴코코에이트": "보통",
    "PEG-7 Glyceryl Cocoate": "보통",
    "장미꽃추출물": "안전",
    "라벤더오일": "보통",
    "Lavender Oil": "보통",
    "센티드제라늄꽃오일": "보통",
    "시트릭애씨드": "보통",
    "Citric Acid": "보통",
    "소듐벤조에이트": "보통",
    "Sodium Benzoate": "보통",
    "포타슘솔베이트": "보통",
    "Potassium Sorbate": "보통",
    "테트라소듐이디티에이": "보통",
    "Tetrasodium EDTA": "보통",
    벤질알코올: "주의",
    "Benzyl Alcohol": "주의",
    리날룰: "주의",
    Linalool: "주의",
    시트로넬올: "주의",
    Citronellol: "주의",
    제라니올: "주의",
    Geraniol: "주의",
  };

  // 성분별 역할과 설명 매핑 (사용자 친화적 설명)
  const ingredientRoleMap: Record<string, { role: string; description: string }> = {
    정제수: {
      role: "피부 컨디셔닝제, 용매",
      description: "제품의 기반이 되는 성분으로, 다른 성분들을 용해시키고 피부에 수분을 공급합니다.",
    },
    물: {
      role: "피부 컨디셔닝제, 용매",
      description: "제품의 기반이 되는 성분으로, 다른 성분들을 용해시키고 피부에 수분을 공급합니다.",
    },
    Water: {
      role: "피부 컨디셔닝제, 용매",
      description: "제품의 기반이 되는 성분으로, 다른 성분들을 용해시키고 피부에 수분을 공급합니다.",
    },
    "소듐라우레스설페이트": {
      role: "계면활성제, 세정제, 거품촉진제",
      description: "모공 속 노폐물을 효과적으로 제거하고 풍부한 거품을 생성하여 세정력을 높입니다.",
    },
    "Sodium Laureth Sulfate": {
      role: "계면활성제, 세정제, 거품촉진제",
      description: "모공 속 노폐물을 효과적으로 제거하고 풍부한 거품을 생성하여 세정력을 높입니다.",
    },
    "소듐라우릴설페이트": {
      role: "계면활성제, 세정제, 거품촉진제",
      description: "강력한 세정력을 제공하며 풍부한 거품을 생성합니다.",
    },
    "Sodium Lauryl Sulfate": {
      role: "계면활성제, 세정제, 거품촉진제",
      description: "강력한 세정력을 제공하며 풍부한 거품을 생성합니다.",
    },
    "코카미도프로필베타인": {
      role: "양쪽성 계면활성제, 세정제, 점증제",
      description: "피부에 비교적 순하게 작용하며 거품을 풍성하게 만들어 세정력을 돕습니다.",
    },
    "Cocamidopropyl Betaine": {
      role: "양쪽성 계면활성제, 세정제, 점증제",
      description: "피부에 비교적 순하게 작용하며 거품을 풍성하게 만들어 세정력을 돕습니다.",
    },
    "소듐클로라이드": {
      role: "점증제, 결합제",
      description: "화장품의 점도를 조절하여 사용감을 개선하고 다른 성분들을 안정화하는 역할을 합니다.",
    },
    "Sodium Chloride": {
      role: "점증제, 결합제",
      description: "화장품의 점도를 조절하여 사용감을 개선하고 다른 성분들을 안정화하는 역할을 합니다.",
    },
    글리세린: {
      role: "보습제, 피부 컨디셔닝제",
      description: "공기 중의 수분을 끌어당겨 피부에 촉촉함을 유지시켜 주는 대표적인 보습 성분입니다.",
    },
    Glycerin: {
      role: "보습제, 피부 컨디셔닝제",
      description: "공기 중의 수분을 끌어당겨 피부에 촉촉함을 유지시켜 주는 대표적인 보습 성분입니다.",
    },
    "소듐라우로일사코시네이트": {
      role: "계면활성제, 세정제, 거품촉진제",
      description: "부드러운 세정력을 제공하면서도 풍성한 거품을 형성하여 세안을 돕습니다.",
    },
    "Sodium Lauroyl Sarcosinate": {
      role: "계면활성제, 세정제, 거품촉진제",
      description: "부드러운 세정력을 제공하면서도 풍성한 거품을 형성하여 세안을 돕습니다.",
    },
    "피이지-7글리세릴코코에이트": {
      role: "계면활성제, 유화제",
      description: "피부에 유분감 없이 부드러운 세정감을 제공하며, 오일과 물이 잘 섞이도록 돕습니다.",
    },
    "PEG-7 Glyceryl Cocoate": {
      role: "계면활성제, 유화제",
      description: "피부에 유분감 없이 부드러운 세정감을 제공하며, 오일과 물이 잘 섞이도록 돕습니다.",
    },
    "장미꽃추출물": {
      role: "피부 컨디셔닝제",
      description: "피부 진정 및 보습에 도움을 주며, 은은한 향을 부여할 수 있습니다.",
    },
    "다마스크장미꽃오일": {
      role: "향료, 피부 컨디셔닝제",
      description: "피부 진정 및 보습에 도움을 주며, 은은한 장미 향을 부여합니다.",
    },
    "Damask Rose Flower Oil": {
      role: "향료, 피부 컨디셔닝제",
      description: "피부 진정 및 보습에 도움을 주며, 은은한 장미 향을 부여합니다.",
    },
    "라벤더오일": {
      role: "향료, 피부 컨디셔닝제",
      description: "심신 안정에 도움을 주는 특유의 향을 가지고 있으며 피부 진정 효과가 있습니다.",
    },
    "Lavender Oil": {
      role: "향료, 피부 컨디셔닝제",
      description: "심신 안정에 도움을 주는 특유의 향을 가지고 있으며 피부 진정 효과가 있습니다.",
    },
    "센티드제라늄꽃오일": {
      role: "향료, 피부 컨디셔닝제",
      description: "피부의 유수분 밸런스 조절에 도움을 주며, 특유의 상쾌한 꽃 향을 부여합니다.",
    },
    "시트릭애씨드": {
      role: "pH 조절제, 산도조절제",
      description: "제품의 pH를 적절하게 조절하여 안정성을 유지하고 피부에 유효한 환경을 조성합니다.",
    },
    "Citric Acid": {
      role: "pH 조절제, 산도조절제",
      description: "제품의 pH를 적절하게 조절하여 안정성을 유지하고 피부에 유효한 환경을 조성합니다.",
    },
    "소듐벤조에이트": {
      role: "보존제",
      description: "미생물의 성장을 억제하여 제품의 변질을 막고 사용 기간을 늘려주는 데 사용됩니다.",
    },
    "Sodium Benzoate": {
      role: "보존제",
      description: "미생물의 성장을 억제하여 제품의 변질을 막고 사용 기간을 늘려주는 데 사용됩니다.",
    },
    "포타슘솔베이트": {
      role: "보존제",
      description: "제품 내 미생물 번식을 억제하여 화장품을 신선하고 안전하게 유지하는 데 도움을 줍니다.",
    },
    "Potassium Sorbate": {
      role: "보존제",
      description: "제품 내 미생물 번식을 억제하여 화장품을 신선하고 안전하게 유지하는 데 도움을 줍니다.",
    },
    "테트라소듐이디티에이": {
      role: "금속이온봉쇄제, 안정화제",
      description: "화장품 성분들이 금속 이온과 반응하여 변질되는 것을 막아 제품을 안정화시킵니다.",
    },
    "Tetrasodium EDTA": {
      role: "금속이온봉쇄제, 안정화제",
      description: "화장품 성분들이 금속 이온과 반응하여 변질되는 것을 막아 제품을 안정화시킵니다.",
    },
    벤질알코올: {
      role: "보존제, 향료",
      description: "방부 효과와 함께 은은한 향을 부여하며, 식약처에서 알레르기 유발 가능 성분으로 고시하고 있습니다.",
    },
    "Benzyl Alcohol": {
      role: "보존제, 향료",
      description: "방부 효과와 함께 은은한 향을 부여하며, 식약처에서 알레르기 유발 가능 성분으로 고시하고 있습니다.",
    },
    리날룰: {
      role: "향료",
      description: "라벤더나 감귤류 등에서 나는 꽃 향을 부여하는 성분으로, 식약처에서 알레르기 유발 가능 성분으로 고시하고 있습니다.",
    },
    Linalool: {
      role: "향료",
      description: "라벤더나 감귤류 등에서 나는 꽃 향을 부여하는 성분으로, 식약처에서 알레르기 유발 가능 성분으로 고시하고 있습니다.",
    },
    시트로넬올: {
      role: "향료",
      description: "장미향과 같은 꽃 향을 부여하는 성분으로, 식약처에서 알레르기 유발 가능 성분으로 고시하고 있습니다.",
    },
    Citronellol: {
      role: "향료",
      description: "장미향과 같은 꽃 향을 부여하는 성분으로, 식약처에서 알레르기 유발 가능 성분으로 고시하고 있습니다.",
    },
    제라니올: {
      role: "향료",
      description: "장미나 제라늄과 유사한 향을 내는 성분으로, 식약처에서 알레르기 유발 가능 성분으로 고시하고 있습니다.",
    },
    Geraniol: {
      role: "향료",
      description: "장미나 제라늄과 유사한 향을 내는 성분으로, 식약처에서 알레르기 유발 가능 성분으로 고시하고 있습니다.",
    },
  };

  // 성분 정보 보강
  const enrichedIngredients: Ingredient[] = simpleIngredients.map((ing) => {
    const publicDataInfo = publicDataMap.get(ing.name);
    // 규제정보 API는 검색 기능이 없으므로 사용하지 않음
    // const regulationInfo = regulationMap.get(ing.name);
    const nameLower = ing.name.toLowerCase();

    // ingredientRoleMap에서 정보 가져오기
    const roleInfo = ingredientRoleMap[ing.name];

    // 알레르기 유발 여부 확인
    let isAllergen = false;
    
    // 1순위: ingredientRoleMap에서 직접 확인 (설명에 "식약처에서 알레르기 유발 가능 성분으로 고시하고 있습니다" 포함)
    if (roleInfo && roleInfo.description.includes("식약처에서 알레르기 유발 가능 성분으로 고시하고 있습니다")) {
      isAllergen = true;
    }
    // 2순위: 공공데이터 API 응답에서 알레르기 관련 키워드 검색
    else if (publicDataInfo?.ORIGIN_MAJOR_KOR_NAME) {
      const originText = publicDataInfo.ORIGIN_MAJOR_KOR_NAME.toLowerCase();
      isAllergen = allergenKeywordsInDescription.some((keyword) =>
        originText.includes(keyword.toLowerCase())
      );
    }
    
    // 3순위: 키워드 기반 감지 (1순위와 2순위에서 감지되지 않은 경우)
    if (!isAllergen) {
      isAllergen = allergenKeywords.some((keyword) =>
        nameLower.includes(keyword.toLowerCase())
      );
    }

    // 규제정보는 API가 검색 기능을 지원하지 않으므로 항상 false/null로 설정
    const isProhibited = false; // 규제정보 API가 검색 기능을 지원하지 않음
    const hasLimitation = false; // 규제정보 API가 검색 기능을 지원하지 않음
    const limitationInfo = undefined; // 규제정보 API가 검색 기능을 지원하지 않음

    // 안전성 등급 평가
    // 평가 기준:
    // - 금지 성분이면 "위험"
    // - 알레르기 유발 성분이면 "주의"
    // - 제한이 있으면 "주의"
    // - 맵에 등록된 등급이 있으면 사용
    // - 기본값: "보통"
    let safetyGrade: "안전" | "보통" | "주의" | "위험" = safetyGradeMap[ing.name] || "보통";
    
    // 규제 정보에 따른 등급 조정
    if (isProhibited) {
      safetyGrade = "위험";
    } else if (isAllergen || hasLimitation) {
      // 알레르기 유발 또는 제한이 있으면 "주의"로 상향 조정
      if (safetyGrade === "안전" || safetyGrade === "보통") {
        safetyGrade = "주의";
      }
    }

    // 성분 설명 생성 (역할 + 기능 설명 형식)
    let description: string | undefined;
    
    // 1순위: ingredientRoleMap에서 직접 매핑된 설명 사용
    if (roleInfo) {
      description = `${roleInfo.role}. ${roleInfo.description}`;
    }
    // 2순위: 공공데이터에서 가져온 정보로 설명 생성
    else if (publicDataInfo) {
      const parts: string[] = [];
      
      // 역할 추론 (공공데이터 정보 기반)
      let role = "";
      if (publicDataInfo.ORIGIN_MAJOR_KOR_NAME) {
        const originText = publicDataInfo.ORIGIN_MAJOR_KOR_NAME.toLowerCase();
        
        // 역할 추론
        if (originText.includes("계면활성") || originText.includes("세정") || originText.includes("거품")) {
          role = "계면활성제, 세정제";
        } else if (originText.includes("보습") || originText.includes("수분")) {
          role = "보습제, 피부 컨디셔닝제";
        } else if (originText.includes("보존") || originText.includes("방부")) {
          role = "보존제";
        } else if (originText.includes("향") || originText.includes("오일")) {
          role = "향료, 피부 컨디셔닝제";
        } else if (originText.includes("용매") || originText.includes("정제한 물")) {
          role = "피부 컨디셔닝제, 용매";
        } else if (originText.includes("ph") || originText.includes("산도")) {
          role = "pH 조절제, 산도조절제";
        }
      }
      
      // ORIGIN_MAJOR_KOR_NAME을 더 사용자 친화적인 설명으로 변환
      if (publicDataInfo.ORIGIN_MAJOR_KOR_NAME) {
        let originText = publicDataInfo.ORIGIN_MAJOR_KOR_NAME;
        
        // "이 원료는" 제거하고 자연스러운 문장으로 변환
        originText = originText.replace(/^이 원료는\s*/, "");
        originText = originText.replace(/이다\.?$/, "");
        
        if (role) {
          parts.push(`${role}. ${originText}`);
        } else {
          parts.push(originText);
        }
      }
      
      description = parts.length > 0 ? parts.join(". ") : undefined;
    }
    
    // 3순위: 기본 설명 제공 (주요 성분만)
    if (!description) {
      const defaultDescriptions: Record<string, string> = {
        정제수: "피부 컨디셔닝제, 용매. 제품의 기반이 되는 성분으로, 다른 성분들을 용해시키고 피부에 수분을 공급합니다.",
        물: "피부 컨디셔닝제, 용매. 제품의 기반이 되는 성분으로, 다른 성분들을 용해시키고 피부에 수분을 공급합니다.",
        Water: "피부 컨디셔닝제, 용매. 제품의 기반이 되는 성분으로, 다른 성분들을 용해시키고 피부에 수분을 공급합니다.",
        글리세린: "보습제, 피부 컨디셔닝제. 공기 중의 수분을 끌어당겨 피부에 촉촉함을 유지시켜 주는 대표적인 보습 성분입니다.",
        Glycerin: "보습제, 피부 컨디셔닝제. 공기 중의 수분을 끌어당겨 피부에 촉촉함을 유지시켜 주는 대표적인 보습 성분입니다.",
        다이메티콘: "실리콘 오일. 피부를 부드럽게 만들고 제품의 질감을 개선합니다.",
        Dimethicone: "실리콘 오일. 피부를 부드럽게 만들고 제품의 질감을 개선합니다.",
        향료: "향료. 제품에 향을 부여하는 성분입니다.",
        Fragrance: "향료. 제품에 향을 부여하는 성분입니다.",
        프로필렌글라이콜: "용매, 보습제. 다른 성분의 침투를 돕습니다.",
        PropyleneGlycol: "용매, 보습제. 다른 성분의 침투를 돕습니다.",
      };

      const nameLower = ing.name.toLowerCase();
      for (const [key, value] of Object.entries(defaultDescriptions)) {
        if (nameLower === key.toLowerCase() || ing.name === key) {
          description = value;
          break;
        }
      }
    }
    
    // 알레르기 성분인 경우 안내 문구 추가
    if (isAllergen && description) {
      // 이미 안내 문구가 포함되어 있지 않은 경우에만 추가
      if (!description.includes("식약처에서 알레르기 유발 가능 성분으로 고시하고 있습니다")) {
        description += " 식약처에서 알레르기 유발 가능 성분으로 고시하고 있습니다.";
      }
    }

    return {
      name: ing.name,
      safetyGrade,
      isAllergen,
      description,
      isProhibited,
      hasLimitation,
      limitationInfo,
    };
  });

  return enrichedIngredients;
};
