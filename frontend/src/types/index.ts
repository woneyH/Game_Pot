export interface User {
  id: number;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  discordId?: string;
}

export interface GameMatchStartResponse {
    gameId: number;
    gameName: string;
    status: string;
}

export interface WaitingUser {
    displayName: string;
}