import { getAuthToken } from "@/auth";
import Services from "@/components/dashboard/services";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";

async function DashboardServices() {
  const token = await getAuthToken();

  const services = await preloadQuery(
    api.service.admin.getBusinessServices,
    {},
    { token },
  );
  return <Services preloadedServices={services} />;
}

export default DashboardServices;
