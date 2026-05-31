'use client'

import { useState, useEffect, useRef } from 'react'
import { CarModelMeta } from '../config'

interface StepsUIProps {
  isVisible: boolean
  onAnimationComplete: () => void
  carModel: CarModelMeta
}

function buildSteps(model: CarModelMeta): string[] {
  return [
    '正在解析您的活动想法...',
    `已拦截车型上下文，正在注入 ${model.displayName} ${model.tag} 核心卖点...`,
    `正在根据 ${model.displayName} 调性匹配专属 H5 视觉皮肤...`,
  ]
}

export default function StepsUI({ isVisible, onAnimationComplete, carModel }: StepsUIProps) {
  const [activeStep, setActiveStep] = useState<number>(0)
  // Snapshot of carModel at the moment isVisible becomes true
  const snapshotRef = useRef<string[]>(buildSteps(carModel))

  useEffect(() => {
    if (!isVisible) {
      setActiveStep(0)
      return
    }

    // Capture a snapshot of the current carModel when animation starts
    snapshotRef.current = buildSteps(carModel)

    // Reset and start interval when becoming visible
    setActiveStep(0)

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        const next = prev + 1
        if (next >= snapshotRef.current.length) {
          clearInterval(interval)
          onAnimationComplete()
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isVisible]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isVisible) return null

  const steps = snapshotRef.current

  return (
    <div
      className="rounded-xl p-4 text-sm"
      style={{ backgroundColor: '#0D1117', border: '1px solid #1f2937' }}
    >
      {/* Panel header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00D4AA' }} />
        <span className="text-xs font-medium" style={{ color: '#6b7280' }}>
          AI 生成进度
        </span>
      </div>

      {/* Step list */}
      <div className="flex flex-col gap-3">
        {steps.map((step, index) => {
          const isActivated = index < activeStep
          return (
            <div
              key={index}
              className="flex items-start gap-2 animate-fade-in-up"
            >
              {isActivated ? (
                <span
                  className="mt-0.5 text-sm leading-none font-bold flex-shrink-0"
                  style={{ color: '#00D4AA' }}
                >
                  ✓
                </span>
              ) : (
                <span
                  className="mt-0.5 text-sm leading-none flex-shrink-0"
                  style={{ color: '#4b5563' }}
                >
                  ○
                </span>
              )}
              <span style={{ color: isActivated ? '#e5e7eb' : '#6b7280' }}>
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
