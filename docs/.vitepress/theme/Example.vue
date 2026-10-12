<script setup>
import { computed } from 'vue';
import { withBase } from 'vitepress';
import { examples } from '../examples.js';

const props = defineProps({
  name: { type: String, required: true },
  height: { type: Number, default: 480 },
});
const example = computed(() => examples[props.name]);
const src = computed(() => withBase(`/sketches/${props.name}/`));
</script>

<template>
  <div class="p5geo-example">
    <iframe :src="src" :title="example.title" :style="{ height: `${height}px` }" loading="lazy"></iframe>
    <div class="links">
      <a :href="src" target="_blank" rel="noopener">Open in a new tab</a>
      <a v-if="example.webEditor" :href="example.webEditor" target="_blank" rel="noopener">Open in the p5.js Web Editor</a>
    </div>
  </div>
</template>

<style scoped>
.p5geo-example {
  margin: 16px 0;
}
iframe {
  display: block;
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}
.links {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 14px;
}
</style>
