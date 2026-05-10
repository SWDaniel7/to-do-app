# 할일 앱 (Express REST + 정적 HTML)

프론트는 `fetch`로 백엔드 `http://localhost:5001`의 할일 API를 호출합니다.

## API 경로

`app.js` 맨 위 `API_BASE`를 서버에서 라우터를 붙인 경로에 맞게 수정하세요.

- 예: `app.use("/todos", todoRouter)` → `http://localhost:5001/todos`
- 예: `app.use("/api/todos", todoRouter)` → `http://localhost:5001/api/todos`

## 백엔드와 맞추기

- 목록: `GET` → JSON 배열 (`_id`, `title`, `createdAt` 등)
- 추가: `POST` + `{ "title": "..." }`
- 수정: `PATCH /:id` + `{ "title": "..." }`
- 삭제: `DELETE /:id`

브라우저에서 열려면 Express에 `cors` 미들웨어가 필요할 수 있습니다.

### macOS에서 `localhost:5000` 이 안 될 때

포트 **5000**은 AirPlay 수신(AirTunes) 등 시스템 서비스가 쓰는 경우가 많습니다. Network 탭에서 응답 `Server: AirTunes/...` 이면 Express가 아니라 그 서비스에 요청이 간 것입니다. 백엔드를 **5001** 등 다른 포트로 두고, 프론트의 `API_BASE`도 같은 포트로 맞추세요.

## 로컬에서 프론트 실행

```bash
python3 -m http.server 3000
```

브라우저에서 `http://localhost:3000` 을 열고, 백엔드는 `5001` 포트에서 실행하세요.
