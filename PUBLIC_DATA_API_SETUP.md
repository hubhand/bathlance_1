# 공공데이터 API 설정 가이드

이 문서는 Gemini API 사용료를 절감하기 위해 공공데이터포털의 화장품 원료성분정보 API를 설정하는 방법을 안내합니다.

## 공공데이터 API 개요

- **제공 기관**: 식품의약품안전처
- **API명**: 화장품 원료성분정보
- **API ID**: 15111774
- **URL**: https://www.data.go.kr/data/15111774/openapi.do
- **비용**: 무료
- **일일 제한**: 개발계정 10,000건

## API 신청 방법

1. **공공데이터포털 회원가입**
   - https://www.data.go.kr 접속
   - 회원가입 및 로그인

2. **API 활용신청**
   - https://www.data.go.kr/data/15111774/openapi.do 접속
   - "활용신청" 버튼 클릭
   - 개발계정 또는 운영계정 선택
   - 신청 완료 후 승인 대기 (개발계정은 자동승인)

3. **인증키 발급**
   - 마이페이지 > 개발계정/운영계정 관리
   - 발급받은 인증키(Service Key) 복사

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# 공공데이터 API 설정 (선택사항)
# 공공데이터 API를 사용하지 않으면 이 변수들을 설정하지 않아도 됩니다.
# 설정하지 않으면 Gemini API만 사용하여 성분 정보를 제공합니다.

PUBLIC_DATA_API_KEY=your_public_data_api_key_here
PUBLIC_DATA_API_URL=https://apis.data.go.kr/1471000/CsmtcsIngdCpntInfoService01/getCsmtcsIngdCpntInfoService01

# 규제정보 API (선택사항 - 더 풍부한 안전성 정보 제공)
PUBLIC_DATA_REGULATION_API_URL=https://apis.data.go.kr/1471000/CsmtcsReglMaterialInfoService/getCsmtcsReglMaterialInfoService
```

### API URL 확인 방법

1. 공공데이터포털에서 API 상세 페이지 접속
2. "활용 명세" 탭 클릭
3. Swagger UI에서 실제 엔드포인트 URL 확인
4. 일반적인 형식: `https://apis.data.go.kr/1471000/[서비스명]/[오퍼레이션명]`

**주의**: 실제 API URL은 공공데이터포털에서 확인한 정확한 엔드포인트를 사용해야 합니다.

## 작동 방식

### 하이브리드 방식 (공공데이터 API 설정 시)

1. **Gemini API**: 이미지에서 성분명만 추출 (프롬프트 단순화로 비용 절감)
2. **공공데이터 원료성분정보 API**: 추출된 성분명으로 상세 정보 조회 (무료)
3. **공공데이터 규제정보 API**: 성분의 금지/제한 정보 조회 (선택사항, 무료)
4. **결합**: 모든 정보를 결합하여 최종 결과 생성

### 폴백 방식 (공공데이터 API 미설정 시)

- 공공데이터 API가 설정되지 않으면 Gemini API만 사용
- 기존과 동일하게 작동하지만 비용 절감 효과는 없음

## 비용 절감 효과

- **예상 절감률**: 약 30-40%
- **이유**:
  - Gemini 프롬프트 단순화로 토큰 사용량 감소
  - 성분 상세 정보는 무료 공공데이터 API 활용

## 주의사항

1. **API 엔드포인트 URL**: 공공데이터포털에서 정확한 URL을 확인해야 합니다.
2. **파라미터명**: 실제 API 스펙에 맞게 `services/publicDataService.ts`의 파라미터명을 수정해야 할 수 있습니다.
3. **응답 형식**: API 응답 형식이 다를 경우 `services/publicDataService.ts`의 파싱 로직을 수정해야 합니다.
4. **EWG 등급**: 공공데이터에는 EWG 등급 정보가 없을 수 있어, 현재는 키워드 기반으로 처리합니다.
5. **알레르기 정보**: 식약처 알레르기 유발 성분 정보는 별도로 관리해야 할 수 있습니다.

## 문제 해결

### 공공데이터 API가 작동하지 않는 경우

1. 인증키가 올바른지 확인
2. API URL이 정확한지 확인
3. 공공데이터포털에서 API 상태 확인
4. 브라우저 콘솔에서 에러 메시지 확인

### API 응답 형식이 다른 경우

`services/publicDataService.ts` 파일의 `PublicDataApiResponse` 인터페이스와 파싱 로직을 실제 API 응답 형식에 맞게 수정하세요.

## 참고 자료

- [공공데이터포털](https://www.data.go.kr)
- [화장품 원료성분정보 API 상세](https://www.data.go.kr/data/15111774/openapi.do)
- [공공데이터 API 이용 가이드](https://www.data.go.kr/ugs/selectPortalPolicyView.do)

