import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ReferralsList from "./components/ReferralsList";

export default function ReferralsPage() {
  return (
    <div>
      <PageBreadCrumb pageTitle="Referrals" />
      <ReferralsList />
    </div>
  );
}
