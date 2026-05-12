// src/navigation/types.ts — typed route params
import type { Color, PlayerInfo, TimeControl, GameResult } from '@/types/index';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  Matchmaking: { timeControlKey?: import('@/types/index').TimeControlKey } | undefined;
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
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};
