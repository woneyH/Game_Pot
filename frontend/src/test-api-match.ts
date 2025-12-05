/**
 * API 테스트용 코드
 *
 * 사용법:
 * 1. 브라우저 콘솔에서 이 파일을 import하거나
 * 2. 개발자 도구에서 직접 실행
 *
 * 예시:
 * import { testMatchAPI, checkStatusField } from './test-api-match';
 * checkStatusField();  // status 필드만 확인
 * testMatchAPI();      // 전체 테스트
 */

import { startMatching, getMatchStatus, stopMatching } from "@/api/match";

/**
 * status 필드만 확인하는 함수
 */
export async function checkStatusField(gameName: string = "배그") {
  console.log("=== status 필드 확인 ===\n");
  console.log(`게임 이름: "${gameName}"으로 매칭 시작 중...\n`);

  try {
    const response = await startMatching(gameName);

    console.log("✅ 매칭 시작 성공!");
    console.log("\n📋 전체 응답 객체:");
    console.log(JSON.stringify(response, null, 2));

    console.log("\n🔍 각 필드 상세:");
    console.log("  - gameId:", response.gameId, `(타입: ${typeof response.gameId})`);
    console.log("  - gameName:", response.gameName, `(타입: ${typeof response.gameName})`);
    console.log("  - status:", response.status, `(타입: ${typeof response.status})`);

    console.log("\n💡 status 값 분석:");
    if (response.status) {
      console.log(`  ✓ status 값: "${response.status}"`);
      console.log(`  ✓ 길이: ${response.status.length}자`);
      console.log(`  ✓ 타입: ${typeof response.status}`);

      // 가능한 값들 추측
      const possibleValues = ["waiting", "matching", "active", "pending", "started", "ready"];
      const lowerStatus = response.status.toLowerCase();
      if (possibleValues.some((v) => lowerStatus.includes(v))) {
        console.log(`  ✓ 예상 상태: ${possibleValues.find((v) => lowerStatus.includes(v))}`);
      }
    } else {
      console.log("  ⚠️ status가 비어있거나 undefined입니다");
    }

    console.log("\n" + "=".repeat(50));
    return response;
  } catch (error) {
    console.error("❌ 테스트 실패:", error);
    if (error instanceof Error) {
      console.error("   에러 메시지:", error.message);
    }
    throw error;
  }
}

export async function testMatchAPI() {
  console.log("=== 매칭 API 테스트 시작 ===\n");

  try {
    // 1. 매칭 시작 테스트
    console.log("1. 매칭 시작 테스트...");
    const startResponse = await startMatching("배그");
    console.log("✅ 매칭 시작 성공:");
    console.log("   - gameId:", startResponse.gameId);
    console.log("   - gameName:", startResponse.gameName);
    console.log("   - status:", startResponse.status, `(타입: ${typeof startResponse.status})`); // 이게 뭔지 확인하고 싶은 필드
    console.log("");

    const gameId = startResponse.gameId;

    // 2. 매칭 상태 조회 테스트 (즉시)
    console.log("2. 매칭 상태 조회 테스트 (즉시)...");
    const status1 = await getMatchStatus(gameId);
    console.log("✅ 현재 대기 중인 사용자:", status1.length, "명");
    status1.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.displayName}`);
    });
    console.log("");

    // 3. 5초 후 다시 조회
    console.log("3. 5초 후 매칭 상태 재조회...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const status2 = await getMatchStatus(gameId);
    console.log("✅ 업데이트된 대기 중인 사용자:", status2.length, "명");
    status2.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.displayName}`);
    });
    console.log("");

    // 4. 매칭 취소 테스트
    console.log("4. 매칭 취소 테스트...");
    await stopMatching();
    console.log("✅ 매칭 취소 성공");
    console.log("");

    console.log("=== 테스트 완료 ===");
  } catch (error) {
    console.error("❌ 테스트 실패:", error);
    if (error instanceof Error) {
      console.error("   에러 메시지:", error.message);
    }
  }
}

// 개별 함수로도 테스트 가능
export async function testStartMatching(gameName: string = "배그") {
  console.log(`매칭 시작 테스트: ${gameName}`);
  const result = await startMatching(gameName);
  console.log("응답:", result);
  console.log("status 필드 값:", result.status);
  console.log("status 타입:", typeof result.status);
  return result;
}

export async function testGetStatus(gameId: number) {
  console.log(`매칭 상태 조회 테스트: gameId=${gameId}`);
  const users = await getMatchStatus(gameId);
  console.log("대기 중인 사용자:", users);
  return users;
}

export async function testStopMatching() {
  console.log("매칭 취소 테스트");
  await stopMatching();
  console.log("매칭 취소 완료");
}
