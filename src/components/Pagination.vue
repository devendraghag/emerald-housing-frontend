<template>
  <nav v-if="pages > 1" class="pagination" :aria-label="label">
    <span class="pagination-summary" role="status" aria-atomic="true">Page {{ page + 1 }} of {{ pages }} &#183; 10 per page</span>
    <div class="pagination-buttons">
      <button type="button" class="button button-secondary" :disabled="disabled || page <= 0" aria-label="Go to first page" @click="$emit('change', 0)">First</button>
      <button type="button" class="button button-secondary" :disabled="disabled || page <= 0" aria-label="Go to previous page" @click="$emit('change', page - 1)">Previous</button>
      <button type="button" class="button button-secondary" :disabled="disabled || page >= pages - 1" aria-label="Go to next page" @click="$emit('change', page + 1)">Next</button>
      <button type="button" class="button button-secondary" :disabled="disabled || page >= pages - 1" aria-label="Go to last page" @click="$emit('change', pages - 1)">Last</button>
    </div>
  </nav>
</template>
<script>
export default {
  props: {
    page: { type: Number, default: 0 },
    pages: { type: Number, default: 0 },
    disabled: Boolean,
    label: { type: String, default: 'List pagination' },
  },
  emits: ['change'],
};
</script>
