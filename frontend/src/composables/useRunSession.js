import { computed, nextTick, onMounted, onUnmounted, reactive, ref, shallowRef, watch } from 'vue'
import { phases, plannedSeconds, pointAt } from '../lib/format'

export function useRunSession() {
  const form = reactive({ username: '', password: '', km: 3.0, pace: 6, submit: true, route_id: 18 })
  const routes = shallowRef([])
  const token = ref(''), connected = ref(false), pending = ref(false), previewLoading = ref(true)
  const preview = shallowRef(null), job = shallowRef(null), lastResult = shallowRef(null)
  const error = ref(''), errorSource = ref(''), networkError = ref(false)
  const now = ref(performance.now()), receivedAt = ref(now.value)
  let booting = true, debounce, timer, ticker, version = 0, controller, disposed = false

  const active = computed(() => Boolean(job.value?.active))
  const selectedRoute = computed(() => routes.value.find(route => route.id === Number(form.route_id)))
  const duration = computed(() => job.value?.duration_s ?? preview.value?.duration_s ?? plannedSeconds(form.km, form.pace))
  const elapsed = computed(() => {
    let value = job.value?.elapsed_s || 0
    if (active.value && job.value.stage === 'replaying' && !networkError.value) value += (now.value - receivedAt.value) / 1000
    return Math.min(duration.value, Math.max(0, value))
  })
  const fraction = computed(() => duration.value ? elapsed.value / duration.value : 0)
  const distance = computed(() => pointAt(preview.value, elapsed.value)?.distance || 0)
  const phase = computed(() => job.value ? phases[job.value.stage] || { title: '处理中', detail: '正在处理本次运行。', step: 0 } : { title: '准备就绪', detail: '填写账号信息后，开始本次运行。', step: -1 })
  const canStart = computed(() => connected.value && selectedRoute.value && !active.value && !pending.value && !previewLoading.value && preview.value && preview.value.settings.route_id === Number(form.route_id) && preview.value.settings.km === Number(form.km) && preview.value.settings.pace === Number(form.pace))
  const reportJob = computed(() => job.value?.has_report ? job.value : lastResult.value)

  function showError(message, source) { error.value = message; errorSource.value = source }
  function clearError(source) { if (!source || errorSource.value === source) { error.value = ''; errorSource.value = '' } }

  async function api(path, data, signal) {
    const response = await fetch(path, {
      method: data === undefined ? 'GET' : 'POST',
      headers: { 'X-Local-Token': token.value, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: data === undefined ? undefined : JSON.stringify(data), cache: 'no-store', signal,
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || '请求失败，请重试。')
    return result
  }

  async function generatePreview(settings) {
    const current = ++version
    controller?.abort()
    controller = new AbortController()
    previewLoading.value = true
    const values = settings || { km: Number(form.km), pace: Number(form.pace), submit: form.submit, route_id: Number(form.route_id) }
    if (!plannedSeconds(values.km, values.pace)) {
      preview.value = null
      previewLoading.value = false
      showError('请输入大于零的距离和配速。', 'preview')
      return
    }
    try {
      const result = await api('/api/preview', values, controller.signal)
      if (current !== version || disposed) return
      preview.value = result
      clearError('preview')
    } catch (cause) {
      if (current !== version || disposed || cause.name === 'AbortError') return
      preview.value = null
      showError(cause.message, 'preview')
    } finally {
      if (current === version && !disposed) previewLoading.value = false
    }
  }

  function applyJob(value) {
    job.value = value
    receivedAt.value = performance.now()
    now.value = receivedAt.value
    if (!value.active) lastResult.value = value
  }

  function poll() {
    clearTimeout(timer)
    if (!active.value || disposed) return
    timer = setTimeout(async () => {
      const id = job.value.id
      try {
        const result = await api(`/api/jobs/${id}`)
        if (disposed || job.value?.id !== id) return
        connected.value = true
        networkError.value = false
        clearError('connection')
        applyJob(result)
      } catch (_) {
        if (disposed || job.value?.id !== id) return
        connected.value = false
        networkError.value = true
        showError('暂时无法连接本机服务，正在重试。运行状态尚未确认。', 'connection')
      }
      poll()
    }, networkError.value ? 3000 : 1000)
  }

  function resetFinished() {
    if (job.value && !job.value.active) { lastResult.value = job.value; job.value = null }
  }

  async function regenerate() { resetFinished(); await generatePreview() }

  function restoreSettings(settings) {
    form.km = settings.km
    form.pace = settings.pace
    form.submit = settings.submit
    form.route_id = settings.route_id ?? 18
  }

  async function reconnect() {
    booting = true
    previewLoading.value = true
    try {
      const result = await api('/api/bootstrap')
      if (disposed) return
      token.value = result.token
      routes.value = result.routes
      connected.value = true
      networkError.value = false
      clearError('connection')
      const settings = result.job?.settings || result.defaults
      restoreSettings(settings)
      await nextTick()
      await generatePreview(settings)
      if (result.job) { applyJob(result.job); poll() }
    } catch (_) {
      connected.value = false
      previewLoading.value = false
      showError('无法连接本机服务，请确认控制台已启动后重新连接。', 'connection')
    } finally { booting = false }
  }

  async function start() {
    if (!canStart.value) return
    pending.value = true
    clearError()
    const values = {
      km: Number(form.km), pace: Number(form.pace), submit: form.submit, route_id: Number(form.route_id),
      username: form.username.trim(), password: form.password,
      seed: preview.value.settings.seed, request_id: crypto.randomUUID(),
    }
    try {
      applyJob(await api('/api/jobs', values))
      poll()
    } catch (cause) {
      showError(cause.message, 'job')
      // Recover an accepted start request without sending it again.
      try {
        const boot = await api('/api/bootstrap')
        token.value = boot.token
        routes.value = boot.routes
        if (boot.job?.active) {
          restoreSettings(boot.job.settings)
          applyJob(boot.job)
          await generatePreview(boot.job.settings)
          poll()
        }
      } catch (_) { /* Keep the original error. */ }
    } finally {
      values.password = ''; form.password = ''; pending.value = false
    }
  }

  async function stop() {
    if (pending.value || !job.value?.can_stop || job.value.stage === 'stopping') return
    pending.value = true
    try { applyJob(await api(`/api/jobs/${job.value.id}/stop`, {})) }
    catch (cause) { showError(cause.message, 'job') }
    finally { pending.value = false }
  }

  async function downloadReport() {
    if (!reportJob.value) return
    try {
      const id = reportJob.value.id
      const report = await api(`/api/jobs/${id}/report`)
      const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url; link.download = `run-${id.slice(0, 8)}.json`; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (cause) { showError(cause.message, 'job') }
  }

  watch(() => [form.route_id, form.km, form.pace], (values, previous) => {
    if (booting || active.value || pending.value) return
    resetFinished()
    version++
    controller?.abort()
    preview.value = null
    previewLoading.value = true
    clearTimeout(debounce)
    debounce = setTimeout(() => generatePreview(), values[0] === previous[0] ? 300 : 0)
  })
  onMounted(() => { ticker = setInterval(() => { now.value = performance.now() }, 200); reconnect() })
  onUnmounted(() => { disposed = true; clearTimeout(timer); clearTimeout(debounce); clearInterval(ticker); controller?.abort(); form.password = '' })

  return { form, routes, selectedRoute, connected, pending, previewLoading, preview, job, error, networkError, active,
    duration, elapsed, fraction, distance, phase, canStart, reportJob,
    generatePreview, regenerate, reconnect, start, stop, downloadReport, clearError }
}
