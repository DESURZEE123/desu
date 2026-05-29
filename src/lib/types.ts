export type WorkRecord = {
  id: string;
  workDate: string;
  styleName: string;
  quantity: number;
  unitPrice: number;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkRecordInput = {
  workDate: string;
  styleName: string;
  quantity: number;
  unitPrice: number;
  note: string;
};

export type WorkRecordRow = {
  id: string;
  user_id: string;
  work_date: string;
  style_name: string;
  quantity: number | string;
  unit_price: number | string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type MonthSummary = {
  ym: string;
  label: string;
  quantity: number;
  total: number;
};

export type DayGroup = {
  date: string;
  day: number;
  total: number;
  records: WorkRecord[];
};
