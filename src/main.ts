import { createApp } from "vue";
import App from "./App.vue";

import "./output.css";

// import './demos/ipc'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

const app = createApp(App);
app.provide("version_string", window.version_string);
app.mount("#app");
// .$nextTick(() => {
//   postMessage({ payload: "removeLoading" }, "*");
// });
