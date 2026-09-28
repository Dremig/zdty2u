<script setup>
import { ref } from 'vue'
import { Expand, MapPin, RefreshCw, X, LoaderCircle, Layers } from '@lucide/vue'
import MapCanvas from './MapCanvas.vue'

defineProps({ routeName: String, preview: Object, elapsed: Number, loading: Boolean, disabled: Boolean })
defineEmits(['regenerate'])
const dialog = ref(null)
</script>

<template>
  <section class="panel route-panel" aria-labelledby="route-heading">
    <div class="panel-heading">
      <div><div class="section-title"><MapPin :size="17" /><h2 id="route-heading">路线预览</h2></div><p>{{ routeName }} <span class="inline-dot">·</span> 区域内环线 <span class="inline-dot">·</span> 随机起点</p></div>
      <div class="map-actions"><button type="button" class="button button-subtle button-small" :disabled="disabled || loading" @click="$emit('regenerate')"><RefreshCw :size="14" :class="{ spinning: loading }" />重新生成</button><button type="button" class="icon-button" aria-label="放大路线预览" :disabled="!preview" @click="dialog.showModal()"><Expand :size="16" /></button></div>
    </div>
    <div class="map-container">
      <MapCanvas :preview="preview" :elapsed="elapsed || 0" />
      <div v-if="loading || !preview" class="map-overlay"><LoaderCircle v-if="loading" :size="22" class="spinning" /><Layers v-else :size="24" /><span>{{ loading ? '正在规划路线' : '调整设置后生成预览' }}</span></div>
      <div class="map-legend"><span><i class="boundary-key" />允许区域</span><span><i class="route-key" />跑步路线</span></div>
      <span class="map-tag"><Layers :size="12" />路线示意</span>
    </div>
    <div class="route-facts">
      <div><span>环线长度</span><strong>{{ preview ? preview.summary.loop_m.toFixed(1) : '—' }} <small>m</small></strong></div>
      <div><span>最小边界间距</span><strong>{{ preview ? preview.summary.minimum_clearance_m.toFixed(1) : '—' }} <small>m</small></strong></div>
      <div><span>采样点</span><strong>{{ preview ? preview.summary.points.toLocaleString() : '—' }} <small>个</small></strong></div>
    </div>
    <dialog ref="dialog" class="map-dialog">
      <header class="dialog-heading"><div><h2>{{ routeName }}</h2><p>允许区域与本次路线</p></div><button type="button" class="icon-button" aria-label="关闭放大预览" @click="dialog.close()"><X :size="20" /></button></header>
      <MapCanvas :preview="preview" :elapsed="elapsed || 0" />
      <div class="dialog-map-legend"><span><i class="boundary-key" />允许区域</span><span><i class="route-key" />跑步路线</span></div>
    </dialog>
  </section>
</template>
