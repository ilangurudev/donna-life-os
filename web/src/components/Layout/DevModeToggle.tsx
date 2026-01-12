import { useDevMode } from '../../stores/useDevMode'
import { Code, Sparkles } from 'lucide-react'
import clsx from 'clsx'

export function DevModeToggle() {
  const { devMode, toggleDevMode } = useDevMode()

  return (
    <button
      onClick={toggleDevMode}
      className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
        devMode
          ? 'bg-donna-purple/20 text-donna-purple hover:bg-donna-purple/30'
          : 'bg-donna-green/20 text-donna-green hover:bg-donna-green/30'
      )}
      title={devMode ? 'Switch to production mode (hide technical details)' : 'Switch to dev mode (show thinking & tools)'}
    >
      {devMode ? (
        <>
          <Code className="h-4 w-4" />
          <span>Dev</span>
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          <span>Clean</span>
        </>
      )}
    </button>
  )
}
