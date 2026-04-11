import { getAuthToken } from "@/auth";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { preloadQuery } from "convex/nextjs";
import DashboardService from "@/components/dashboard/service";

interface DashboardServicepageProps {
  params: {
    id: string;
  };
}

async function DashboardServicepage({ params }: DashboardServicepageProps) {
  const { id } = await params;
  const token = await getAuthToken();

  const services = await preloadQuery(
    api.service.admin.getServiceById,
    { id: id as Id<"service"> },
    { token },
  );

  if (!id)
    return (
      <div className="min-h-screen w-full flex items-center justify-between">
        <p>Invalid service ID</p>
      </div>
    );
  return <DashboardService preloadedServices={services} />;
}

export default DashboardServicepage;
