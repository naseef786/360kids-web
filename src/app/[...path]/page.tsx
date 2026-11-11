import { notFound, redirect } from "next/navigation";
import type { Search } from "@/lib/page-query";
import { ContentScreen, PublicPage, SupportScreen, contentSlugs } from "@/components/service-screens";
import { NotificationScreen } from "@/components/notification-screen";
const aliases:Record<string,string>={
  activities:"/parent/activities","sign-in":"/login","become-a-provider":"/partner/apply",
  account:"/parent","account/bookings":"/parent/bookings","account/children":"/parent/profile","account/settings":"/parent/profile","account/support":"/parent/support",
  provider:"/partner","provider/requests":"/partner","provider/activities":"/partner/programs","provider/profile":"/partner/organizations","provider/support":"/partner/support","provider/subscription":"/partner/organizations",
  "admin/providers":"/admin/partners","admin/activities":"/admin/programs","admin/corrections":"/admin/operations","admin/finance":"/admin/operations?resource=refunds","admin/contacts":"/admin/operations?resource=contacts","admin/campaigns":"/admin/operations?resource=campaigns","admin/subscriptions":"/admin/operations?resource=subscriptions","admin/audit":"/admin/operations?resource=audit"
};
export default async function Page({params,searchParams}:{params:Promise<{path:string[]}>;searchParams:Search}) {
  const name=(await params).path.join("/");
  if(aliases[name]) {
    const target=new URL(aliases[name],"https://local.invalid");
    for(const [key,value] of Object.entries(await searchParams)) if(typeof value==="string" && !target.searchParams.has(key)) target.searchParams.set(key,value);
    redirect(target.pathname+target.search);
  }
  if(contentSlugs.includes(name)) return <PublicPage slug={name}/>;
  if(["parent/notifications","partner/notifications","admin/notifications"].includes(name)) return <NotificationScreen role={name.split("/")[0] as "parent"|"partner"|"admin"} searchParams={searchParams}/>;
  if(name==="admin/content") return <ContentScreen searchParams={searchParams}/>;
  if(["parent/support","partner/support","admin/support"].includes(name)) return <SupportScreen role={name.split("/")[0] as "parent"|"partner"|"admin"} searchParams={searchParams}/>;
  notFound();
}
