export const COMMON_LABELS = {
  active: "Aktiv",
  admin_assigned: "Admin tərəfindən təyin edilib",
  approved: "Təsdiqlənib",
  assigned: "Təyin edilib",
  balance_hold: "Balans bloklanması",
  balance_release: "Blokdan azad etmə",
  balance_topup: "Balans artırılması",
  business: "Biznes",
  calculated: "Hesablanıb",
  cancelled: "Ləğv edilib",
  charged: "Hesablanıb",
  completed: "Tamamlanıb",
  credit: "Mədaxil",
  customer_declined: "Müştəri imtina edib",
  debit: "Məxaric",
  disabled: "Deaktiv",
  disbursed: "Kredit verilib",
  disputed: "Mübahisəli",
  draft: "Qaralama",
  expired: "Müddəti bitib",
  free_test: "Pulsuz test",
  hidden: "Gizli",
  hybrid: "Lead haqqı + uğur komissiyası",
  inactive: "Deaktiv",
  individual: "Fərdi",
  invoiced: "Fakturalanıb",
  lead_fee: "Lead haqqı",
  lead_fee_only: "Yalnız lead haqqı",
  manual_adjustment: "Manual düzəliş",
  new: "Yeni",
  not_applicable: "Tətbiq olunmur",
  not_charged: "Tutulmayıb",
  only_selected: "Yalnız seçilmiş təşkilat",
  open_market: "Açıq müraciət",
  paid: "Ödənilib",
  pending: "Gözləyir",
  processing: "Baxılır",
  rejected: "Rədd edilib",
  refunded: "Geri qaytarılıb",
  refund: "Geri ödəniş",
  reviewing: "Baxılır",
  revoked: "Ləğv edilib",
  sent: "Göndərilib",
  success_fee: "Uğur komissiyası",
  success_fee_only: "Yalnız uğur komissiyası",
  under_review: "Baxılır",
  unknown: "Məlum deyil",
};

export const PERMISSION_LABELS = {
  can_view_applications: "Müraciət siyahısı",
  can_view_application_detail: "Müraciət detalları",
  can_view_customer_contact: "Müştəri əlaqə məlumatları",
  can_update_application_status: "Müraciət statusunu yeniləmə",
  can_update_credit_result: "Kredit nəticəsini yeniləmə",
  can_view_monetization: "Komissiya məlumatları",
  can_buy_leads: "Lead alma",
  can_view_balance: "Balans",
  can_manage_products: "Məhsulları idarəetmə",
  can_export_data: "Məlumat ixracı",
};

export const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS);

export function labelFor(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return COMMON_LABELS[value] || String(value);
}

export function yesNo(value) {
  return value ? "Bəli" : "Xeyr";
}
