# 🎮 GamePot API Documentation

프론트엔드 개발자를 위한 GamePot 백엔드 API 명세서입니다.

## 🌐 Server Information

| 환경 (Environment) | URL | 비고 |
| :--- | :--- | :--- |
| **Production (Azure)** | **`https://gamepot.azurewebsites.net`** | **배포된 실제 서버** |
| Local Development | `http://localhost:8080` | 로컬 테스트 용 |

> **⚠️ Frontend 개발 필독 (Same-Origin)**
> * 배포 환경에서는 백엔드가 프론트엔드(`index.html`)를 직접 서빙합니다.
> * 따라서 API 호출 시 도메인을 생략하고 **상대 경로(예: `/api/me`)**만 사용하면 됩니다.
> * **인증 방식:** Session Cookie를 사용하므로 모든 요청에 `{ credentials: 'include' }` 옵션이 **필수**입니다.

---

## 1. 🔐 인증 (Auth)

로그인은 API 호출이 아닌 **브라우저 이동**으로 처리됩니다.

| Method | URI | Auth | 설명 | 요청/응답 |
| :--- | :--- | :---: | :--- | :--- |
| **GET** | `/oauth2/authorization/discord` | ❌ | **디스코드 로그인 시작**<br>브라우저 주소창 이동(`window.location.href`) 필요 | **[이동 후 리다이렉트]**<br>로그인 성공 시 `index.html`로 돌아오며<br>URL 쿼리에 유저 정보 포함됨<br>`?id=1&username=...` |
| **POST** | `/api/auth/logout` | ⭕ | **로그아웃**<br>세션 만료 처리 | **[Response]** `200 OK` |

---

## 2. 👤 사용자 (User)

| Method | URI | Auth | 설명 | 요청/응답 |
| :--- | :--- | :---: | :--- | :--- |
| **GET** | `/api/me` | ⭕ | **내 정보 조회**<br>새로고침 시 로그인 유지 확인용 | **[Response]** JSON<br>`{ "username": "...", "displayName": "...", "dbId": 1 }` |

---

## 3. 🕹️ 매칭 시스템 (Matching)

매칭 시스템은 **HTTP Polling (5초 간격)** 방식을 사용합니다.

| Method | URI | Auth | 설명 | 요청/응답 |
| :--- | :--- | :---: | :--- | :--- |
| **POST** | `/api/match/start` | ⭕ | **매칭 시작 (게임 검색)**<br>한글 별명(예: "배그") 검색 지원.<br>자동으로 스팀 공식 ID를 찾아 매칭함. | **[Body]** `{ "gameName": "배그" }`<br>**[Response]** `{ "gameId": 55, "gameName": "PUBG...", "status": "..." }`<br>*(실패 시 404)* |
| **GET** | `/api/match/status/{gameId}` | ⭕ | **매칭 현황 조회 (Polling)**<br>특정 게임 대기열의 유저 목록 조회.<br>**5초마다 주기적 호출 필요.** | **[Path]** `gameId`: 매칭 시작 시 받은 ID<br>**[Response]** `[ { "displayName": "UserA", ... }, ... ]` |
| **POST** | `/api/match/stop` | ⭕ | **매칭 취소**<br>대기열에서 나가기 | **[Response]** `{ "status": "matching stopped" }` |

---

## 💡 Code (Example)

### 1. 로그인 버튼 클릭 시
```javascript
const loginButton = document.getElementById("login-btn");

loginButton.addEventListener("click", () => {
    // 1. 백엔드의 OAuth2 엔드포인트로 브라우저를 이동시킵니다.
    // 2. 로그인 성공 시, 백엔드가 다시 index.html로 리다이렉트 시켜줍니다.
    window.location.href = "/oauth2/authorization/discord";
});
```

### 2. 로그아웃
```javascript
const logoutButton = document.getElementById("logout-btn");

logoutButton.addEventListener("click", async () => {
    try {
        // [중요] credentials: 'include'를 넣어 세션 쿠키를 함께 보냅니다.
        await fetch("/api/auth/logout", { 
            method: "POST", 
            credentials: "include" 
        });
        
        alert("로그아웃 되었습니다.");
        // 로그아웃 후 페이지 새로고침하여 상태 초기화
        window.location.reload(); 
    } catch (error) {
        console.error("Logout failed:", error);
    }
});
```

### 3. 사용자 정보 조회 (로그인한 후 페이지 로드 시 해당 api 호출하여 로그인 상태 확인)
```javascript
async function checkLoginStatus() {
    try {
        const response = await fetch("/api/me", { 
            credentials: 'include' // [중요] 쿠키 전송
        });

        if (!response.ok) {
            console.log("로그인되지 않은 상태입니다.");
            return;
        }

        const userInfo = await response.json();
        console.log("로그인 유저:", userInfo);
        // 예: { username: "user", displayName: "User", discordId: "..." }
        
    } catch (error) {
        console.error("사용자 정보 조회 실패:", error);
    }
}
```

### 4. 매칭 시작
```javascript
const matchButton = document.getElementById("match-btn");
const gameInput = document.getElementById("game-name-input");

matchButton.addEventListener("click", async () => {
    const gameName = gameInput.value;

    try {
        const response = await fetch("/api/match/start", {
            method: 'POST',
            credentials: 'include', // [중요]
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameName: gameName }) // 예: "배그", "철권"
        });

        if (!response.ok) throw new Error("매칭 시작 실패 (게임을 찾을 수 없음)");

        const result = await response.json();
        console.log(`매칭 시작됨! 게임: ${result.gameName}, ID: ${result.gameId}`);
        
        // 매칭 시작 후, 5. 매칭 상태 조회(Polling)를 시작해야 합니다.
        startPolling(result.gameId);

    } catch (error) {
        alert(error.message);
    }
});
```

### 5. 매칭 상태 조회 (주기적으로 호출해야함)
#### 5초마다 상태 갱신 더 실시간 느낌을 위하면 시간 줄이면 됩니다.
```javascript
// 매칭 시작 시 받은 gameId를 사용합니다.
function startPolling(gameId) {
    
    // 5초마다 함수 실행
    setInterval(async () => {
        try {
            const response = await fetch(`/api/match/status/${gameId}`, {
                credentials: 'include' // [중요]
            });
            
            if (response.ok) {
                const users = await response.json();
                
                // users 배열 구조 예시:
                // [
                //   { 
                //     "username": "사용자 이름", 
                //     "displayName": "디스코드 닉네임", 
                //     "email": "이메일값" 
                //   }
                // ]
                
                // 화면 표시 예시 (수정된 요구사항 반영)
                const userList = users.map(u => 
                    `  - 닉네임: ${u.displayName} / ID: ${u.username} / 이메일: ${u.email}`
                ).join('\n');

                console.log("현재 대기 중인 유저 목록:\n" + userList);
                // matchStatusBox.textContent 업데이트 로직에 사용...
            }
        } catch (error) {
            console.error("폴링 에러:", error);
        }
    }, 5000); // 5000ms = 5초
}
```