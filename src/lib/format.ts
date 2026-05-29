export function formatMoney(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2
  }).format(value);
}

export function parseYearMonth(date: string) {
  const [year, month] = date.split("-");
  return `${year}-${month}`;
}

export function nextMonthStart(ym: string) {
  const [year, month] = ym.split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

export function monthLabel(ym: string) {
  const [year, month] = ym.split("-");
  return `${year}年${Number(month)}月`;
}

export function todayISODate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
