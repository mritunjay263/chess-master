// src/components/Pieces/ChessPiece.tsx — SVG pieces, fully memoized
import React, { memo } from 'react';
import Svg, { Path, Circle, G, Rect } from 'react-native-svg';
import type { PieceType, PieceColor } from '../../types';

interface Props { type: PieceType; color: PieceColor; size: number; }
const SW = 1.5;
type SP = { fill: string; stroke: string };

const PIECES: Record<PieceType, (p: SP) => React.JSX.Element> = {
  p: ({fill,stroke}) => <G><Circle cx="22" cy="13" r="4" fill={fill} stroke={stroke} strokeWidth={SW}/><Path d="M17,17 C15,21 15,27 17,30 L15,36 L29,36 L27,30 C29,27 29,21 27,17Z" fill={fill} stroke={stroke} strokeWidth={SW}/><Rect x="13" y="36" width="18" height="2" rx="1" fill={fill} stroke={stroke} strokeWidth={SW}/></G>,
  n: ({fill,stroke}) => <G><Path d="M14,29 C11,23 13,16 18,12 C18,12 17,10 22,10 C27,10 30,14 28,20 L29,28 L27,36 L17,36Z" fill={fill} stroke={stroke} strokeWidth={SW}/><Circle cx="21" cy="14" r="1.5" fill={stroke}/><Rect x="13" y="36" width="18" height="2" rx="1" fill={fill} stroke={stroke} strokeWidth={SW}/></G>,
  b: ({fill,stroke}) => <G><Circle cx="22" cy="10" r="3" fill={fill} stroke={stroke} strokeWidth={SW}/><Path d="M16,36 L28,36 L27,20 C26,15 18,15 17,20Z" fill={fill} stroke={stroke} strokeWidth={SW}/><Path d="M13,30 L31,30" stroke={stroke} strokeWidth={SW+0.5}/><Rect x="13" y="36" width="18" height="2" rx="1" fill={fill} stroke={stroke} strokeWidth={SW}/></G>,
  r: ({fill,stroke}) => <G><Path d="M14,18 L14,36 L30,36 L30,18Z" fill={fill} stroke={stroke} strokeWidth={SW}/><Rect x="13" y="10" width="5" height="8" rx="1" fill={fill} stroke={stroke} strokeWidth={SW}/><Rect x="19" y="10" width="6" height="8" rx="1" fill={fill} stroke={stroke} strokeWidth={SW}/><Rect x="26" y="10" width="5" height="8" rx="1" fill={fill} stroke={stroke} strokeWidth={SW}/><Path d="M17,25 L27,25" stroke={stroke} strokeWidth={SW}/><Rect x="12" y="36" width="20" height="2" rx="1" fill={fill} stroke={stroke} strokeWidth={SW}/></G>,
  q: ({fill,stroke}) => <G><Path d="M13,14 L16,36 L28,36 L31,14 L22,22Z" fill={fill} stroke={stroke} strokeWidth={SW}/><Circle cx="22" cy="9" r="2.5" fill={fill} stroke={stroke} strokeWidth={SW}/><Circle cx="13" cy="13" r="2" fill={fill} stroke={stroke} strokeWidth={SW}/><Circle cx="31" cy="13" r="2" fill={fill} stroke={stroke} strokeWidth={SW}/><Path d="M16,28 L28,28" stroke={stroke} strokeWidth={SW}/><Rect x="13" y="36" width="18" height="2" rx="1" fill={fill} stroke={stroke} strokeWidth={SW}/></G>,
  k: ({fill,stroke}) => <G><Path d="M15,36 L29,36 L29,18 C29,14 15,14 15,18Z" fill={fill} stroke={stroke} strokeWidth={SW}/><Rect x="20" y="6" width="4" height="9" rx="1" fill={fill} stroke={stroke} strokeWidth={SW}/><Rect x="17" y="9" width="10" height="3" rx="1" fill={fill} stroke={stroke} strokeWidth={SW}/><Path d="M15,24 L29,24" stroke={stroke} strokeWidth={SW}/><Rect x="13" y="36" width="18" height="2" rx="1" fill={fill} stroke={stroke} strokeWidth={SW}/></G>,
};

export const ChessPiece = memo(({ type, color, size }: Props) => {
  const fill = color === 'w' ? '#FFFFFF' : '#1A1A1A';
  const stroke = color === 'w' ? '#2C2C2C' : '#DDDDDD';
  return (
    <Svg width={size * 0.82} height={size * 0.82} viewBox="0 0 45 45">
      {PIECES[type]({ fill, stroke })}
    </Svg>
  );
}, (p, n) => p.type === n.type && p.color === n.color && p.size === n.size);
