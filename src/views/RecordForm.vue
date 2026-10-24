<template>
  <div class="form-page">
    <router-link class="back-link" :to="`/${type}`"
      >Back to {{ type }}</router-link
    >
    <h1 class="page-title">{{ readonly ? "View" : id ? "Edit" : "Add" }} {{ singular }}</h1>
    <StatusMessage :message="error" error :retry="!ready" @retry="load" /><StatusMessage :message="success" />
    <p v-if="loading" role="status" class="body-text">Loading record...</p>
    <p class="sr-only" role="status" aria-atomic="true">{{ busy ? 'Saving changes...' : '' }}</p>
    <form v-if="!loading && ready" :aria-busy="busy" @submit.prevent="save">
      <fieldset class="plain-fieldset" :disabled="busy"><legend class="sr-only">{{ id ? "Edit" : "Add" }} {{ singular }} details</legend>
        <template v-if="type === 'members'"
          ><Input
            :disabled="!canSave"
            name="fullName"
            label="Full name"
            v-model="form.fullName"
            required
            maxlength="160"
            autocomplete="name" /><Input
            :disabled="!canSave"
            name="mobileNumber"
            label="Mobile number"
            hint="10 digits, starting with 6, 7, 8 or 9."
            v-model="form.mobileNumber"
            type="tel"
            required
            pattern="[6-9][0-9]{9}"
            autocomplete="tel" /><Input
            :disabled="!canSave"
            name="email"
            label="Email address (optional)"
            v-model="form.email"
            type="email"
            maxlength="254"
            autocomplete="email" /></template
        ><template v-else
          ><Input
            :disabled="!canSave"
            name="flatNumber"
            label="Flat number"
            v-model="form.flatNumber"
            required
            maxlength="40" /><Input
            :disabled="!canSave"
            name="floorNumber"
            label="Floor number"
            hint="Enter a floor from 1 to 18."
            v-model="form.floorNumber"
            type="number"
            min="1"
            max="18"
            step="1"
            required
        /></template>
        <div class="button-row">
          <button v-if="canSave" class="button" type="submit">
            {{ busy ? "Saving..." : "Save " + singular }}</button
          ><router-link :to="`/${type}`">Cancel</router-link>
        </div>
        <section v-if="id && status === 'ACTIVE' && !readonly && can(prefix+'_DEACTIVATE')" class="danger-area">
          <h2 class="section-title">Deactivate {{ singular }}</h2>
          <p class="body-text">This marks the {{ singular }} as inactive.</p>
          <label class="field-label"
            ><input type="checkbox" v-model="confirmDeactivate" /> I confirm
            that this {{ singular }} should be deactivated.</label
          ><button
            type="button"
            class="button button-danger"
            :disabled="!confirmDeactivate"
            @click="deactivate"
          >
            Deactivate {{ singular }}
          </button>
        </section>
        <p v-else-if="id" class="body-text">Status: {{ status }}</p>
      </fieldset>
    </form>
  </div>
</template>
<script>
import access from '../util/access-mixin';
import Input from "../components/forms/Input.vue";
import StatusMessage from "../components/StatusMessage.vue";
import { api, errorMessage } from "../services/api";
import { memberPayload, flatPayload } from "../util/contracts.cjs";
export default {
  mixins: [access],
  props: { type: String, id: String, readonly: Boolean },
  components: { Input, StatusMessage },
  data: () => ({
    form: {
      fullName: "",
      mobileNumber: "",
      email: "",
      flatNumber: "",
      floorNumber: 1,
    },
    loading: false,
    ready: false,
    busy: false,
    error: "",
    success: "",
    status: "",
    confirmDeactivate: false,
  }),
  computed: {
    prefix() { return this.type === "members" ? "MEMBER" : "FLAT"; },
    canSave() { return !this.readonly && this.can(this.prefix+(this.id?"_UPDATE":"_CREATE")); },
    singular() {
      return this.type === "members" ? "member" : "flat";
    },
  },
  created() { this.load(); },
  methods: {
    async load() {
    this.loading = !!this.id;
    this.error = "";
    this.ready = false;
    try {
      if (this.id) {
        const data = await api.get(this.type, this.id);
        Object.assign(this.form, data);
        this.status = data.status;
      }
      this.ready = true;
    } catch (e) {
      this.error = errorMessage(e);
    } finally {
      this.loading = false;
    }
  },
    async save() {
      if (this.busy || !this.canSave) return;
      this.busy = true;
      this.error = "";
      this.success = "";
      try {
        const data =
          this.type === "members"
            ? memberPayload(this.form)
            : flatPayload(this.form);
        await api.save(this.type, this.id, data, this.form._etag);
        await this.$router.push(`/${this.type}`);
        this.$store.commit(
          "notice",
          `${this.type === "members" ? "Member" : "Flat"} saved successfully.`
        );
      } catch (e) {
        this.error = errorMessage(e);
      } finally {
        this.busy = false;
      }
    },
    async deactivate() {
      if (!this.confirmDeactivate || this.busy || this.readonly || !this.can(this.prefix+'_DEACTIVATE')) return;
      this.busy = true;
      this.error = "";
      try {
        const record = await api.deactivate(this.type, this.id, this.form._etag);
        this.status = record.status; this.form._etag = record._etag;
        this.success = "Record deactivated successfully.";
      } catch (e) {
        this.error = errorMessage(e);
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>
