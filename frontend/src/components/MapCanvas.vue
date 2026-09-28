<script setup>
import { computed, useId } from 'vue'
import { pointAt } from '../lib/format'

const props = defineProps({ preview: Object, elapsed: { type: Number, default: 0 } })
const gridId = `grid-${useId()}`
const projection = computed(() => {
  const points = [...(props.preview?.boundary || []), ...(props.preview?.points || [])]
  if (!points.length) return null
  const latitude = points.reduce((sum, p) => sum + p.lat, 0) / points.length
  const sx = 111320 * Math.cos(latitude * Math.PI / 180), sy = 111320
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (const p of points) { x0 = Math.min(x0, p.lng * sx); x1 = Math.max(x1, p.lng * sx); y0 = Math.min(y0, p.lat * sy); y1 = Math.max(y1, p.lat * sy) }
  const scale = Math.min(645 / Math.max(1, x1 - x0), 275 / Math.max(1, y1 - y0))
  const at = (p) => [400 + (p.lng * sx - (x0 + x1) / 2) * scale, 174 - (p.lat * sy - (y0 + y1) / 2) * scale]
  const path = (values) => values.map((p, i) => `${i ? 'L' : 'M'}${at(p).map((v) => v.toFixed(2)).join(',')}`).join(' ')
  return { at, scale, boundary: path(props.preview.boundary) + 'Z', route: path(props.preview.points) }
})
const marker = computed(() => {
  const point = pointAt(props.preview, props.elapsed)
  return point && projection.value ? projection.value.at(point) : null
})
</script>

<template>
  <svg class="map-canvas" viewBox="0 0 800 365" role="img" aria-label="允许区域和规划路线，图中圆点为当前进度">
    <defs><pattern :id="gridId" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="#e4eae6" stroke-width="0.7" /></pattern></defs>
    <rect width="800" height="365" fill="#f5f8f5" />
    <rect width="800" height="365" :fill="`url(#${gridId})`" />
    <g v-if="projection">
      <path :d="projection.boundary" class="map-boundary" />
      <path :d="projection.route" class="map-route-halo" />
      <path :d="projection.route" class="map-route" />
      <g v-if="marker" :transform="`translate(${marker[0]},${marker[1]})`">
        <circle r="15" fill="#237858" opacity="0.10" /><circle r="8" fill="white" /><circle r="4.5" fill="#237858" />
        <text x="17" y="-13" class="map-point-label">{{ elapsed > 0 ? '当前位置' : '起点' }}</text>
      </g>
      <path :d="`M32 326v5h${50 * projection.scale}v-5`" stroke="#97a59b" fill="none" />
      <text x="32" y="316" class="map-small-text">50 m</text>
    </g>
    <g class="map-north"><text x="758" y="33">N</text><path d="M758 43l-5 12 5-3 5 3z" /></g>
  </svg>
</template>
