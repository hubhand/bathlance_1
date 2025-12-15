import { GoogleGenAI, Type } from "@google/genai";
import {
  GeminiResponse,
  ProductCategory,
  GeminiIngredientsResponse,
} from "../types";

// API 키는 서버 사이드에서만 사용 (클라이언트에 노출하지 않음)
// 이 파일은 app/api/gemini/analyze/route.ts에서만 호출됨
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. .env.local 파일에 GEMINI_API_KEY를 추가해주세요."
  );
}
const ai = new GoogleGenAI({ apiKey });

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

const ingredientsSchema = {
  type: Type.OBJECT,
  properties: {
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: '성분명 (INCI name). 예: "정제수"',
          },
          ewgGrade: {
            type: Type.STRING,
            description:
              'EWG 등급. "1", "2" 등 숫자 또는 "3-6"과 같은 범위, 혹은 "주의"와 같은 텍스트로 표기.',
          },
          isAllergen: {
            type: Type.BOOLEAN,
            description:
              "식약처 고시 알레르기 유발 가능 성분인 경우 true, 아니면 false.",
          },
          description: {
            type: Type.STRING,
            description: "성분에 대한 1-2 문장의 간단한 설명. 없으면 생략.",
          },
        },
        required: ["name", "ewgGrade", "isAllergen"],
      },
    },
  },
  required: ["ingredients"],
};

export const analyzeProductImage = async (
  imageBase64: string
): Promise<GeminiResponse> => {
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
  const prompt =
    "이 제품 사진 뒷면의 전성분 목록을 분석해줘. 각 성분에 대해 한국어 이름, EWG 안전 등급, 식약처 고시 알레르기 유발 주의 성분 여부를 알려줘. EWG 등급은 숫자나 범위로 표기하고, 알레르기 유발 가능성이 있다면 true로 표시해줘. JSON 형식으로 응답해줘. 성분이 너무 많으면 주요 성분 20개까지만 분석해줘.";

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
        responseSchema: ingredientsSchema,
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

    return parsedResponse;
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
