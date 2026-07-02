import { getAuthToken } from "@/auth";
import DashboardContent from "@/components/dashboard/dashboardContent";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";

async function DashboardPage() {
  const token = await getAuthToken();
  const business = await fetchQuery(
    api.business.admin.getUserBusiness,
    {},
    { token },
  );

  if (!business) redirect("/onboarding");
  return <DashboardContent />;
}

export default DashboardPage;
