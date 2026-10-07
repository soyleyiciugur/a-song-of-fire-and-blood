import { redirect } from "next/navigation";

export default function GreatGameHome() {
  redirect("/cards/play");
}
