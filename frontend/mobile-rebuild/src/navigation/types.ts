import type { Color, PlayerInfo, TimeControl, GameResult } from '@/types/index';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  Settings: undefined;
  Profile: { userId: string } | undefined;
  Matchmaking: { timeControlKey?: import('@/types/index').TimeControlKey } | undefined;
  SinglePlayer: undefined;
  Game: {
    matchId: string;
    white: PlayerInfo;
    black: PlayerInfo;
    myColor: Color;
    timeControl: TimeControl;
  };
  PostGame: {
    matchId: string;
    result: GameResult;
  };
  Replay: { matchId: string };
};

export type TabParamList = {
  Play: undefined;
  Puzzles: undefined;
  Learn: undefined;
  Leaderboard: undefined;
};
