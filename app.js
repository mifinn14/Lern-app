const state = {
  grades: JSON.parse(localStorage.getItem("grades") || "[]"),
  events: JSON.parse(localStorage.getItem("events") || "null") || defaultEvents(),
  tasks: JSON.parse(localStorage.getItem("tasks") || "[]"),
  focusMode: JSON.parse(localStorage.getItem("focusMode") || "false"),
  currentPage: "dashboard",
  currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  timerSeconds: 25 * 60,
  timerRunning: false,
  timerRef: null,
  calcExpr: ""
};

function defaultEvents() {
  const year = new Date().getFullYear();
  return [
    { title: "Osterferien", date: `${year}-03-30`, type: "ferien" },
    { title: "Sommerferien", date: `${year}-07-20`, type: "ferien" },
    { title: "Klausurphase Q2", date: `${year}-05-12`, type: "klausur" },
    { title: "Elternsprechtag", date: `${year}-11-08`, type: "schule" }
  ];
}

const tabs = [...document.querySelectorAll(".tab-btn")];
const pages = [...document.querySelectorAll(".page")];

const focusToggle = document.getElementById("focusToggle");
const avgPreview = document.getElementById("avgPreview");
const nextEvents = document.getElementById("nextEvents");
const plannerSummary = document.getElementById("plannerSummary");

const taskTitle = document.getElementById("taskTitle");
const taskPriority = document.getElementById("taskPriority");
const taskDue = document.getElementById("taskDue");
const addTaskBtn = document.getElementById("addTaskBtn");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const taskList = document.getElementById("taskList");
const taskStats = document.getElementById("taskStats");

const subjectInput = document.getElementById("subjectInput");
const gradeInput = document.getElementById("gradeInput");
const weightInput = document.getElementById("weightInput");
const addGradeBtn = document.getElementById("addGradeBtn");
const clearGradesBtn = document.getElementById("clearGrades");
const weightedAverage = document.getElementById("weightedAverage");
const gradesTable = document.getElementById("gradesTable");

const calendarTitle = document.getElementById("calendarTitle");
const calendarGrid = document.getElementById("calendarGrid");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const eventTitle = document.getElementById("eventTitle");
const eventDate = document.getElementById("eventDate");
const eventType = document.getElementById("eventType");
const addEventBtn = document.getElementById("addEventBtn");
const eventList = document.getElementById("eventList");

const dictSearch = document.getElementById("dictSearch");
const searchWordBtn = document.getElementById("searchWordBtn");
const dictResult = document.getElementById("dictResult");

const calcDisplay = document.getElementById("calcDisplay");
const calcGrid = document.getElementById("calcGrid");

const timerDisplay = document.getElementById("timerDisplay");
const startTimerBtn = document.getElementById("startTimer");
const pauseTimerBtn = document.getElementById("pauseTimer");
const resetTimerBtn = document.getElementById("resetTimer");

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function setPage(pageId) {
  state.currentPage = pageId;
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.page === pageId));
  pages.forEach((p) => p.classList.toggle("active", p.id === pageId));
}

function updateFocusMode() {
  document.body.classList.toggle("focus-active", state.focusMode);
  focusToggle.textContent = `Fokusmodus: ${state.focusMode ? "An" : "Aus"}`;

  if (state.focusMode && state.currentPage === "grades") {
    setPage("focus");
  }

  save("focusMode", state.focusMode);
}

function calcAverage() {
  if (!state.grades.length) {
    return null;
  }
  const totalWeight = state.grades.reduce((sum, g) => sum + g.weight, 0);
  const weighted = state.grades.reduce((sum, g) => sum + g.grade * g.weight, 0);
  return weighted / totalWeight;
}

function renderGrades() {
  gradesTable.innerHTML = "";

  state.grades.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.subject}</td>
      <td>${entry.grade.toFixed(1)}</td>
      <td>${entry.weight}</td>
      <td><button class="btn" data-remove-grade="${index}">Löschen</button></td>
    `;
    gradesTable.appendChild(row);
  });

  const avg = calcAverage();
  weightedAverage.textContent = avg ? avg.toFixed(2) : "-";
  avgPreview.textContent = avg ? `Aktueller Schnitt: ${avg.toFixed(2)}` : "Noch keine Noten vorhanden.";

  save("grades", state.grades);
}

function renderTasks() {
  const sorted = [...state.tasks].sort((a, b) => {
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due.localeCompare(b.due);
  });

  taskList.innerHTML = "";
  sorted.forEach((task) => {
    const li = document.createElement("li");
    const prettyDate = task.due ? new Date(task.due).toLocaleDateString("de-DE") : "ohne Datum";
    li.innerHTML = `
      <div class="task-row ${task.done ? "task-done" : ""}">
        <strong>${task.title}</strong>
        <div class="task-meta">
          <span class="badge ${task.priority}">${task.priority}</span>
          <span>${prettyDate}</span>
          <button class="btn" data-toggle-task="${task.id}">${task.done ? "Offen" : "Erledigt"}</button>
          <button class="btn btn-danger" data-remove-task="${task.id}">Löschen</button>
        </div>
      </div>
    `;
    taskList.appendChild(li);
  });

  const done = state.tasks.filter((t) => t.done).length;
  const total = state.tasks.length;
  const summaryText = `${done} von ${total} Aufgaben erledigt.`;
  taskStats.textContent = summaryText;
  plannerSummary.textContent = summaryText;

  save("tasks", state.tasks);
}

function normalizedDate(value) {
  return new Date(value).toISOString().split("T")[0];
}

function getEventsForDate(dateStr) {
  return state.events.filter((e) => e.date === dateStr);
}

function renderCalendar() {
  const d = state.currentMonth;
  const year = d.getFullYear();
  const month = d.getMonth();

  calendarTitle.textContent = d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  calendarGrid.innerHTML = "";

  ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].forEach((wd) => {
    const head = document.createElement("div");
    head.className = "day-cell";
    head.innerHTML = `<strong>${wd}</strong>`;
    calendarGrid.appendChild(head);
  });

  const first = new Date(year, month, 1);
  const firstDay = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day-cell";
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = normalizedDate(new Date(year, month, day));
    const dayEvents = getEventsForDate(cellDate);

    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.innerHTML = `<strong>${day}</strong>`;

    dayEvents.slice(0, 2).forEach((ev) => {
      const badge = document.createElement("span");
      badge.className = `badge ${ev.type}`;
      badge.textContent = ev.type;
      cell.appendChild(badge);
    });

    calendarGrid.appendChild(cell);
  }
}

function renderEventList() {
  const sorted = [...state.events].sort((a, b) => a.date.localeCompare(b.date));
  eventList.innerHTML = "";

  sorted.forEach((ev, index) => {
    const li = document.createElement("li");
    const pretty = new Date(ev.date).toLocaleDateString("de-DE");
    li.innerHTML = `
      <strong>${ev.title}</strong> (${pretty})
      <span class="badge ${ev.type}">${ev.type}</span>
      <button class="btn" data-remove-event="${index}">Löschen</button>
    `;
    eventList.appendChild(li);
  });

  const upcoming = sorted
    .filter((ev) => new Date(ev.date) >= new Date(new Date().toDateString()))
    .slice(0, 4);

  nextEvents.innerHTML = "";
  if (!upcoming.length) {
    nextEvents.innerHTML = "<li>Keine kommenden Termine.</li>";
  } else {
    upcoming.forEach((ev) => {
      const item = document.createElement("li");
      item.textContent = `${new Date(ev.date).toLocaleDateString("de-DE")} - ${ev.title}`;
      nextEvents.appendChild(item);
    });
  }

  save("events", state.events);
}

function searchDictionary() {
  const query = dictSearch.value.trim();
  if (!query) {
    dictResult.textContent = "Bitte ein Wort eingeben.";
    return;
  }

  const url = `https://www.duden.de/suchen/dudenonline/${encodeURIComponent(query)}`;
  dictResult.innerHTML = `Suche gestartet: <a href="${url}" target="_blank" rel="noopener noreferrer">${query}</a>`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function formatTime(totalSeconds) {
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const sec = (totalSeconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(state.timerSeconds);
}

function startTimer() {
  if (state.timerRunning) {
    return;
  }

  state.timerRunning = true;
  state.timerRef = setInterval(() => {
    state.timerSeconds -= 1;
    renderTimer();

    if (state.timerSeconds <= 0) {
      clearInterval(state.timerRef);
      state.timerRunning = false;
      state.timerSeconds = 0;
      renderTimer();
      alert("Lernblock beendet. Kurze Pause einlegen.");
    }
  }, 1000);
}

function pauseTimer() {
  state.timerRunning = false;
  clearInterval(state.timerRef);
}

function resetTimer() {
  pauseTimer();
  state.timerSeconds = 25 * 60;
  renderTimer();
}

function onCalcInput(value) {
  if (value === "C") {
    state.calcExpr = "";
    calcDisplay.value = "0";
    return;
  }

  if (value === "=") {
    try {
      const sanitized = state.calcExpr.replace(/[^0-9()+\-*/.]/g, "");
      const result = Function(`"use strict"; return (${sanitized || "0"});`)();
      state.calcExpr = String(result);
      calcDisplay.value = state.calcExpr;
    } catch {
      calcDisplay.value = "Fehler";
      state.calcExpr = "";
    }
    return;
  }

  state.calcExpr += value;
  calcDisplay.value = state.calcExpr;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setPage(tab.dataset.page));
});

focusToggle.addEventListener("click", () => {
  state.focusMode = !state.focusMode;
  updateFocusMode();
});

addTaskBtn.addEventListener("click", () => {
  const title = taskTitle.value.trim();
  if (!title) {
    alert("Bitte eine Aufgabe eintragen.");
    return;
  }

  state.tasks.push({
    id: Date.now(),
    title,
    priority: taskPriority.value,
    due: taskDue.value || "",
    done: false
  });

  taskTitle.value = "";
  taskDue.value = "";
  renderTasks();
});

taskList.addEventListener("click", (e) => {
  const toggleBtn = e.target.closest("button[data-toggle-task]");
  if (toggleBtn) {
    const id = Number(toggleBtn.dataset.toggleTask);
    const task = state.tasks.find((t) => t.id === id);
    if (task) {
      task.done = !task.done;
      renderTasks();
    }
    return;
  }

  const removeBtn = e.target.closest("button[data-remove-task]");
  if (removeBtn) {
    const id = Number(removeBtn.dataset.removeTask);
    state.tasks = state.tasks.filter((t) => t.id !== id);
    renderTasks();
  }
});

clearDoneBtn.addEventListener("click", () => {
  state.tasks = state.tasks.filter((t) => !t.done);
  renderTasks();
});

addGradeBtn.addEventListener("click", () => {
  const subject = subjectInput.value.trim();
  const grade = Number(gradeInput.value);
  const weight = Number(weightInput.value || 1);

  if (!subject || !grade || grade < 1 || grade > 6 || weight < 1) {
    alert("Bitte gültige Werte eintragen.");
    return;
  }

  state.grades.push({ subject, grade, weight });
  subjectInput.value = "";
  gradeInput.value = "";
  weightInput.value = "1";
  renderGrades();
});

clearGradesBtn.addEventListener("click", () => {
  state.grades = [];
  renderGrades();
});

gradesTable.addEventListener("click", (e) => {
  const button = e.target.closest("button[data-remove-grade]");
  if (!button) {
    return;
  }
  const index = Number(button.dataset.removeGrade);
  state.grades.splice(index, 1);
  renderGrades();
});

prevMonthBtn.addEventListener("click", () => {
  state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
  renderCalendar();
});

addEventBtn.addEventListener("click", () => {
  const title = eventTitle.value.trim();
  const date = eventDate.value;
  const type = eventType.value;

  if (!title || !date) {
    alert("Bitte Titel und Datum angeben.");
    return;
  }

  state.events.push({ title, date, type });
  eventTitle.value = "";
  eventDate.value = "";
  renderEventList();
  renderCalendar();
});

eventList.addEventListener("click", (e) => {
  const button = e.target.closest("button[data-remove-event]");
  if (!button) {
    return;
  }

  const sorted = [...state.events].sort((a, b) => a.date.localeCompare(b.date));
  const indexInSorted = Number(button.dataset.removeEvent);
  const targetEvent = sorted[indexInSorted];

  state.events = state.events.filter(
    (ev) => !(ev.title === targetEvent.title && ev.date === targetEvent.date && ev.type === targetEvent.type)
  );

  renderEventList();
  renderCalendar();
});

searchWordBtn.addEventListener("click", searchDictionary);
dictSearch.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchDictionary();
  }
});

calcGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-calc]");
  if (!btn) {
    return;
  }
  onCalcInput(btn.dataset.calc);
});

document.addEventListener("keydown", (e) => {
  if (state.currentPage !== "calculator") {
    return;
  }

  if ((e.key >= "0" && e.key <= "9") || ["+", "-", "*", "/", ".", "(", ")"].includes(e.key)) {
    onCalcInput(e.key);
  }
  if (e.key === "Enter") {
    onCalcInput("=");
  }
  if (e.key === "Backspace") {
    state.calcExpr = state.calcExpr.slice(0, -1);
    calcDisplay.value = state.calcExpr || "0";
  }
  if (e.key.toLowerCase() === "c") {
    onCalcInput("C");
  }
});

startTimerBtn.addEventListener("click", startTimer);
pauseTimerBtn.addEventListener("click", pauseTimer);
resetTimerBtn.addEventListener("click", resetTimer);

renderGrades();
renderTasks();
renderEventList();
renderCalendar();
renderTimer();
updateFocusMode();

