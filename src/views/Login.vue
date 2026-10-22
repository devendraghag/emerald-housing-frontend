<template>
  <div class="login-layout">
    <section class="login-story" aria-labelledby="story-title"><span class="story-tag"><span></span> YOUR COMMUNITY, CONNECTED</span><h1 id="story-title">A better place<br />to <em>belong.</em></h1><p>A thoughtful little workspace for the people and places that make your community.</p><div class="architecture-art" aria-hidden="true"><div class="art-sun"></div><div class="art-tower tower-one"><i v-for="n in 12" :key="n"></i></div><div class="art-tower tower-two"><i v-for="n in 9" :key="n"></i></div><div class="art-tree tree-one"></div><div class="art-tree tree-two"></div><div class="art-ground"></div><div class="art-caption">GOOD NEIGHBOURS. GREAT COMMUNITIES.</div></div><div class="story-footer"><Icon name="home" :size="18" /><span>People. Homes. One community.</span></div></section>
    <section class="login-form-panel" aria-labelledby="login-heading"><span class="login-symbol"><Icon name="shield" :size="27" /></span><span class="page-kicker">WELCOME BACK</span><h2 id="login-heading">Your community<br />starts here.</h2><p class="lead">Sign in to your admin workspace.</p><StatusMessage :message="error" error /><p class="sr-only" role="status" aria-atomic="true">{{ busy ? 'Signing in...' : '' }}</p><form :aria-busy="busy" @submit.prevent="submit"><fieldset class="plain-fieldset" :disabled="busy"><legend class="sr-only">Administrator sign in</legend><Input name="username" label="Username" placeholder="Enter your admin username" v-model="username" autocomplete="username" required /><div class="password-field"><Input name="password" label="Password" :type="showPassword ? 'text' : 'password'" placeholder="Enter your password" v-model="password" autocomplete="current-password" required /><button type="button" class="password-toggle" aria-controls="password" :aria-label="showPassword ? 'Hide password' : 'Show password'" :aria-pressed="showPassword" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button></div><button class="button login-submit" type="submit"><span v-if="busy" class="loading-spinner"></span>{{ busy ? 'Signing in...' : 'Sign in to workspace' }}<Icon v-if="!busy" name="arrow" :size="18" /></button></fieldset></form><div class="login-help"><Icon name="shield" :size="15" /><span>Admin access only. Need an account? Contact your society administrator.</span></div></section>
  </div>
</template>
<script>
import Input from '../components/forms/Input.vue';
import Icon from '../components/Icon.vue';
import StatusMessage from '../components/StatusMessage.vue';
import { errorMessage } from '../services/api';
export default {
 components: { Input, Icon, StatusMessage }, emits: ['signed-in'],
 data: () => ({ username: '', password: '', showPassword: false, error: '', busy: false }),
 methods: { async submit() {
  if (this.busy) return;
  this.error = ''; this.busy = true;
  try { const user = await this.$store.dispatch('session/login', { username: this.username, password: this.password }); this.password = ''; this.$emit('signed-in', user); }
  catch (error) { this.error = error.response && error.response.status === 401 ? 'Username or password is incorrect.' : errorMessage(error); }
  finally { this.busy = false; }
 } },
};
</script>