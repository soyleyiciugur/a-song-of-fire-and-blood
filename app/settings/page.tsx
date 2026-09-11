import {redirect} from "next/navigation";
import {getCurrentProfile} from "@/lib/auth";
import {affinityCatalog} from "@/lib/profileAffinity";
import ProfileSettings from "./ProfileSettings";
export default async function Page(){
  const profile=await getCurrentProfile();
  if(!profile)redirect("/login");
  return <ProfileSettings profile={profile} affinityCatalog={affinityCatalog()}/>;
}
