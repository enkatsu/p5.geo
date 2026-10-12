<script setup>
import { withBase } from 'vitepress';
import { examples } from '../.vitepress/examples.js';
</script>

# Examples

Each example runs right here, and can be opened in the p5.js Web Editor to change it.

<ul>
  <li v-for="(example, name) in examples" :key="name">
    <a :href="withBase(`/examples/${name}`)">{{ example.title }}</a>: {{ example.description }}
  </li>
</ul>
