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

    if (type === 'ingredients') {
      const result = await analyzeIngredients(imageBase64);
      return NextResponse.json(result);
    } else {
      const result = await analyzeProductImage(imageBase64);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Gemini API 에러:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '제품 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}








