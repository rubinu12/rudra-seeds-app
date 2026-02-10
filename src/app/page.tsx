import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default async function Page() {
  const session = await auth();

  // 1. If not logged in, go to Login Page
  if (!session) {
    redirect('/login');
  }

  // 2. If Admin -> Admin Dashboard
  if (session.user.role === 'admin' ) {
    redirect('/admin/dashboard');
  }

  // 3. If Employee -> Employee Dashboard
  if (session.user.role === 'employee') {
    redirect('/employee/dashboard');
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
       <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
    </div>
  );
}