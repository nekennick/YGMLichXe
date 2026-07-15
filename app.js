const STORAGE_KEY = "yagami-lich-xe-v1";

const defaultDrivers = [
  "Khang",
  "Nghị",
  "Vinh",
  "Thành",
  "Tuấn",
  "Nhựt",
  "Vương",
  "Phát",
  "Khải",
  "Phương",
];

const defaultVehicles = ["DOTHANH", "SU LỚN", "SU NHỎ", "KIA", "HINO"];

const defaultBranches = [
  "Thanh Bình",
  "Thạnh Phú",
  "Long Xuyên",
  "Thốt Nốt",
  "Cà Mau",
  "Kho BD (Hàng Đông)",
  "Kho BD (Súp)",
  "Cái Tàu",
  "An Long",
  "Ba Tri",
  "Rạch Giá",
  "Lấp Vò",
  "Phước Long",
  "Kiến Tường",
  "Hòa Phú",
  "Hồng Ngự",
  "Bình Đại",
  "Kiên Lương",
  "Cờ Đỏ",
  "Năm Căn",
  "Thạnh Hoá",
  "Lai Vung",
  "Tân Hồng",
  "Mỏ Cày",
  "Tri Tôn",
  "Vị Thanh",
  "Giá Rai",
  "Đức Huệ",
  "Đại Học",
  "Tam Nông",
  "Cái Bè",
  "Thoại Sơn",
  "Thới Lai",
  "Sông Đốc",
  "Tân Thạnh",
  "Tân Hưng",
  "Cai Lậy",
  "Nhà Bàng",
  "Một Ngàn",
  "Đầm Dơi",
  "Tháp Mười",
  "Vĩnh Hưng",
  "Mỹ Tho",
  "Hòn Đất",
  "Trung An",
  "Thới Bình",
  "Trường Xuân",
  "An Phong",
  "Chợ Gạo",
  "An Châu",
  "Ô Môn",
  "Ngan Dừa",
  "Phú Tân",
  "Tân Bình",
  "Bình Minh",
  "Vĩnh Bình",
  "Tân Hiệp",
  "Nàng Mau",
  "Cái Nước",
  "Chợ Mới",
  "Tân Thành",
  "Bình Tân",
  "Gò Công",
  "Phú Hòa",
  "Phong Điền",
  "An Biên",
  "Mỹ Luông",
  "Phú Quốc",
  "Tam Bình",
  "Gò Đen",
  "An Phú",
  "Tiểu Cần",
  "Vĩnh Thuận",
  "Long Mỹ",
  "Cao Lãnh",
  "Vĩnh Long",
  "Cần Đước",
  "Châu Phú",
  "Trà Ôn",
  "Ngã 7",
  "Ngã 5 Sóc Trăng",
  "Chiba Cao Lãnh",
  "Kế Sách",
  "Tân An",
  "Quốc Thái",
  "Kho Trà Vinh",
  "Cái Tắc",
  "Phú Lộc",
  "Mái Dầm",
  "Tân Hương",
  "Gò Quao",
  "TP Cần Thơ",
  "Châu Thành - Sóc Trăng",
  "Hòa Bình",
  "Ngã 6",
  "Chợ Lách",
  "Giồng Riềng",
  "Trần Văn Thời",
  "Bạc Liêu",
  "Long Phú",
  "Giồng Trôm",
  "Rạch Sỏi",
  "T.T Thứ 11",
  "Chợ Vàm",
  "Vĩnh Châu",
  "Châu Đốc",
  "Hà Tiên",
  "Tắc Vân",
  "Cần Thơ",
  "Trà Vinh",
  "Ba Chúc",
];

const starterRoutes = [
  createRoute({
    date: "2026-07-09",
    title: "Trà Ôn - Tiểu Cần - Trà Vinh",
    branches: ["Trà Ôn", "Tiểu Cần", "Trà Vinh"],
    driverIds: ["Thành", "Tuấn"],
    vehicleId: "DOTHANH",
  }),
  createRoute({
    date: "2026-07-09",
    title: "Cờ Đỏ - Vị Thanh - Một Ngàn - Thới Lai - Ô Môn - Thốt Nốt",
    branches: ["Cờ Đỏ", "Vị Thanh", "Một Ngàn", "Thới Lai", "Ô Môn", "Thốt Nốt"],
    driverIds: ["Nhựt", "Khải"],
    vehicleId: "HINO",
  }),
  createRoute({
    date: "2026-07-09",
    title: "Khai trương Ba Chúc",
    branches: ["Ba Chúc"],
    driverIds: ["Khang", "Nghị"],
    vehicleId: "SU LỚN",
  }),
  createRoute({
    date: "2026-07-09",
    title: "Cần Thơ - Phong Điền",
    branches: ["Cần Thơ", "Phong Điền"],
    driverIds: ["Vinh", "Vương"],
    vehicleId: "SU NHỎ",
  }),
  createRoute({
    date: "2026-07-09",
    title: "Trung An - Lấp Vò",
    branches: ["Trung An", "Lấp Vò"],
    driverIds: ["Phương", "Phát"],
    vehicleId: "KIA",
  }),
];

let state = loadState();
let selectedDate = localStorage.getItem("yagami-selected-date") || "2026-07-09";
let editingBranches = [];
let pointerDrag = null;
let suppressNextClick = false;
let activeDropTarget = null;
let activeDropPosition = null;
let branchSuggestionIndex = 0;

const el = {
  board: document.querySelector("#board"),
  dateFilter: document.querySelector("#dateFilter"),
  searchInput: document.querySelector("#searchInput"),
  vehicleFilter: document.querySelector("#vehicleFilter"),
  driverFilter: document.querySelector("#driverFilter"),
  prevDayBtn: document.querySelector("#prevDayBtn"),
  nextDayBtn: document.querySelector("#nextDayBtn"),
  newRouteBtn: document.querySelector("#newRouteBtn"),
  manageBranchesBtn: document.querySelector("#manageBranchesBtn"),
  importBtn: document.querySelector("#importBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  sheetBackdrop: document.querySelector("#sheetBackdrop"),
  routeSheet: document.querySelector("#routeSheet"),
  routeForm: document.querySelector("#routeForm"),
  sheetTitle: document.querySelector("#sheetTitle"),
  closeSheetBtn: document.querySelector("#closeSheetBtn"),
  routeId: document.querySelector("#routeId"),
  routeDate: document.querySelector("#routeDate"),
  routeTitle: document.querySelector("#routeTitle"),
  routeVehicle: document.querySelector("#routeVehicle"),
  branchSearch: document.querySelector("#branchSearch"),
  branchSuggestions: document.querySelector("#branchSuggestions"),
  addBranchBtn: document.querySelector("#addBranchBtn"),
  selectedBranches: document.querySelector("#selectedBranches"),
  branchCount: document.querySelector("#branchCount"),
  driverChecks: document.querySelector("#driverChecks"),
  conflictBox: document.querySelector("#conflictBox"),
  deleteRouteBtn: document.querySelector("#deleteRouteBtn"),
  duplicateRouteBtn: document.querySelector("#duplicateRouteBtn"),
  branchManagerDialog: document.querySelector("#branchManagerDialog"),
  newBranchName: document.querySelector("#newBranchName"),
  addBranchToCatalogBtn: document.querySelector("#addBranchToCatalogBtn"),
  branchCatalogSearch: document.querySelector("#branchCatalogSearch"),
  branchCatalogList: document.querySelector("#branchCatalogList"),
  importDialog: document.querySelector("#importDialog"),
  importText: document.querySelector("#importText"),
  confirmImportBtn: document.querySelector("#confirmImportBtn"),
};

init();

function init() {
  el.dateFilter.value = selectedDate;
  populateStaticControls();
  bindEvents();
  render();
}

function createRoute(route) {
  const now = new Date().toISOString();
  return {
    id: route.id || newId(),
    date: route.date,
    title: route.title,
    branches: route.branches || [],
    driverIds: route.driverIds || [],
    vehicleId: route.vehicleId || "",
    sortOrder: route.sortOrder || Date.now(),
    createdAt: route.createdAt || now,
    updatedAt: now,
  };
}

function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `route-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return {
    branches: normalizeList(defaultBranches),
    drivers: normalizeList(defaultDrivers),
    vehicles: normalizeList(defaultVehicles),
    routes: starterRoutes,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem("yagami-selected-date", selectedDate);
}

function bindEvents() {
  el.dateFilter.addEventListener("change", () => {
    selectedDate = el.dateFilter.value;
    saveState();
    render();
  });

  el.prevDayBtn.addEventListener("click", () => shiftDay(-1));
  el.nextDayBtn.addEventListener("click", () => shiftDay(1));
  el.searchInput.addEventListener("input", render);
  el.vehicleFilter.addEventListener("change", render);
  el.driverFilter.addEventListener("change", render);
  el.newRouteBtn.addEventListener("click", () => openRouteSheet());
  el.manageBranchesBtn.addEventListener("click", openBranchManager);
  el.closeSheetBtn.addEventListener("click", closeRouteSheet);
  el.sheetBackdrop.addEventListener("click", closeRouteSheet);
  el.addBranchBtn.addEventListener("click", addBranchFromInput);
  el.branchSearch.addEventListener("input", () => {
    branchSuggestionIndex = 0;
    renderBranchSuggestions();
  });
  el.branchSearch.addEventListener("focus", renderBranchSuggestions);
  el.branchSearch.addEventListener("keydown", (event) => {
    if (handleBranchSuggestionKey(event)) return;
    if (event.key === "Enter") {
      event.preventDefault();
      addBranchFromInput();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".branch-input-wrap")) hideBranchSuggestions();
  });
  el.routeForm.addEventListener("submit", saveRouteFromForm);
  el.deleteRouteBtn.addEventListener("click", deleteCurrentRoute);
  el.duplicateRouteBtn.addEventListener("click", duplicateCurrentRoute);
  el.addBranchToCatalogBtn.addEventListener("click", addBranchToCatalog);
  el.newBranchName.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addBranchToCatalog();
    }
  });
  el.branchCatalogSearch.addEventListener("input", renderBranchCatalog);
  el.branchCatalogList.addEventListener("click", handleBranchCatalogAction);
  el.importBtn.addEventListener("click", openImportDialog);
  el.confirmImportBtn.addEventListener("click", importRoutesFromText);
  el.exportBtn.addEventListener("click", exportCsv);
  el.routeDate.addEventListener("change", updateConflictPreview);
  el.routeVehicle.addEventListener("change", updateConflictPreview);
  el.driverChecks.addEventListener("change", updateConflictPreview);
}

function populateStaticControls() {
  populateFilters();
  populateEditorLists();
}

function populateFilters() {
  el.vehicleFilter.innerHTML = option("", "Tất cả xe") + state.vehicles.map((vehicle) => option(vehicle, vehicle)).join("");
  el.driverFilter.innerHTML = option("", "Tất cả tài xế") + state.drivers.map((driver) => option(driver, driver)).join("");
}

function populateEditorLists() {
  el.routeVehicle.innerHTML = option("", "Chọn xe") + state.vehicles.map((vehicle) => option(vehicle, vehicle)).join("");
  populateBranchOptions();
  el.driverChecks.innerHTML = state.drivers
    .map(
      (driver) => `
        <label class="check-pill">
          <input type="checkbox" name="drivers" value="${escapeHtml(driver)}" />
          ${escapeHtml(driver)}
        </label>
      `,
    )
    .join("");
}

function populateBranchOptions() {
  renderBranchSuggestions();
}

function openBranchManager() {
  el.newBranchName.value = "";
  el.branchCatalogSearch.value = "";
  renderBranchCatalog();
  el.branchManagerDialog.showModal();
  setTimeout(() => el.newBranchName.focus(), 20);
}

function renderBranchCatalog() {
  const query = normalizeText(el.branchCatalogSearch.value);
  const branches = state.branches
    .filter((branch) => !query || normalizeText(branch).includes(query))
    .sort((a, b) => a.localeCompare(b, "vi"));

  el.branchCatalogList.innerHTML = branches.length
    ? branches
        .map(
          (branch) => `
            <div class="manager-row" data-branch="${escapeHtml(branch)}">
              <input class="manager-branch-input" value="${escapeHtml(branch)}" aria-label="Tên chi nhánh" />
              <button type="button" class="manager-icon-button save" data-branch-action="save" aria-label="Lưu chi nhánh">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
              </button>
              <button type="button" class="manager-icon-button delete" data-branch-action="delete" aria-label="Xóa chi nhánh">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
          `,
        )
        .join("")
    : `<div class="empty-column">Không có chi nhánh phù hợp</div>`;
}

function addBranchToCatalog() {
  const branches = parseBranchInput(el.newBranchName.value);
  if (!branches.length) return;

  let added = 0;
  branches.forEach((branch) => {
    const before = state.branches.length;
    ensureInList(state.branches, branch);
    if (state.branches.length > before) added += 1;
  });

  el.newBranchName.value = "";
  saveState();
  populateBranchOptions();
  renderBranchCatalog();
  if (!added) {
    alert("Chi nhánh này đã có trong danh mục.");
  }
}

function handleBranchCatalogAction(event) {
  const actionButton = event.target.closest("[data-branch-action]");
  const action = actionButton?.dataset.branchAction;
  if (!actionButton || !action) return;
  const row = actionButton.closest(".manager-row");
  const oldName = row?.dataset.branch;
  const input = row?.querySelector(".manager-branch-input");
  if (!oldName || !input) return;

  if (action === "save") {
    renameBranchInCatalog(oldName, input.value);
  }

  if (action === "delete") {
    deleteBranchFromCatalog(oldName);
  }
}

function renameBranchInCatalog(oldName, nextName) {
  const cleanName = toTitleCase(String(nextName || "").trim());
  if (!cleanName) {
    alert("Tên chi nhánh không được để trống.");
    return;
  }

  const duplicate = state.branches.some(
    (branch) => normalizeText(branch) === normalizeText(cleanName) && normalizeText(branch) !== normalizeText(oldName),
  );
  if (duplicate) {
    alert("Tên chi nhánh này đã có trong danh mục.");
    return;
  }

  state.branches = state.branches
    .map((branch) => (normalizeText(branch) === normalizeText(oldName) ? cleanName : branch))
    .sort((a, b) => a.localeCompare(b, "vi"));

  state.routes.forEach((route) => {
    route.branches = route.branches.map((branch) =>
      normalizeText(branch) === normalizeText(oldName) ? cleanName : branch,
    );
    route.title = route.branches.join(" - ");
  });

  editingBranches = editingBranches.map((branch) =>
    normalizeText(branch) === normalizeText(oldName) ? cleanName : branch,
  );

  saveState();
  populateBranchOptions();
  renderSelectedBranches();
  renderBranchCatalog();
  render();
}

function deleteBranchFromCatalog(branchName) {
  const usedCount = state.routes.filter((route) =>
    route.branches.some((branch) => normalizeText(branch) === normalizeText(branchName)),
  ).length;
  const message = usedCount
    ? `"${branchName}" đang có trong ${usedCount} tuyến. Xóa khỏi danh mục gợi ý thôi, lịch đã tạo vẫn giữ nguyên. Tiếp tục?`
    : `Xóa "${branchName}" khỏi danh mục chi nhánh?`;

  if (!confirm(message)) return;

  state.branches = state.branches.filter((branch) => normalizeText(branch) !== normalizeText(branchName));
  saveState();
  populateBranchOptions();
  renderBranchCatalog();
}

function render() {
  const routes = getFilteredRoutes();
  renderBoard(routes);
}

function getFilteredRoutes() {
  const query = normalizeText(el.searchInput.value);
  const vehicle = el.vehicleFilter.value;
  const driver = el.driverFilter.value;

  return state.routes
    .filter((route) => route.date === selectedDate)
    .filter((route) => !vehicle || route.vehicleId === vehicle)
    .filter((route) => !driver || route.driverIds.includes(driver))
    .filter((route) => {
      if (!query) return true;
      const haystack = normalizeText([
        route.title,
        route.vehicleId,
        route.branches.join(" "),
        route.driverIds.join(" "),
      ].join(" "));
      return haystack.includes(query);
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function renderBoard(routes) {
  el.board.innerHTML = `
    <section class="route-table-panel">
      <header class="route-table-header">
        <div>
          <p class="eyebrow">Lịch tuyến</p>
          <h2>${formatDisplayDate(selectedDate)}</h2>
        </div>
        <span>${routes.length} tuyến</span>
      </header>
      <div class="route-table" role="table" aria-label="Tuyến xe">
        <div class="route-table-head" role="row">
          <span>Tuyến</span>
          <span>Chi nhánh</span>
          <span>Tài xế</span>
          <span>Xe</span>
        </div>
        ${routes.length ? routes.map((route, index) => routeRow(route, index)).join("") : `<div class="empty-column">Ngày này chưa có tuyến. Anh bấm "Thêm tuyến" hoặc nhập nhanh từ nội dung.</div>`}
      </div>
    </section>
  `;

  document.querySelectorAll(".route-row").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }
      if (event.target.closest(".branch-token, .route-drag-handle")) return;
      openRouteSheet(row.dataset.routeId);
    });
  });

  document.querySelectorAll(".route-drag-handle").forEach((handle) => {
    handle.addEventListener("click", (event) => event.stopPropagation());
    handle.addEventListener("pointerdown", (event) => {
      const row = handle.closest(".route-row");
      startPointerDrag({
        type: "route",
        sourceId: handle.dataset.routeId,
        sourceEl: handle,
        dragEl: row,
        immediate: true,
        event,
      });
      event.stopPropagation();
    });
  });

  document.querySelectorAll(".branch-token").forEach((token) => {
    token.addEventListener("click", (event) => event.stopPropagation());
    token.addEventListener("pointerdown", (event) => {
      startPointerDrag({
        type: "branch",
        routeId: token.dataset.routeId,
        sourceIndex: Number(token.dataset.branchIndex),
        sourceEl: token,
        event,
      });
      event.stopPropagation();
    });
    token.addEventListener("pointermove", (event) => {
      activatePointerDrag(event);
      event.stopPropagation();
    });
    token.addEventListener("pointerup", (event) => {
      finishPointerDrag(event);
      event.stopPropagation();
    });
    token.addEventListener("pointercancel", clearPointerDrag);
  });
}

function startPointerDrag({ type, sourceId, routeId, sourceIndex, sourceEl, dragEl, immediate = false, event }) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  clearPointerDrag();

  pointerDrag = {
    type,
    sourceId,
    routeId,
    sourceIndex,
    sourceEl,
    dragEl: dragEl || sourceEl,
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY,
    pointerId: event.pointerId,
    active: false,
    pressTimer: immediate ? null : window.setTimeout(() => beginPointerDrag(), 280),
  };

  sourceEl.classList.add("is-pressing");
  document.addEventListener("pointermove", activatePointerDrag, { passive: false });
  document.addEventListener("pointerup", finishPointerDrag, { passive: false });
  document.addEventListener("pointercancel", clearPointerDrag);
  if (immediate) {
    beginPointerDrag();
  }
}

function beginPointerDrag() {
  if (!pointerDrag || pointerDrag.active) return;
  pointerDrag.active = true;
  suppressNextClick = true;
  pointerDrag.sourceEl.classList.remove("is-pressing");
  pointerDrag.dragEl.classList.add("is-dragging");
  pointerDrag.sourceEl.setPointerCapture?.(pointerDrag.pointerId);
  document.body.classList.add("is-pointer-dragging");
  pointerDrag.ghost = createDragGhost(pointerDrag);
  updateDragGhost(pointerDrag.currentX, pointerDrag.currentY);
}

function activatePointerDrag(event) {
  if (!pointerDrag) return;
  pointerDrag.currentX = event.clientX;
  pointerDrag.currentY = event.clientY;
  const distance = Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY);

  if (!pointerDrag.active && distance > 12) {
    clearPointerDrag();
    return;
  }

  if (!pointerDrag.active) return;
  event.preventDefault();
  updateDragGhost(event.clientX, event.clientY);
  updateDropTarget(event.clientX, event.clientY);
}

function finishPointerDrag(event) {
  if (!pointerDrag) return;
  const drag = pointerDrag;
  if (!drag.active) {
    clearPointerDrag();
    return;
  }

  event.preventDefault();
  if (!drag.active) return;

  const target = document.elementFromPoint(event.clientX, event.clientY);
  const dropTarget = activeDropTarget;
  const dropPosition = activeDropPosition;
  clearPointerDrag();
  if (drag.type === "route") {
    const targetRow = dropTarget || target?.closest(".route-row");
    if (targetRow && targetRow.dataset.routeId !== drag.sourceId) {
      moveRouteToPosition(drag.sourceId, targetRow.dataset.routeId, dropPosition || "before");
    }
  }

  if (drag.type === "branch") {
    const targetBranch = dropTarget || target?.closest(".branch-token");
    if (targetBranch && targetBranch.dataset.routeId === drag.routeId) {
      moveBranchToPosition(
        drag.routeId,
        drag.sourceIndex,
        Number(targetBranch.dataset.branchIndex),
        dropPosition || "before",
      );
    }
  }
}

function clearPointerDrag() {
  if (pointerDrag?.pressTimer) {
    window.clearTimeout(pointerDrag.pressTimer);
  }
  pointerDrag?.sourceEl?.classList.remove("is-pressing");
  pointerDrag?.dragEl?.classList.remove("is-dragging");
  pointerDrag?.ghost?.remove();
  pointerDrag = null;
  clearDropTarget();
  document.removeEventListener("pointermove", activatePointerDrag);
  document.removeEventListener("pointerup", finishPointerDrag);
  document.removeEventListener("pointercancel", clearPointerDrag);
  document.body.classList.remove("is-pointer-dragging");
}

function createDragGhost(drag) {
  const ghost = drag.dragEl.cloneNode(true);
  ghost.classList.add("drag-ghost");
  if (drag.type === "route") {
    ghost.classList.add("route-drag-ghost");
  }
  ghost.removeAttribute("id");
  const rect = drag.dragEl.getBoundingClientRect();
  const computed = getComputedStyle(drag.dragEl);
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.style.gridTemplateColumns = computed.gridTemplateColumns;
  ghost.style.minWidth = `${rect.width}px`;
  document.body.appendChild(ghost);
  return ghost;
}

function updateDragGhost(x, y) {
  if (!pointerDrag?.ghost) return;
  pointerDrag.ghost.style.transform = `translate3d(${x + 12}px, ${y + 12}px, 0)`;
}

function updateDropTarget(x, y) {
  if (!pointerDrag) return;
  const target = document.elementFromPoint(x, y);
  let nextTarget = null;
  let nextPosition = null;

  if (pointerDrag.type === "route") {
    nextTarget = target?.closest(".route-row");
    if (nextTarget?.dataset.routeId === pointerDrag.sourceId) nextTarget = null;
    if (nextTarget) {
      const rect = nextTarget.getBoundingClientRect();
      nextPosition = y < rect.top + rect.height / 2 ? "before" : "after";
    }
  }

  if (pointerDrag.type === "branch") {
    nextTarget = target?.closest(".branch-token");
    if (nextTarget?.dataset.routeId !== pointerDrag.routeId) nextTarget = null;
    if (Number(nextTarget?.dataset.branchIndex) === pointerDrag.sourceIndex) nextTarget = null;
    if (nextTarget) {
      const rect = nextTarget.getBoundingClientRect();
      nextPosition = x < rect.left + rect.width / 2 ? "before" : "after";
    }
  }

  if (activeDropTarget === nextTarget && activeDropPosition === nextPosition) return;
  clearDropTarget();
  activeDropTarget = nextTarget;
  activeDropPosition = nextPosition;
  if (activeDropTarget) {
    activeDropTarget.classList.add("is-drop-target", `drop-${activeDropPosition}`);
  }
}

function clearDropTarget() {
  activeDropTarget?.classList.remove("is-drop-target", "drop-before", "drop-after");
  activeDropTarget = null;
  activeDropPosition = null;
}

function routeRow(route, index) {
  const conflicts = getConflicts(route);
  const branches = route.branches.length
    ? route.branches
        .map(
          (branch, branchIndex) =>
            `<span class="branch-token" data-route-id="${route.id}" data-branch-index="${branchIndex}">${escapeHtml(branch)}</span>`,
        )
        .join("")
    : `<span class="branch-empty">Chưa chọn chi nhánh</span>`;
  const drivers = route.driverIds.length ? route.driverIds.join(" + ") : "Chưa chọn tài xế";
  const vehicle = route.vehicleId || "Chưa chọn xe";

  return `
    <div class="route-row ${conflicts.length ? "has-warning" : ""}" data-route-id="${route.id}" role="row" title="Nhấn giữ để kéo thả, bấm để sửa">
      <div class="route-cell route-name" data-label="Tuyến">
        <button type="button" class="route-drag-handle" data-route-id="${route.id}" aria-label="Kéo để đổi thứ tự tuyến">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" />
          </svg>
        </button>
        <strong>Tuyến ${index + 1}</strong>
        ${conflicts.length ? `<small>${escapeHtml(conflicts[0])}</small>` : ""}
      </div>
      <div class="route-cell branch-cell" data-label="Chi nhánh">${branches}</div>
      <div class="route-cell" data-label="Tài xế">${escapeHtml(drivers)}</div>
      <div class="route-cell vehicle-cell" data-label="Xe">${escapeHtml(vehicle)}</div>
    </div>
  `;
}

function moveRouteToPosition(sourceId, targetId, position) {
  const dayRoutes = state.routes
    .filter((route) => route.date === selectedDate)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const sourceIndex = dayRoutes.findIndex((route) => route.id === sourceId);
  const targetIndex = dayRoutes.findIndex((route) => route.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;

  const [source] = dayRoutes.splice(sourceIndex, 1);
  const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  const insertIndex = adjustedTargetIndex + (position === "after" ? 1 : 0);
  dayRoutes.splice(insertIndex, 0, source);
  resequenceRoutes(dayRoutes);
  saveState();
  render();
}

function resequenceRoutes(routes) {
  const base = Date.now();
  routes.forEach((route, index) => {
    route.sortOrder = base + index;
    route.updatedAt = new Date().toISOString();
  });
}

function moveBranchToPosition(routeId, sourceIndex, targetIndex, position) {
  const route = state.routes.find((item) => item.id === routeId);
  if (!route || sourceIndex === targetIndex) return;
  const [branch] = route.branches.splice(sourceIndex, 1);
  const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  const insertIndex = adjustedTargetIndex + (position === "after" ? 1 : 0);
  route.branches.splice(insertIndex, 0, branch);
  route.title = route.branches.join(" - ");
  route.updatedAt = new Date().toISOString();
  saveState();
  render();
}

function openRouteSheet(routeId = null) {
  const route = routeId ? state.routes.find((item) => item.id === routeId) : null;
  el.sheetTitle.textContent = route ? "Sửa tuyến" : "Thêm tuyến";
  el.routeId.value = route?.id || "";
  el.routeDate.value = route?.date || selectedDate;
  el.routeTitle.value = route?.title || "";
  el.routeVehicle.value = route?.vehicleId || "";
  editingBranches = [...(route?.branches || [])];

  document.querySelectorAll("input[name='drivers']").forEach((checkbox) => {
    checkbox.checked = route?.driverIds.includes(checkbox.value) || false;
  });

  el.deleteRouteBtn.hidden = !route;
  el.duplicateRouteBtn.hidden = !route;
  renderSelectedBranches();
  updateConflictPreview();
  el.sheetBackdrop.hidden = false;
  el.routeSheet.hidden = false;
  setTimeout(() => el.branchSearch.focus(), 20);
}

function closeRouteSheet() {
  el.routeSheet.hidden = true;
  el.sheetBackdrop.hidden = true;
  el.routeForm.reset();
  editingBranches = [];
}

function renderSelectedBranches() {
  el.branchCount.textContent = `${editingBranches.length} điểm`;
  el.selectedBranches.innerHTML = editingBranches.length
    ? editingBranches
        .map(
          (branch, index) => `
            <div class="branch-chip">
              <span>${index + 1}. ${escapeHtml(branch)}</span>
              <button type="button" class="chip-button" aria-label="Đưa lên" data-branch-up="${index}">↑</button>
              <button type="button" class="chip-button" aria-label="Đưa xuống" data-branch-down="${index}">↓</button>
              <button type="button" class="chip-button" aria-label="Xóa chi nhánh" data-branch-remove="${index}">×</button>
            </div>
          `,
        )
        .join("")
    : `<div class="empty-column">Thêm chi nhánh để tạo tuyến</div>`;

  document.querySelectorAll("[data-branch-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      editingBranches.splice(Number(button.dataset.branchRemove), 1);
      renderSelectedBranches();
      updateTitleFromBranches();
    });
  });

  document.querySelectorAll("[data-branch-up]").forEach((button) => {
    button.addEventListener("click", () => moveBranch(Number(button.dataset.branchUp), -1));
  });

  document.querySelectorAll("[data-branch-down]").forEach((button) => {
    button.addEventListener("click", () => moveBranch(Number(button.dataset.branchDown), 1));
  });
}

function addBranchFromInput() {
  const branches = parseBranchInput(el.branchSearch.value);
  if (!branches.length) return;

  branches.forEach((branch) => {
    editingBranches.push(branch);
    ensureInList(state.branches, branch);
  });
  populateBranchOptions();
  el.branchSearch.value = "";
  renderSelectedBranches();
  updateTitleFromBranches();
  saveState();
}

function renderBranchSuggestions() {
  const segment = getCurrentBranchSegment(el.branchSearch.value);
  const query = normalizeText(segment.query);
  const usedBranches = new Set(parseBranchInput(segment.prefix).map((branch) => normalizeText(branch)));

  if (!query) {
    hideBranchSuggestions();
    return;
  }

  const suggestions = state.branches
    .filter((branch) => normalizeText(branch).includes(query))
    .filter((branch) => !usedBranches.has(normalizeText(branch)))
    .slice(0, 7);

  if (!suggestions.length) {
    hideBranchSuggestions();
    return;
  }

  branchSuggestionIndex = Math.min(branchSuggestionIndex, suggestions.length - 1);
  el.branchSuggestions.innerHTML = suggestions
    .map(
      (branch, index) => `
        <button type="button" class="branch-suggestion ${index === branchSuggestionIndex ? "is-active" : ""}" data-branch="${escapeHtml(branch)}" role="option" aria-selected="${index === branchSuggestionIndex}">
          ${escapeHtml(branch)}
        </button>
      `,
    )
    .join("");
  el.branchSuggestions.hidden = false;

  el.branchSuggestions.querySelectorAll(".branch-suggestion").forEach((button, index) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      branchSuggestionIndex = index;
      applyBranchSuggestion(button.dataset.branch);
    });
  });
}

function handleBranchSuggestionKey(event) {
  if (el.branchSuggestions.hidden) return false;
  const items = [...el.branchSuggestions.querySelectorAll(".branch-suggestion")];
  if (!items.length) return false;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    branchSuggestionIndex = (branchSuggestionIndex + 1) % items.length;
    renderBranchSuggestions();
    return true;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    branchSuggestionIndex = (branchSuggestionIndex - 1 + items.length) % items.length;
    renderBranchSuggestions();
    return true;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    applyBranchSuggestion(items[branchSuggestionIndex]?.dataset.branch);
    return true;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    hideBranchSuggestions();
    return true;
  }

  return false;
}

function applyBranchSuggestion(branch) {
  if (!branch) return;
  const segment = getCurrentBranchSegment(el.branchSearch.value);
  el.branchSearch.value = `${segment.prefix}${branch} - `;
  el.branchSearch.focus();
  hideBranchSuggestions();
}

function hideBranchSuggestions() {
  el.branchSuggestions.hidden = true;
  el.branchSuggestions.innerHTML = "";
  branchSuggestionIndex = 0;
}

function getCurrentBranchSegment(value) {
  const text = String(value || "");
  const matches = [...text.matchAll(/(\r?\n|,|\s+-\s+|-)/g)];
  const last = matches.at(-1);
  if (!last) return { prefix: "", query: text };
  const splitIndex = last.index + last[0].length;
  return {
    prefix: text.slice(0, splitIndex),
    query: text.slice(splitIndex),
  };
}

function parseBranchInput(value) {
  return normalizeList(
    String(value || "")
      .split(/\r?\n|,|\s+-\s+|-/)
      .map((branch) => branch.replace(/^1 ngàn$/i, "Một Ngàn"))
      .map((branch) => toTitleCase(branch.trim()))
      .filter(Boolean),
  );
}

function moveBranch(index, direction) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= editingBranches.length) return;
  const [branch] = editingBranches.splice(index, 1);
  editingBranches.splice(nextIndex, 0, branch);
  renderSelectedBranches();
  updateTitleFromBranches();
}

function updateTitleFromBranches() {
  if (!el.routeTitle.value.trim() && editingBranches.length) {
    el.routeTitle.value = editingBranches.join(" - ");
  }
}

function saveRouteFromForm(event) {
  event.preventDefault();
  const driverIds = getSelectedDrivers();
  const routePayload = createRoute({
    id: el.routeId.value || undefined,
    date: el.routeDate.value,
    title: el.routeTitle.value.trim() || editingBranches.join(" - ") || "Tuyến mới",
    branches: [...editingBranches],
    driverIds,
    vehicleId: el.routeVehicle.value,
    sortOrder: Date.now(),
    createdAt: state.routes.find((route) => route.id === el.routeId.value)?.createdAt,
  });

  if (!routePayload.branches.length) {
    alert("Anh thêm ít nhất một chi nhánh cho tuyến nhé.");
    return;
  }

  routePayload.branches.forEach((branch) => ensureInList(state.branches, branch));
  routePayload.title = routePayload.branches.join(" - ");
  routePayload.driverIds.forEach((driver) => ensureInList(state.drivers, driver));
  if (routePayload.vehicleId) ensureInList(state.vehicles, routePayload.vehicleId);

  const index = state.routes.findIndex((route) => route.id === routePayload.id);
  if (index >= 0) state.routes[index] = routePayload;
  else state.routes.push(routePayload);

  selectedDate = routePayload.date;
  el.dateFilter.value = selectedDate;
  saveState();
  populateStaticControls();
  render();
  closeRouteSheet();
}

function deleteCurrentRoute() {
  const id = el.routeId.value;
  if (!id) return;
  const route = state.routes.find((item) => item.id === id);
  const ok = confirm(`Xóa tuyến "${route.title}"?`);
  if (!ok) return;
  state.routes = state.routes.filter((item) => item.id !== id);
  saveState();
  render();
  closeRouteSheet();
}

function duplicateCurrentRoute() {
  const id = el.routeId.value;
  const route = state.routes.find((item) => item.id === id);
  if (!route) return;
  const copy = createRoute({
    ...route,
    id: undefined,
    title: `${route.title} (bản sao)`,
    sortOrder: Date.now(),
  });
  state.routes.push(copy);
  saveState();
  render();
  openRouteSheet(copy.id);
}

function getSelectedDrivers() {
  return [...document.querySelectorAll("input[name='drivers']:checked")].map((input) => input.value);
}

function getConflicts(route) {
  const conflicts = [];
  const otherRoutes = state.routes.filter((item) => item.id !== route.id && item.date === route.date);
  if (route.vehicleId && otherRoutes.some((item) => item.vehicleId === route.vehicleId)) {
    conflicts.push(`Xe ${route.vehicleId} đang có tuyến khác cùng ngày`);
  }

  const duplicatedDrivers = route.driverIds.filter((driver) =>
    otherRoutes.some((item) => item.driverIds.includes(driver)),
  );
  if (duplicatedDrivers.length) {
    conflicts.push(`Tài xế trùng lịch: ${normalizeList(duplicatedDrivers).join(", ")}`);
  }

  return conflicts;
}

function updateConflictPreview() {
  const previewRoute = createRoute({
    id: el.routeId.value || "preview",
    date: el.routeDate.value,
    title: el.routeTitle.value || "Tuyến mới",
    branches: editingBranches,
    driverIds: getSelectedDrivers(),
    vehicleId: el.routeVehicle.value,
  });
  const conflicts = getConflicts(previewRoute);
  el.conflictBox.hidden = conflicts.length === 0;
  el.conflictBox.innerHTML = conflicts.map((item) => `<div>${escapeHtml(item)}</div>`).join("");
}

function openImportDialog() {
  el.importText.value = `Ngày 9/7
Tuyến: trà ôn - tiểu cần - trà vinh ( Thành + Tuấn) DOTHANH
Tuyến: cờ đỏ - vị thanh - 1 ngàn - thới lai - ô môn - thốt nốt ( Nhựt + Khải) HINO`;
  el.importDialog.showModal();
}

function importRoutesFromText() {
  const imported = parseRouteText(el.importText.value);
  if (!imported.length) {
    alert("Chưa nhận ra tuyến nào. Anh kiểm tra lại dòng bắt đầu bằng 'Tuyến:' nhé.");
    return;
  }

  imported.forEach((route) => {
    route.branches.forEach((branch) => ensureInList(state.branches, branch));
    route.driverIds.forEach((driver) => ensureInList(state.drivers, driver));
    if (route.vehicleId) ensureInList(state.vehicles, route.vehicleId);
    state.routes.push(route);
  });

  selectedDate = imported[0].date;
  el.dateFilter.value = selectedDate;
  saveState();
  populateStaticControls();
  render();
  el.importDialog.close();
}

function parseRouteText(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let activeDate = selectedDate;
  const routes = [];

  for (const line of lines) {
    const dateMatch = line.match(/^ngày\s+(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/i);
    if (dateMatch) {
      activeDate = normalizeInputDate(dateMatch[1], dateMatch[2], dateMatch[3]);
      continue;
    }

    const routeMatch = line.match(/^tuyến\s*:\s*(.+)$/i);
    if (!routeMatch) continue;

    let raw = routeMatch[1].trim();
    let vehicleId = "";
    const matchedVehicle = state.vehicles
      .slice()
      .sort((a, b) => b.length - a.length)
      .find((vehicle) => normalizeText(raw).endsWith(normalizeText(vehicle)));
    if (matchedVehicle) {
      vehicleId = matchedVehicle;
      raw = raw.slice(0, raw.length - matchedVehicle.length).trim();
    }

    let driverIds = [];
    const driverMatch = raw.match(/\(([^)]+)\)/);
    if (driverMatch) {
      driverIds = driverMatch[1]
        .split(/[+,/&]/)
        .map((driver) => toTitleCase(driver.trim()))
        .filter(Boolean);
      raw = raw.replace(driverMatch[0], "").trim();
    }

    const branches = raw
      .split(/\s+-\s+|-/)
      .map((branch) => branch.replace(/^1 ngàn$/i, "Một Ngàn"))
      .map((branch) => toTitleCase(branch.trim()))
      .filter(Boolean);

    routes.push(
      createRoute({
        date: activeDate,
        title: branches.join(" - "),
        branches,
        driverIds,
        vehicleId,
      }),
    );
  }

  return routes;
}

function exportCsv() {
  const routes = getFilteredRoutes();
  const rows = [
    ["Thứ tự", "Tuyến", "Chi nhánh", "Tài xế", "Xe"],
    ...routes.map((route, index) => [
      index + 1,
      `Tuyến ${index + 1}`,
      route.branches.join(" - "),
      route.driverIds.join(" + "),
      route.vehicleId,
    ]),
  ];

  const csv = "\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lich-xe-${selectedDate}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function shiftDay(offset) {
  const date = new Date(`${selectedDate}T00:00:00`);
  date.setDate(date.getDate() + offset);
  selectedDate = formatDate(date);
  el.dateFilter.value = selectedDate;
  saveState();
  render();
}

function option(value, label) {
  return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
}

function normalizeList(items) {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    const clean = String(item || "").trim();
    const key = normalizeText(clean);
    if (clean && !seen.has(key)) {
      seen.add(key);
      result.push(clean);
    }
  });
  return result;
}

function ensureInList(list, value) {
  const clean = String(value || "").trim();
  if (!clean) return;
  if (!list.some((item) => normalizeText(item) === normalizeText(clean))) {
    list.push(clean);
    list.sort((a, b) => a.localeCompare(b, "vi"));
  }
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("vi")
    .replace(/\s+/g, " ")
    .split(/(\s+|-)/)
    .map((part) => {
      if (!/\p{L}/u.test(part)) return part;
      if (["tp", "bd", "su"].includes(part)) return part.toLocaleUpperCase("vi");
      return part.replace(/^(\p{L})/u, (char) => char.toLocaleUpperCase("vi"));
    })
    .join("");
}

function normalizeInputDate(day, month, year) {
  const fullYear = year ? Number(year.length === 2 ? `20${year}` : year) : new Date().getFullYear();
  const date = new Date(fullYear, Number(month) - 1, Number(day));
  return formatDate(date);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function csvCell(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
