<template>
  <div
    :class="message ? (error ? 'error-message' : 'notice') : 'sr-only'"
    :role="error ? 'alert' : 'status'"
    aria-atomic="true"
    tabindex="-1"
  >
    <template v-if="message">
    <p v-if="error" class="message-title">There is a problem</p>
    <p class="body-text">{{ message }}</p>
    <button
      v-if="retry"
      type="button"
      class="link-button"
      @click="$emit('retry')"
    >
      Try again
    </button>
    </template>
  </div>
</template>
<script>
export default {
  props: { message: String, error: Boolean, retry: Boolean },
  emits: ["retry"],
};
</script>
