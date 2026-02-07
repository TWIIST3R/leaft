import { redirect } from "next/navigation";

// Départements gérés dans Grilles de salaire
export default function DepartmentsPage() {
  redirect("/dashboard/grilles");
}
