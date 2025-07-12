import { useCallback } from 'react'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return (
    <button
      className='size-8 inline-flex items-center justify-center gap-2 border-2 border-neutral-7 rounded-lg bg-neutral-3 text-neutral-11 outline-none disabled:pointer-events-none disabled:border-neutral-7 active:bg-neutral-5 disabled:bg-neutral-4 hover:bg-neutral-4 disabled:text-neutral-11 disabled:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-8 focus-visible:ring-offset-neutral-1'
      onClick={toggleTheme}
      title='Toggle theme'
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='24'
        height='24'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        className='size-4.5'
      >
        <path stroke='none' d='M0 0h24v24H0z' fill='none' />
        <path d='M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0' />
        <path d='M12 3l0 18' />
        <path d='M12 9l4.65 -4.65' />
        <path d='M12 14.3l7.37 -7.37' />
        <path d='M12 19.6l8.85 -8.85' />
      </svg>
      <span className='sr-only'>Toggle theme</span>
    </button>
  )
}
