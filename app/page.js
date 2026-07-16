"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseManyNames, toTitleCase, normalizeText } from "@/lib/text";

function today() {
  return formatDateInput(new Date());
}

export default function HomePage() {
  const [date, setDate] = useState(today());
  const [branches, setBranches] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeForm, setRouteForm] = useState(null);
  const [branchInput, setBranchInput] = useState("");
  const [branchSuggestions, setBranchSuggestions] = useState([]);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [branchManagerOpen, setBranchManagerOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [drag, setDrag] = useState(null);
  const [dropPreview, setDropPreview] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const inputRef = useRef(null);
  const loadSeqRef = useRef(0);
  const dropPreviewRef = useRef(null);
  const branchInputComposingRef = useRef(false);

  useEffect(() => {
    loadState(date);
  }, [date]);

  useEffect(() => {
    dropPreviewRef.current = dropPreview;
  }, [dropPreview]);

  useEffect(() => {
    if (!drag) return undefined;

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    function updatePreview(event) {
      event.preventDefault();
      const element = document.elementFromPoint(event.clientX, event.clientY);
      if (!element) return;

      if (drag.type === "route") {
        const row = element.closest("[data-route-id]");
        const targetId = row?.dataset.routeId;
        if (!row || !targetId || targetId === drag.sourceId) {
          setDropPreview(null);
          return;
        }
        const rect = row.getBoundingClientRect();
        setDropPreview({
          type: "route",
          targetId,
          position: event.clientY < rect.top + rect.height / 2 ? "before" : "after"
        });
        return;
      }

      if (drag.type === "branch") {
        const token = element.closest("[data-branch-route-id]");
        const routeId = token?.dataset.branchRouteId;
        const targetIndex = Number(token?.dataset.branchIndex);
        if (!token || routeId !== drag.routeId || !Number.isInteger(targetIndex) || targetIndex === drag.sourceIndex) {
          setDropPreview(null);
          return;
        }
        const rect = token.getBoundingClientRect();
        setDropPreview({
          type: "branch",
          routeId,
          targetIndex,
          position: event.clientX < rect.left + rect.width / 2 ? "before" : "after"
        });
      }
    }

    function finishDrag(event) {
      event.preventDefault();
      const preview = dropPreviewRef.current;
      if (drag.type === "route" && preview?.type === "route") {
        reorderRoutes(drag.sourceId, preview.targetId, preview.position);
      }
      if (drag.type === "branch" && preview?.type === "branch") {
        const route = routes.find((item) => item.id === drag.routeId);
        if (route) reorderRouteBranches(route, drag.sourceIndex, preview.targetIndex, preview.position);
      }
      setDrag(null);
      setDropPreview(null);
    }

    document.addEventListener("pointermove", updatePreview, { passive: false });
    document.addEventListener("pointerup", finishDrag, { passive: false });
    document.addEventListener("pointercancel", finishDrag, { passive: false });

    return () => {
      document.removeEventListener("pointermove", updatePreview);
      document.removeEventListener("pointerup", finishDrag);
      document.removeEventListener("pointercancel", finishDrag);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [drag]);

  async function loadState(nextDate = date) {
    const requestId = ++loadSeqRef.current;
    try {
      const response = await fetch(`/api/state?date=${encodeURIComponent(nextDate)}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Load state failed: ${response.status}`);
      const data = await response.json();
      if (requestId !== loadSeqRef.current) return null;
      setBranches(Array.isArray(data.branches) ? data.branches : []);
      setDrivers(Array.isArray(data.drivers) ? data.drivers : []);
      setVehicles(Array.isArray(data.vehicles) ? data.vehicles : []);
      setRoutes(Array.isArray(data.routes) ? data.routes : []);
      return data;
    } catch (error) {
      if (requestId === loadSeqRef.current) console.error(error);
      return null;
    }
  }

  const filteredRoutes = useMemo(() => {
    const query = normalizeText(search);
    return routes.filter((route) => {
      if (vehicleFilter && route.vehicleId !== vehicleFilter) return false;
      if (driverFilter && !route.driverIds.includes(driverFilter)) return false;
      if (!query) return true;
      return normalizeText([route.title, route.vehicleId, route.branches.join(" "), route.driverIds.join(" ")].join(" ")).includes(query);
    });
  }, [routes, search, vehicleFilter, driverFilter]);

  function openNewRoute() {
    setEditingRoute(null);
    setRouteForm({
      id: "",
      date,
      branches: [],
      driverIds: [],
      vehicleId: vehicles[0] || ""
    });
    setBranchInput("");
  }

  function openEditRoute(route) {
    setEditingRoute(route);
    setRouteForm({
      id: route.id,
      date: route.date,
      branches: [...route.branches],
      driverIds: [...route.driverIds],
      vehicleId: route.vehicleId
    });
    setBranchInput("");
  }

  async function saveRoute(event) {
    event.preventDefault();
    if (!routeForm.branches.length) {
      alert("Anh thêm ít nhất một chi nhánh cho tuyến nhé.");
      return;
    }
    const payload = {
      ...routeForm,
      sortOrder: editingRoute?.sortOrder || Date.now()
    };
    const response = await fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      alert("Không lưu được tuyến.");
      return;
    }
    const savedRoute = await response.json();
    if (savedRoute?.date === date) {
      setRoutes((items) => upsertRoute(items, savedRoute));
    }
    setDate(routeForm.date);
    setRouteForm(null);
    await loadState(routeForm.date);
  }

  async function deleteRoute() {
    if (!editingRoute) return;
    if (!confirm(`Xóa ${editingRoute.branches.join(" - ")}?`)) return;
    await fetch(`/api/routes?id=${encodeURIComponent(editingRoute.id)}`, { method: "DELETE" });
    setRouteForm(null);
    await loadState();
  }

  function addBranchesToForm() {
    const names = parseManyNames(branchInput);
    if (!names.length) return;
    setRouteForm((form) => ({ ...form, branches: mergeBranchNames(form.branches, names) }));
    setBranchInput("");
    setBranchSuggestions([]);
    setSuggestionIndex(-1);
  }

  function renderBranchSuggestions(value) {
    const query = normalizeText(value);
    if (!query) {
      setBranchSuggestions([]);
      return;
    }
    const used = new Set((routeForm?.branches || []).map(normalizeText));
    setBranchSuggestions(
      branches
        .filter((branch) => normalizeText(branch).includes(query))
        .filter((branch) => !used.has(normalizeText(branch)))
        .slice(0, 7)
    );
    setSuggestionIndex(-1);
  }

  function applyBranchSuggestion(branch) {
    if (branchInputComposingRef.current) return;
    setRouteForm((form) => ({ ...form, branches: mergeBranchNames(form.branches, [branch]) }));
    setBranchInput("");
    setBranchSuggestions([]);
    setSuggestionIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleBranchInputKey(event) {
    if (event.nativeEvent?.isComposing || branchInputComposingRef.current) return;

    if (branchSuggestions.length) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSuggestionIndex((index) => (index + 1) % branchSuggestions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSuggestionIndex((index) => (index <= 0 ? branchSuggestions.length - 1 : index - 1));
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setBranchSuggestions([]);
        setSuggestionIndex(-1);
        return;
      }
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (branchInput.trim()) addBranchesToForm();
    }
  }

  function removeBranchFromForm(index) {
    setRouteForm((form) => ({ ...form, branches: form.branches.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function moveBranchInForm(sourceIndex, targetIndex, position = "before") {
    setRouteForm((form) => {
      const next = [...form.branches];
      const [branch] = next.splice(sourceIndex, 1);
      const adjusted = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      next.splice(adjusted + (position === "after" ? 1 : 0), 0, branch);
      return { ...form, branches: next };
    });
  }

  async function addBranchToCatalog() {
    if (!newBranchName.trim()) return;
    await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names: newBranchName })
    });
    setNewBranchName("");
    await loadState();
  }

  async function renameBranch(oldName, input) {
    const name = toTitleCase(input.value);
    if (!name) return;
    await fetch("/api/branches", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldName, name })
    });
    await loadState();
  }

  async function deleteBranch(name) {
    if (!confirm(`Xóa "${name}" khỏi danh mục chi nhánh?`)) return;
    await fetch(`/api/branches?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    await loadState();
  }

  async function reorderRoutes(sourceId, targetId, position) {
    const ordered = [...routes];
    const sourceIndex = ordered.findIndex((route) => route.id === sourceId);
    const targetIndex = ordered.findIndex((route) => route.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
    const [source] = ordered.splice(sourceIndex, 1);
    const adjusted = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    ordered.splice(adjusted + (position === "after" ? 1 : 0), 0, source);
    setRoutes(ordered);
    await fetch("/api/routes/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, orderedIds: ordered.map((route) => route.id) })
    });
  }

  async function reorderRouteBranches(route, sourceIndex, targetIndex, position) {
    const next = [...route.branches];
    const [branch] = next.splice(sourceIndex, 1);
    const adjusted = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    next.splice(adjusted + (position === "after" ? 1 : 0), 0, branch);
    setRoutes((items) => items.map((item) => (item.id === route.id ? { ...item, branches: next } : item)));
    await fetch("/api/routes/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "branches", routeId: route.id, branches: next })
    });
    await loadState();
  }

  async function captureScheduleImage() {
    if (!filteredRoutes.length || isCapturing) return;
    setIsCapturing(true);
    try {
      await document.fonts?.ready;
      const blob = await createScheduleImageBlob({
        routes: filteredRoutes,
        dateLabel: formatDisplayDate(date),
        routeCount: filteredRoutes.length
      });
      const fileName = `lich-xe-${date}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Lich xe",
          text: `Lich xe ${formatDisplayDate(date)}`
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    } catch (error) {
      if (error?.name !== "AbortError") alert("Khong tao duoc anh lich xe.");
    } finally {
      setIsCapturing(false);
    }
  }

  const catalogBranches = branches.filter((branch) => !catalogSearch || normalizeText(branch).includes(normalizeText(catalogSearch)));

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <TruckIcon />
          </span>
          <div>
            <p>Tổng kho Cao Lãnh</p>
            <h1>Lịch xe</h1>
          </div>
        </div>
        <div className="top-actions">
          <button className="icon-button" title="Quản lý chi nhánh" onClick={() => setBranchManagerOpen(true)}>
            <ListIcon />
          </button>
          <button className="primary-button" onClick={openNewRoute}>
            <PlusIcon /> Thêm tuyến
          </button>
        </div>
      </header>

      <section className="control-strip" aria-label="Bộ lọc lịch xe">
        <div className="date-card">
          <button className="ghost-button" onClick={() => shiftDate(-1, date, setDate)} aria-label="Ngày trước">
            ‹
          </button>
          <label>
            <span>Ngày giao</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <button className="ghost-button" onClick={() => shiftDate(1, date, setDate)} aria-label="Ngày sau">
            ›
          </button>
        </div>
        <label className="search-field">
          <span>Tìm tuyến</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Chi nhánh, tài xế, xe..." />
        </label>
        <label>
          <span>Xe</span>
          <select value={vehicleFilter} onChange={(event) => setVehicleFilter(event.target.value)}>
            <option value="">Tất cả xe</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle} value={vehicle}>{vehicle}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Tài xế</span>
          <select value={driverFilter} onChange={(event) => setDriverFilter(event.target.value)}>
            <option value="">Tất cả tài xế</option>
            {drivers.map((driver) => (
              <option key={driver} value={driver}>{driver}</option>
            ))}
          </select>
        </label>
      </section>

      <main className="board route-board" aria-label="Danh sách tuyến xe theo ngày">
        <section className="route-table-panel">
          <header className="route-table-header">
            <div>
              <p className="eyebrow">Lịch tuyến</p>
              <h2>{formatDisplayDate(date)}</h2>
            </div>
            <button type="button" className="capture-button" onClick={captureScheduleImage} disabled={!filteredRoutes.length || isCapturing}>
              <CameraIcon />
              {isCapturing ? "Đang chụp" : "Chụp ảnh"}
            </button>
            <span>{filteredRoutes.length} tuyến</span>
          </header>
          <div className="route-table" role="table" aria-label="Tuyến xe">
            <div className="route-table-head" role="row">
              <span>Tuyến</span>
              <span>Chi nhánh</span>
              <span>Tài xế</span>
              <span>Xe</span>
            </div>
            {filteredRoutes.length ? filteredRoutes.map((route, index) => (
              <RouteRow
                key={route.id}
                index={index}
                route={route}
                onEdit={() => openEditRoute(route)}
                drag={drag}
                setDrag={setDrag}
                dropPreview={dropPreview}
              />
            )) : <div className="empty-column">Ngày này chưa có tuyến.</div>}
          </div>
        </section>
      </main>

      {routeForm && (
        <div className="sheet-backdrop" onClick={() => setRouteForm(null)}>
          <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
            <form onSubmit={saveRoute}>
              <div className="sheet-header">
                <div>
                  <p className="eyebrow">Điều phối tuyến</p>
                  <h2>{editingRoute ? "Sửa tuyến" : "Thêm tuyến"}</h2>
                </div>
                <button type="button" className="icon-button" onClick={() => setRouteForm(null)}><CloseIcon /></button>
              </div>
              <div className="form-grid">
                <label>
                  <span>Ngày</span>
                  <input type="date" required value={routeForm.date} onChange={(event) => setRouteForm({ ...routeForm, date: event.target.value })} />
                </label>
                <label>
                  <span>Xe</span>
                  <select required value={routeForm.vehicleId} onChange={(event) => setRouteForm({ ...routeForm, vehicleId: event.target.value })}>
                    <option value="">Chọn xe</option>
                    {vehicles.map((vehicle) => <option key={vehicle} value={vehicle}>{vehicle}</option>)}
                  </select>
                </label>
              </div>
              <div className="form-section">
                <div className="section-title">
                  <span>Chi nhánh theo thứ tự ghé</span>
                  <small>{routeForm.branches.length} điểm</small>
                </div>
                <div className="inline-adder">
                  <div className="branch-input-wrap">
                    {routeForm.branches.length > 0 && (
                      <div className="branch-entry-chips" aria-label="Chi nhánh đã chọn">
                        {routeForm.branches.map((branch, index) => (
                          <div className="branch-chip" key={`${branch}-${index}`}>
                            <span>{index + 1}. {branch}</span>
                            <button type="button" className="chip-button" onClick={() => moveBranchInForm(index, Math.max(index - 1, 0))}>↑</button>
                            <button type="button" className="chip-button" onClick={() => moveBranchInForm(index, Math.min(index + 1, routeForm.branches.length - 1), "after")}>↓</button>
                            <button type="button" className="chip-button" onClick={() => removeBranchFromForm(index)}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      ref={inputRef}
                      value={branchInput}
                      onFocus={() => renderBranchSuggestions(branchInput)}
                      onBlur={() => {
                        setBranchSuggestions([]);
                        setSuggestionIndex(-1);
                      }}
                      onCompositionStart={() => {
                        branchInputComposingRef.current = true;
                      }}
                      onCompositionEnd={(event) => {
                        branchInputComposingRef.current = false;
                        renderBranchSuggestions(event.currentTarget.value);
                      }}
                      onChange={(event) => {
                        setBranchInput(event.target.value);
                        if (!branchInputComposingRef.current) renderBranchSuggestions(event.target.value);
                      }}
                      onKeyDown={handleBranchInputKey}
                      placeholder="Nhập một chi nhánh rồi bấm Enter"
                      autoComplete="off"
                    />
                    {branchSuggestions.length > 0 && (
                      <div className="branch-suggestions" role="listbox">
                        {branchSuggestions.map((branch, index) => (
                          <button
                            key={branch}
                            type="button"
                            className={`branch-suggestion ${index === suggestionIndex ? "is-active" : ""}`}
                            onPointerDown={(event) => {
                              event.preventDefault();
                              applyBranchSuggestion(branch);
                            }}
                          >
                            {branch}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <small className="input-hint">Mỗi chi nhánh là một chip riêng. Gõ tên rồi bấm Enter, hoặc chạm gợi ý để thêm. Có thể dán nhiều chi nhánh bằng dấu phẩy, xuống dòng hoặc dấu " - ".</small>
              </div>
              <div className="form-section">
                <div className="section-title">
                  <span>Tài xế</span>
                  <small>Có thể chọn nhiều người</small>
                </div>
                <div className="check-grid">
                  {drivers.map((driver) => (
                    <label className="check-pill" key={driver}>
                      <input
                        type="checkbox"
                        checked={routeForm.driverIds.includes(driver)}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...routeForm.driverIds, driver]
                            : routeForm.driverIds.filter((item) => item !== driver);
                          setRouteForm({ ...routeForm, driverIds: next });
                        }}
                      />
                      {driver}
                    </label>
                  ))}
                </div>
              </div>
              <div className="sheet-actions">
                {editingRoute && <button type="button" className="danger-button" onClick={deleteRoute}>Xóa</button>}
                <button type="submit" className="primary-button">Lưu tuyến</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {branchManagerOpen && (
        <div className="dialog-backdrop">
          <section className="manager-dialog as-panel">
            <div className="sheet-header">
              <div>
                <p className="eyebrow">Danh mục</p>
                <h2>Quản lý chi nhánh</h2>
              </div>
              <button className="icon-button" onClick={() => setBranchManagerOpen(false)}><CloseIcon /></button>
            </div>
            <div className="manager-add">
              <label>
                <span>Thêm chi nhánh</span>
                <input value={newBranchName} onChange={(event) => setNewBranchName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addBranchToCatalog()} placeholder="Nhập tên chi nhánh mới" />
              </label>
              <button className="primary-button" onClick={addBranchToCatalog}>Thêm</button>
            </div>
            <label className="manager-search">
              <span>Tìm trong danh mục</span>
              <input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Tìm chi nhánh..." />
            </label>
            <div className="manager-list">
              {catalogBranches.map((branch) => (
                <div className="manager-row" key={branch}>
                  <input className="manager-branch-input" defaultValue={branch} />
                  <button className="manager-icon-button save" onClick={(event) => renameBranch(branch, event.currentTarget.parentElement.querySelector("input"))}><CheckIcon /></button>
                  <button className="manager-icon-button delete" onClick={() => deleteBranch(branch)}><CloseIcon /></button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function RouteRow({ route, index, onEdit, drag, setDrag, dropPreview }) {
  function previewClass(id, branchIndex = null) {
    if (!dropPreview) return "";
    if (branchIndex === null && dropPreview.type === "route" && dropPreview.targetId === id) return `is-drop-target drop-${dropPreview.position}`;
    if (dropPreview.type === "branch" && dropPreview.routeId === id && dropPreview.targetIndex === branchIndex) return `is-drop-target drop-${dropPreview.position}`;
    return "";
  }

  return (
    <div
      className={`route-row ${previewClass(route.id)} ${drag?.type === "route" && drag.sourceId === route.id ? "is-dragging" : ""}`}
      data-route-id={route.id}
      role="row"
      onClick={onEdit}
    >
      <div className="route-cell route-name" data-label="Tuyến">
        <button
          type="button"
          className={`route-drag-handle ${drag?.type === "route" && drag.sourceId === route.id ? "is-dragging" : ""}`}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDrag({ type: "route", sourceId: route.id });
          }}
        >
          <ListIcon />
        </button>
        <strong>Tuyến {index + 1}</strong>
      </div>
      <div className="route-cell branch-cell" data-label="Chi nhánh">
        {route.branches.map((branch, branchIndex) => (
          <span
            key={`${branch}-${branchIndex}`}
            className={`branch-token ${previewClass(route.id, branchIndex)} ${drag?.type === "branch" && drag.routeId === route.id && drag.sourceIndex === branchIndex ? "is-dragging" : ""}`}
            data-branch-route-id={route.id}
            data-branch-index={branchIndex}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDrag({ type: "branch", routeId: route.id, sourceIndex: branchIndex });
            }}
          >
            {branch}
          </span>
        ))}
      </div>
      <div className="route-cell" data-label="Tài xế">{route.driverIds.join(" + ") || "Chưa chọn tài xế"}</div>
      <div className="route-cell vehicle-cell" data-label="Xe">{route.vehicleId || "Chưa chọn xe"}</div>
    </div>
  );
}

function shiftDate(amount, value, setDate) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + amount);
  setDate(formatDateInput(date));
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mergeBranchNames(current, nextNames) {
  const seen = new Set((current || []).map(normalizeText));
  const merged = [...(current || [])];
  nextNames.forEach((name) => {
    const clean = toTitleCase(name);
    const key = normalizeText(clean);
    if (clean && !seen.has(key)) {
      seen.add(key);
      merged.push(clean);
    }
  });
  return merged;
}

function upsertRoute(items, route) {
  const next = [...items.filter((item) => item.id !== route.id), route];
  return next.sort((first, second) => Number(first.sortOrder || 0) - Number(second.sortOrder || 0));
}

function formatDisplayDate(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function createScheduleImageBlob({ routes, dateLabel, routeCount }) {
  const width = 1200;
  const margin = 48;
  const contentWidth = width - margin * 2;
  const columns = {
    route: 128,
    branch: 560,
    driver: 250,
    vehicle: 166
  };
  const palette = {
    bg: "#f7f3ea",
    card: "#fffaf1",
    white: "#ffffff",
    ink: "#17211f",
    muted: "#63706b",
    line: "#ddd4c3",
    softLine: "#eee5d6",
    primary: "#0f5f6a",
    primaryStrong: "#08444c",
    primarySoft: "#d9ecec"
  };

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = "700 28px Inter, system-ui, sans-serif";

  const rowLayouts = routes.map((route, index) => {
    const branchLines = layoutChips(ctx, route.branches, columns.branch - 48);
    const driverLines = wrapText(ctx, route.driverIds.join(" + ") || "Chưa chọn tài xế", columns.driver - 36, "500 28px Inter, system-ui, sans-serif");
    const vehicleLines = wrapText(ctx, route.vehicleId || "Chưa chọn xe", columns.vehicle - 36, "800 26px Inter, system-ui, sans-serif");
    const contentHeight = Math.max(
      112,
      branchLines.height + 40,
      driverLines.length * 34 + 42,
      vehicleLines.length * 32 + 42
    );
    return { route, index, branchLines, driverLines, vehicleLines, height: contentHeight };
  });

  const headerHeight = 150;
  const tableHeadHeight = 58;
  const totalRowsHeight = rowLayouts.reduce((sum, row) => sum + row.height, 0);
  const height = margin + headerHeight + tableHeadHeight + totalRowsHeight + margin;

  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  roundRect(ctx, margin, margin, contentWidth, height - margin * 2, 10);
  ctx.fillStyle = palette.card;
  ctx.fill();
  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = palette.card;
  ctx.fillRect(margin + 1, margin + 1, contentWidth - 2, headerHeight - 1);
  ctx.fillStyle = palette.muted;
  ctx.font = "800 24px Inter, system-ui, sans-serif";
  ctx.fillText("LỊCH TUYẾN", margin + 32, margin + 48);
  ctx.fillStyle = palette.ink;
  ctx.font = "900 42px Inter, system-ui, sans-serif";
  ctx.fillText(capitalizeFirst(dateLabel), margin + 32, margin + 102);

  const badgeText = `${routeCount} tuyến`;
  ctx.font = "900 24px Inter, system-ui, sans-serif";
  const badgeWidth = ctx.measureText(badgeText).width + 42;
  roundRect(ctx, width - margin - badgeWidth - 32, margin + 42, badgeWidth, 54, 999);
  ctx.fillStyle = palette.primarySoft;
  ctx.fill();
  ctx.fillStyle = palette.primaryStrong;
  ctx.fillText(badgeText, width - margin - badgeWidth - 11, margin + 77);

  let y = margin + headerHeight;
  ctx.strokeStyle = palette.line;
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(width - margin, y);
  ctx.stroke();

  drawTableHead(ctx, margin, y, columns, tableHeadHeight, palette);
  y += tableHeadHeight;

  rowLayouts.forEach((layout) => {
    drawScheduleRow(ctx, margin, y, columns, layout, palette);
    y += layout.height;
  });

  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = palette.primaryStrong;
  ctx.font = "800 24px Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Powered by Khoa Trần", width - margin, height - 18);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas export failed"));
    }, "image/png", 0.96);
  });
}

function drawTableHead(ctx, x, y, columns, height, palette) {
  const labels = ["Tuyến", "Chi nhánh", "Tài xế", "Xe"];
  const widths = [columns.route, columns.branch, columns.driver, columns.vehicle];
  ctx.fillStyle = "#f4efe5";
  ctx.fillRect(x, y, widths.reduce((sum, width) => sum + width, 0), height);
  ctx.font = "900 20px Inter, system-ui, sans-serif";
  ctx.fillStyle = palette.muted;

  let cursor = x;
  labels.forEach((label, index) => {
    ctx.fillText(label.toUpperCase(), cursor + 18, y + 37);
    cursor += widths[index];
    if (index < labels.length - 1) drawVerticalLine(ctx, cursor, y, height, palette.line);
  });
}

function drawScheduleRow(ctx, x, y, columns, layout, palette) {
  const widths = [columns.route, columns.branch, columns.driver, columns.vehicle];
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  ctx.fillStyle = layout.index % 2 ? "#fffdf8" : palette.white;
  ctx.fillRect(x, y, totalWidth, layout.height);

  let cursor = x;
  widths.slice(0, -1).forEach((width) => {
    cursor += width;
    drawVerticalLine(ctx, cursor, y, layout.height, palette.softLine);
  });
  drawHorizontalLine(ctx, x, y + layout.height, totalWidth, palette.softLine);

  ctx.fillStyle = "#f7f2e8";
  ctx.fillRect(x, y, columns.route, layout.height);
  ctx.fillStyle = palette.ink;
  ctx.font = "900 28px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Tuyến ${layout.index + 1}`, x + columns.route / 2, y + Math.min(70, layout.height / 2 + 10));
  ctx.textAlign = "left";

  drawChips(ctx, layout.branchLines.lines, x + columns.route + 24, y + 28, palette);
  drawWrappedCell(ctx, layout.driverLines, x + columns.route + columns.branch + 18, y + 44, "500 28px Inter, system-ui, sans-serif", palette.ink);
  drawWrappedCell(ctx, layout.vehicleLines, x + columns.route + columns.branch + columns.driver + 18, y + 44, "900 26px Inter, system-ui, sans-serif", palette.primaryStrong);
}

function drawChips(ctx, lines, x, y, palette) {
  let cursorY = y;
  lines.forEach((line) => {
    let cursorX = x;
    line.forEach((chip) => {
      roundRect(ctx, cursorX, cursorY, chip.width, 42, 999);
      ctx.fillStyle = palette.card;
      ctx.fill();
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = palette.ink;
      ctx.font = "800 25px Inter, system-ui, sans-serif";
      ctx.fillText(chip.label, cursorX + 20, cursorY + 28);
      cursorX += chip.width + 12;
    });
    cursorY += 54;
  });
}

function drawWrappedCell(ctx, lines, x, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * 34));
}

function layoutChips(ctx, labels, maxWidth) {
  ctx.font = "800 25px Inter, system-ui, sans-serif";
  const lines = [];
  let line = [];
  let lineWidth = 0;
  labels.forEach((label) => {
    const width = Math.ceil(ctx.measureText(label).width + 40);
    if (line.length && lineWidth + width + 12 > maxWidth) {
      lines.push(line);
      line = [];
      lineWidth = 0;
    }
    line.push({ label, width });
    lineWidth += width + (line.length > 1 ? 12 : 0);
  });
  if (line.length) lines.push(line);
  return { lines, height: Math.max(42, lines.length * 54 - 12) };
}

function wrapText(ctx, text, maxWidth, font) {
  ctx.font = font;
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawVerticalLine(ctx, x, y, height, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + height);
  ctx.stroke();
}

function drawHorizontalLine(ctx, x, y, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();
}

function capitalizeFirst(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function TruckIcon() {
  return <svg viewBox="0 0 24 24"><path d="M4 7.5h9.5v7H4z" /><path d="M13.5 10h3.2l2.6 2.8v1.7h-5.8z" /><path d="M7 17.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm9.5 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></svg>;
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>;
}

function CameraIcon() {
  return <svg viewBox="0 0 24 24"><path d="M4 8.5h3l1.5-2h7l1.5 2h3v10H4z" /><path d="M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /></svg>;
}

function ListIcon() {
  return <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
}
