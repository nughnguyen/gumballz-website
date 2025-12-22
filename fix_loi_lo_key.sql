-- 1. Thêm cột token bảo mật vào bảng mod_keys (CẦN THIẾT)
ALTER TABLE mod_keys 
ADD COLUMN IF NOT EXISTS verification_token TEXT;

-- 2. Xóa toàn bộ key cũ để loại bỏ các link bị lộ (QUAN TRỌNG)
DELETE FROM mod_keys;

-- 3. (Tùy chọn) Tắt RLS cho bảng downloads nếu bạn chưa cấu hình Service Key thành công
-- ALTER TABLE downloads DISABLE ROW LEVEL SECURITY;
