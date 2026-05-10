# 할일 앱 (프론트 + Express REST)

`HTML + CSS + JavaScript` 프론트엔드가 **로컬 Express API**(`localhost:5000`)와 통신해 할일을 추가·조회·수정·삭제합니다.

## API 전제

백엔드에서 라우터가 아래와 같이 붙어 있다고 가정합니다.

- `GET /todos` — 목록
- `POST /todos` — 본문 `{ "title": "..." }`
- `PATCH /todos/:id` — 본문 `{ "title": "..." }`
- `DELETE /todos/:id`

마운트 경로가 다르면 `app.js` 상단의 `API_BASE`를 수정하세요.

```js
const API_BASE = "http://localhost:5000/todos";
```

## CORS

브라우저에서 프론트를 다른 포트(또는 `file://`)로 열면 백엔드에 **CORS 허용**이 필요합니다. 예: `cors` 패키지로 `http://localhost:5500` 등 프론트 출처를 허용.

## 프론트 실행

1. 백엔드를 `5000` 포트에서 실행
2. 이 폴더에서 정적 서버 실행  
   예: `python3 -m http.server 5500`
3. 브라우저에서 `http://localhost:5500` 열기
