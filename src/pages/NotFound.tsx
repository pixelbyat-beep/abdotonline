import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-28 text-center">
      <span className="text-5xl font-bold text-accent">404</span>
      <h1 className="mt-3 text-xl font-semibold text-text-primary">Page not found</h1>
      <p className="mt-2 text-sm text-text-secondary">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="mt-6">
        <Button>Back to Home</Button>
      </Link>
    </div>
  )
}
