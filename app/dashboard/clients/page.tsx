import { getAuthToken } from "@/auth";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import ClientRoster from "@/components/dashboard/client-roster";

async function ClientsPage() {
  const token = await getAuthToken();

  const preloadedClients = await preloadQuery(
    api.business.admin.getClients,
    {},
    { token },
  );

  return <ClientRoster preloadedClients={preloadedClients} />;
}

export default ClientsPage;
