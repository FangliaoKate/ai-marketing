'use client';

import { useState, useRef } from 'react';
import { Prize, ThemeTokens } from '../config';

interface SpinWheelProps {
  prizes: Prize[];
  isFormSubmitted: boolean;
  themeTokens: ThemeTokens;
}

export default function SpinWheel({ prizes, isFormSubmitted, themeTokens }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const wheelRef = useRef<SVGSVGElement>(null);

  // SVG 转盘参数
  const cx = 100, cy = 100, r = 90;
  const sectorCount = prizes.length;
  const sectorAngle = 360 / sectorCount;

  // 计算扇形 SVG path
  function getSectorPath(index: number): string {
    const startAngle = (index * sectorAngle - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * sectorAngle - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  }

  // 计算扇形文字位置（扇形中线，距圆心 55px）
  function getTextTransform(index: number): string {
    const midAngle = (index * sectorAngle + sectorAngle / 2 - 90) * (Math.PI / 180);
    const tx = cx + 55 * Math.cos(midAngle);
    const ty = cy + 55 * Math.sin(midAngle);
    const rotateDeg = index * sectorAngle + sectorAngle / 2;
    return `translate(${tx}, ${ty}) rotate(${rotateDeg})`;
  }

  function handleSpin() {
    if (!isFormSubmitted) {
      setShowPrompt(true);
      setTimeout(() => setShowPrompt(false), 2000);
      return;
    }
    if (isSpinning) return;

    const selectedIndex = Math.floor(Math.random() * prizes.length);
    // 指针在 12 点方向（顶部），扇区 0 从 -90° 开始
    // 要让 selectedIndex 扇区中心对准 12 点（0°），需要旋转：
    const targetRotation = rotation + 360 * 5 + (360 - selectedIndex * sectorAngle - sectorAngle / 2);

    setIsSpinning(true);
    setWinnerIndex(null);
    setRotation(targetRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinnerIndex(selectedIndex);
    }, 4100);
  }

  // 将奖品名分成两行（每行最多4个字符）
  function splitPrizeName(name: string): [string, string] {
    if (name.length <= 4) return [name, ''];
    return [name.slice(0, 4), name.slice(4, 8)];
  }

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-4">
      <div className="text-center mb-3">
        <p className="text-white font-bold text-sm">🎰 幸运大转盘</p>
        <p className="text-gray-400 text-xs mt-1">填写信息后参与抽奖</p>
      </div>

      {/* 转盘容器 */}
      <div className="relative">
        {/* 顶部指针 */}
        <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 z-10">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <polygon points="8,0 0,16 16,16" fill={themeTokens.pointerColor} />
          </svg>
        </div>

        {/* SVG 转盘 */}
        <div
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            filter: `drop-shadow(0 0 8px ${themeTokens.ringColor}80)`,
          }}
        >
          <svg
            ref={wheelRef}
            viewBox="0 0 200 200"
            width="200"
            height="200"
          >
            {prizes.map((prize, index) => (
              <g key={prize.id}>
                <path
                  d={getSectorPath(index)}
                  fill={winnerIndex === index ? '#FFD700' : themeTokens.sectorColors[index % 2]}
                  stroke="#0A0A0A"
                  strokeWidth="1"
                />
                <text
                  transform={getTextTransform(index)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="6.5"
                  fill="white"
                  fontWeight="bold"
                >
                  <tspan x="0" dy="0">{splitPrizeName(prize.name)[0]}</tspan>
                  <tspan x="0" dy="9">{splitPrizeName(prize.name)[1]}</tspan>
                </text>
              </g>
            ))}
            {/* 外圈 */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={themeTokens.ringColor} strokeWidth="2" />
            {/* 中心圆 */}
            <circle cx={cx} cy={cy} r="12" fill="#0A0A0A" stroke={themeTokens.ringColor} strokeWidth="2" />
          </svg>
        </div>

        {/* 中心抽奖按钮（绝对定位在转盘中心） */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full text-[8px] font-bold text-black z-10 disabled:opacity-60 disabled:cursor-not-allowed ${isFormSubmitted && winnerIndex === null && !isSpinning ? 'animate-pulse' : ''}`}
          style={{
            background: isFormSubmitted && !isSpinning ? themeTokens.pointerColor : '#888',
          }}
        >
          抽奖
        </button>
      </div>

      {/* 提示文字 */}
      {showPrompt && (
        <div className="text-xs text-center animate-fade-in" style={{ color: themeTokens.secondary }}>
          请先锁定品鉴名额
        </div>
      )}

      {/* 获奖结果 */}
      {winnerIndex !== null && (
        <div className="text-center animate-fade-in-up">
          <p className="text-gray-400 text-xs mb-1">🎉 恭喜您获得</p>
          <p className="text-sm font-bold" style={{ color: themeTokens.secondary }}>{prizes[winnerIndex].name}</p>
        </div>
      )}
    </div>
  );
}
