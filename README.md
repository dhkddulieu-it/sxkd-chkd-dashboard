# SXKD + CHKD Integrated Command Center

## Kiến trúc
- 01–05: SXKD tổng hợp.
- 06–07: Cơ hội kinh doanh.
- 08_BRIDGE: lớp liên kết Năm × Tháng × SPDV × Địa bàn × Đơn vị.
- 09_EXEC_KPI: KPI điều hành.

## Logic quan trọng
1. Tính Gap = Forecast SXKD - Kế hoạch.
2. Nếu Gap âm, lấy CHKD có tháng dự kiến chốt tương ứng.
3. Weighted Pipeline = Giá trị cơ hội × Xác suất.
4. Coverage = Weighted Pipeline / phần thiếu kế hoạch.
5. Cảnh báo Đỏ khi forecast thấp và pipeline có trọng số không đủ bù.

## Dashboard
- KH / TH / Forecast.
- Gap và khả năng bù Gap bằng CHKD.
- Pipeline theo giai đoạn.
- Pipeline đứng yên theo Owner.
- Top điểm cần can thiệp.
- Top CHKD ưu tiên để bù Gap.

## Nối Google Sheets
Import workbook → Apps Script → dán Code.gs → deploy Web App → điền URL /exec vào config.js → deploy GitHub Pages.
