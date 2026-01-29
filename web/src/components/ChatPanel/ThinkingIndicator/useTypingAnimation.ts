import { useState, useEffect, useCallback, useRef } from 'react'

interface UseTypingAnimationOptions {
  text: string
  baseSpeed?: number
  onComplete?: () => void
}

interface UseTypingAnimationReturn {
  displayedText: string
  cursorVisible: boolean
  isComplete: boolean
  reset: () => void
}

/**
 * Custom hook for typewriter effect with organic timing
 * @param text - The text to animate
 * @param baseSpeed - Base milliseconds per character (default: 35ms)
 * @param onComplete - Callback when typing finishes
 */
export function useTypingAnimation({
  text,
  baseSpeed = 35,
  onComplete,
}: UseTypingAnimationOptions): UseTypingAnimationReturn {
  const [displayedText, setDisplayedText] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)
  const [isComplete, setIsComplete] = useState(false)

  const currentIndexRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Randomize typing speed for organic feel
  const getRandomizedSpeed = useCallback(() => {
    // Vary between 0.7x and 1.4x base speed
    const variance = 0.7 + Math.random() * 0.7
    return Math.floor(baseSpeed * variance)
  }, [baseSpeed])

  // Reset function for phrase changes
  const reset = useCallback(() => {
    currentIndexRef.current = 0
    setDisplayedText('')
    setIsComplete(false)
    setCursorVisible(true)
  }, [])

  // Typing effect
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // If we've typed all characters, mark complete
    if (currentIndexRef.current >= text.length) {
      setIsComplete(true)
      onComplete?.()
      return
    }

    // Type next character
    const typeNextChar = () => {
      if (currentIndexRef.current < text.length) {
        currentIndexRef.current++
        setDisplayedText(text.slice(0, currentIndexRef.current))

        // Schedule next character
        timeoutRef.current = setTimeout(typeNextChar, getRandomizedSpeed())
      } else {
        setIsComplete(true)
        onComplete?.()
      }
    }

    // Start typing with initial delay
    timeoutRef.current = setTimeout(typeNextChar, getRandomizedSpeed())

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [text, getRandomizedSpeed, onComplete])

  // Cursor blink effect (only while typing)
  useEffect(() => {
    if (isComplete) {
      setCursorVisible(false)
      return
    }

    cursorIntervalRef.current = setInterval(() => {
      setCursorVisible((prev) => !prev)
    }, 400)

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current)
      }
    }
  }, [isComplete])

  // Reset when text changes
  useEffect(() => {
    reset()
  }, [text, reset])

  return {
    displayedText,
    cursorVisible,
    isComplete,
    reset,
  }
}
