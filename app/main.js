import { createApp } from "./node_modules/vue/dist/vue.esm-browser.js";

createApp({
  data() {
    return {
      count: 0,
    };
  },
  template: `
    <main class="card">
      <p>Baymax app</p>
      <h1>Vue is running.</h1>
      <p>ローカルの Vue ランタイムだけで動く最小構成です。</p>
      <div class="row">
        <button type="button" @click="count += 1">count up</button>
        <span class="count">{{ count }}</span>
      </div>
    </main>
  `,
}).mount("#app");
