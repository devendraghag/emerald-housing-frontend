<template>
  <section class="panel lab-card">
    <h3><slot name="heading">{{ title }}</slot></h3>
    <p>Shared workspace: {{ workspaceName }}. Cached count: {{ count }}</p>
    <button class="button button-secondary" @click="increment">Increment {{ title }}</button>
    <slot :count="count"><p>Default slot content</p></slot>
  </section>
</template>
<script>
import { CounterBase, lifecycleMixin } from './examples';
export default {
  name: 'CachedCounter',
  extends: CounterBase,
  mixins: [lifecycleMixin],
  inject: { workspaceName: { from: 'labWorkspace', default: 'Example workspace' } },
  props: { title: { type: String, required: true, validator: value => value.length > 0 } },
};
</script>
