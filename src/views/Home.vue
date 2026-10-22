<template>
    <div class="dashboard">
        <div class="dashboard-heading">
            <div><span class="page-kicker">YOUR COMMUNITY AT A GLANCE</span>
                <h1 class="page-title">A good day starts at home<span class="title-dot">.</span></h1>
                <p class="lead">Here's what's happening in your Emerald community.</p>
            </div><button class="button button-secondary refresh-button"
                :aria-label="loading ? 'Refreshing overview' : 'Refresh overview'" :disabled="loading" @click="load">
                <Icon name="refresh" :class="{ spinning: loading }" :size="16" />{{ loading ? 'Refreshing' : 'Refresh'
                }}
            </button>
        </div>
        <p class="sr-only" role="status" aria-atomic="true">{{ loading ? 'Refreshing overview...' : refreshedAt ?
            'Overview updated.' : '' }}</p>
        <StatusMessage :message="error" error retry @retry="load" />
        <div class="stats-grid" :aria-busy="loading"><router-link to="/members" class="stat-card"><span
                    class="stat-icon plum">
                    <Icon name="people" :size="23" />
                </span><span class="stat-label">Community members</span><strong>{{ memberTotal === null ? '—' :
                    memberTotal }}</strong><span class="stat-foot">People who call it home
                    <Icon name="arrow" :size="15" />
                </span></router-link><router-link to="/flats" class="stat-card"><span class="stat-icon peach">
                    <Icon name="building" :size="23" />
                </span><span class="stat-label">Registered flats</span><strong>{{ flatTotal === null ? '—' : flatTotal
                    }}</strong><span class="stat-foot">Every home, in one place
                    <Icon name="arrow" :size="15" />
                </span></router-link><a href="#floor-explorer" class="stat-card"><span class="stat-icon lavender">
                    <Icon name="layers" :size="23" />
                </span><span class="stat-label">Society floors</span><strong>{{ loading && !$store.state.floors.length ?
                    '—' : $store.state.floors.length }}</strong><span class="stat-foot">Explore your building
                    <Icon name="arrow" :size="15" />
                </span></a></div>
        <section class="welcome-banner">
            <div class="welcome-copy"><span class="eyebrow">A LITTLE MORE CONNECTED</span>
                <h2>People make a place.<br /><em>You make it a community.</em></h2>
                <p>Keep the everyday running smoothly, so there's more room for the moments that matter.</p>
            </div>
            <div class="hero-illustration" aria-hidden="true">
                <div class="hero-orbit"></div>
                <div class="mini-building"><span v-for="n in 12" :key="n"></span></div>
                <div class="floating-label"><span class="tiny-dot"></span> Better together</div>
                <div class="hero-home">
                    <Icon name="home" :size="47" />
                </div>
            </div>
        </section>
        <div class="dashboard-columns">
            <section class="society-section" id="floor-explorer">
                <div class="section-heading">
                    <div><span class="page-kicker">GET TO KNOW YOUR SPACE</span>
                        <h2 class="section-title">Explore your building</h2>
                    </div><span class="subtle-tag">{{ $store.state.floors.length }} floors</span>
                </div>
                <div v-if="$store.state.society" class="society-detail"><span class="society-avatar">
                        <Icon name="building" :size="25" />
                    </span>
                    <div><strong>{{ $store.state.society.societyName }}</strong><span class="muted">Choose a floor to
                            discover its flats</span></div>
                </div>
                <div v-if="loading" class="skeleton-lines" role="status"><span></span><span></span><span
                        class="sr-only">Loading building details</span></div>
                <div class="floor-list"><button v-for="floor in pagedFloors" :key="floor.floorNumber"
                        :class="{ selected: selectedFloor === floor.floorNumber }"
                        :aria-pressed="selectedFloor === floor.floorNumber"
                        @click="selectFloor(floor.floorNumber)"><span>FLOOR</span>{{
                            String(floor.floorNumber).padStart(2, '0') }}</button></div>
                <Pagination :page="floorPage" :pages="floorPages" label="Floors pagination"
                    @change="floorPage = $event" />
                <div v-if="selectedFloor !== null" class="floor-results" aria-live="polite">
                    <div class="section-heading"><strong>Floor {{ selectedFloor }}</strong><router-link to="/flats">View
                            directory
                            <Icon name="arrow" :size="14" />
                        </router-link></div>
                    <p v-if="floorLoading" class="body-text">Finding flats...</p>
                    <StatusMessage v-else-if="floorError" :message="floorError" error retry
                        @retry="selectFloor(selectedFloor)" />
                    <div v-else-if="floorFlats.length" class="flat-chips"><router-link v-for="flat in pagedFloorFlats"
                            :key="flat.flatId" :to="'/flats/' + flat.flatId + '/edit'">
                            <Icon name="home" :size="16" />{{ flat.flatNumber }}<span class="tiny-dot"
                                :class="{ gray: flat.status !== 'ACTIVE' }"></span>
                        </router-link></div>
                    <p v-else class="body-text">No flats registered on this floor yet. <router-link to="/flats/new">Add
                            a flat</router-link></p>
                    <Pagination :page="flatPage" :pages="flatPages" :disabled="floorLoading"
                        label="Floor flats pagination" @change="flatPage = $event" />
                </div>
            </section>
            <section class="quick-actions-panel"><span class="page-kicker">MAKE YOURSELF AT HOME</span>
                <h2 class="section-title">Everyday essentials</h2><router-link to="/members/new"
                    class="quick-action"><span class="action-icon plum">
                        <Icon name="people" />
                    </span><span><strong>Add a member</strong><small>A new face in the community</small></span>
                    <Icon name="chevron" :size="16" />
                </router-link><router-link to="/flats/new" class="quick-action"><span class="action-icon peach">
                        <Icon name="building" />
                    </span><span><strong>Register a flat</strong><small>Make room for another home</small></span>
                    <Icon name="chevron" :size="16" />
                </router-link><router-link to="/members" class="quick-action"><span class="action-icon lavender">
                        <Icon name="layers" />
                    </span><span><strong>Manage memberships</strong><small>Connect members to their flats</small></span>
                    <Icon name="chevron" :size="16" />
                </router-link>
                <div class="community-note">
                    <Icon name="home" :size="24" />
                    <p>Good communities grow<br /><strong>one connection at a time.</strong></p>
                </div>
                <p v-if="refreshedAt" class="last-refreshed">
                    <Icon name="clock" :size="13" /> Updated {{ refreshedAt }}
                </p>
            </section>
        </div>
    </div>
</template>
<script>
import Pagination from '../components/Pagination.vue';
import { pageItems, pageCount } from '../util/pagination.cjs';
import Icon from '../components/Icon.vue';
import StatusMessage from '../components/StatusMessage.vue';
import { api, errorMessage } from '../services/api';
export default {
    components: { Icon, StatusMessage, Pagination },
    data: () => ({ loading: false, error: '', memberTotal: null, flatTotal: null, refreshedAt: '', selectedFloor: null, floorFlats: [], floorLoading: false, floorError: '', floorRequest: 0, floorPage: 0, flatPage: 0 }),
    computed: {
        floorPages() { return pageCount(this.$store.state.floors.length); },
        pagedFloors() { return pageItems(this.$store.getters.sortedFloors, this.floorPage); },
        flatPages() { return pageCount(this.floorFlats.length); },
        pagedFloorFlats() { return pageItems(this.floorFlats, this.flatPage); },
    },
    beforeUnmount() { this.floorController && this.floorController.abort(); this.floorRequest++; },
    created() { this.load(); },
    methods: {
        async load() {
            this.loading = true; this.error = '';
            try {
                const [, members, flats] = await Promise.all([this.$store.dispatch('loadReferenceData'), api.page('members'), api.page('flats')]);
                this.memberTotal = members.totalElements; this.flatTotal = flats.totalElements;
                this.refreshedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                if (this.selectedFloor !== null) await this.selectFloor(this.selectedFloor);
            } catch (error) { this.error = errorMessage(error); }
            finally { this.loading = false; }
        },
        async selectFloor(number) {
            this.floorController && this.floorController.abort();
            this.floorController = new AbortController();
            const request = ++this.floorRequest;
            this.flatPage = 0;
            this.selectedFloor = number; this.floorLoading = true; this.floorError = ''; this.floorFlats = [];
            try { const data = await api.flatsByFloor(number, { signal: this.floorController.signal }); if (request === this.floorRequest) this.floorFlats = data; }
            catch (error) { if (error.code !== 'ERR_CANCELED' && request === this.floorRequest) this.floorError = errorMessage(error); }
            finally { if (request === this.floorRequest) this.floorLoading = false; }
        },
    },
};
</script>