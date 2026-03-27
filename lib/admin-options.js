export const ORGANIZATION_TYPE_STATUSES = [
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Deaktiv" },
];

export const ORGANIZATION_STATUSES = [
  { value: "draft", label: "Qaralama" },
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Deaktiv" },
  { value: "archived", label: "Arxiv" },
];

export const APPROVAL_STATUSES = [
  { value: "pending", label: "Gözləyir" },
  { value: "approved", label: "Təsdiqlənib" },
  { value: "rejected", label: "Rədd edilib" },
  { value: "incomplete", label: "Natamam" },
];

export const STATUS_COLORS = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-gray-100 text-gray-600",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-200 text-gray-700",
  pending: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  incomplete: "bg-orange-100 text-orange-700",
};