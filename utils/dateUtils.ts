export const getDaysRemaining = (expiryDate: string): number => {
  const now = new Date();
  const end = new Date(expiryDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export const addMonths = (date: Date, months: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

/**
 * 교체 예정일을 계산합니다.
 * (제조일 + 유통기한)과 (개봉일 + 개봉 후 사용기한) 중 더 빠른 날짜를 반환합니다.
 * @param registrationDateStr - 등록일 (개봉일) ISO 문자열
 * @param periodAfterOpeningMonths - 개봉 후 사용기한 (개월)
 * @param manufacturingDateStr - 제조일 ISO 문자열 (Optional)
 * @param expiryPeriodBeforeOpeningMonths - 개봉 전 유효기간 (개월) (Optional)
 * @returns 최종 교체 예정일 ISO 문자열
 */
export const calculateExpiryDate = (
  registrationDateStr: string,
  periodAfterOpeningMonths: number,
  manufacturingDateStr?: string,
  expiryPeriodBeforeOpeningMonths?: number,
): string => {
  const registrationDate = new Date(registrationDateStr);
  const dateAfterOpening = addMonths(registrationDate, periodAfterOpeningMonths);

  // 제조일과 유통기한(개월)이 모두 있는 경우에만 유통기한 만료일을 계산
  if (manufacturingDateStr && expiryPeriodBeforeOpeningMonths) {
    try {
      const manufacturingDate = new Date(manufacturingDateStr);
      if (!isNaN(manufacturingDate.getTime())) {
        const dateBeforeOpening = addMonths(manufacturingDate, expiryPeriodBeforeOpeningMonths);
        // 두 날짜 중 더 이른 날짜를 반환
        return new Date(Math.min(dateBeforeOpening.getTime(), dateAfterOpening.getTime())).toISOString();
      }
    } catch (e) {
      console.error("잘못된 제조일자 형식:", manufacturingDateStr);
    }
  }

  // 유통기한을 계산할 수 없는 경우, 개봉 후 사용기한 기준 날짜를 반환
  return dateAfterOpening.toISOString();
};
