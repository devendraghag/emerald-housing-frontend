import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./assets/style/app.scss";
import "./assets/style/access.scss";
const app = createApp(App);
// Vue 3.2 opt-in: unwrap computed refs received through Options API inject.
app.config.unwrapInjectedRef = true;
app.use(router).use(store).mount("#root");
