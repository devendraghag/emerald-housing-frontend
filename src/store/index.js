import { createStore } from "vuex";
import { createSessionModule } from "./session.cjs";
import { auth, errorMessage } from "../services/api";
import { api } from "../services/api";
export default createStore({
  modules: { session: createSessionModule(auth, errorMessage) },
  getters: {
    floorCount: state => state.floors.length,
    sortedFloors: state => [...state.floors].sort((a, b) => a.floorNumber - b.floorNumber),
  },
  state: () => ({ society: null, floors: [], notice: "" }),
  mutations: {
    referenceData(state, { society, floors }) {
      state.society = society;
      state.floors = floors;
    },
    notice(state, message) {
      state.notice = message;
    },
  },
  actions: {
    async loadReferenceData({ commit, state }) {
      const user = state.session.user;
      const [society, floors] = await Promise.all([
        api.society(),
        api.floors(),
      ]);
      if (state.session.user === user) commit("referenceData", { society, floors });
    },
  },
});
