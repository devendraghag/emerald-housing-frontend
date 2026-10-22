import { h } from 'vue';

// Raw diagnostic storage deliberately avoids causing render/update loops.
export const lifecycleLog = [];
function record(instance, hook) {
  lifecycleLog.push(`${instance.$options.name}: ${hook}`);
  if (lifecycleLog.length > 80) lifecycleLog.shift();
}
export const lifecycleMixin = {
  beforeCreate() { record(this, 'beforeCreate'); },
  created() { record(this, 'created'); },
  beforeMount() { record(this, 'beforeMount'); },
  mounted() { record(this, 'mounted'); },
  beforeUpdate() { record(this, 'beforeUpdate'); },
  updated() { record(this, 'updated'); },
  beforeUnmount() { record(this, 'beforeUnmount'); },
  unmounted() { record(this, 'unmounted'); },
  activated() { record(this, 'activated'); },
  deactivated() { record(this, 'deactivated'); },
  renderTracked() { record(this, 'renderTracked (development)'); },
  renderTriggered() { record(this, 'renderTriggered (development)'); },
};
export const CounterBase = {
  data() { return { count: 0 }; },
  methods: { increment() { this.count++; } },
};
export const RenderSummary = {
  name: 'RenderSummary',
  props: { count: { type: Number, required: true, validator: value => value >= 0 } },
  render() { return h('p', { class: 'body-text' }, this.$slots.default ? this.$slots.default({ count: this.count }) : `Count: ${this.count}`); },
};
export const IntentionalError = {
  name: 'IntentionalError',
  render() { throw new Error('Example descendant error captured successfully.'); },
};
