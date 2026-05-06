import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getDatabase,
  push,
  ref,
  remove,
  set,
  onValue,
  update,
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDnVsdTFlCxLqJt7kxPzId185LwskYHtL4",
  authDomain: "to-do-test-7779e.firebaseapp.com",
  databaseURL: "https://to-do-test-7779e-default-rtdb.firebaseio.com",
  projectId: "to-do-test-7779e",
  storageBucket: "to-do-test-7779e.firebasestorage.app",
  messagingSenderId: "87819161699",
  appId: "1:87819161699:web:49df66e84bca28a183a856",
};

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const statusMessage = document.getElementById("status-message");
const todayDate = document.getElementById("today-date");
const todoCount = document.getElementById("todo-count");
const toggleAllBtn = document.getElementById("toggle-all-btn");
const clearCompletedBtn = document.getElementById("clear-completed-btn");
const filterButtons = document.querySelectorAll(".filter-btn");
let currentFilter = "all";
let currentTodos = [];
let editingTodoId = null;

function setStatus(message, type = "error") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type === "info" ? "info" : ""}`;
}

function hasPlaceholderConfig() {
  return Object.values(firebaseConfig).some(
    (value) => typeof value === "string" && value.includes("YOUR_")
  );
}

if (hasPlaceholderConfig()) {
  setStatus(
    "Firebase 설정값이 비어 있습니다. app.js의 firebaseConfig를 실제 값으로 바꿔주세요."
  );
  todoForm.addEventListener("submit", (event) => event.preventDefault());
  throw new Error("Firebase config is not set.");
}

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const todosRef = ref(db, "todos");

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDateTime(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setTodayDate() {
  const text = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  todayDate.textContent = text;
}

function filteredTodos(todos) {
  if (currentFilter === "active") {
    return todos.filter(([, todo]) => !todo.completed);
  }
  if (currentFilter === "completed") {
    return todos.filter(([, todo]) => todo.completed);
  }
  return todos;
}

function updateCount(todos) {
  const activeCount = todos.filter(([, todo]) => !todo.completed).length;
  todoCount.textContent = `남은 할일 ${activeCount}개`;
}

async function toggleAllTodos() {
  if (!currentTodos.length) return;
  const shouldCompleteAll = currentTodos.some(([, todo]) => !todo.completed);
  try {
    await Promise.all(
      currentTodos.map(([id]) =>
        update(ref(db, `todos/${id}`), { completed: shouldCompleteAll })
      )
    );
    setStatus("", "info");
  } catch (error) {
    setStatus(`전체 상태 변경 실패: ${error.message}`);
  }
}

async function clearCompletedTodos() {
  const completed = currentTodos.filter(([, todo]) => todo.completed);
  if (!completed.length) return;
  try {
    await Promise.all(completed.map(([id]) => remove(ref(db, `todos/${id}`))));
    setStatus("", "info");
  } catch (error) {
    setStatus(`완료 항목 삭제 실패: ${error.message}`);
  }
}

async function saveTodoEdit(id, text) {
  if (!text) {
    setStatus("수정할 내용은 비워둘 수 없습니다.");
    return;
  }
  try {
    await update(ref(db, `todos/${id}`), { text });
    currentTodos = currentTodos.map(([todoId, todo]) =>
      todoId === id ? [todoId, { ...todo, text }] : [todoId, todo]
    );
    editingTodoId = null;
    renderTodoList();
    setStatus("", "info");
  } catch (error) {
    setStatus(`수정 실패: ${error.message}`);
  }
}

function setFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
  renderTodoList();
}

function renderTodoList() {
  const visibleTodos = filteredTodos(currentTodos);
  todoList.innerHTML = "";

  if (!visibleTodos.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "todo-item";
    emptyItem.innerHTML = `<span class="todo-text">${escapeHtml(
      "표시할 할일이 없습니다."
    )}</span>`;
    todoList.appendChild(emptyItem);
    return;
  }

  for (const [id, todo] of visibleTodos) {
    const li = document.createElement("li");
    li.className = `todo-item ${todo.completed ? "completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!todo.completed;
    checkbox.addEventListener("change", async () => {
      try {
        await update(ref(db, `todos/${id}`), { completed: checkbox.checked });
      } catch (error) {
        setStatus(`상태 변경 실패: ${error.message}`);
        checkbox.checked = !checkbox.checked;
      }
    });

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
      editInput.value = todo.text || "";

      const saveEdit = async () => {
        const nextText = editInput.value.trim();
        await saveTodoEdit(id, nextText);
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
      textSpan.textContent = todo.text || "";
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
          await remove(ref(db, `todos/${id}`));
        } catch (error) {
          setStatus(`삭제 실패: ${error.message}`);
        }
      });
    }

    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(primaryButton);
    li.appendChild(secondaryButton);
    todoList.appendChild(li);
  }
}

setTodayDate();
toggleAllBtn.addEventListener("click", toggleAllTodos);
clearCompletedBtn.addEventListener("click", clearCompletedTodos);
filterButtons.forEach((button) => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = todoInput.value.trim();
  if (!text) return;

  try {
    const newTodoRef = push(todosRef);
    await set(newTodoRef, {
      text,
      completed: false,
      createdAt: Date.now(),
    });

    setStatus("", "info");
    todoInput.value = "";
    todoInput.focus();
  } catch (error) {
    setStatus(`추가 실패: ${error.message}`);
  }
});

onValue(
  todosRef,
  (snapshot) => {
    const todos = snapshot.val() || {};
    currentTodos = Object.entries(todos).sort(
      (a, b) => (b[1]?.createdAt || 0) - (a[1]?.createdAt || 0)
    );

    setStatus("", "info");
    updateCount(currentTodos);
    renderTodoList();
  },
  (error) => {
    setStatus(`데이터 불러오기 실패: ${error.message}`);
  }
);
