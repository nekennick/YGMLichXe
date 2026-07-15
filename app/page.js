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
  const inputRef = useRef(null);
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
    const response = await fetch(`/api/state?date=${encodeURIComponent(nextDate)}`, { cache: "no-store" });
    const data = await response.json();
    setBranches(data.branches);
    setDrivers(data.drivers);
    setVehicles(data.vehicles);
    setRoutes(data.routes);
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

function formatDisplayDate(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
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

function ListIcon() {
  return <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
}
