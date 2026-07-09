import { parseApiError, request } from './http.ts'
import type {
  CheckInCalendarResponse,
  CheckInDayRecord,
  LotteryCheckInResult,
  LotteryDrawResult,
  LotteryEffectOp,
  LotteryEffectTarget,
  LotteryPrize,
  LotteryPrizeList,
  LotteryStatus,
  LotteryWinRecord,
  LotteryWinRecordList,
} from './types.ts'

export type {
  LotteryPrize,
  LotteryPrizeList,
  LotteryDrawResult,
  LotteryStatus,
  LotteryWinRecord,
  LotteryEffectTarget,
  LotteryEffectOp,
  CheckInCalendarResponse,
  CheckInDayRecord,
}

export type AddLotteryPrizeInput = {
  label: string
  effectTarget?: LotteryEffectTarget
  effectOp?: LotteryEffectOp
  effectValue?: number
}

export async function addLotteryPrize(input: AddLotteryPrizeInput): Promise<LotteryPrize> {
  const data = await request<{ prize: LotteryPrize }>('/api/lottery/prizes', {
    method: 'POST',
    body: input,
  })
  return data.prize
}

export async function getLotteryStatus(): Promise<LotteryStatus> {
  return request<LotteryStatus>('/api/lottery/status', { auth: false })
}

export async function listLotteryWinRecords(): Promise<LotteryWinRecord[]> {
  const data = await request<LotteryWinRecordList>('/api/lottery/records', { auth: false })
  return data.items
}

export async function listLotteryPrizes(): Promise<LotteryPrize[]> {
  const data = await request<LotteryPrizeList>('/api/lottery/prizes', { auth: false })
  return data.items
}

export async function removeLotteryPrize(id: string): Promise<void> {
  await request<void>(`/api/lottery/prizes/${id}`, {
    method: 'DELETE',
  })
}

export async function updateLotteryPrize(id: string, enabled: boolean): Promise<LotteryPrize> {
  const data = await request<{ prize: LotteryPrize }>(`/api/lottery/prizes/${id}`, {
    method: 'PATCH',
    body: { enabled },
  })
  return data.prize
}

export async function drawLottery(): Promise<LotteryDrawResult> {
  return request<LotteryDrawResult>('/api/lottery/draw', {
    method: 'POST',
    auth: false,
  })
}

export async function uploadLotteryImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch('/api/lottery/upload', {
    method: 'POST',
    credentials: 'include',
    body: form,
  })

  if (!res.ok) {
    throw await parseApiError(res)
  }

  const data = (await res.json()) as { imageUrl: string }
  return data.imageUrl
}

export async function submitLotteryCheckIn(
  imageUrl: string,
  distanceKm: number,
): Promise<LotteryCheckInResult> {
  return request<LotteryCheckInResult>('/api/lottery/check-in', {
    method: 'POST',
    auth: false,
    body: { imageUrl, distanceKm },
  })
}

export async function getCheckInCalendar(month: string): Promise<CheckInCalendarResponse> {
  const query = new URLSearchParams({ month })
  return request<CheckInCalendarResponse>(`/api/lottery/check-ins?${query}`, { auth: false })
}

export async function submitMakeupCheckIn(
  date: string,
  imageUrl: string,
  distanceKm: number,
): Promise<LotteryCheckInResult> {
  return request<LotteryCheckInResult>('/api/lottery/check-in/makeup', {
    method: 'POST',
    auth: false,
    body: { date, imageUrl, distanceKm },
  })
}
