<template>
  <div class="field">
    <label class="field-label field-label-strong" :for="name">{{
      label
    }}<span v-if="$attrs.required !== undefined && $attrs.required !== false" class="field-required"> (required)</span></label>
    <div v-if="fieldHint" class="field-hint" :id="`${name}-hint`">{{ fieldHint }}</div>
    <input
      class="text-input"
      ref="input"
      :id="name"
      :name="name"
      :type="type"
      :inputmode="inputMode"
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
    fieldHint() {
      if (this.$attrs.readonly !== undefined && this.$attrs.readonly !== false) return 'This value is read-only.';
      if (this.$attrs.disabled !== undefined && this.$attrs.disabled !== false) return 'This field is unavailable right now.';
      if (this.hint) return this.hint;
      const label = String(this.label || 'this field').toLowerCase();
      if (this.type === 'tel') return this.numericPhone ? 'Enter digits only.' : 'Enter a phone number in the format shown.';
      if (this.type === 'email') return 'Enter a valid email address.';
      if (this.type === 'number') {
        const min = this.$attrs.min;
        const max = this.$attrs.max;
        if (min !== undefined && max !== undefined) return `Enter a number from ${min} to ${max}.`;
        if (min !== undefined) return `Enter a number of at least ${min}.`;
        if (max !== undefined) return `Enter a number no greater than ${max}.`;
        return `Enter a number for ${label}.`;
      }
      if (this.type === 'date') return 'Choose a valid date.';
      if (this.type === 'datetime-local') return 'Choose a valid date and time.';
      if (this.$attrs.pattern) return 'Enter a value in the format shown.';
      if (this.type === 'password') return `Enter ${label}.`;
      return `Please enter ${label}.`;
    },
    numericPhone() {
      return this.type === 'tel' && !String(this.$attrs.pattern || '').includes('[+]');
    },
    inputMode() {
      return this.numericPhone ? 'numeric' : undefined;
    },
    value: {
      get() { return this.modelValue; },
      set(value) {
        if (this.numericPhone) value = String(value).replace(/\D/g, '');
        this.$emit("update:modelValue", value);
      },
    },
    describedBy() {
      return [this.$attrs["aria-describedby"], this.fieldHint ? `${this.name}-hint` : ""].filter(Boolean).join(" ") || undefined;
    },
  },
  emits: { "update:modelValue": (value) => typeof value === "string" || typeof value === "number" },
  methods: { focus() { this.$refs.input.focus(); } },
};
</script>
