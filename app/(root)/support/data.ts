import {
  LifeBuoy,
  Users,
  Compass,
  Star,
  Briefcase,
  MessageSquare,
  BookOpen,
} from "lucide-react";

export const mainPillars = [
  {
    title: "Support Community",
    tagline: "Connect & Network",
    description:
      "Connect with other providers, share experiences, exchange ideas, and discover new opportunities within the Waylink community.",
    image: "/support-1.jpg",
    icon: Users,
    accentColor: "text-orange-500 dark:text-orange-400",
    accentSolid: "bg-orange-500",
    badgeBg:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  {
    title: "Customer Support",
    tagline: "Dedicated 24/7 Desk",
    description:
      "Get personalized assistance from our support team with your account, services, bookings, subscriptions, or any platform-related issues.",
    image: "/support-3.jpg",
    icon: LifeBuoy,
    accentColor: "text-blue-500 dark:text-blue-400",
    accentSolid: "bg-blue-500",
    badgeBg:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    title: "Help Center",
    tagline: "Knowledge Hub",
    description:
      "Find answers to common questions and learn more about managing your services, plans, subscriptions, payments, and account settings.",
    image: "/support-2.jpg",
    icon: BookOpen,
    accentColor: "text-amber-500 dark:text-amber-400",
    accentSolid: "bg-amber-500",
    badgeBg:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
];

export const faqs = [
  {
    q: "How do I contact the support team?",
    a: "Open a support ticket from your account's Support page. Pick the topic closest to your problem, describe what happened, and send it. Your ticket gets a number, and the whole conversation with our team stays in that ticket.",
  },
  {
    q: "How do I follow up on a ticket I already opened?",
    a: "Go to Support in your account. Every ticket shows its number, topic and current status. Reply inside the same ticket instead of opening a new one, so nothing gets lost.",
  },
  {
    q: "How many tickets can I have open at once?",
    a: "Up to five. Resolved and closed tickets don't count toward that limit. If you reach it, wait for a reply or close one you no longer need.",
  },
  {
    q: "Why is my provider account pending, rejected, suspended or inactive?",
    a: 'Your provider dashboard shows the current status, the reason, and a suggested fix. Follow the steps, then use "Check status again". If something is unclear, open a ticket under "Provider account status". These tickets are prioritized because the whole team is blocked until they are solved.',
  },
  {
    q: "How do I become a provider?",
    a: 'Choose "Become a provider", fill in your business details, and submit. Our team reviews every request, and you can follow its progress on your request page. If something needs fixing, you will see what to change.',
  },
  {
    q: "I'm a team member and I can't open the provider dashboard.",
    a: "When a provider account is pending, suspended or inactive, everyone on the team is blocked, not only you. Ask the account owner or a manager to resolve the issue shown on screen.",
  },
  {
    q: "My team invitation doesn't work.",
    a: "Invitations expire after 7 days and can be used once. Ask a manager to send you a new invitation.",
  },
  {
    q: "Is the community the same as customer support?",
    a: "No. The community is for sharing experiences and ideas with other providers. For anything about your own account, bookings or payments, open a support ticket. Never share passwords or payment details in the community.",
  },
  {
    q: "Where can I find the best services on Waylink?",
    a: "Use Explore to browse transport and experiences, or open the top-rated page to see the services travelers rate highest.",
  },
];

export const quickLinks = [
  {
    label: "Post a Ticket",
    href: "/account/support",
    icon: MessageSquare,
    className:
      "bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-md shadow-blue-500/20",
    iconClassName: "w-4 h-4",
  },
  {
    label: "Become a Provider",
    href: "/provider/become-provider",
    icon: Briefcase,
    className:
      "bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-500/20",
    iconClassName: "w-4 h-4",
  },
  {
    label: "Explore Platform",
    href: "/",
    icon: Compass,
    className:
      "bg-secondary/80 hover:bg-secondary text-secondary-foreground border border-border",
    iconClassName: "w-4 h-4 text-blue-500",
  },
  {
    label: "Discover Top-Rated",
    href: "/most-rating",
    icon: Star,
    className:
      "bg-secondary/80 hover:bg-secondary text-secondary-foreground border border-border hover:border-orange-500/40",
    iconClassName: "w-4 h-4 text-amber-500 fill-amber-500/20",
  },
];
