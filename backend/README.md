## 백엔드 파트 부분

| 이름       |
| ---------- |
| 김원혁     |
| 임재훈     |


## 📚 개발환경

<ul>
  <li>SpringBoot: 3.5.5</li>
  <li>Java:21</li>
  <li>Intellij</li>
  <li>Gradle - Groovy</li>
  <li>Thymeleaf</li>
  <li>Microsoft Azure MYSQL(version=8.0)</li>
</ul>

<br>
<hr>

 ## ⚙️개발환경구축

1. 아무 폴더 생성
2. cmd 생성한 폴더로 이동
3. git clone [해당 깃헙 리포 URL]
4. IDE에서 폴더 열기 (인텔리제이 권장)
5. Java 21 sdk 버전 맞추기, Gradle Load하기
6. Game_Pot/backend/src/main/resources/application-example.properties 파일안 내용 복사
7. resources 패키안에 복사한 properties api 값 넣기



<br>
<hr>

## 🔗 사용한 API들 
<ul>
  <li>Steam Web API</li>
  <li>Discord login API</li>
</ul>




## 자체 API 명세서

## 🎮 로그인 API
### 공통  (localhost:8080  사용예정)
Base URL: <b>http://localhost:8080</b><br>
인증 방식: Discord OAuth2 → 세션 쿠키  
<br>

### 디스코드 로그인 시작
<strong>GET /oauth2//authorization/discord</strong><br>
설명: 디스코드 로그인 화면 리다이렉트<br>
요청 바디/헤더: 없음<br>
응답: 302 Found (Discored 공식 authorize로 이동)<br>
로그인 버튼 클릭 시 예시 js 코드 : window.location.href = "/oauth2/authorization/discord";

<br>

### 로그인 성공 화면
<b>GET /login/success </b> <br>
설명: 로그인 완료 후 백엔드에서 자동으로 /login/success 페이지로 이동<br>
프론트 동작:  이 화면에서 즉시 /api/me 호출하여 사용자 정보 JSON으로 가져오기<br>
참고: main\resources\static\login\success\index.html  에 로그인 페이지 만들기 권장 index.hmtl

<br>

### 현재 사용자 정보 조회
<b>GET /api/me </b> <br>
설명: 로그인한 사용자의 최소 정보 (DB upsert 완료 기준 ) (id, email, isername) <br>
응답: 200 (JSON) 

<br>

### 화면 흐름 
<ol>
  <li>"/" 홈 페이지에서 디스코드 로그인 버튼 -> /oauth2/authorization/discord</li>
  <li>디스코드 로인 완료시 ->  서버가 /login/success로 리다이렉트</li>
  <li> 성공 화면에서 GET /apu/me 호출 -> {username, email, id} 표시</li>
  <li> 로그아웃 시 POST /api/logout  -> "/" 으로 이동</li>
</ol>
