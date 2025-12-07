import { useState, useEffect, useRef, useCallback } from "react";
import { startMatching, getMatchStatus, stopMatching } from "@/api/match";
import type { WaitingUser } from "@/types";

export type MatchType = "join" | "create" | "";

export interface MatchingState {
  // 폼 입력 상태
  selectedGame: string;
  gameSearch: string;
  matchType: MatchType;
  playerCount: string;

  // 매칭 상태
  isMatching: boolean;
  matchedGameName: string;
  matchedGameId: number | null;
  waitingUsers: WaitingUser[];
  error: string | null;
}

export function useMatching() {
  // 폼 입력 상태
  const [selectedGame, setSelectedGame] = useState("");
  const [gameSearch, setGameSearch] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("");
  const [playerCount, setPlayerCount] = useState("");

  // 매칭 상태
  const [isMatching, setIsMatching] = useState(false);
  const [matchedGameName, setMatchedGameName] = useState("");
  const [matchedGameId, setMatchedGameId] = useState<number | null>(null);
  const [waitingUsers, setWaitingUsers] = useState<WaitingUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 폴링 시작
  const startPolling = useCallback((gameId: number) => {
    // 기존 폴링 정리
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // 즉시 한 번 조회
    getMatchStatus(gameId)
      .then((users) => {
        setWaitingUsers(users);
      })
      .catch((e) => {
        console.error("매칭 상태 조회 실패:", e);
      });

    // 5초마다 폴링
    pollIntervalRef.current = setInterval(async () => {
      try {
        const users = await getMatchStatus(gameId);
        setWaitingUsers(users);
      } catch (e) {
        console.error("매칭 상태 조회 실패:", e);
      }
    }, 2000);
  }, []);

  // 폴링 정리
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // 매칭 시작
  const handleStartMatching = useCallback(async () => {
    // 유효성 검사 - 게임만 선택하면 됨
    if (!selectedGame) {
      return;
    }

    // 매칭 방식 관련 검사는 주석 처리 (나중에 사용할 수 있음)
    // if (!matchType || (matchType === "create" && !playerCount)) {
    //   return;
    // }

    setError(null);
    setIsMatching(true);

    try {
      // API 호출
      const data = await startMatching(selectedGame);

      // 응답 데이터 저장
      setMatchedGameName(data.gameName);
      setMatchedGameId(data.gameId);

      // 폴링 시작
      startPolling(data.gameId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "매칭 시작 실패";
      setError(errorMessage);
      setIsMatching(false);
      alert(errorMessage);
    }
  }, [selectedGame, startPolling]);

  // 매칭 취소
  const handleCancelMatching = useCallback(async () => {
    try {
      // 폴링 정리
      stopPolling();

      // API 호출
      await stopMatching();
    } catch (err) {
      console.error("매칭 취소 실패:", err);
    } finally {
      // 상태 초기화
      setIsMatching(false);
      setMatchedGameName("");
      setMatchedGameId(null);
      setWaitingUsers([]);
      setError(null);
    }
  }, [stopPolling]);

  // 전체 상태 초기화
  const resetMatching = useCallback(() => {
    stopPolling();
    setIsMatching(false);
    setMatchedGameName("");
    setMatchedGameId(null);
    setWaitingUsers([]);
    setError(null);
  }, [stopPolling]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // 매칭 시작 가능 여부 - 게임만 선택하면 됨
  const canStartMatching = !!selectedGame;
  // 기존 로직 (나중에 사용할 수 있음)
  // const canStartMatching = selectedGame && matchType && (matchType === "join" || playerCount);

  return {
    // 폼 입력 상태
    selectedGame,
    setSelectedGame,
    gameSearch,
    setGameSearch,
    matchType,
    setMatchType,
    playerCount,
    setPlayerCount,

    // 매칭 상태
    isMatching,
    matchedGameName,
    matchedGameId,
    waitingUsers,
    error,

    // 액션
    handleStartMatching,
    handleCancelMatching,
    resetMatching,
    canStartMatching,
  };
}
