/**
 * 브라우저 콘솔에서 바로 실행할 수 있는 간단한 테스트 코드
 *
 * 사용법:
 * 1. 개발자 도구(F12) 열기
 * 2. Console 탭 선택
 * 3. 아래 코드를 복사해서 붙여넣고 Enter
 *
 * 또는 이 파일을 열어서 전체를 복사해서 콘솔에 붙여넣기
 */

(async function checkStatus() {
  console.log("=== status 필드 확인 ===\n");

  try {
    const BACKEND_URL = "https://gamepot.azurewebsites.net";

    console.log("매칭 시작 API 호출 중...");
    const response = await fetch(`${BACKEND_URL}/api/match/start`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameName: "배그" }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `서버 오류: ${response.status}`);
    }

    const data = await response.json();

    console.log("\n✅ 응답 받음!");
    console.log("\n📋 전체 응답:");
    console.log(JSON.stringify(data, null, 2));

    console.log("\n🔍 각 필드:");
    console.log("  gameId:", data.gameId);
    console.log("  gameName:", data.gameName);
    console.log("  status:", data.status);

    console.log("\n💡 status 상세 분석:");
    console.log("  값:", JSON.stringify(data.status));
    console.log("  타입:", typeof data.status);
    console.log("  길이:", data.status?.length || "N/A");

    if (data.status) {
      console.log("\n📝 status 값의 가능한 의미:");
      const statusLower = String(data.status).toLowerCase();
      if (statusLower.includes("wait")) console.log("  - 대기 중");
      if (statusLower.includes("match")) console.log("  - 매칭 중");
      if (statusLower.includes("active")) console.log("  - 활성");
      if (statusLower.includes("ready")) console.log("  - 준비됨");
      if (statusLower.includes("start")) console.log("  - 시작됨");
    }

    console.log("\n" + "=".repeat(50));

    return data;
  } catch (error) {
    console.error("❌ 오류 발생:", error.message);
    console.error("전체 에러:", error);
  }
})();
