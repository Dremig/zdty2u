<script setup>
import { computed, ref } from 'vue'
import { ArrowUpRight, CalendarDays, Check, ChevronDown, CircleHelp, CircleAlert, Eye, EyeOff, FileText, Footprints, Gauge, KeyRound, LoaderCircle, LockKeyhole, MapPin, Play, Route, ShieldCheck, SlidersHorizontal, Timer, UserRound, X, Download } from '@lucide/vue'
import { useRunSession } from './composables/useRunSession'
import { clock, paceLabel, phases, resultTone } from './lib/format'
import RoutePreview from './components/RoutePreview.vue'
import SessionStatus from './components/SessionStatus.vue'

const { form, routes, selectedRoute, connected, pending, previewLoading, preview, job, error, active,
  duration, elapsed, fraction, distance, phase, canStart, reportJob, regenerate, reconnect, start, stop, downloadReport, clearError } = useRunSession()
const showPassword = ref(false), helpDialog = ref(null), reportDialog = ref(null)
const today = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())
const startLabel = computed(() => active.value ? '运行进行中' : pending.value ? '正在启动' : previewLoading.value ? '准备中' : '开始运行')
const reportStatus = computed(() => reportJob.value?.review || phases[reportJob.value?.stage]?.title || '尚未开始')
const reportTone = computed(() => resultTone(reportJob.value))
const reportLocation = computed(() => routes.value.find(route => route.id === reportJob.value?.settings.route_id)?.name || reportJob.value?.summary?.route_name || '—')
async function submitForm() { await start(); showPassword.value = false }
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-inner"><a href="/" class="brand" aria-label="Pace 跑步工作台首页"><span class="brand-symbol"><Route :size="20" :stroke-width="2.2" /></span><span class="brand-name">pace<span>.</span></span><span class="brand-context">跑步工作台</span></a><nav class="header-nav" aria-label="主导航"><span class="nav-current">运行面板</span><button type="button" :disabled="!reportJob" @click="reportDialog.showModal()"><FileText :size="15" />本次报告</button></nav><div class="header-tools"><span class="connection-pill" :class="{ disconnected: !connected }"><i />{{ connected ? '本机已连接' : '连接中' }}</span><button type="button" class="icon-button help-button" aria-label="使用说明" @click="helpDialog.showModal()"><CircleHelp :size="19" /></button></div></div>
    </header>

    <main class="workbench">
      <section class="page-heading"><div><div class="page-eyebrow"><span />RUNNING WORKSPACE</div><h1>准备好，开始下一程。</h1><p>设置目标、预览路线，跟踪本次运行。</p></div><div class="heading-meta"><span class="date-label"><CalendarDays :size="14" />{{ today }}</span><span class="route-tag">路线规划</span></div></section>

      <div class="overview-grid">
        <div class="overview-card"><div><span class="overview-label">目标距离</span><strong>{{ form.km === '' ? '—' : form.km }} <small>km</small></strong></div><span class="metric-icon"><Footprints :size="20" /></span></div>
        <div class="overview-card"><div><span class="overview-label">目标配速</span><strong>{{ paceLabel(form.pace) }} <small>/ km</small></strong></div><span class="metric-icon neutral"><Gauge :size="20" /></span></div>
        <div class="overview-card"><div><span class="overview-label">预计用时</span><strong>{{ duration ? clock(duration) : '—' }} <small>min : sec</small></strong></div><span class="metric-icon warm"><Timer :size="20" /></span></div>
      </div>

      <div v-if="error" class="error-banner" role="alert"><CircleAlert :size="17" /><p>{{ error }}</p><button v-if="!connected && !active" type="button" class="error-retry" @click="reconnect">重新连接</button><button type="button" class="icon-button" aria-label="关闭提示" @click="clearError()"><X :size="16" /></button></div>

      <div class="workspace-grid">
        <div class="visual-column"><RoutePreview :route-name="selectedRoute?.name || '选择跑步地点'" :preview="preview" :elapsed="elapsed" :loading="previewLoading" :disabled="active || pending" @regenerate="regenerate" /><SessionStatus :job="job" :phase="phase" :elapsed="elapsed" :duration="duration" :fraction="fraction" :distance="distance" :pending="pending" @stop="stop" @download="downloadReport" /></div>

        <aside class="setup-column">
          <section class="panel setup-panel" aria-labelledby="setup-heading"><div class="setup-heading"><div class="section-title"><SlidersHorizontal :size="17" /><h2 id="setup-heading">本次运行</h2></div><span class="setup-caption">START A SESSION</span></div>
            <form @submit.prevent="submitForm">
              <fieldset :disabled="active || pending">
                <div class="field"><label for="location">跑步地点 <span>{{ routes.length ? `${routes.length} 个地点` : '加载中' }}</span></label><div class="input-wrap select-wrap"><MapPin :size="16" /><select id="location" v-model.number="form.route_id" name="route_id" :disabled="!routes.length" required><option v-for="location in routes" :key="location.id" :value="location.id">{{ location.name }}</option></select><ChevronDown :size="15" class="select-chevron" /></div></div>
                <div class="credential-fields">
                  <div class="field"><label for="username">学号</label><div class="input-wrap"><UserRound :size="16" /><input id="username" v-model="form.username" name="username" type="text" autocomplete="username" maxlength="64" placeholder="输入学号" required /></div></div>
                  <div class="field"><label for="password">密码</label><div class="input-wrap"><KeyRound :size="16" /><input id="password" v-model="form.password" name="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" maxlength="256" placeholder="登录密码" required /><button type="button" class="reveal-button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" :aria-pressed="showPassword" @click="showPassword = !showPassword"><component :is="showPassword ? EyeOff : Eye" :size="16" /></button></div></div>
                </div>
                <div class="number-fields"><div class="field"><label for="km">目标距离 <span>km</span></label><input id="km" v-model="form.km" name="km" type="number" min="0" step="any" inputmode="decimal" required /></div><div class="field"><label for="pace">目标配速 <span>min / km</span></label><input id="pace" v-model="form.pace" name="pace" type="number" min="0" step="any" inputmode="decimal" required /></div></div>
                <label class="submit-toggle"><div><strong>完成后自动提交</strong><span>关闭后仅计时和预检</span></div><input v-model="form.submit" type="checkbox" /><span class="toggle-track" aria-hidden="true"><Check :size="10" /></span></label>
              </fieldset>
              <button class="button button-primary start-button" type="submit" :disabled="!canStart"><LoaderCircle v-if="pending || previewLoading || active" :size="17" :class="{ spinning: pending || previewLoading }" /><Play v-else :size="16" fill="currentColor" /><span>{{ startLabel }}</span><ArrowUpRight :size="17" /></button>
              <p class="credential-note"><LockKeyhole :size="12" />密码仅用于本次登录，不保存在本地。</p>
            </form>
          </section>
        </aside>
      </div>
      <footer class="page-footer"><span>PACE <i />本地运动工作台</span><span>关闭页面后，已开始的运行继续计时。</span></footer>
    </main>

    <dialog ref="helpDialog" class="info-dialog"><header class="dialog-heading"><div><h2>开始一次运行</h2><p>设置完成后，页面会持续显示运行状态。</p></div><button type="button" class="icon-button" aria-label="关闭使用说明" @click="helpDialog.close()"><X :size="20" /></button></header><ol class="help-steps"><li><span>1</span><div><strong>填写账号与目标</strong><p>选择跑步地点，输入学号、密码、距离和配速。距离与配速支持任意有限正数及小数。</p></div></li><li><span>2</span><div><strong>查看轨迹，开始运行</strong><p>预览所选地点的跑步路线，点击开始后按实际时间计时。</p></div></li><li><span>3</span><div><strong>查看结果</strong><p>完成后显示预检、提交与审核状态；“待审”表示已保存，尚未审核完成。</p></div></li></ol><div class="help-note"><ShieldCheck :size="17" /><p>路线由程序规划。开放时间与运行结果以服务端返回为准。</p></div></dialog>
    <dialog ref="reportDialog" class="info-dialog report-dialog"><header class="dialog-heading"><div><h2>本次运行报告</h2><p>{{ reportJob?.account || '本地运行记录' }}</p></div><button type="button" class="icon-button" aria-label="关闭报告" @click="reportDialog.close()"><X :size="20" /></button></header><template v-if="reportJob"><div class="report-status"><span class="status-pill" :class="{ 'is-active': reportTone === 'success', 'is-review': reportTone === 'review', 'is-error': reportTone === 'error' }">{{ reportStatus }}</span><p>{{ reportJob.error || '报告包含轨迹数据、预检及回查结果，账号信息已脱敏。' }}</p></div><div class="report-location"><MapPin :size="15" />{{ reportLocation }}</div><div class="report-facts"><div><span>目标距离</span><strong>{{ reportJob.settings.km }} km</strong></div><div><span>预计时长</span><strong>{{ clock(reportJob.duration_s) }}</strong></div><div><span>提交次数</span><strong>{{ reportJob.post_attempts }}</strong></div></div><button type="button" class="button button-primary report-download" @click="downloadReport"><Download :size="16" />下载 JSON 报告</button></template></dialog>
  </div>
</template>
