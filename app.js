// Express 백엔드(localhost:5001) REST API로 할일 CRUD를 수행하는 클라이언트
const API_BASE = "http://localhost:5001/todos";

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const statusMessage = document.getElementById("status-message");
const todayDate = document.getElementById("today-date");
const todoCount = document.getElementById("todo-count");
const refreshBtn = document.getElementById("refresh-btn");

let currentTodos = [];
let editingTodoId = null;

function setStatus(message, type = "error") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type === "info" ? "info" : ""}`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDateTime(value) {
  if (value == null || value === "") return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setTodayDate() {
  todayDate.textContent = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function updateCount(todos) {
  todoCount.textContent = `할일 ${todos.length}개`;
}

async function apiRequest(path, options = {}) {
  const url = path ? `${API_BASE}/${path}` : API_BASE;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data.message === "string"
        ? data.message
        : `요청 실패 (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

async function loadTodos() {
  try {
    const todos = await apiRequest("", { method: "GET" });
    if (!Array.isArray(todos)) {
      throw new Error("목록 형식이 올바르지 않습니다.");
    }
    currentTodos = todos;
    if (editingTodoId && !currentTodos.some((t) => String(t._id) === editingTodoId)) {
      editingTodoId = null;
    }
    setStatus("", "info");
    updateCount(currentTodos);
    renderTodoList();
  } catch (error) {
    setStatus(error.message);
  }
}

async function saveTodoEdit(id, title) {
  if (!title) {
    setStatus("제목은 비워둘 수 없습니다.");
    return;
  }
  try {
    const updated = await apiRequest(id, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
    currentTodos = currentTodos.map((t) =>
      String(t._id) === id ? { ...t, ...updated } : t
    );
    editingTodoId = null;
    renderTodoList();
    setStatus("", "info");
  } catch (error) {
    setStatus(error.message);
  }
}

function renderTodoList() {
  todoList.innerHTML = "";

  if (!currentTodos.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "todo-item";
    emptyItem.innerHTML = `<span class="todo-text">${escapeHtml(
      "할일이 없습니다. 위에서 추가해 보세요."
    )}</span>`;
    todoList.appendChild(emptyItem);
    return;
  }

  for (const todo of currentTodos) {
    const id = String(todo._id);
    const li = document.createElement("li");
    li.className = "todo-item";

    const content = document.createElement("div");
    content.className = "todo-content";

    const dateSpan = document.createElement("span");
    dateSpan.className = "todo-date";
    dateSpan.textContent = `생성: ${formatDateTime(todo.createdAt)}`;

    const primaryButton = document.createElement("button");
    const secondaryButton = document.createElement("button");

    if (editingTodoId === id) {
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "edit-input";
      editInput.value = todo.title || "";

      const saveEdit = async () => {
        const nextTitle = editInput.value.trim();
        await saveTodoEdit(id, nextTitle);
      };

      editInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          await saveEdit();
        }
      });

      primaryButton.className = "save-btn";
      primaryButton.textContent = "저장";
      primaryButton.addEventListener("click", saveEdit);

      secondaryButton.className = "secondary-btn";
      secondaryButton.textContent = "취소";
      secondaryButton.addEventListener("click", () => {
        editingTodoId = null;
        renderTodoList();
      });

      content.appendChild(editInput);
      content.appendChild(dateSpan);
    } else {
      const textSpan = document.createElement("span");
      textSpan.className = "todo-text";
      textSpan.textContent = todo.title || "";
      content.appendChild(textSpan);
      content.appendChild(dateSpan);

      primaryButton.className = "edit-btn";
      primaryButton.textContent = "수정";
      primaryButton.addEventListener("click", () => {
        editingTodoId = id;
        renderTodoList();
      });

      secondaryButton.className = "delete-btn";
      secondaryButton.textContent = "삭제";
      secondaryButton.addEventListener("click", async () => {
        try {
          await apiRequest(id, { method: "DELETE" });
          if (editingTodoId === id) editingTodoId = null;
          await loadTodos();
        } catch (error) {
          setStatus(error.message);
        }
      });
    }

    li.appendChild(content);
    li.appendChild(primaryButton);
    li.appendChild(secondaryButton);
    todoList.appendChild(li);
  }
}

setTodayDate();
refreshBtn.addEventListener("click", () => loadTodos());

todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = todoInput.value.trim();
  if (!title) return;

  try {
    await apiRequest("", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    setStatus("", "info");
    todoInput.value = "";
    todoInput.focus();
    await loadTodos();
  } catch (error) {
    setStatus(error.message);
  }
});

loadTodos();
