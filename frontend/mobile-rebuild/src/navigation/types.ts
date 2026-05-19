import type { Color, PlayerInfo, TimeControl, GameResult } from '@/types/index';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  Settings: undefined;
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
};

export type TabParamList = {
  Play: undefined;
};
