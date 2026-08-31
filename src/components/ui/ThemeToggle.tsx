import { Sun, Moon } from 'lucide-react'
import { useThemeStore, resolveTheme } from '@/store/themeStore'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const resolved = resolveTheme(theme)

  return (
    <button
      type="button"
      onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
      aria-label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`rounded-full p-2 text-text-primary hover:bg-bg-elevated ${className}`}
    >
      {resolved === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
