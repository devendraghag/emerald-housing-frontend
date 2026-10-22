<template>
  <div class="field">
    <label class="field-label field-label-strong" :for="name">{{
      label
    }}<span v-if="$attrs.required !== undefined && $attrs.required !== false" class="field-required"> (required)</span></label>
    <div v-if="hint" class="field-hint" :id="`${name}-hint`">{{ hint }}</div>
    <input
      class="text-input"
      ref="input"
      :id="name"
      :name="name"
      :type="type"
      v-model="value"
      v-bind="$attrs"
      :aria-describedby="describedBy"
    />
  </div>
</template>
<script>
export default {
  name: "FormInput",
  expose: ["focus"],
  inheritAttrs: false,
  props: {
    name: String,
    label: String,
    hint: String,
    modelValue: [String, Number],
    type: { type: String, default: "text" },
  },
  computed: {
    value: {
      get() { return this.modelValue; },
      set(value) { this.$emit("update:modelValue", value); },
    },
    describedBy() {
      return [this.$attrs["aria-describedby"], this.hint ? `${this.name}-hint` : ""].filter(Boolean).join(" ") || undefined;
    },
  },
  emits: { "update:modelValue": (value) => typeof value === "string" || typeof value === "number" },
  methods: { focus() { this.$refs.input.focus(); } },
};
</script>
