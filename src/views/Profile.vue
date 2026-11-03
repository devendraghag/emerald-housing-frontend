<template>
  <section class="profile-page" aria-labelledby="profile-title">
    <header class="profile-heading">
      <span class="page-kicker">MY ACCOUNT</span>
      <h1 id="profile-title" class="page-title">Your profile</h1>
      <p class="lead">Manage the contact details linked to your society account.</p>
    </header>

    <StatusMessage :message="error" error retry @retry="load" />
    <StatusMessage :message="success" />

    <div v-if="loading" class="profile-loading" role="status" aria-live="polite">
      <span class="loading-spinner" aria-hidden="true"></span>
      <span>Loading your profile…</span>
    </div>

    <div v-else-if="profile" class="profile-layout">
      <article class="profile-card panel" aria-labelledby="registered-details-title">
        <div class="identity-header">
          <div class="profile-avatar" aria-hidden="true">{{ initials }}</div>
          <div class="identity-copy">
            <span class="identity-label">REGISTERED MEMBER</span>
            <h2 id="registered-details-title">{{ profile.fullName }}</h2>
            <span class="member-reference">Member #{{ profile.memberId }}</span>
          </div>
          <span class="status-badge"><span class="status-dot"></span>{{ profile.status }}</span>
        </div>

        <div class="profile-divider"></div>

        <dl class="contact-details">
          <div class="detail-item">
            <dt><span class="detail-icon" aria-hidden="true">☎</span>Mobile number</dt>
            <dd>{{ profile.mobileNumber || 'Not provided' }}</dd>
          </div>
          <div class="detail-item">
            <dt><span class="detail-icon detail-icon-mail" aria-hidden="true">@</span>Email address</dt>
            <dd>{{ profile.email || 'Not provided' }}</dd>
          </div>
        </dl>

        <router-link class="history-link" :to="'/members/' + profile.memberId + '/memberships'">
          <span><strong>Membership history</strong><small>View your registered membership records</small></span>
          <span class="history-arrow" aria-hidden="true">→</span>
        </router-link>
      </article>

      <section class="edit-card panel" aria-labelledby="edit-profile-title">
        <div class="card-heading">
          <span class="edit-mark" aria-hidden="true">✎</span>
          <div>
            <h2 id="edit-profile-title" class="section-title">Contact details</h2>
            <p>Keep your information up to date.</p>
          </div>
        </div>

        <form v-if="can('MEMBER_UPDATE','SELF') || can('MEMBER_UPDATE','SOCIETY')" :aria-busy="busy" @submit.prevent="save">
          <fieldset class="plain-fieldset" :disabled="busy">
            <legend class="sr-only">Update registered contact details</legend>
            <Input name="profileFullName" label="Full name" v-model="form.fullName" maxlength="160" autocomplete="name" required />
            <Input name="profileMobile" label="Mobile number" hint="10 digits, starting with 6, 7, 8 or 9." v-model="form.mobileNumber" type="tel" pattern="[6-9][0-9]{9}" autocomplete="tel" required />
            <Input name="profileEmail" label="Email address" hint="Optional" v-model="form.email" type="email" maxlength="254" autocomplete="email" />
            <button class="button save-button" type="submit" :disabled="busy">
              <span v-if="busy" class="loading-spinner" aria-hidden="true"></span>
              {{ busy ? 'Saving changes…' : 'Save changes' }}
              <span v-if="!busy" aria-hidden="true">→</span>
            </button>
          </fieldset>
        </form>
        <div v-else class="readonly-note">
          <span class="readonly-icon" aria-hidden="true">i</span>
          <p>Your registered details are read-only. Contact your society administrator to request a change.</p>
        </div>
      </section>
    </div>

    <div v-else-if="!error" class="unlinked-card panel">
      <span class="unlinked-icon" aria-hidden="true">◎</span>
      <h2>Your account is not linked yet</h2>
      <p>Your login account is not connected to a registered member. Contact your society administrator for help.</p>
    </div>
  </section>
</template>

<script>
import { api, errorMessage } from '../services/api';
import { memberPayload } from '../util/contracts.cjs';
import access from '../util/access-mixin';
import Input from '../components/forms/Input.vue';
import StatusMessage from '../components/StatusMessage.vue';

export default {
  mixins: [access],
  components: { Input, StatusMessage },
  data: () => ({
    profile: null,
    form: { fullName: '', mobileNumber: '', email: '' },
    error: '',
    success: '',
    loading: false,
    busy: false,
  }),
  computed: {
    initials() {
      return ((this.profile && this.profile.fullName) || 'M')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase();
    },
  },
  created() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      this.error = '';
      try {
        const id = this.currentUser.memberId;
        if (id) {
          this.profile = await api.get('members', id);
          this.form = {
            fullName: this.profile.fullName,
            mobileNumber: this.profile.mobileNumber,
            email: this.profile.email || '',
          };
        }
      } catch (e) {
        this.error = errorMessage(e);
      } finally {
        this.loading = false;
      }
    },
    async save() {
      if (this.busy || !(this.can('MEMBER_UPDATE', 'SELF') || this.can('MEMBER_UPDATE', 'SOCIETY'))) return;
      this.busy = true;
      this.error = '';
      this.success = '';
      try {
        this.profile = await api.save('members', this.profile.memberId, memberPayload(this.form), this.profile._etag);
        this.form = {
          fullName: this.profile.fullName,
          mobileNumber: this.profile.mobileNumber,
          email: this.profile.email || '',
        };
        this.success = 'Your registered details have been updated.';
      } catch (e) {
        this.error = errorMessage(e);
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.profile-page { max-width: 1050px; margin: 0 auto; }
.profile-heading { margin-bottom: 27px; }
.profile-heading .page-title { margin-bottom: 8px; }
.profile-layout { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(310px, .95fr); gap: 20px; align-items: start; }
.profile-card, .edit-card, .unlinked-card { margin: 0; padding: 26px; border: 1px solid var(--border, #e4e9e3); border-radius: 16px; background: var(--surface, #fff); box-shadow: 0 8px 26px rgba(37, 55, 43, .045); }
.identity-header { display: flex; align-items: center; gap: 16px; min-width: 0; }
.profile-avatar { width: 62px; height: 62px; flex: 0 0 62px; display: grid; place-items: center; border-radius: 18px; color: #fff; background: linear-gradient(145deg, #297153, #174b39); font-size: 21px; font-weight: 650; letter-spacing: .5px; }
.identity-copy { min-width: 0; flex: 1; }
.identity-label { display: block; margin-bottom: 5px; color: #79857d; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; }
.identity-copy h2 { overflow-wrap: anywhere; margin: 0 0 4px; color: var(--ink, #27352c); font-size: 21px; font-weight: 620; letter-spacing: -.45px; }
.member-reference { color: #7f8982; font-size: 12px; }
.status-badge { display: inline-flex; align-items: center; gap: 7px; flex: 0 0 auto; padding: 7px 10px; border: 1px solid #d6e9db; border-radius: 999px; background: #f1f8f2; color: #286244; font-size: 11px; font-weight: 650; text-transform: capitalize; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #3c9b61; }
.profile-divider { height: 1px; margin: 23px 0 5px; background: #edf0ed; }
.contact-details { margin: 0; }
.detail-item { display: flex; justify-content: space-between; align-items: center; gap: 18px; padding: 14px 0; border-bottom: 1px solid #f0f2f0; }
.detail-item:last-child { border-bottom: 0; }
.detail-item dt { display: flex; align-items: center; gap: 10px; color: #737e76; font-size: 12px; }
.detail-icon { display: grid; place-items: center; width: 29px; height: 29px; border-radius: 9px; color: #356d51; background: #edf5ef; font-size: 14px; }
.detail-icon-mail { font-weight: 700; }
.detail-item dd { margin: 0; overflow-wrap: anywhere; color: #26352c; font-size: 13px; font-weight: 600; text-align: right; }
.history-link { display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-top: 15px; padding: 15px 16px; border: 1px solid #e5ece6; border-radius: 12px; background: #f8faf8; color: inherit; text-decoration: none; transition: border-color .18s, background .18s, transform .18s; }
.history-link:hover { transform: translateY(-1px); border-color: #b7d0be; background: #f2f7f2; }
.history-link:focus-visible { outline: 3px solid #9ac5a7; outline-offset: 3px; }
.history-link strong, .history-link small { display: block; }
.history-link strong { color: #285840; font-size: 12px; }
.history-link small { margin-top: 4px; color: #778179; font-size: 11px; }
.history-arrow { color: #387551; font-size: 20px; }
.card-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
.edit-mark { display: grid; place-items: center; width: 39px; height: 39px; border-radius: 12px; background: #edf5ef; color: #326c4c; font-size: 19px; }
.card-heading .section-title { margin: 0 0 4px; color: var(--ink, #27352c); font-size: 16px; font-weight: 650; }
.card-heading p { margin: 0; color: #778179; font-size: 12px; }
.edit-card .plain-fieldset { display: grid; gap: 17px; }
.save-button { width: 100%; margin-top: 3px; background: #176044; }
.save-button:hover { background: #104e3b; }
.save-button:disabled { cursor: wait; opacity: .72; }
.save-button .loading-spinner { width: 15px; height: 15px; border-width: 2px; }
.profile-loading { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 220px; color: #65736a; font-size: 13px; }
.readonly-note { display: flex; align-items: flex-start; gap: 12px; padding: 15px; border: 1px solid #e5ece6; border-radius: 12px; background: #f7faf7; }
.readonly-note p { margin: 0; color: #647168; font-size: 12px; line-height: 1.7; }
.readonly-icon { display: grid; place-items: center; width: 22px; height: 22px; flex: 0 0 22px; border-radius: 50%; background: #e4eee6; color: #35684b; font-size: 13px; font-weight: 700; }
.unlinked-card { max-width: 590px; padding: 40px; text-align: center; }
.unlinked-icon { display: inline-grid; place-items: center; width: 50px; height: 50px; border-radius: 16px; background: #edf5ef; color: #326c4c; font-size: 28px; }
.unlinked-card h2 { margin: 16px 0 8px; color: var(--ink, #27352c); font-size: 19px; }
.unlinked-card p { max-width: 390px; margin: 0 auto; color: #748077; font-size: 13px; line-height: 1.7; }
@media (max-width: 760px) { .profile-layout { grid-template-columns: 1fr; } }
@media (max-width: 480px) {
  .profile-card, .edit-card { padding: 20px 17px; }
  .identity-header { flex-wrap: wrap; gap: 12px; }
  .profile-avatar { width: 53px; height: 53px; flex-basis: 53px; border-radius: 15px; }
  .identity-copy h2 { font-size: 18px; }
  .status-badge { margin-left: 65px; }
  .detail-item { align-items: flex-start; flex-direction: column; gap: 8px; }
  .detail-item dd { padding-left: 39px; text-align: left; }
  .unlinked-card { padding: 30px 22px; }
}
</style>
