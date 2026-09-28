<script setup>
import { computed, ref } from 'vue'
import { Activity, Check, CircleCheck, Clock3, Download, CircleAlert, FileText, Square, X } from '@lucide/vue'
import { clock, resultTone } from '../lib/format'

const props = defineProps({ job: Object, phase: Object, elapsed: Number, duration: Number, fraction: Number, distance: Number, pending: Boolean })
defineEmits(['stop', 'download'])
const tone = computed(() => resultTone(props.job))
const failed = computed(() => tone.value === 'error')
const resultIcon = computed(() => ({ error: CircleAlert, review: Clock3, neutral: Square, success: CircleCheck })[tone.value])
const completed = computed(() => props.job && !props.job.active)
const logsDialog = ref(null)
const resultTitle = computed(() => props.job?.review ? `已提交 · ${props.job.review}` : props.phase.title)
const resultDetail = computed(() => props.job?.error || (props.job?.record ? `${props.job.record.odometer} 公里 · ${props.job.record.activeTime} · ${props.job.record.avgPace || ''}` : props.job?.post_attempts ? '请以报告中的回查结果确认记录状态。' : '本次没有提交记录。'))
</script>

<template>
  <section class="panel session-panel" aria-labelledby="session-heading">
    <div class="session-heading"><div class="section-title"><Activity :size="17" /><h2 id="session-heading">运行状态</h2></div><div class="session-tools"><button v-if="job?.events?.length" type="button" class="log-trigger" aria-label="查看运行日志" @click="logsDialog.showModal()"><FileText :size="13" />日志</button><span class="status-pill" :class="{ 'is-active': job?.active, 'is-error': failed }" role="status"><i />{{ job ? phase.title : '尚未开始' }}</span></div></div>
    <div class="session-values"><div><span>已运行 / 总时长</span><strong>{{ clock(elapsed) }} <small>/ {{ clock(duration) }}</small></strong></div><div><span>距离进度</span><strong>{{ distance.toFixed(2) }} <small>km</small></strong></div><div class="completion-value"><span>完成比例</span><strong>{{ Math.floor(fraction * 100) }}<small>%</small></strong></div></div>
    <div class="progress-track" role="progressbar" aria-label="运行完成比例" :aria-valuenow="Math.floor(fraction * 100)" aria-valuemin="0" aria-valuemax="100"><div :style="{ width: `${fraction * 100}%` }" /></div>
    <div class="session-description"><p>{{ phase.detail }}<span v-if="job?.active" class="masked-account">{{ job.account }}</span></p><button v-if="job?.active" type="button" class="stop-link" :disabled="pending || !job.can_stop || job.stage === 'stopping'" @click="$emit('stop')"><Square :size="11" />{{ job.stage === 'stopping' ? '正在停止' : job.can_stop ? '停止运行' : '等待提交结果' }}</button></div>
    <div v-if="job?.active" class="run-steps" aria-label="运行阶段"><div v-for="(label, index) in ['登录检查', '轨迹计时', '完成预检', '提交回查']" :key="label" :class="{ done: phase.step > index, current: phase.step === index }"><span><Check v-if="phase.step > index" :size="11" /><template v-else>{{ index + 1 }}</template></span>{{ label }}</div></div>
    <div v-if="completed" class="result-summary" :class="`result-${tone}`"><component :is="resultIcon" :size="21" /><div><strong>{{ resultTitle }}</strong><p>{{ resultDetail }}</p></div><button v-if="job.has_report" type="button" class="button button-subtle button-small" @click="$emit('download')"><Download :size="13" />报告</button></div>
    <dialog ref="logsDialog" class="info-dialog logs-dialog"><header class="dialog-heading"><div><h2>运行日志</h2><p>{{ job?.account || '本次运行' }}</p></div><button type="button" class="icon-button" aria-label="关闭运行日志" @click="logsDialog.close()"><X :size="20" /></button></header><ol class="event-list"><li v-for="(event, index) in job?.events || []" :key="index"><time>{{ event.time }}</time><span>{{ event.message }}</span></li></ol></dialog>
  </section>
</template>
