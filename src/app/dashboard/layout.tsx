import Sidebar from '@/components/dashboard/Sidebar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden md:pl-56">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pt-16 sm:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}


