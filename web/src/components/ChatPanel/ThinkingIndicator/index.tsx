import { useState, useEffect, useCallback, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { thinkingPhrases, shuffleArray } from './thinkingPhrases'
import { useTypingAnimation } from './useTypingAnimation'
import clsx from 'clsx'

type AnimationPhase = 'typing' | 'paused' | 'exiting'

/**
 * Animated thinking indicator with typewriter effect
 * Displays personality-rich phrases while Donna is processing
 */
export function ThinkingIndicator() {
  // Shuffle phrases on mount so we don't repeat until all shown
  const [shuffledPhrases] = useState(() => shuffleArray(thinkingPhrases))
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [phase, setPhase] = useState<AnimationPhase>('typing')

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentPhrase = shuffledPhrases[currentPhraseIndex % shuffledPhrases.length]

  // Handle typing completion
  const handleTypingComplete = useCallback(() => {
    // Move to paused phase
    setPhase('paused')

    // After pause, start exit animation
    timeoutRef.current = setTimeout(() => {
      setPhase('exiting')

      // After exit animation, show next phrase
      timeoutRef.current = setTimeout(() => {
        setCurrentPhraseIndex((prev) => prev + 1)
        setPhase('typing')
      }, 300) // Exit animation duration
    }, 1000) // Pause duration
  }, [])

  // Typing animation hook
  const { displayedText, cursorVisible } = useTypingAnimation({
    text: currentPhrase,
    baseSpeed: 35,
    onComplete: handleTypingComplete,
  })

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="flex items-center gap-2 pt-1">
      {/* Sparkles icon with pulsing animation */}
      <Sparkles className="h-4 w-4 text-donna-purple animate-thinking-pulse flex-shrink-0 self-center" />

      {/* Animated text container */}
      <div
        className={clsx(
          'text-sm text-donna-text-secondary font-medium transition-all duration-300',
          phase === 'exiting' && 'animate-fade-up-out',
          phase === 'typing' && 'animate-fade-up-in'
        )}
      >
        <span>{displayedText}</span>
        {/* Blinking cursor */}
        {cursorVisible && (
          <span className="inline-block w-0.5 h-4 bg-donna-purple ml-0.5 align-middle animate-typewriter-cursor" />
        )}
      </div>
    </div>
  )
}
