import { FloorPlanner } from "@/components/admin/floor/FloorPlanner";
import { getFloorPlan, getSeatingGuests } from "@/lib/floor-db";

export default async function Mesas() {
  const [{ plan, version }, guests] = await Promise.all([getFloorPlan(), getSeatingGuests()]);
  return <FloorPlanner initialPlan={plan} initialVersion={version} guests={guests} />;
}
