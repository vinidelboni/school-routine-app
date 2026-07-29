import { redirect } from "next/navigation";
import { getCurrentContext } from "../lib/auth";

export default async function AppHome() {
  const { membership } = await getCurrentContext();
  redirect(`/app/${membership.role === "director" ? "direction" : membership.role}`);
}
