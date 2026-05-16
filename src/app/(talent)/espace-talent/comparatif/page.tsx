import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTalentComparatifData } from "@/lib/talent/get-talent-comparatif-data";
import { ComparatifClient } from "./comparatif-client";

export default async function ComparatifPage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? null;

  const data = await getTalentComparatifData(userId, orgId ?? null, userEmail);
  if (!data) redirect("/sign-in");

  return <ComparatifClient data={data} />;
}
