# 할일 앱 (Express REST + 정적 HTML)

프론트는 **`fetch`로 같은 호스트의 `/todos`**를 호출합니다. 브라우저 주소가 `http://localhost:5001`이면 API도 자동으로 `http://localhost:5001/todos`입니다. 포트 번호를 코드에 따로 적지 않아도 됩니다.

## 한 포트(5001)로 통일하려면

백엔드 Express에서 **이 폴더를 정적 파일로 서빙**하세요. 그다음 브라우저에서는 **`http://localhost:5001`** 만 열면 됩니다. (`python`으로 3000번을 띄울 필요 없음.)

```javascript
const path = require("path");
const express = require("express");

const app = express();

// 할 일 API (기존 라우터)
app.use("/todos", todoRouter);

// 프론트 (이 레포 폴더 경로로 바꾸세요)
app.use(express.static(path.join(__dirname, "..", "todo-firebase")));

app.listen(5001, () => console.log("http://localhost:5001"));
```

루트(`/`)에 `"서버 실행 중"` 같은 텍스트만 보내는 라우트가 있으면, **정적 서빙보다 먼저** 잡혀서 `index.html`이 안 열릴 수 있습니다. 그럴 땐 해당 `app.get("/")`를 지우거나, 정적의 `index.html`을 쓰도록 순서를 조정하세요.

## API 경로가 `/api/todos` 인 경우

`app.js` 맨 위를 아래처럼 바꾸면 됩니다.

```javascript
const API_BASE = new URL("/api/todos", window.location.origin).href;
```

## 백엔드 API 스펙

- 목록: `GET` → JSON 배열 (`_id`, `title`, `createdAt` 등)
- 추가: `POST` + `{ "title": "..." }`
- 수정: `PATCH /:id` + `{ "title": "..." }`
- 삭제: `DELETE /:id`

같은 출처로 열면 CORS 없이 동작합니다. 3000번 등 **다른 포트에서만** HTML을 열 때는 `cors`가 필요할 수 있습니다.

### macOS에서 `localhost:5000` 이 안 될 때

포트 **5000**은 AirPlay 등에 잡히는 경우가 많습니다. 백엔드를 **5001** 등으로 두는 편이 안전합니다.
