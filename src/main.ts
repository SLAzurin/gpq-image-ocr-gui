import { createApp } from "vue";
import App from "./App.vue";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import hljsVuePlugin from "@highlightjs/vue-plugin";
import "highlight.js/styles/vs2015.css";
import "highlight.js/lib/common";

hljs.registerLanguage("json", json);

import "./output.css";

// import './demos/ipc'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

createApp(App).use(hljsVuePlugin).mount("#app");
// .$nextTick(() => {
//   postMessage({ payload: "removeLoading" }, "*");
// });
