import { getAuthToken } from "@/auth";
import DashboardContent from "@/components/dashboard/dashboardContent";
import DashboardFooter from "@/components/dashboard/footer";
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
  return (
    <div className="w-full min-h-screen justify-center items-center bg-[#F5F5F5]">
      <DashboardContent
        business={business}
        coverImageUrl={business.coverImageUrl}
      />

      <DashboardFooter />
    </div>
  );
}

export default DashboardPage;
