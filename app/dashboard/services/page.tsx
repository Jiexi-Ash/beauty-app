import { getAuthToken } from "@/auth";
import DashboardFooter from "@/components/dashboard/footer";
import Services from "@/components/dashboard/services";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import React from "react";

async function DashboardServices() {
  const token = await getAuthToken();

  const services = await preloadQuery(
    api.service.admin.getBusinessServices,
    {},
    { token },
  );
  return (
    <div>
      <Services preloadedServices={services} />;
      <DashboardFooter />
    </div>
  );
}

export default DashboardServices;
