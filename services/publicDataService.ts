// 공공데이터포털 화장품 원료성분정보 API 서비스
// 식품의약품안전처 화장품 원료성분정보 API 활용

interface PublicDataIngredientInfo {
  INGR_KOR_NAME?: string; // 표준명
  INGR_ENG_NAME?: string; // 영문명
  CAS_NO?: string; // CAS 번호
  ORIGIN_MAJOR_KOR_NAME?: string; // 기원 및 정의
  INGR_SYNONYM?: string; // 이명
}

// 화장품 규제정보 인터페이스
interface PublicDataRegulationInfo {
  SN?: string;
  INGR_STD_NAME?: string; // 표준명
  INGR_ENG_NAME?: string; // 영문명
  PROH_NATIONAL?: string; // 금지 여부
  LIMIT_NATIONAL?: string; // 제한 여부
}

interface PublicDataRegulationApiResponse {
  header?: {
    resultCode?: string;
    resultMsg?: string;
  };
  body?: {
    numOfRows?: number;
    pageNo?: number;
    totalCount?: number;
    items?: {
      item?: PublicDataRegulationInfo | PublicDataRegulationInfo[];
    };
  };
}

interface PublicDataApiResponse {
  header?: {
    resultCode?: string;
    resultMsg?: string;
  };
  body?: {
    numOfRows?: number;
    pageNo?: number;
    totalCount?: number;
    items?: {
      item?: PublicDataIngredientInfo | PublicDataIngredientInfo[];
    };
  };
}

// XML 응답 파싱을 위한 간단한 인터페이스
interface PublicDataXmlResponse {
  response?: {
    header?: {
      resultCode?: string;
      resultMsg?: string;
    };
    body?: {
      items?: {
        item?: PublicDataIngredientInfo | PublicDataIngredientInfo[];
      };
      totalCount?: number;
    };
  };
}

/**
 * 공공데이터 API에서 성분 정보를 조회합니다.
 * @param ingredientName 검색할 성분명 (한국어 또는 영문)
 * @returns 성분 상세 정보 또는 null
 */
/**
 * XML 문자열을 간단하게 파싱하여 객체로 변환
 * 서버 사이드에서는 DOMParser를 사용할 수 없으므로 정규식을 사용한 간단한 파싱
 * 더 정확한 파싱이 필요하면 fast-xml-parser 라이브러리 사용 권장
 */
const parseXmlToJson = (xmlString: string): any => {
  try {
    const result: any = {};

    // header 추출
    const resultCodeMatch = xmlString.match(
      /<resultCode>([^<]*)<\/resultCode>/
    );
    const resultMsgMatch = xmlString.match(/<resultMsg>([^<]*)<\/resultMsg>/);

    if (resultCodeMatch || resultMsgMatch) {
      result.header = {};
      if (resultCodeMatch) {
        result.header.resultCode = resultCodeMatch[1];
      }
      if (resultMsgMatch) {
        result.header.resultMsg = resultMsgMatch[1];
      }
    }

    // body 추출
    const bodyMatch = xmlString.match(/<body>([\s\S]*?)<\/body>/);
    if (bodyMatch) {
      result.body = {};

      // items 추출
      const itemsMatch = bodyMatch[1].match(/<items>([\s\S]*?)<\/items>/);
      if (itemsMatch) {
        const itemsContent = itemsMatch[1];
        const itemMatches = itemsContent.matchAll(/<item>([\s\S]*?)<\/item>/g);

        const items: any[] = [];
        for (const itemMatch of itemMatches) {
          const itemContent = itemMatch[1];
          const item: any = {};

          // 각 필드 추출 (실제 API 스펙에 맞는 필드명)
          const fields = [
            "INGR_KOR_NAME",
            "INGR_ENG_NAME",
            "CAS_NO",
            "ORIGIN_MAJOR_KOR_NAME",
            "INGR_SYNONYM",
          ];
          fields.forEach((field) => {
            const fieldMatch = itemContent.match(
              new RegExp(`<${field}>([\\s\\S]*?)<\\/${field}>`)
            );
            if (fieldMatch) {
              item[field] = fieldMatch[1].trim();
            }
          });

          if (Object.keys(item).length > 0) {
            items.push(item);
          }
        }

        if (items.length > 0) {
          result.body.items = { item: items.length === 1 ? items[0] : items };
        }
      }
    }

    return result;
  } catch (error) {
    console.error("[공공데이터 API] XML 파싱 중 오류:", error);
    return null;
  }
};

export const getIngredientInfoFromPublicData = async (
  ingredientName: string
): Promise<PublicDataIngredientInfo | null> => {
  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  const apiUrl = process.env.PUBLIC_DATA_API_URL;

  if (!apiKey || !apiUrl) {
    console.warn(
      "[공공데이터 API] 키 또는 URL이 설정되지 않았습니다. 환경 변수를 확인해주세요."
    );
    return null;
  }

  try {
    // 성분명에서 괄호와 퍼센트 기호 제거 (API 에러 방지)
    // 예: "다마스크장미꽃오일(0.076164%)" → "다마스크장미꽃오일"
    const cleanedName = ingredientName
      .replace(/\([^)]*\)/g, "") // 괄호와 그 안의 내용 제거
      .replace(/%/g, "") // 퍼센트 기호 제거
      .trim();

    // 공공데이터 API 호출
    // ⚠️ 중요: 실제 API 스펙에 맞게 파라미터명과 URL을 수정해야 합니다.
    // 공공데이터포털의 Swagger UI에서 정확한 파라미터명을 확인하세요.
    // 일반적인 공공데이터 API 패턴: serviceKey, pageNo, numOfRows, 검색 파라미터

    // serviceKey는 공공데이터포털에서 발급받은 원본 키를 사용
    // URLSearchParams가 자동으로 인코딩하지만, 일부 API는 디코딩된 키를 요구할 수 있음
    const searchParams = new URLSearchParams({
      serviceKey: apiKey,
      pageNo: "1",
      numOfRows: "10",
      type: "json", // JSON 형식으로 요청
      INGR_KOR_NAME: cleanedName, // 정제된 성분명 사용
    });

    // 한글 파라미터는 URLSearchParams가 자동으로 인코딩합니다
    const fullUrl = `${apiUrl}?${searchParams.toString()}`;
    if (cleanedName !== ingredientName) {
      console.log(
        `[공공데이터 API] 호출 중: ${ingredientName} → ${cleanedName} (정제됨)`
      );
    } else {
      console.log(`[공공데이터 API] 호출 중: ${ingredientName}`);
    }
    // URL 로깅 (인증키는 마스킹)
    const maskedUrl = fullUrl.replace(/serviceKey=[^&]*/, "serviceKey=***");
    console.log(`[공공데이터 API] 요청 URL: ${maskedUrl}`);

    // JSON과 XML 모두 지원
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Accept: "application/json, application/xml, text/xml",
      },
    });

    if (!response.ok) {
      // 에러 응답 본문 읽기 (중요: 500 에러의 원인 파악)
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (textError) {
        errorText = "응답 본문을 읽을 수 없습니다.";
      }

      console.error(
        `[공공데이터 API] HTTP 에러: ${response.status} ${response.statusText}`
      );
      console.error(
        `[공공데이터 API] 에러 응답 본문: ${errorText.substring(0, 1000)}`
      );

      // XML 에러 응답인 경우 파싱 시도
      if (
        errorText.includes("<?xml") ||
        errorText.includes("<response>") ||
        errorText.includes("<header>")
      ) {
        try {
          const errorData = parseXmlToJson(errorText);
          if (errorData?.header) {
            console.error(
              `[공공데이터 API] 에러 코드: ${
                errorData.header.resultCode || "N/A"
              }`
            );
            console.error(
              `[공공데이터 API] 에러 메시지: ${
                errorData.header.resultMsg || "N/A"
              }`
            );
          }
        } catch (parseError) {
          // XML 파싱 실패는 무시
        }
      }

      return null;
    }

    // Content-Type 확인
    const contentType = response.headers.get("content-type") || "";
    let data: PublicDataApiResponse | null = null;

    if (contentType.includes("application/json")) {
      // JSON 응답 처리
      const jsonText = await response.text();
      console.log(
        `[공공데이터 API] JSON 응답 수신 (${ingredientName}): ${jsonText.substring(
          0,
          500
        )}...`
      );
      try {
        data = JSON.parse(jsonText);
        // 응답 구조 디버깅
        console.log(
          `[공공데이터 API] 파싱된 데이터 구조:`,
          JSON.stringify(data, null, 2).substring(0, 1000)
        );
      } catch (parseError) {
        console.error(`[공공데이터 API] JSON 파싱 실패:`, parseError);
        return null;
      }
    } else if (
      contentType.includes("xml") ||
      contentType.includes("text/xml")
    ) {
      // XML 응답 처리
      const xmlText = await response.text();
      console.log(
        `[공공데이터 API] XML 응답 수신: ${xmlText.substring(0, 200)}...`
      );

      // 서버 사이드에서는 DOMParser를 사용할 수 없으므로, 간단한 파싱 또는 xml2js 사용
      // 여기서는 간단한 문자열 파싱으로 처리 (실제로는 xml2js 라이브러리 사용 권장)
      try {
        // Node.js 환경에서는 xml2js 또는 fast-xml-parser 사용
        // 브라우저 환경에서는 DOMParser 사용
        // 여기서는 일단 JSON으로 변환 시도
        data = parseXmlToJson(xmlText) as PublicDataApiResponse;
      } catch (parseError) {
        console.error("[공공데이터 API] XML 파싱 실패:", parseError);
        // XML 파싱 실패 시 빈 응답으로 처리
        return null;
      }
    } else {
      // 알 수 없는 형식
      const text = await response.text();
      console.warn(`[공공데이터 API] 알 수 없는 응답 형식: ${contentType}`);
      console.warn(`[공공데이터 API] 응답 내용: ${text.substring(0, 200)}...`);

      // JSON으로 파싱 시도
      try {
        data = JSON.parse(text);
      } catch {
        return null;
      }
    }

    // 에러 응답 코드 확인
    if (data?.header?.resultCode) {
      const resultCode = data.header.resultCode;
      const resultMsg = data.header.resultMsg || "";

      // resultCode가 "00"이 아니면 에러
      if (resultCode !== "00") {
        console.error(
          `[공공데이터 API] 에러 응답: resultCode=${resultCode}, resultMsg=${resultMsg}`
        );
        return null;
      }
    }

    // 응답 구조 확인 및 정확한 성분명 매칭
    let items: PublicDataIngredientInfo[] = [];

    // 실제 API 응답 구조: body.items.item (단일 객체 또는 배열)
    if (data?.body?.items?.item) {
      items = Array.isArray(data.body.items.item)
        ? data.body.items.item
        : [data.body.items.item];
    }
    // 응답 구조가 다른 경우도 확인 (직접 items 배열인 경우)
    else if (data?.body?.items && Array.isArray(data.body.items)) {
      items = data.body.items;
    }

    if (items.length > 0) {
      // 정확한 성분명과 일치하는 항목 찾기
      // 정제된 이름과 원본 이름 모두로 비교
      const normalizedSearchName = cleanedName.trim().toLowerCase();
      const normalizedOriginalName = ingredientName.trim().toLowerCase();

      // 1순위: 정확히 일치하는 항목 (한글명) - 정제된 이름으로 먼저 검색
      let matchedItem = items.find(
        (item) =>
          item.INGR_KOR_NAME?.trim().toLowerCase() === normalizedSearchName
      );

      // 원본 이름으로도 검색 시도
      if (!matchedItem) {
        matchedItem = items.find(
          (item) =>
            item.INGR_KOR_NAME?.trim().toLowerCase() === normalizedOriginalName
        );
      }

      // 2순위: 정확히 일치하는 항목 (영문명) - 정제된 이름으로 먼저 검색
      if (!matchedItem) {
        matchedItem = items.find(
          (item) =>
            item.INGR_ENG_NAME?.toLowerCase().split(",")[0].trim() ===
            normalizedSearchName
        );
      }

      // 원본 이름으로도 검색 시도
      if (!matchedItem) {
        matchedItem = items.find(
          (item) =>
            item.INGR_ENG_NAME?.toLowerCase().split(",")[0].trim() ===
            normalizedOriginalName
        );
      }

      // 3순위: 부분 일치 (한글명에 검색어가 정확히 포함된 경우, 단 검색어가 더 짧거나 같아야 함)
      // 정제된 이름과 원본 이름 모두로 검색
      if (!matchedItem) {
        const searchNames = [normalizedSearchName, normalizedOriginalName];
        for (const searchName of searchNames) {
          matchedItem = items.find((item) => {
            const itemName = item.INGR_KOR_NAME?.toLowerCase() || "";
            // 검색어가 항목명에 포함되어 있고, 검색어가 항목명보다 짧거나 같아야 함
            // 예: "피씨에이"는 "마그네슘피씨에이"에 포함되지만, "피씨에이"가 더 짧으므로 매칭하지 않음
            return (
              itemName.includes(searchName) &&
              searchName.length <= itemName.length &&
              // 정확히 일치하는 부분이 있는지 확인 (단어 경계 고려)
              (itemName === searchName ||
                itemName.startsWith(searchName) ||
                itemName.endsWith(searchName) ||
                itemName.includes(` ${searchName} `) ||
                itemName.includes(`/${searchName}/`) ||
                itemName.includes(`-${searchName}-`))
            );
          });
          if (matchedItem) break;
        }
      }

      // 4순위: 첫 번째 항목 (매칭 실패 시)
      if (!matchedItem) {
        matchedItem = items[0];
        console.log(
          `[공공데이터 API] 정확한 매칭 실패, 첫 번째 항목 사용: ${ingredientName} → ${
            matchedItem.INGR_KOR_NAME ||
            matchedItem.INGR_ENG_NAME ||
            "정보 조회됨"
          }`
        );
      } else {
        console.log(
          `[공공데이터 API] 성공: ${ingredientName} → ${
            matchedItem.INGR_KOR_NAME ||
            matchedItem.INGR_ENG_NAME ||
            "정보 조회됨"
          }`
        );
      }

      return matchedItem;
    }

    // 결과가 없으면 null 반환
    console.log(
      `[공공데이터 API] 결과 없음: ${ingredientName} (응답 구조: ${JSON.stringify(
        data
      ).substring(0, 200)})`
    );
    return null;
  } catch (error) {
    console.error(`[공공데이터 API] 호출 중 오류 (${ingredientName}):`, error);
    if (error instanceof Error) {
      console.error(`[공공데이터 API] 에러 상세: ${error.message}`);
      console.error(`[공공데이터 API] 스택: ${error.stack}`);
    }
    return null;
  }
};

/**
 * 여러 성분에 대한 정보를 일괄 조회합니다.
 * @param ingredientNames 성분명 배열
 * @returns 성분명을 키로 하는 맵
 */
export const getMultipleIngredientInfo = async (
  ingredientNames: string[]
): Promise<Map<string, PublicDataIngredientInfo>> => {
  const resultMap = new Map<string, PublicDataIngredientInfo>();

  if (ingredientNames.length === 0) {
    return resultMap;
  }

  console.log(
    `[공공데이터 API] 일괄 조회 시작: ${ingredientNames.length}개 성분`
  );

  // 병렬로 여러 성분 조회 (공공데이터 API 제한 고려하여 배치 처리)
  const batchSize = 5; // 한 번에 5개씩 처리
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < ingredientNames.length; i += batchSize) {
    const batch = ingredientNames.slice(i, i + batchSize);
    const promises = batch.map(async (name) => {
      const info = await getIngredientInfoFromPublicData(name);
      if (info) {
        successCount++;
        return { name, info };
      }
      failCount++;
      return null;
    });

    const results = await Promise.all(promises);
    results.forEach((result) => {
      if (result) {
        resultMap.set(result.name, result.info);
      }
    });

    // API 호출 제한을 고려한 딜레이 (필요시)
    if (i + batchSize < ingredientNames.length) {
      await new Promise((resolve) => setTimeout(resolve, 200)); // 200ms 대기
    }
  }

  console.log(
    `[공공데이터 API] 일괄 조회 완료: 성공 ${successCount}개, 실패 ${failCount}개`
  );

  return resultMap;
};

/**
 * 화장품 규제정보 API에서 성분의 규제 정보를 조회합니다.
 * @param ingredientName 검색할 성분명 (한국어 또는 영문)
 * @returns 규제 정보 또는 null
 */
export const getIngredientRegulationInfo = async (
  ingredientName: string
): Promise<PublicDataRegulationInfo | null> => {
  const apiKey = process.env.PUBLIC_DATA_API_KEY;
  const regulationApiUrl = process.env.PUBLIC_DATA_REGULATION_API_URL;

  if (!apiKey || !regulationApiUrl) {
    // 규제정보 API가 설정되지 않았으면 null 반환 (선택사항)
    return null;
  }

  try {
    const searchParams = new URLSearchParams({
      serviceKey: apiKey,
      pageNo: "1",
      numOfRows: "10",
      type: "json",
      INGR_STD_NAME: ingredientName, // 규제정보 API의 파라미터명
    });

    const fullUrl = `${regulationApiUrl}?${searchParams.toString()}`;
    console.log(`[공공데이터 규제정보 API] 호출 중: ${ingredientName}`);

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Accept: "application/json, application/xml, text/xml",
      },
    });

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (textError) {
        errorText = "응답 본문을 읽을 수 없습니다.";
      }

      console.error(
        `[공공데이터 규제정보 API] HTTP 에러: ${response.status} ${response.statusText}`
      );
      console.error(
        `[공공데이터 규제정보 API] 에러 응답 본문: ${errorText.substring(
          0,
          1000
        )}`
      );

      if (
        errorText.includes("<?xml") ||
        errorText.includes("<response>") ||
        errorText.includes("<header>")
      ) {
        try {
          const errorData = parseXmlToJson(errorText);
          if (errorData?.header) {
            console.error(
              `[공공데이터 규제정보 API] 에러 코드: ${
                errorData.header.resultCode || "N/A"
              }`
            );
            console.error(
              `[공공데이터 규제정보 API] 에러 메시지: ${
                errorData.header.resultMsg || "N/A"
              }`
            );
          }
        } catch (parseError) {
          // XML 파싱 실패는 무시
        }
      }
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    let data: PublicDataRegulationApiResponse | null = null;

    if (contentType.includes("application/json")) {
      data = await response.json();
      console.log(
        `[공공데이터 규제정보 API] JSON 응답 수신 (${ingredientName}):`,
        JSON.stringify(data).substring(0, 500)
      );
    } else if (
      contentType.includes("xml") ||
      contentType.includes("text/xml")
    ) {
      const xmlText = await response.text();
      console.log(
        `[공공데이터 규제정보 API] XML 응답 수신 (${ingredientName}): ${xmlText.substring(
          0,
          500
        )}...`
      );
      try {
        data = parseXmlToJson(xmlText) as PublicDataRegulationApiResponse;
      } catch (parseError) {
        console.error("[공공데이터 규제정보 API] XML 파싱 실패:", parseError);
        return null;
      }
    } else {
      const text = await response.text();
      console.warn(
        `[공공데이터 규제정보 API] 알 수 없는 응답 형식: ${contentType}`
      );
      console.warn(
        `[공공데이터 규제정보 API] 응답 내용: ${text.substring(0, 500)}...`
      );
      try {
        data = JSON.parse(text);
      } catch {
        return null;
      }
    }

    // 에러 응답 코드 확인
    if (data?.header?.resultCode) {
      const resultCode = data.header.resultCode;
      const resultMsg = data.header.resultMsg || "";
      if (resultCode !== "00") {
        console.error(
          `[공공데이터 규제정보 API] 에러 응답: resultCode=${resultCode}, resultMsg=${resultMsg}`
        );
        return null;
      }
    }

    console.log(
      `[공공데이터 규제정보 API] 파싱된 데이터 구조 (${ingredientName}):`,
      JSON.stringify(data).substring(0, 500)
    );

    // 응답 구조 확인 및 정확한 성분명 매칭
    let items: PublicDataRegulationInfo[] = [];

    if (data?.body?.items?.item) {
      items = Array.isArray(data.body.items.item)
        ? data.body.items.item
        : [data.body.items.item];
    } else if (data?.body?.items && Array.isArray(data.body.items)) {
      items = data.body.items;
    }

    if (items.length > 0) {
      // 정확한 성분명과 일치하는 항목 찾기
      const normalizedSearchName = ingredientName.trim().toLowerCase();

      // 1순위: 정확히 일치하는 항목 (표준명)
      let matchedItem = items.find(
        (item) =>
          item.INGR_STD_NAME?.trim().toLowerCase() === normalizedSearchName
      );

      // 2순위: 정확히 일치하는 항목 (영문명)
      if (!matchedItem) {
        matchedItem = items.find(
          (item) =>
            item.INGR_ENG_NAME?.toLowerCase().split(",")[0].trim() ===
            normalizedSearchName
        );
      }

      // 3순위: 부분 일치 (표준명에 검색어가 정확히 포함된 경우, 단 검색어가 더 짧거나 같아야 함)
      if (!matchedItem) {
        matchedItem = items.find((item) => {
          const itemName = item.INGR_STD_NAME?.toLowerCase() || "";
          // 검색어가 항목명에 포함되어 있고, 검색어가 항목명보다 짧거나 같아야 함
          return (
            itemName.includes(normalizedSearchName) &&
            normalizedSearchName.length <= itemName.length &&
            // 정확히 일치하는 부분이 있는지 확인 (단어 경계 고려)
            (itemName === normalizedSearchName ||
              itemName.startsWith(normalizedSearchName) ||
              itemName.endsWith(normalizedSearchName) ||
              itemName.includes(` ${normalizedSearchName} `) ||
              itemName.includes(`/${normalizedSearchName}/`) ||
              itemName.includes(`-${normalizedSearchName}-`))
          );
        });
      }

      // 매칭 실패 시 null 반환 (규제정보 API가 검색 파라미터를 제대로 처리하지 못할 수 있음)
      if (!matchedItem) {
        console.log(
          `[공공데이터 규제정보 API] 매칭 실패: ${ingredientName} (응답 항목 수: ${
            items.length
          }, totalCount: ${data?.body?.totalCount || "N/A"})`
        );
        // 규제정보 API가 검색 파라미터를 무시하고 전체 목록을 반환하는 경우를 감지
        if (data?.body?.totalCount && data.body.totalCount > 100) {
          console.warn(
            `[공공데이터 규제정보 API] 경고: totalCount가 ${data.body.totalCount}로 매우 큽니다. 검색 파라미터가 제대로 작동하지 않을 수 있습니다.`
          );
        }
        return null;
      }

      console.log(
        `[공공데이터 규제정보 API] 성공: ${ingredientName} → ${
          matchedItem.INGR_STD_NAME ||
          matchedItem.INGR_ENG_NAME ||
          "규제정보 조회됨"
        }`
      );

      return matchedItem;
    }

    console.log(`[공공데이터 규제정보 API] 결과 없음: ${ingredientName}`);
    return null;
  } catch (error) {
    console.error(
      `[공공데이터 규제정보 API] 호출 중 오류 (${ingredientName}):`,
      error
    );
    if (error instanceof Error) {
      console.error(`[공공데이터 규제정보 API] 에러 상세: ${error.message}`);
      console.error(`[공공데이터 규제정보 API] 스택: ${error.stack}`);
    }
    return null;
  }
};

/**
 * 여러 성분에 대한 규제정보를 일괄 조회합니다.
 * @param ingredientNames 성분명 배열
 * @returns 성분명을 키로 하는 맵
 */
export const getMultipleIngredientRegulationInfo = async (
  ingredientNames: string[]
): Promise<Map<string, PublicDataRegulationInfo>> => {
  const resultMap = new Map<string, PublicDataRegulationInfo>();

  if (ingredientNames.length === 0) {
    return resultMap;
  }

  const regulationApiUrl = process.env.PUBLIC_DATA_REGULATION_API_URL;
  if (!regulationApiUrl) {
    // 규제정보 API가 설정되지 않았으면 빈 맵 반환
    return resultMap;
  }

  console.log(
    `[공공데이터 규제정보 API] 일괄 조회 시작: ${ingredientNames.length}개 성분`
  );

  const batchSize = 5;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < ingredientNames.length; i += batchSize) {
    const batch = ingredientNames.slice(i, i + batchSize);
    const promises = batch.map(async (name) => {
      const info = await getIngredientRegulationInfo(name);
      if (info) {
        successCount++;
        return { name, info };
      }
      failCount++;
      return null;
    });

    const results = await Promise.all(promises);
    results.forEach((result) => {
      if (result) {
        resultMap.set(result.name, result.info);
      }
    });

    if (i + batchSize < ingredientNames.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.log(
    `[공공데이터 규제정보 API] 일괄 조회 완료: 성공 ${successCount}개, 실패 ${failCount}개`
  );

  return resultMap;
};
