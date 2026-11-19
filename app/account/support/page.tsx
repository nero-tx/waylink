import type { Metadata } from "next";
import { SupportTicketsView } from "../_components/SupportTicketsView";

export const metadata: Metadata = {
  title: "Support Center | Waylink",
  description:
    "Get help with your Waylink account, bookings, payments, or services. Contact our support team for assistance.",
  robots: {
    index: false,
    follow: false,
  },
};

const Page = () => {
  return (
    <div className="h-full w-full overflow-x-hidden">
      <div className="px-4 py-8 md:px-6">
        <SupportTicketsView role="user" />
      </div>
    </div>
  );
};

export default Page;
