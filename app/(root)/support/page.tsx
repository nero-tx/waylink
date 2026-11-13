import type { Metadata } from "next";
import SupportPage from "./clientPage";

export const metadata: Metadata = {
  title: "Support Center | Waylink",
  description:
    "Get the help you need with Waylink. Connect with our support community, contact customer support, and explore helpful guides and resources.",
  openGraph: {
    title: "Support Center | Waylink",
    description:
      "Your central hub for assistance, community connections, and helpful resources on Waylink.",
    type: "website",
    siteName: "Waylink",
  },
  twitter: {
    card: "summary_large_image",
    title: "Support Center | Waylink",
    description:
      "Find answers, connect with the community, and get personalized assistance with Waylink.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const Page = () => {
  return <SupportPage />;
};

export default Page;
