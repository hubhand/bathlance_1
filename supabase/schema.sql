-- BATHLANCE 데이터베이스 스키마
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 제품(products) 테이블 생성
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk 사용자 ID
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('칫솔', '샴푸', '린스', '세안제', '바디워시', '수건', '면도기 헤드', '샤워볼', '샤워기 필터', '기타')),
  registration_date TIMESTAMPTZ NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  image_url TEXT NOT NULL, -- Data URL 저장
  manufacturing_date TIMESTAMPTZ,
  expiry_period_before_opening INTEGER, -- 개봉 전 유효기간 (개월)
  period_after_opening INTEGER, -- 개봉 후 사용기한 (개월)
  ingredient_analysis JSONB, -- 성분 분석 결과 배열
  review TEXT, -- 간단 후기
  has_trouble BOOLEAN DEFAULT FALSE, -- 트러블 발생 여부
  stock INTEGER DEFAULT 1, -- 재고 수량
  display_order INTEGER DEFAULT 0, -- 드래그 앤 드롭 순서
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 쇼핑 리스트(shopping_list) 테이블 생성
CREATE TABLE IF NOT EXISTS shopping_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk 사용자 ID
  name TEXT NOT NULL,
  checked BOOLEAN DEFAULT FALSE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- 제품과 연결 (선택사항)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 샤워 일기(diary_entries) 테이블 생성
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk 사용자 ID
  content TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 트러블 이력(trouble_history) 테이블 생성
-- 제품을 삭제해도 트러블 이력은 남아있도록 별도 테이블에 저장
CREATE TABLE IF NOT EXISTS trouble_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk 사용자 ID
  product_name TEXT NOT NULL, -- 제품 이름
  category TEXT NOT NULL CHECK (category IN ('칫솔', '샴푸', '린스', '세안제', '바디워시', '수건', '면도기 헤드', '샤워볼', '샤워기 필터', '기타')),
  ingredient_analysis JSONB, -- AI 성분 분석 결과 배열
  review TEXT, -- 사용자가 남긴 후기
  product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- 원본 제품 ID (제품 삭제 시 NULL로 변경)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id_order ON products(user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_shopping_list_user_id ON shopping_list(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date ON diary_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_trouble_history_user_id ON trouble_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trouble_history_user_name ON trouble_history(user_id, product_name);

-- 6. Row Level Security (RLS) 정책 설정
-- ⚠️ 중요: 이 정책들은 Clerk를 Supabase의 third-party auth provider로 설정한 후에만 작동합니다.
-- Clerk Dashboard에서 Supabase 통합을 활성화하고, Supabase Dashboard에서 Clerk를 third-party auth provider로 추가해야 합니다.
-- 자세한 내용은 CLERK_SUPABASE_INTEGRATION.md 문서를 참고하세요.

-- 모든 테이블에 RLS 활성화
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE trouble_history ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책: 사용자는 자신의 데이터만 조회/수정/삭제 가능
-- Clerk session token의 'sub' 클레임이 user_id와 일치하는 경우에만 접근 허용

-- products 테이블
CREATE POLICY "사용자는 자신의 제품만 조회 가능"
  ON products FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "사용자는 자신의 제품만 생성 가능"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "사용자는 자신의 제품만 수정 가능"
  ON products FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "사용자는 자신의 제품만 삭제 가능"
  ON products FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id);

-- shopping_list 테이블
CREATE POLICY "사용자는 자신의 쇼핑 리스트만 조회 가능"
  ON shopping_list FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "사용자는 자신의 쇼핑 리스트만 생성 가능"
  ON shopping_list FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "사용자는 자신의 쇼핑 리스트만 수정 가능"
  ON shopping_list FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "사용자는 자신의 쇼핑 리스트만 삭제 가능"
  ON shopping_list FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id);

-- diary_entries 테이블
CREATE POLICY "사용자는 자신의 일기만 조회 가능"
  ON diary_entries FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "사용자는 자신의 일기만 생성 가능"
  ON diary_entries FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "사용자는 자신의 일기만 수정 가능"
  ON diary_entries FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "사용자는 자신의 일기만 삭제 가능"
  ON diary_entries FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id);

-- trouble_history 테이블
CREATE POLICY "사용자는 자신의 트러블 이력만 조회 가능"
  ON trouble_history FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "사용자는 자신의 트러블 이력만 생성 가능"
  ON trouble_history FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "사용자는 자신의 트러블 이력만 수정 가능"
  ON trouble_history FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "사용자는 자신의 트러블 이력만 삭제 가능"
  ON trouble_history FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id);

-- 8. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. updated_at 트리거 생성
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_list_updated_at BEFORE UPDATE ON shopping_list
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trouble_history_updated_at BEFORE UPDATE ON trouble_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

