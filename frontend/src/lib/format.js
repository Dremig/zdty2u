export function clock(value) {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function paceLabel(value) {
  const minutes = Number(value)
  if (!Number.isFinite(minutes) || minutes <= 0) return '—'
  const seconds = Math.round(minutes * 60)
  return `${Math.floor(seconds / 60)}′${String(seconds % 60).padStart(2, '0')}″`
}

export function plannedSeconds(km, pace) {
  const value = Number(km) * Number(pace) * 60
  return Number(km) > 0 && Number(pace) > 0 && Number.isFinite(value) ? Math.max(1, Math.round(value)) : 0
}

export function pointAt(preview, seconds) {
  const points = preview?.points
  if (!points?.length) return null
  let low = 0, high = points.length - 1
  while (low + 1 < high) {
    const mid = Math.floor((low + high) / 2)
    if (points[mid].second <= seconds) low = mid
    else high = mid
  }
  const a = points[low], b = points[high]
  const u = Math.min(1, Math.max(0, (seconds - a.second) / Math.max(1, b.second - a.second)))
  return {
    lat: a.lat + (b.lat - a.lat) * u,
    lng: a.lng + (b.lng - a.lng) * u,
    distance: (a.distance_m + (b.distance_m - a.distance_m) * u) / 1000,
  }
}

export function resultTone(job) {
  if (['failed', 'save_result_needs_review'].includes(job?.stage) || job?.review === '未通过 / 需查看') return 'error'
  if (job?.review === '待审') return 'review'
  if (job?.active || job?.review === '有效' || job?.stage === 'prechecked_without_save') return 'success'
  return 'neutral'
}

export const phases = {
  initializing: { title: '准备中', detail: '正在启动本次运行。', step: 0 },
  authenticating: { title: '正在登录', detail: '正在验证学号和密码。', step: 0 },
  checking_route: { title: '检查路线', detail: '正在检查路线和开放时间。', step: 0 },
  replaying: { title: '运行中', detail: '正在按实际时间计时，关闭页面后运行继续。', step: 1 },
  checking: { title: '预检中', detail: '计时完成，正在检查距离、时长和配速。', step: 2 },
  submitting: { title: '正在提交', detail: '正在提交本次记录，请等待返回结果。', step: 3 },
  verifying: { title: '正在回查', detail: '提交请求已返回，正在确认记录和审核状态。', step: 3 },
  stopping: { title: '正在停止', detail: '停止请求已收到，正在结束当前步骤。', step: 1 },
  interrupted: { title: '已停止', detail: '本次运行已停止。', step: -1 },
  failed: { title: '运行失败', detail: '本次运行未完成，请查看运行结果。', step: -1 },
  saved_and_verified: { title: '已提交', detail: '记录已回查，审核状态见运行结果。', step: 4 },
  prechecked_without_save: { title: '预检完成', detail: '计时和预检已完成，本次未提交记录。', step: 3 },
  save_result_needs_review: { title: '需确认结果', detail: '提交结果尚未确认，请查看报告后再开始下一次。', step: -1 },
}
