import {can,canRead} from './access.cjs';
export default {
  computed:{currentUser(){return this.$store.state.session.user;}},
  methods:{can(permission,scope='SOCIETY'){return can(this.currentUser,permission,scope);},canRead(permission){return canRead(this.currentUser,permission);}}
};
