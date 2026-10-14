<script setup>
import { withBase } from 'vitepress';
import { examples } from '../.vitepress/examples.js';
</script>

# Examples

Each example runs on its page and can be opened in the p5.js Web Editor.

<ul>
  <li v-for="(example, name) in examples" :key="name">
    <a :href="withBase(`/examples/${name}`)">{{ example.title }}</a>: {{ example.description }}
  </li>
</ul>
