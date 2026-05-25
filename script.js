/* ============================================================
   OJT Progress Tracker — script.js
   Handles: tasks CRUD, notes, dashboard stats, LocalStorage
   ============================================================ */

"use strict";

// ── STORAGE KEYS ──────────────────────────────────────────────
const TASKS_KEY = "ojt_tasks";
const NOTES_KEY = "ojt_notes";

// ── STATE ─────────────────────────────────────────────────────
let tasks = [];
let activeFilter = "All";
let activeNoteTab = "learnings";
let searchQuery = "";

const notes = { learnings: "", feedback: "", errors: "" };

// ── UTILS ─────────────────────────────────────────────────────
function generateId() {
  return "_" + Math.random().toString(36).slice(2, 10);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return dateStr < today();
}

// ── LOCAL STORAGE ─────────────────────────────────────────────
function saveTasks() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    tasks = JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
  } catch {
    tasks = [];
  }
}

function saveNotes() {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function loadNotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(NOTES_KEY));
    if (saved) Object.assign(notes, saved);
  } catch {
    /* ignore */
  }
}

// ── DASHBOARD ─────────────────────────────────────────────────
function updateDashboard() {
  const total    = tasks.length;
  const done     = tasks.filter(t => t.status === "Completed").length;
  const pending  = tasks.filter(t => t.status === "Pending").length;
  const progress = tasks.filter(t => t.status === "In Progress").length;
  const pct      = total ? Math.round((done / total) * 100) : 0;

  document.getElementById("statTotal").textContent    = total;
  document.getElementById("statDone").textContent     = done;
  document.getElementById("statPending").textContent  = pending;
  document.getElementById("statProgress").textContent = progress;
  document.getElementById("progressFill").style.width = pct + "%";
  document.getElementById("progressPct").textContent  = pct + "% done";
}

// ── BADGE HELPERS ─────────────────────────────────────────────
function badgeClass(status) {
  if (status === "Completed") return "badge-completed";
  if (status === "In Progress") return "badge-inprogress";
  return "badge-pending";
}

function badgeLabel(status) {
  return status;
}

// ── RENDER TASKS ──────────────────────────────────────────────
function getFilteredTasks() {
  return tasks.filter(t => {
    const matchFilter = activeFilter === "All" || t.status === activeFilter;
    const matchSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery) ||
      t.category.toLowerCase().includes(searchQuery);
    return matchFilter && matchSearch;
  });
}

function renderTasks() {
  const list    = document.getElementById("taskList");
  const empty   = document.getElementById("emptyState");
  const visible = getFilteredTasks();

  // Remove old cards (keep emptyState node)
  Array.from(list.children).forEach(child => {
    if (!child.id) list.removeChild(child);
  });

  if (visible.length === 0) {
    empty.style.display = "";
    updateDashboard();
    return;
  }

  empty.style.display = "none";

  visible.forEach((task, idx) => {
    const card = createTaskCard(task, idx);
    list.appendChild(card);
  });

  updateDashboard();
}

function createTaskCard(task) {
  const overdue = isOverdue(task.dueDate) && task.status !== "Completed";
  const card = document.createElement("div");
  card.className = "task-card";
  card.dataset.id = task.id;
  card.dataset.status = task.status;

  card.innerHTML = `
    <div class="task-card-top">
      <span class="task-title">${escapeHtml(task.title)}</span>
      <span class="badge ${badgeClass(task.status)}">${badgeLabel(task.status)}</span>
    </div>
    <div class="task-meta">
      <span class="tag-category">${escapeHtml(task.category)}</span>
      ${task.dueDate
        ? `<span class="tag-due ${overdue ? "overdue" : ""}">
            ${overdue ? "⚠ " : "📅 "}${formatDate(task.dueDate)}
           </span>`
        : ""}
    </div>
    <div class="task-actions">
      <button class="btn-action btn-complete" data-id="${task.id}"
        ${task.status === "Completed" ? "disabled" : ""}>
        ✓ Complete
      </button>
      <button class="btn-action btn-delete" data-id="${task.id}">
        ✕ Delete
      </button>
    </div>
  `;

  // Complete button
  card.querySelector(".btn-complete").addEventListener("click", () => {
    updateTaskStatus(task.id, "Completed");
  });

  // Delete button
  card.querySelector(".btn-delete").addEventListener("click", () => {
    deleteTask(task.id);
  });

  return card;
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// ── TASK CRUD ─────────────────────────────────────────────────
function addTask(title, category, dueDate, status) {
  const task = {
    id: generateId(),
    title: title.trim(),
    category,
    dueDate,
    status,
    createdAt: new Date().toISOString(),
  };
  tasks.unshift(task);
  saveTasks();
  renderTasks();
}

function updateTaskStatus(id, newStatus) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.status = newStatus;
    saveTasks();
    renderTasks();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

// ── FORM HANDLING ─────────────────────────────────────────────
function handleAddTask() {
  const titleEl    = document.getElementById("taskTitle");
  const categoryEl = document.getElementById("taskCategory");
  const dueDateEl  = document.getElementById("taskDueDate");
  const statusEl   = document.getElementById("taskStatus");

  const title = titleEl.value.trim();
  if (!title) {
    titleEl.focus();
    titleEl.style.borderColor = "var(--red)";
    setTimeout(() => (titleEl.style.borderColor = ""), 1500);
    return;
  }

  addTask(title, categoryEl.value, dueDateEl.value, statusEl.value);

  // Reset form
  titleEl.value   = "";
  dueDateEl.value = "";
  statusEl.value  = "Pending";
  titleEl.focus();
}

// ── FILTER TABS ───────────────────────────────────────────────
function initFilterTabs() {
  document.querySelectorAll(".filter-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      renderTasks();
    });
  });
}

// ── SEARCH ────────────────────────────────────────────────────
function initSearch() {
  document.getElementById("searchInput").addEventListener("input", e => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderTasks();
  });
}

// ── NOTES ─────────────────────────────────────────────────────
function initNotes() {
  const area = document.getElementById("notesArea");
  const saveBtn = document.getElementById("saveNoteBtn");
  const confirm = document.getElementById("saveConfirm");

  // Set initial value
  area.value = notes[activeNoteTab] || "";

  // Tab switching
  document.querySelectorAll(".notes-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      // Save current tab before switching
      notes[activeNoteTab] = area.value;
      saveNotes();

      document.querySelectorAll(".notes-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeNoteTab = tab.dataset.note;
      area.value = notes[activeNoteTab] || "";

      const placeholders = {
        learnings: "Write your daily learnings here…",
        feedback:  "Note down mentor feedback, suggestions, or reviews…",
        errors:    "Log errors, bugs, or issues you encountered today…",
      };
      area.placeholder = placeholders[activeNoteTab];
    });
  });

  // Save button
  saveBtn.addEventListener("click", () => {
    notes[activeNoteTab] = area.value;
    saveNotes();
    confirm.classList.add("show");
    setTimeout(() => confirm.classList.remove("show"), 2000);
  });

  // Auto-save on Ctrl+S / Cmd+S
  area.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      notes[activeNoteTab] = area.value;
      saveNotes();
      confirm.classList.add("show");
      setTimeout(() => confirm.classList.remove("show"), 2000);
    }
  });
}

// ── HEADER DATE ───────────────────────────────────────────────
function setHeaderDate() {
  const el = document.getElementById("headerDate");
  el.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

// ── INIT ──────────────────────────────────────────────────────
function init() {
  loadTasks();
  loadNotes();
  setHeaderDate();

  document.getElementById("addTaskBtn").addEventListener("click", handleAddTask);
  document.getElementById("taskTitle").addEventListener("keydown", e => {
    if (e.key === "Enter") handleAddTask();
  });

  initFilterTabs();
  initSearch();
  initNotes();
  renderTasks();
}

document.addEventListener("DOMContentLoaded", init);
