import { Link } from 'wouter'

export default function NotFoundPage() {
  return (
    <div className='fixed inset-0 flex items-center justify-center p-4 bg-neutral-1/80 backdrop-blur-sm'>
      <div className='w-full max-w-2xl p-6 bg-neutral-1 border border-neutral-6 rounded-lg shadow-lg'>
        <div className='space-y-4'>
          <h2 className='text-2xl font-bold text-danger-11'>404 Not Found</h2>

          <div className='space-y-2'>
            <p className='text-sm text-neutral-11'>
              It looks like you've reached a page that doesn't exist.
            </p>
          </div>

          <div className='flex gap-4 mt-6'>
            <Link
              to='/'
              className='px-4 py-2 text-sm font-medium text-neutral-11 bg-neutral-3 rounded-md hover:bg-neutral-4 transition-colors'
            >
              Take me back home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
