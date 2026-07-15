# PLAN-kanban-lich-xe.md

## Phase -1: Context Check

Repo hiện gần như trống, chỉ có file dữ liệu nguồn:

- `Lich Xe Tong Kho Cao Lanh.xlsx`
- Sheet `CHUYẾN XE 🚚`: lịch tuyến theo ngày/tuần, cột B-H là thứ trong tuần, I là xe ngoài, K là danh sách xe, L là tài xế.
- Sheet `DANH SÁCH CHI NHÁNH MƯỢN TỦ MÁT`: có danh sách chi nhánh có thể dùng làm nguồn dropdown.
- Các sheet theo tháng: dữ liệu lịch sử/công nợ, chưa phải nguồn chính cho app tuyến xe.

Mục tiêu: xây dựng web app kanban mobile-first để sắp xếp tuyến giao xe theo cấu trúc:

`Tuyến -> Chi nhánh 1, Chi nhánh 2... -> Tài xế -> Xe`

Ví dụ nghiệp vụ:

> Ngày 9/7: Tuyến trà ôn - tiểu cần - trà vinh, tài xế Thành + Tuấn, xe DOTHANH.

## Phase 0: Socratic Gate

### Câu hỏi cần xác nhận

1. Một tuyến có thể có nhiều xe không, hay mỗi tuyến chỉ gắn đúng 1 xe?
2. Một tài xế có thể chạy nhiều tuyến trong cùng ngày không?
3. Chi nhánh chỉ chọn từ danh sách cố định hay cho phép nhập nhanh chi nhánh mới?
4. App dùng một mình trên máy/điện thoại nội bộ hay cần nhiều người cùng cập nhật realtime?
5. Export Excel cần giữ format giống file cũ hay chỉ cần xuất dữ liệu sạch, dễ in?
6. Có cần phân quyền điều phối, tài xế, quản lý không?

### Giả định mặc định nếu chưa trả lời

- Mỗi tuyến có 1 xe chính, có thể có nhiều tài xế.
- Một tài xế/xe không nên bị trùng lịch trong cùng ngày; app sẽ cảnh báo thay vì chặn cứng.
- Chi nhánh chọn từ dropdown/search, có nút thêm nhanh khi thiếu chi nhánh.
- Giai đoạn đầu là single-user/local-first, chưa cần đăng nhập.
- Import Excel hỗ trợ đọc dữ liệu cũ; export ra `.xlsx` dạng dễ in và dễ chỉnh.
- UI ưu tiên điện thoại trước, desktop là bản mở rộng.

## Product Requirements

### Core

- Tạo lịch theo ngày.
- Tạo tuyến dạng kanban card.
- Mỗi card tuyến gồm:
  - Ngày giao
  - Tên tuyến
  - Danh sách chi nhánh theo thứ tự ghé
  - Tài xế
  - Xe
  - Ghi chú
  - Trạng thái
- Dropdown/search cho:
  - Chi nhánh
  - Tài xế
  - Xe
  - Trạng thái
- Kéo thả card giữa các cột trạng thái.
- Kéo sắp xếp thứ tự chi nhánh trong một tuyến.
- Cảnh báo trùng tài xế/xe cùng ngày.
- Import dữ liệu từ Excel hiện tại.
- Export lịch ngày/tuần/tháng ra Excel.

### Status Kanban đề xuất

- `Nháp`
- `Đã xếp tuyến`
- `Đang giao`
- `Hoàn tất`
- `Có vấn đề`

### Nice To Have

- Tìm kiếm theo chi nhánh/tài xế/xe.
- Lọc theo ngày, xe, tài xế.
- Copy lịch từ ngày trước.
- In lịch giao xe.
- Lưu lịch sử chỉnh sửa.

## UX / Mobile Design

### Nguyên tắc

- Mobile-first, thao tác một tay.
- Màn hình chính là lịch của ngày đang chọn.
- Không làm landing page; mở app là vào bảng điều phối.
- Dữ liệu dày nhưng dễ quét nhanh.
- Card tuyến phải đọc được trong vài giây: tuyến, tài xế, xe, số chi nhánh.

### Mobile Layout

- Top bar:
  - Date picker
  - Nút import/export
  - Search icon
- Filter row:
  - Xe
  - Tài xế
  - Trạng thái
- Kanban:
  - Horizontal swipe giữa các cột.
  - Card compact.
  - Bottom sheet để tạo/sửa tuyến.
- Route editor:
  - Tên tuyến
  - Branch multi-select có search
  - Danh sách chi nhánh reorder được
  - Driver multi-select
  - Vehicle select
  - Note
  - Save / Duplicate / Delete

### Desktop Layout

- Sidebar nhỏ cho ngày/tháng.
- Kanban nhiều cột cùng lúc.
- Panel phải để xem/sửa chi tiết tuyến.
- Import/export rõ ràng trên toolbar.

## Data Model

### Branch

- `id`
- `name`
- `normalizedName`
- `notes`
- `source`

### Driver

- `id`
- `name`
- `active`

Drivers ban đầu từ sheet `CHUYẾN XE 🚚`:

- Khang
- Nghị
- Vinh
- Thành
- Tuấn
- Nhựt
- Vương
- Phát
- Khải
- Phương

### Vehicle

- `id`
- `name`
- `type`
- `active`

Vehicles ban đầu từ sheet `CHUYẾN XE 🚚`:

- DOTHANH
- SU LỚN
- SU NHỎ
- KIA
- HINO

### Route

- `id`
- `date`
- `title`
- `branchIds[]`
- `driverIds[]`
- `vehicleId`
- `externalVehicle`
- `status`
- `notes`
- `sortOrder`
- `createdAt`
- `updatedAt`

### ScheduleDay

- `date`
- `routes[]`

## Recommended Tech Stack

Vì repo đang trống, đề xuất stack nhẹ, hiện đại, dễ triển khai:

- Framework: `Next.js`
- Language: `TypeScript`
- Styling: `Tailwind CSS`
- UI primitives: `shadcn/ui`
- Icons: `lucide-react`
- Drag/drop: `@dnd-kit`
- Excel import/export: `xlsx`
- Local persistence giai đoạn đầu: `IndexedDB` qua `Dexie`
- State: `Zustand`
- Validation: `Zod`
- Testing: `Vitest` + `Playwright`

Lý do: nhanh để làm MVP, mobile tốt, dễ nâng cấp lên database/API sau.

## Excel Import / Export Approach

### Import

1. Cho user upload `Lich Xe Tong Kho Cao Lanh.xlsx`.
2. Đọc workbook bằng `xlsx`.
3. Parse:
   - Sheet `CHUYẾN XE 🚚`
   - Sheet danh sách chi nhánh
   - Các sheet tháng nếu sau này cần dữ liệu lịch sử
4. Chuẩn hóa tên chi nhánh, tài xế, xe.
5. Detect route text dạng:
   - `Trà Ôn - Tiểu Cần - Trà Vinh`
   - `(Thành + Tuấn)`
   - `DOTHANH`
6. Hiển thị preview trước khi import.
7. Cho phép sửa lỗi mapping trước khi lưu.

### Export

- Export theo ngày/tuần/tháng.
- Cột đề xuất:
  - Ngày
  - Trạng thái
  - Tuyến
  - Chi nhánh
  - Tài xế
  - Xe
  - Xe ngoài
  - Ghi chú
- Có thêm sheet danh mục:
  - Branches
  - Drivers
  - Vehicles

## Implementation Phases / Tasks

### Phase 1: App Skeleton

- Khởi tạo Next.js + TypeScript.
- Thiết lập Tailwind/shadcn/lucide.
- Tạo layout mobile-first.
- Tạo navigation chính theo ngày.

### Phase 2: Core Data

- Định nghĩa schema TypeScript/Zod.
- Seed vehicles/drivers từ Excel context.
- Tạo local database bằng Dexie.
- CRUD branch/driver/vehicle/route.

### Phase 3: Kanban UI

- Tạo cột trạng thái.
- Tạo route card compact.
- Kéo thả route giữa status columns.
- Reorder route trong cùng cột.
- Bottom sheet/modal tạo và sửa route.

### Phase 4: Route Builder

- Dropdown searchable cho chi nhánh.
- Multi-select tài xế.
- Select xe.
- Reorder thứ tự chi nhánh.
- Validate trùng tài xế/xe theo ngày.

### Phase 5: Excel Import

- Upload workbook.
- Parse workbook.
- Mapping preview.
- Import confirmed data vào local DB.
- Báo lỗi dòng/sheet rõ ràng.

### Phase 6: Excel Export

- Export lịch ngày.
- Export lịch tuần/tháng.
- Format sheet dễ in.
- Kiểm tra tiếng Việt và emoji không lỗi encoding.

### Phase 7: Polish & QA

- Responsive mobile/desktop.
- Empty states.
- Loading/error states.
- Accessibility cơ bản.
- Playwright smoke tests.

## Agent Assignments

### project-planner

- Giữ scope, phase, checklist.
- Cập nhật plan khi yêu cầu nghiệp vụ thay đổi.

### frontend-ui agent

- Mobile kanban layout.
- Route card.
- Bottom sheet editor.
- Responsive desktop view.

### data-model agent

- Schema route/branch/driver/vehicle.
- Validation trùng lịch.
- Local DB structure.

### excel-import agent

- Workbook parsing.
- Mapping/normalization.
- Import preview.

### qa agent

- Test cases.
- Mobile viewport verification.
- Import/export verification.

## Risks

- Dữ liệu Excel không đồng nhất giữa các tháng.
- Tên chi nhánh viết tắt/sai dấu gây trùng hoặc sai mapping.
- Route text tự do khó parse 100% chính xác.
- Drag/drop trên mobile cần test kỹ để không khó dùng.
- Nếu nhiều người dùng cùng lúc, local-first sẽ không đủ; cần backend/realtime.
- Export giống file cũ có thể tốn thêm thời gian nếu format phức tạp.

## Verification Checklist

### Functional

- Tạo route mới thành công.
- Chọn nhiều chi nhánh theo đúng thứ tự.
- Chọn nhiều tài xế.
- Chọn xe.
- Kéo card đổi trạng thái.
- Kéo sắp xếp chi nhánh trong tuyến.
- Cảnh báo khi trùng tài xế cùng ngày.
- Cảnh báo khi trùng xe cùng ngày.
- Import Excel có preview.
- Export Excel mở được và đúng tiếng Việt.

### Mobile UX

- Dùng tốt ở viewport 375px.
- Không có text tràn card/button.
- Bottom sheet không che mất nút lưu.
- Dropdown/search dùng được bằng cảm ứng.
- Kanban swipe mượt, không nhầm với kéo card.

### Data Quality

- Drivers seed đúng:
  - Khang, Nghị, Vinh, Thành, Tuấn, Nhựt, Vương, Phát, Khải, Phương
- Vehicles seed đúng:
  - DOTHANH, SU LỚN, SU NHỎ, KIA, HINO
- Branch import không tạo trùng do khác hoa/thường hoặc dấu cách.
- Route ví dụ parse được:
  - Ngày: 9/7
  - Branches: trà ôn, tiểu cần, trà vinh
  - Drivers: Thành, Tuấn
  - Vehicle: DOTHANH

## Recommended Next Step

Bắt đầu bằng MVP local-first:

1. Skeleton app.
2. Kanban route CRUD.
3. Mobile route editor.
4. Import/export Excel.
5. Sau đó mới thêm backend/realtime nếu cần nhiều người cùng dùng.
