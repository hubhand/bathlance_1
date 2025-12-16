import { NextRequest, NextResponse } from 'next/server';
import { analyzeProductImage, analyzeIngredients } from '@/services/geminiService';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, type } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: '이미지 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이미지 데이터 길이 확인
    if (imageBase64.length < 100) {
      return NextResponse.json(
        { error: '이미지 데이터가 너무 짧습니다.' },
        { status: 400 }
      );
    }

    if (type === 'ingredients') {
      const result = await analyzeIngredients(imageBase64);
      return NextResponse.json(result);
    } else {
      const result = await analyzeProductImage(imageBase64);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Gemini API 에러:', error);
    console.error('에러 상세:', error instanceof Error ? error.stack : error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 429 에러 (할당량 초과) 처리 추가
    const isQuotaExceeded = errorMessage.includes('429') || 
                           errorMessage.includes('RESOURCE_EXHAUSTED') ||
                           errorMessage.includes('quota') ||
                           errorMessage.includes('Quota exceeded');
    
    if (isQuotaExceeded) {
      // 재시도 시간 추출 (에러 메시지에서)
      const retryMatch = errorMessage.match(/retry in ([\d.]+)s/i);
      const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
      
      return NextResponse.json(
        { 
          error: `Gemini API 일일 사용량 제한에 도달했습니다. 무료 티어는 하루 20회까지 사용 가능합니다. 약 ${retrySeconds}초 후에 다시 시도해주세요.`,
          code: 'QUOTA_EXCEEDED',
          retryAfter: retrySeconds
        },
        { status: 429 }
      );
    }
    
    // Gemini API 과부하 에러 처리
    const isOverloaded = errorMessage.includes('overloaded') || 
                         errorMessage.includes('UNAVAILABLE') ||
                         errorMessage.includes('503');
    
    if (isOverloaded) {
      return NextResponse.json(
        { error: 'Gemini API 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.' },
        { status: 503 }
      );
    }
    
    // 기타 에러
    return NextResponse.json(
      { error: errorMessage || '제품 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}








