import {
  ClipboardList,
  GraduationCap,
  LucideIcon,
  UserPlus,
} from "lucide-react";

export type SummaryKey =
  | "registeredTutors"
  | "requestTutorRequests"
  | "registerAsTutorRequests";

export const statCards: Array<{
  label: string;
  key: SummaryKey;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  accent: string;
  href: string;
}> = [
  {
    label: "Approved Tutors",
    key: "registeredTutors",
    icon: GraduationCap,
    iconBg: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    accent: "bg-blue-600",
    href: "/tutors",
  },
  {
    label: "Tutor Requests",
    key: "requestTutorRequests",
    icon: ClipboardList,
    iconBg: "bg-violet-50 dark:bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    accent: "bg-violet-600",
    href: "/request-tutor",
  },
  {
    label: "Register as Tutor Requests",
    key: "registerAsTutorRequests",
    icon: UserPlus,
    iconBg: "bg-orange-50 dark:bg-orange-500/10",
    iconColor: "text-orange-600 dark:text-orange-400",
    accent: "bg-orange-500",
    href: "/tutors",
  },
];
