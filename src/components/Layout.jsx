import { Outlet } from 'react-router-dom';
import Nav from './Nav';
import InstanceSwitcher from './InstanceSwitcher';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-40 shrink-0 bg-bg-sidebar border-r border-border flex flex-col">
        <div className="px-3 py-3 border-b border-border">
          <h1 className="text-[10px] font-bold text-cyan tracking-widest">
            HYPERWATCH
          </h1>
        </div>
        <InstanceSwitcher />
        <Nav />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
