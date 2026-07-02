import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import DashboardFooter from "@/components/dashboard/footer";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main className="flex-1 w-full min-h-screen bg-background">
        <DashboardHeader />
        <div className="pb-20 lg:pb-0">{children}</div>
        <DashboardFooter />
      </main>
    </SidebarProvider>
  );
}
