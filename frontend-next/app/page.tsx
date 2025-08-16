import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard if authenticated, otherwise to login
  // This will be handled by middleware, but we provide a fallback
  redirect('/auth/login');
}
// Hot reload test comment Tue Aug 12 10:39:43 PM CEST 2025
