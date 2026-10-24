<template>
  <div>
    <span class="page-kicker">Society directory</span>
    <div class="page-heading">
      <h1 class="page-title">{{ title }}</h1>
      <router-link v-if="can(prefix+'_CREATE')" :to="`/${type}/new`" class="button"
        ><Icon name="plus" :size="17" /> Add {{ singular }}</router-link
      >
    </div>
    <p class="lead directory-intro">{{ type === 'members' ? 'A familiar face for every home. Keep your people connected.' : 'Every home has a place. Keep your flat directory in order.' }}</p>
    <div class="directory-toolbar"><div class="search-field"><Icon name="search" :size="19" /><input ref="search" v-model="query" type="search" :aria-label="'Search all permitted ' + type" :placeholder="'Search all permitted ' + type + '...'" /><button v-if="query" type="button" class="clear-search" aria-label="Clear search" @click="clearSearch">&times;</button></div><select v-model="statusFilter" class="select-input status-select" aria-label="Filter status"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select><button class="button button-secondary" :disabled="loading" @click="load(page)" aria-label="Refresh directory"><Icon name="refresh" :class="{ spinning: loading }" :size="18" /><span class="refresh-label">Refresh</span></button></div>
    <StatusMessage :message="error" error retry @retry="load(page)" />
    <div v-if="loading" class="skeleton-lines directory-skeleton" role="status"><span v-for="n in 4" :key="n"></span><span class="sr-only">Loading {{ type }}...</span></div>
    <template v-else-if="!error"
      ><div class="directory-summary" role="status" aria-atomic="true"><span><strong>{{ total }}</strong> {{ type }} registered</span><span>{{ visibleRecords.length }} shown on this page</span></div>
      <div class="table-wrap" v-if="visibleRecords.length">
        <table class="data-table">
          <caption class="sr-only">
            {{
              title
            }}
            directory
          </caption>
          <thead class="data-table-head">
            <tr class="data-table-row">
              <th scope="col" class="data-table-heading">
                {{ type === "members" ? "Full name" : "Flat number" }}
              </th>
              <th scope="col" class="data-table-heading">
                {{ type === "members" ? "Contact" : "Floor" }}
              </th>
              <th scope="col" class="data-table-heading">Status</th>
              <th scope="col" class="data-table-heading">Actions</th>
            </tr>
          </thead>
          <tbody class="data-table-body">
            <tr
              v-for="record in visibleRecords"
              :key="record[idKey]"
              class="data-table-row"
            >
              <td class="data-table-cell" :data-label="type === 'members' ? 'Full name' : 'Flat number'">
                <div class="record-identity"><span class="record-avatar" :class="{ peach: type === 'flats' }">{{ (record.fullName || record.flatNumber || '?').slice(0, 2).toUpperCase() }}</span><router-link :to="'/'+type+'/'+record[idKey]"><strong>{{ record.fullName || record.flatNumber }}</strong></router-link></div>
              </td>
              <td class="data-table-cell" :data-label="type === 'members' ? 'Contact' : 'Floor'"><div class="record-details">
                <template v-if="type === 'members'"
                  >{{ record.mobileNumber }}<br /><span class="muted">{{
                    record.email || "No email provided"
                  }}</span></template
                ><template v-else>{{ record.floorNumber }}</template></div>
              </td>
              <td class="data-table-cell" data-label="Status">
                <span
                  class="status"
                  :class="{ inactive: record.status !== 'ACTIVE' }"
                  >{{ record.status }}</span
                >
              </td>
              <td class="data-table-cell actions" data-label="Actions">
                <router-link v-if="can(prefix+'_UPDATE') || can(prefix+'_DEACTIVATE')" :to="`/${type}/${record[idKey]}/edit`"
                  >Edit<span class="sr-only">
                    {{ record.fullName || record.flatNumber }}</span
                  ></router-link
                ><router-link
                  v-if="type === 'members'"
                  :to="`/members/${record.memberId}/memberships`"
                  >Memberships<span class="sr-only">
                    for {{ record.fullName }}</span
                  ></router-link
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty">
        <Icon :name="type === 'members' ? 'people' : 'building'" :size="36" /><h2 class="section-title">{{ records.length ? 'No matching records' : 'No ' + type + ' yet' }}</h2>
        <p class="body-text">{{ records.length ? 'Try another search or status filter, or browse another page.' : 'Add your first ' + singular + ' to get started.' }}</p><button v-if="query || statusFilter" class="button button-secondary" @click="clearFilters">Clear filters</button><router-link v-else-if="can(prefix+'_CREATE')" :to="'/' + type + '/new'" class="button">Add {{ singular }}</router-link>
      </div>
</template
    >
    <Pagination :page="page" :pages="pages" :disabled="loading" :label="title + ' pagination'" @change="load" />
  </div>
</template>
<script>
import access from '../util/access-mixin';
import { focusElement } from "../util/keyboard.cjs";
import { api, errorMessage } from "../services/api";
import Pagination from "../components/Pagination.vue";
import { clampPage } from "../util/pagination.cjs";
import Icon from "../components/Icon.vue";
import StatusMessage from "../components/StatusMessage.vue";
export default {
  mixins: [access],
  props: { type: String },
  components: { StatusMessage, Icon, Pagination },
  data: () => ({
    query: "",
    statusFilter: "",
    records: [],
    page: 0,
    pages: 0,
    total: 0,
    loading: false,
    error: "",
  }),
  computed: {
    visibleRecords() { return this.records; },
    prefix() { return this.type === 'members' ? 'MEMBER' : 'FLAT'; },
    title() {
      return this.type === "members" ? "Members" : "Flats";
    },
    singular() {
      return this.type === "members" ? "member" : "flat";
    },
    idKey() {
      return this.type === "members" ? "memberId" : "flatId";
    },
  },
  beforeUnmount() { clearTimeout(this.searchTimer); this.requestController && this.requestController.abort(); },
  watch: { query() { clearTimeout(this.searchTimer); this.searchTimer = setTimeout(() => this.load(0), 300); }, statusFilter() { this.load(0); } },
  created() {
    this.load(0);
  },
  methods: {
    clearSearch() {
      this.query = '';
      this.$nextTick(() => focusElement(this.$refs.search));
    },
    clearFilters() {
      this.statusFilter = '';
      this.clearSearch();
    },
    async load(page) {
      if (this.requestController) this.requestController.abort();
      const request = (this.requestRevision || 0) + 1; this.requestRevision = request;
      page = clampPage(page, this.pages || 1);
      this.requestController = new AbortController();
      this.loading = true;
      this.error = "";
      try {
        let data = await api.page(this.type, page, { signal: this.requestController.signal, search: this.query, status: this.statusFilter });
        const validPage = clampPage(data.page, data.totalPages);
        if (data.page !== validPage) data = await api.page(this.type, validPage, { signal: this.requestController.signal, search: this.query, status: this.statusFilter });
        if (request !== this.requestRevision) return;
        this.records = data.content;
        this.page = data.page;
        this.pages = data.totalPages;
        this.total = data.totalElements;
      } catch (e) {
        if (request === this.requestRevision && e.code !== 'ERR_CANCELED') this.error = errorMessage(e);
      } finally {
        if (request === this.requestRevision) this.loading = false;
      }
    },
  },
};
</script>
