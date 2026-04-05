export interface VaccineTemplate {
  title: string
  type: 'vaccine' | 'deworming'
  description: string
  firstAt: string
  recurrenceDays: number
}

export const VACCINE_SCHEDULE: VaccineTemplate[] = [
  {
    title: '三聯疫苗（首針）',
    type: 'vaccine',
    description: '貓瘟、貓鼻支氣管炎、貓杯狀病毒',
    firstAt: '8-9 週齡',
    recurrenceDays: 21,
  },
  {
    title: '三聯疫苗（第二針）',
    type: 'vaccine',
    description: '首針後 3-4 週',
    firstAt: '12 週齡',
    recurrenceDays: 365,
  },
  {
    title: '三聯疫苗（年度補打）',
    type: 'vaccine',
    description: '每年補打保持免疫力',
    firstAt: '每年',
    recurrenceDays: 365,
  },
  {
    title: '狂犬病疫苗',
    type: 'vaccine',
    description: '部分地區法規要求',
    firstAt: '12 週齡後',
    recurrenceDays: 365,
  },
  {
    title: '體內驅蟲',
    type: 'deworming',
    description: '驅除腸道寄生蟲',
    firstAt: '每 3 個月',
    recurrenceDays: 90,
  },
  {
    title: '體外驅蟲',
    type: 'deworming',
    description: '驅除跳蚤、蜱蟲',
    firstAt: '每月',
    recurrenceDays: 30,
  },
]
