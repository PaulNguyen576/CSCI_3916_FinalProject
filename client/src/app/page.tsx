"use client";

import { useRef, useMemo, useState } from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  formatMoney,
  getPantryViewItems,
  getShoppingList,
  initialNotePositions,
  NOTE_SIZE,
  pantryItems as initialPantryItems,
} from "../lib/pantry";

export default function Page() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://csci-3916-finalproject.onrender.com";
  const [showAddModal, setShowAddModal] = useState(false);
  const [notePositions, setNotePositions] = useState(initialNotePositions);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(
    null,
  );
  const [pickedUpId, setPickedUpId] = useState<number | null>(null);
  const [putDownId, setPutDownId] = useState<number | null>(null);
  const panRef = useRef<{
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  const [items, setItems] = useState(initialPantryItems);

  // add-item form state
  const [formName, setFormName] = useState("");
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formMin, setFormMin] = useState<number>(1);
  const [formExpiry, setFormExpiry] = useState<string>("");
  const [formPrice, setFormPrice] = useState<number>(0);

  const resetForm = () => {
    setFormName("");
    setFormQuantity(1);
    setFormMin(1);
    setFormExpiry("");
    setFormPrice(0);
  };

  const handleSaveItem = async () => {
    if (!formName.trim()) return;

    const nextId = items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1;
    const newItem = {
      id: nextId,
      barcode: "",
      productName: formName.trim(),
      quantity: formQuantity,
      minThreshold: formMin,
      expiryDate: formExpiry || new Date().toISOString().slice(0, 10),
      unitPrice: formPrice,
      image: "",
    } as const;

    // Optimistic UI update
    setItems((prev) => [...prev, newItem]);

    // position new note roughly offset to avoid overlap
    setNotePositions((prev) => {
      const baseX = 80 + (Object.keys(prev).length * 40) % (CANVAS_WIDTH - NOTE_SIZE - 160);
      const baseY = 80 + (Object.keys(prev).length * 24) % (CANVAS_HEIGHT - NOTE_SIZE - 160);
      return { ...prev, [nextId]: { x: baseX, y: baseY } };
    });

    // Close modal immediately for better UX
    resetForm();
    setShowAddModal(false);

    // Persist to MongoDB via API in background
    try {
      const response = await fetch(`${backendUrl}/api/pantry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) {
        console.error("Failed to save to MongoDB");
      }
    } catch (error) {
      console.error("Error posting item to API:", error);
    }
  };

  const sortedItems = useMemo(() => getPantryViewItems(items), [items]);
  const shoppingList = useMemo(() => getShoppingList(sortedItems), [sortedItems]);

  const deleteItem = (id: number) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    setNotePositions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const clampZoom = (value: number): number => Math.max(0.55, Math.min(1.8, value));

  const applyZoom = (nextValue: number) => {
    setZoom(clampZoom(nextValue));
  };

  const getCanvasPoint = (clientX: number, clientY: number) => {
    if (!canvasRef.current) {
      return { x: 0, y: 0 };
    }

    const canvasRect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - canvasRect.left) / zoom,
      y: (clientY - canvasRect.top) / zoom,
    };
  };

  const moveNote = (clientX: number, clientY: number) => {
    const dragState = dragRef.current;
    if (!dragState) {
      return;
    }

    const pointer = getCanvasPoint(clientX, clientY);
    const nextX = pointer.x - dragState.offsetX;
    const nextY = pointer.y - dragState.offsetY;

    const clampedX = Math.max(10, Math.min(CANVAS_WIDTH - NOTE_SIZE - 10, nextX));
    const clampedY = Math.max(10, Math.min(CANVAS_HEIGHT - NOTE_SIZE - 10, nextY));

    setNotePositions((previous) => ({
      ...previous,
      [dragState.id]: { x: clampedX, y: clampedY },
    }));
  };

  return (
    <main className="workspace-shell text-slate-100">
      <div
        ref={scrollRef}
        className={`workspace-scroll ${isPanning ? "is-panning" : ""}`}
        onWheel={(event) => {
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -0.08 : 0.08;
            applyZoom(zoom + delta);
          }
        }}
        onContextMenu={(event) => {
          event.preventDefault();
        }}
        onMouseDown={(event) => {
          if (event.button !== 2 || !scrollRef.current) {
            return;
          }

          panRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            scrollLeft: scrollRef.current.scrollLeft,
            scrollTop: scrollRef.current.scrollTop,
          };
          setIsPanning(true);
        }}
        onMouseMove={(event) => {
          if (!panRef.current || !scrollRef.current) {
            return;
          }

          const deltaX = event.clientX - panRef.current.startX;
          const deltaY = event.clientY - panRef.current.startY;

          scrollRef.current.scrollLeft = panRef.current.scrollLeft - deltaX;
          scrollRef.current.scrollTop = panRef.current.scrollTop - deltaY;
        }}
        onMouseUp={(event) => {
          if (event.button === 2) {
            panRef.current = null;
            setIsPanning(false);
          }
        }}
        onMouseLeave={() => {
          panRef.current = null;
          setIsPanning(false);
        }}
      >
        <div
          className="workspace-size"
          style={{ width: CANVAS_WIDTH * zoom, height: CANVAS_HEIGHT * zoom }}
        >
          <div
            ref={canvasRef}
            className="workspace-canvas"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              transform: `scale(${zoom})`,
            }}
          >
            {sortedItems.map((item) => {
              const isLowStock = item.quantity <= item.minThreshold;
              const isExpired = item.daysToExpiry < 0 || item.quantity === 0;
              const expiringSoon = !isExpired && item.daysToExpiry <= 7;

              const statusClass = isExpired
                ? "postit-expired"
                : expiringSoon
                  ? "postit-soon"
                  : "postit-fresh";

              const rotateClass =
                item.id % 4 === 0
                  ? "rotate-[-2deg]"
                  : item.id % 4 === 1
                    ? "rotate-[1.4deg]"
                    : item.id % 4 === 2
                      ? "rotate-[-1.1deg]"
                      : "rotate-[1.9deg]";

              const variantClass =
                item.id % 4 === 0
                  ? "note-variant-a"
                  : item.id % 4 === 1
                    ? "note-variant-b"
                    : item.id % 4 === 2
                      ? "note-variant-c"
                      : "note-variant-d";

              const expiryCopy =
                item.daysToExpiry < 0
                  ? "Expired"
                  : `${item.daysToExpiry} day${item.daysToExpiry === 1 ? "" : "s"} left`;

              const currentPosition =
                notePositions[item.id] ?? initialNotePositions[item.id] ?? { x: 60, y: 60 };

              const isPicked = pickedUpId === item.id;
              const isPutDown = putDownId === item.id;

              return (
                <article
                  key={item.id}
                  className={`postit pantry-postit movable-postit ${statusClass} ${rotateClass} ${variantClass} ${
                    isPicked ? "picked-up" : ""
                  } ${isPutDown ? "put-down" : ""}`}
                  style={{
                    left: currentPosition.x,
                    top: currentPosition.y,
                    zIndex: draggingId === item.id ? 10000 : 1,
                  }}
                  onPointerDown={(event) => {
                    // if the pointerdown started on the delete button, don't start dragging
                    const targetEl = event.target as Element | null;
                    if (targetEl && targetEl.closest && targetEl.closest('.delete-btn')) {
                      return;
                    }

                    if (event.button !== 0) {
                      return;
                    }

                    const pointer = getCanvasPoint(event.clientX, event.clientY);
                    const currentPosition =
                      notePositions[item.id] ?? initialNotePositions[item.id] ?? {
                        x: 60,
                        y: 60,
                      };

                    dragRef.current = {
                      id: item.id,
                      offsetX: pointer.x - currentPosition.x,
                      offsetY: pointer.y - currentPosition.y,
                    };
                    setDraggingId(item.id);
                    // mark pick-up animation
                    setPickedUpId(item.id);
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    if (dragRef.current?.id === item.id) {
                      moveNote(event.clientX, event.clientY);
                    }
                  }}
                  onPointerUp={(event) => {
                    if (dragRef.current?.id === item.id) {
                      dragRef.current = null;
                      setDraggingId(null);
                    }

                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    }

                    // trigger put-down animation briefly
                    setPickedUpId(null);
                    setPutDownId(item.id);
                    setTimeout(() => setPutDownId(null), 320);
                  }}
                  onPointerCancel={() => {
                    dragRef.current = null;
                    setDraggingId(null);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#272117]">
                      {item.productName}
                    </h3>
                    <div className="relative flex flex-col items-start">
                      <span className="inline-flex rounded-full border border-black/20 bg-white/55 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2d271b]">
                        {isExpired ? "Expired" : expiringSoon ? "Soon" : "Fresh"}
                      </span>
                      {isExpired ? (
                        <button
                          type="button"
                          className="delete-btn inline-flex rounded-full border border-black/20 bg-white/55 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2d271b] mt-2"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(item.id);
                          }}
                          aria-label="Delete expired note"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                      <div className="mt-2 text-xs text-[#3b3426]">&nbsp;</div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#2f291d]">
                    <p>Qty: {item.quantity}</p>
                    <p>Min: {item.minThreshold}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-[#2f291d]">
                    <p>{expiryCopy}</p>
                    <p>{formatMoney(item.unitPrice)} each</p>
                  </div>
                  {isLowStock ? (
                    <p className="mt-3 rounded-md bg-[#fff3bd]/80 px-2 py-1 text-[11px] font-semibold text-[#7c5800]">
                      Restock alert: added to shopping list
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <header className="workspace-hud">
        <p className="marker-font text-xs uppercase tracking-widest text-[#f0d973]">
          Smart Pantry & Expiry Guard
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold leading-tight text-[#f6fff7] sm:text-2xl">
            Pantry Intelligence on a Retro Grid
          </h1>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#d7f5e9]">
            <span className="status-dot bg-[#4ade80]" /> Fresh
            <span className="status-dot bg-[#facc15]" /> Expiring Soon
            <span className="status-dot bg-[#ef4444]" /> Expired
          </div>
        </div>
        <p className="mt-2 max-w-4xl text-xs text-[#d6efe0] sm:text-sm">
          Pan with scroll/trackpad, drag notes anywhere, and zoom with controls or Ctrl + wheel.
        </p>
      </header>

      <aside className="zoom-hud" aria-label="Workspace zoom controls">
        <button
          type="button"
          className="zoom-button"
          aria-label="Zoom out"
          onClick={() => applyZoom(zoom - 0.1)}
        >
          -
        </button>
        <span className="zoom-value">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="zoom-button"
          aria-label="Zoom in"
          onClick={() => applyZoom(zoom + 0.1)}
        >
          +
        </button>
      </aside>

      <aside className="shopping-hud">
        <h2 className="panel-title">Shopping List</h2>
        <ul className="mt-3 grid gap-2">
          {shoppingList.map((item) => (
            <li
              key={`shopping-${item.id}`}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm"
            >
              <span className="font-semibold text-[#f4fff9]">{item.productName}</span>
              <span className="ml-2 text-[#cae7d8]">
                ({item.quantity}/{item.minThreshold})
              </span>
            </li>
          ))}
        </ul>
      </aside>

      <button
        type="button"
        className="fab-add-button"
        aria-label="Open Scan/Add Item"
        onClick={() => setShowAddModal(true)}
      >
        +
      </button>

      {showAddModal ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Scan and add pantry item"
          onClick={() => setShowAddModal(false)}
        >
          <article className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="panel-title">Scan / Add Item</h2>
              <button
                type="button"
                aria-label="Close add item popup"
                className="close-button"
                onClick={() => setShowAddModal(false)}
              >
                x
              </button>
            </div>

            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveItem();
              }}
            >
              <label className="field-wrap">
                <span>Product Name</span>
                <input
                  placeholder="e.g. Coconut Milk"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="field-wrap">
                  <span>Quantity</span>
                  <input
                    type="number"
                    min={0}
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Math.max(0, Number(e.target.value) || 0))}
                  />
                </label>
                <label className="field-wrap">
                  <span>Min Threshold</span>
                  <input
                    type="number"
                    min={0}
                    value={formMin}
                    onChange={(e) => setFormMin(Math.max(0, Number(e.target.value) || 0))}
                  />
                </label>
              </div>
              <label className="field-wrap">
                <span>Expiry Date</span>
                <input
                  type="date"
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                />
              </label>
              <label className="field-wrap">
                <span>Unit Price ($)</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value) || 0)}
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-3">
                <button type="submit" className="btn-secondary">
                  Save Item
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}
    </main>
  );
}
