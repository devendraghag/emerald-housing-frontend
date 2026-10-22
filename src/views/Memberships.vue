<template>
  <div>
    <router-link class="back-link" to="/members">Back to members</router-link
    ><span class="page-kicker">{{ member ? member.fullName : "Member" }}</span>
    <h1 class="page-title">Flat memberships</h1>
    <StatusMessage :message="error" error retry @retry="load" /><StatusMessage
      :message="success"
    />
    <p class="sr-only" role="status" aria-atomic="true">{{ busy ? 'Saving membership changes...' : '' }}</p>
    <p v-if="loading" role="status" class="body-text">Loading memberships...</p>
    <template v-else-if="ready"
      ><div class="table-wrap">
        <table v-if="memberships.length" class="data-table">
          <caption class="sr-only">
            Member flat assignments
          </caption>
          <thead>
            <tr>
              <th scope="col" class="data-table-heading">Flat</th>
              <th scope="col" class="data-table-heading">Relationship</th>
              <th scope="col" class="data-table-heading">From</th>
              <th scope="col" class="data-table-heading">To</th>
              <th scope="col" class="data-table-heading">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in pagedMemberships" :key="item.membershipId">
              <td class="data-table-cell" data-label="Flat">
                {{ flatName(item.flatId) }}
              </td>
              <td class="data-table-cell" data-label="Relationship">
                {{ item.relationshipType }}
              </td>
              <td class="data-table-cell" data-label="From">
                {{ item.startDate }}
              </td>
              <td class="data-table-cell" data-label="To">
                {{ item.endDate || "Current" }}
              </td>
              <td class="data-table-cell" data-label="Action">
                <button
                  v-if="!item.endDate"
                  class="link-button"
                  :disabled="busy"
                  type="button"
                  @click="beginEnd(item, $event)"
                >
                  End membership<span class="sr-only"> for flat {{ flatName(item.flatId) }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="body-text">No flat memberships yet.</p>
      </div>
      <Pagination :page="membershipPage" :pages="membershipPages" :disabled="busy" label="Memberships pagination" @change="membershipPage = $event" />
      <form v-if="ending" class="panel form-page" @submit.prevent="end">
        <h2 class="section-title">
          End membership for flat {{ flatName(ending.flatId) }}
        </h2>
        <Input
          name="endDate"
          label="End date"
          type="date"
          v-model="endDate"
          :min="ending.startDate"
          :max="today"
          required
        />
        <div class="button-row">
          <button class="button button-danger" :disabled="busy">
            Confirm end membership</button
          ><button type="button" class="link-button" @click="cancelEnd">
            Cancel
          </button>
        </div>
      </form>
      <form
        v-if="member.status === 'ACTIVE'"
        class="panel form-page"
        @submit.prevent="assign"
      >
        <h2 class="section-title">Assign a flat</h2>
        <fieldset class="plain-fieldset" :disabled="busy"><legend class="sr-only">Flat assignment details</legend>
          <div class="field">
            <label class="field-label field-label-strong" for="flatId"
              >Flat</label
            ><select
              id="flatId"
              class="select-input"
              v-model="form.flatId"
              required
            >
              <option value="">Select a flat</option>
              <option
                v-for="flat in activeFlats"
                :key="flat.flatId"
                :value="flat.flatId"
              >
                {{ flat.flatNumber }} - Floor {{ flat.floorNumber }}
              </option>
            </select>
          </div>
          <div class="field">
            <label class="field-label field-label-strong" for="relationship"
              >Relationship</label
            ><select
              id="relationship"
              class="select-input"
              v-model="form.relationshipType"
            >
              <option>OWNER</option>
              <option>TENANT</option>
              <option>RESIDENT</option>
            </select>
          </div>
          <Input
            name="startDate"
            label="Start date"
            type="date"
            v-model="form.startDate"
            :max="today"
            required
          /><button class="button" :disabled="!activeFlats.length">
            {{ busy ? "Saving..." : "Assign flat" }}
          </button>
          <p v-if="!activeFlats.length" class="body-text">
            Add an active flat before assigning a membership.
          </p>
        </fieldset>
      </form></template
    >
  </div>
</template>
<script>
import { focusElement } from "../util/keyboard.cjs";
import { api, errorMessage } from "../services/api";
import { localDate } from "../util/contracts.cjs";
import Pagination from "../components/Pagination.vue";
import { pageItems, pageCount, clampPage } from "../util/pagination.cjs";
import Input from "../components/forms/Input.vue";
import StatusMessage from "../components/StatusMessage.vue";
export default {
  props: { id: String },
  components: { Input, StatusMessage, Pagination },
  data: () => ({
    today: localDate(),
    member: null,
    flats: [],
    memberships: [],
    membershipPage: 0,
    form: { flatId: "", relationshipType: "OWNER", startDate: localDate() },
    ending: null,
    endDate: localDate(),
    loading: false,
    busy: false,
    ready: false,
    error: "",
    success: "",
  }),
  computed: {
    membershipPages() { return pageCount(this.memberships.length); },
    pagedMemberships() { return pageItems(this.memberships, this.membershipPage); },
    activeFlats() {
      return this.flats.filter((f) => f.status === "ACTIVE");
    },
  },
  created() {
    this.load();
  },
  methods: {
    beginEnd(item, event) {
      this.endTrigger = event.currentTarget;
      this.ending = item;
      this.endDate = this.today;
      this.$nextTick(() => focusElement(document.getElementById('endDate')));
    },
    cancelEnd() {
      this.ending = null;
      this.$nextTick(() => focusElement(this.endTrigger));
    },
    flatName(id) {
      const flat = this.flats.find((f) => f.flatId === id);
      return flat ? flat.flatNumber : id;
    },
    async load() {
      this.loading = true;
      this.error = "";
      this.ready = false;
      try {
        [this.member, this.flats, this.memberships] = await Promise.all([
          api.get("members", this.id),
          api.all("flats"),
          api.memberships(this.id),
        ]);
        this.membershipPage = clampPage(this.membershipPage, this.membershipPages);
        this.ready = true;
      } catch (e) {
        this.error = errorMessage(e);
      } finally {
        this.loading = false;
      }
    },
    async assign() {
      if (this.busy) return;
      this.busy = true;
      this.error = "";
      this.success = "";
      try {
        await api.assign(this.id, this.form);
        this.form.flatId = "";
        await this.load();
        if (this.ready) this.success = "Flat assigned successfully.";
      } catch (e) {
        this.error = errorMessage(e);
      } finally {
        this.busy = false;
      }
    },
    async end() {
      if (this.busy) return;
      this.busy = true;
      this.error = "";
      this.success = "";
      try {
        await api.end(this.id, this.ending.membershipId, this.endDate);
        this.ending = null;
        await this.load();
        if (this.ready) this.success = "Membership ended successfully.";
      } catch (e) {
        this.error = errorMessage(e);
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>
