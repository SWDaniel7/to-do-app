# Firebase Realtime Database 할일 앱

`HTML + CSS + JavaScript`로 만든 간단한 Todo 앱입니다.

## 실행 방법

1. Firebase 콘솔에서 프로젝트 생성
2. Realtime Database 생성
3. `app.js`의 `firebaseConfig` 값을 본인 프로젝트 값으로 교체
4. 프로젝트 폴더에서 간단한 로컬 서버 실행
   - 예: `python3 -m http.server 5500`
5. 브라우저에서 `http://localhost:5500` 열기

## Realtime Database 권한 규칙(개발용 예시)

테스트 단계에서는 아래 규칙으로 시작할 수 있습니다.

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

배포 전에는 인증 기반으로 규칙을 반드시 강화하세요.
