// Express REST API(로컬 백엔드)로 할일 CRUD를 호출하는 클라이언트 스크립트
const API_BASE = "http://localhost:5000/todos";

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const statusMessage = document.getElementById("status-message");
const todayDate = document.getElementById("today-date");
const todoCount = document.getElementById("todo-count");

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
  const d = new Date(value);
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

async function parseErrorMessage(response) {
  try {
    const data = await response.json();
    if (data && typeof data.message === "string") return data.message;
  } catch {
    /* ignore */
  }
  return response.statusText || "요청에 실패했습니다.";
}

async function apiGetTodos() {
  const res = await fetch(API_BASE, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

async function apiCreateTodo(title) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

async function apiUpdateTodo(id, title) {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

async function apiDeleteTodo(id) {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

function updateCount(todos) {
  todoCount.textContent = `할일 ${todos.length}개`;
}

async function loadTodos() {
  try {
    const list = await apiGetTodos();
    currentTodos = Array.isArray(list) ? list : [];
    setStatus("", "info");
    updateCount(currentTodos);
    renderTodoList();
  } catch (error) {
    setStatus(error.message);
  }
}

async function saveTodoEdit(id, title) {
  if (!title) {
    setStatus("수정할 내용은 비워둘 수 없습니다.");
    return;
  }
  try {
    const updated = await apiUpdateTodo(id, title);
    currentTodos = currentTodos.map((t) =>
      String(t._id) === String(id) ? { ...t, ...updated } : t
    );
    editingTodoId = null;
    renderTodoList();
    updateCount(currentTodos);
    setStatus("", "info");
  } catch (error) {
    setStatus(`수정 실패: ${error.message}`);
  }
}

function renderTodoList() {
  todoList.innerHTML = "";

  if (!currentTodos.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "todo-item";
    emptyItem.innerHTML = `<div class="todo-content"><span class="todo-text">${escapeHtml(
      "할일이 없습니다."
    )}</span></div>`;
    todoList.appendChild(emptyItem);
    return;
  }

  for (const todo of currentTodos) {
    const id = todo._id != null ? String(todo._id) : "";
    if (!id) continue;

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
          await apiDeleteTodo(id);
          currentTodos = currentTodos.filter((t) => String(t._id) !== id);
          if (editingTodoId === id) editingTodoId = null;
          updateCount(currentTodos);
          renderTodoList();
          setStatus("", "info");
        } catch (error) {
          setStatus(`삭제 실패: ${error.message}`);
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

todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = todoInput.value.trim();
  if (!title) return;

  try {
    const created = await apiCreateTodo(title);
    currentTodos = [created, ...currentTodos.filter((t) => String(t._id) !== String(created._id))];
    todoInput.value = "";
    todoInput.focus();
    updateCount(currentTodos);
    renderTodoList();
    setStatus("", "info");
  } catch (error) {
    setStatus(`추가 실패: ${error.message}`);
  }
});

loadTodos();
