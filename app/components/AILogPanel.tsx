'use client'

import { useState, useEffect } from 'react'

interface AILogPanelProps {
  isVisible: boolean
}

const LOG_MESSAGES = [
  '🔍 正在解析销售需求...',
  '🎨 正在匹配小鹏官方 VI 规范...',
  '🚗 正在注入小鹏 GX 车型卖点...',
  '✅ 活动页面生成完毕，正在渲染...',
]

export default function AILogPanel({ isVisible }: AILogPanelProps) {
  const [visibleCount, setVisibleCount] = useState<number>(0)

  useEffect(() => {
    if (!isVisible) {
      setVisibleCount(0)
      return
    }

    // Reset and start interval when becoming visible
    setVisibleCount(0)

    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        const next = prev + 1
        if (next >= LOG_MESSAGES.length) {
          clearInterval(interval)
        }
        return next
      })
    }, 600)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      className="rounded-xl p-4 font-mono text-sm"
      style={{ backgroundColor: '#0D1117', border: '1px solid #1f2937' }}
    >
      {/* Terminal header dots */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 opacity-70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-70" />
        <span className="ml-2 text-xs" style={{ color: '#6b7280' }}>
          ai-engine — bash
        </span>
      </div>

      {/* Log lines */}
      <div className="flex flex-col gap-2">
        {LOG_MESSAGES.slice(0, visibleCount).map((msg, index) => (
          <div
            key={index}
            className="flex items-start gap-2 animate-fade-in-up"
            style={{ color: '#00D4AA' }}
          >
            <span className="mt-0.5 text-xs leading-none" style={{ color: '#00D4AA' }}>
              ●
            </span>
            <span>{msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
