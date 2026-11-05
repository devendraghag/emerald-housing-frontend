<template>
  <section class="assistant-page" aria-labelledby="assistant-title">
    <header class="assistant-hero">
      <div class="assistant-hero-copy">
        <p class="assistant-kicker"><span class="assistant-live-dot"></span> RESIDENT HELP DESK</p>
        <h1 id="assistant-title">Ask Emerald<span>.</span></h1>
        <p>Friendly answers for the little things that make community life easier.</p>
        <div class="assistant-hero-topics" aria-label="Topics I can help with">
          <span><Icon name="search" :size="14"/> Lost &amp; Found</span>
          <span><Icon name="layers" :size="14"/> Community notices</span>
          <span><Icon name="clock" :size="14"/> Maintenance</span>
          <span><Icon name="home" :size="14"/> Rental help</span>
        </div>
      </div>
      <div class="assistant-hero-art" aria-hidden="true">
        <span class="assistant-orbit orbit-one"></span><span class="assistant-orbit orbit-two"></span>
        <span class="assistant-speech-card"><strong>Here to help</strong><small>One clear next step at a time</small></span>
        <span class="assistant-hero-mark">E</span>
      </div>
    </header>

    <div class="assistant-layout">
      <div class="assistant-main">
        <section ref="thread" class="assistant-thread" aria-label="Conversation" aria-live="polite" aria-relevant="additions text">
          <div v-if="!messages.length" class="assistant-welcome">
            <span class="assistant-avatar assistant-avatar-welcome" aria-hidden="true">E</span>
            <div><p class="assistant-message-label">YOUR COMMUNITY GUIDE</p><h2>What can I help you sort out?</h2><p>Choose a question on the right, or write it in your own words. I’ll point you to the relevant housing information.</p></div>
          </div>

          <article v-for="(message,index) in messages" :key="index" class="assistant-message" :class="message.role">
            <span class="assistant-avatar" aria-hidden="true">{{ message.role === 'assistant' ? 'E' : 'Y' }}</span>
            <div class="assistant-message-card">
              <div class="assistant-message-meta"><strong>{{ message.role === 'assistant' ? 'Emerald assistant' : 'You' }}</strong><time v-if="message.createdAt" :datetime="message.createdAt">{{ formatTime(message.createdAt) }}</time></div>
              <p>{{ message.text }}</p>
              <details v-if="message.sources && message.sources.length" class="assistant-sources">
                <summary>{{ message.sources.length }} {{ message.sources.length === 1 ? 'reference' : 'references' }} used</summary>
                <ul><li v-for="source in message.sources" :key="source.id"><span class="source-mark"><Icon name="check" :size="13"/></span><span><strong>{{ source.title }}</strong><small>{{ source.id }}</small></span></li></ul>
              </details>
            </div>
          </article>

          <div v-if="busy" class="assistant-typing" role="status"><span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>Finding a helpful answer…</span></div>
          <StatusMessage :message="error" error />
          <div ref="threadEnd" aria-hidden="true"></div>
        </section>

        <form class="assistant-composer" @submit.prevent="send">
          <label for="assistant-question">Ask your question</label>
          <div class="assistant-input-wrap">
            <textarea id="assistant-question" v-model="question" maxlength="2000" rows="2" required :disabled="busy" aria-describedby="assistant-compose-hint assistant-character-count" placeholder="Try ‘I found a set of keys. What should I do?’" @keydown.enter.exact.prevent="send"></textarea>
            <button class="assistant-send button" type="submit" :disabled="busy || !question.trim()"><span>{{ busy ? 'Thinking' : 'Send' }}</span><Icon name="arrow" :size="17"/></button>
          </div>
          <div class="assistant-composer-foot"><small id="assistant-compose-hint">Enter to send · Shift + Enter for a new line</small><small id="assistant-character-count">{{ question.length }}/2000</small></div>
        </form>
        <p class="assistant-privacy-note"><Icon name="shield" :size="14"/> Answers stay grounded in housing information. Private records still require the right account access.</p>
      </div>

      <aside class="assistant-prompts" aria-labelledby="assistant-prompts-title">
        <div class="assistant-prompts-heading"><span class="assistant-prompt-spark">✦</span><div><p class="assistant-kicker">A GOOD PLACE TO START</p><h2 id="assistant-prompts-title">Try a question</h2></div></div>
        <p class="assistant-prompts-intro">Pick a prompt, and I’ll take it from there.</p>
        <section v-for="group in promptGroups" :key="group.title" class="assistant-prompt-group">
          <h3><Icon :name="group.icon" :size="15"/>{{ group.title }}</h3>
          <div class="assistant-prompt-list"><button v-for="prompt in group.prompts" :key="prompt" type="button" :disabled="busy" @click="askSuggestion(prompt)">{{ prompt }}<Icon name="arrow" :size="14"/></button></div>
        </section>
        <div class="assistant-prompt-footer"><span class="assistant-live-dot"></span> Answers grounded in the housing guide</div>
      </aside>
    </div>
  </section>
</template>
<script>
import {api} from '../services/api';
import Icon from '../components/Icon.vue';
import StatusMessage from '../components/StatusMessage.vue';
export default {
  name:'HousingAssistant',
  components:{Icon,StatusMessage},
  data:()=>({question:'',conversationId:'',messages:[],busy:false,error:'',promptGroups:[
    {title:'Lost & Found',icon:'search',prompts:['How do I report a lost item?','I found an item, where should I report it?','How do I claim a listed item?']},
    {title:'Around the community',icon:'layers',prompts:['Where is the community notice board?','How do I check maintenance request progress?','What rental details can I view?']},
    {title:'Just saying hello',icon:'people',prompts:['Hello','Good morning','How are you?','Have a good day']}
  ]}),
  methods:{
    askSuggestion(prompt){if(this.busy)return;this.question=prompt;this.send();},
    formatTime(value){const date=new Date(value);return Number.isNaN(date.getTime())?'':date.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});},
    scrollToLatest(){this.$nextTick(()=>{if(this.$refs.threadEnd)this.$refs.threadEnd.scrollIntoView({behavior:'smooth',block:'end'});});},
    async send(){
      const question=this.question.trim();
      if(!question||this.busy)return;
      this.messages.push({role:'user',text:question,createdAt:new Date().toISOString()});this.question='';this.busy=true;this.error='';this.scrollToLatest();
      try{
        const answer=await api.askAssistant({question,...(this.conversationId?{conversationId:this.conversationId}:{})});
        this.conversationId=answer.conversationId;
        this.messages.push({role:'assistant',text:answer.answer,sources:Array.isArray(answer.sources)?answer.sources:[],createdAt:new Date().toISOString()});
      }catch(error){
        const status=error.response&&error.response.status;
        this.question=question;
        this.error=status===503?'The assistant or its model provider is temporarily unavailable. Your question is back in the box so you can try again.':status===401?'Your session has expired. Sign in again to continue.':status===403?'Your security token could not be validated. Refresh the page and try again.':'The assistant could not answer right now. Check your connection and try again.';
      }finally{this.busy=false;this.scrollToLatest();}
    }
  }
};
</script>
<style scoped>
.assistant-page{--assistant-green:#174d3c;--assistant-leaf:#477b50;--assistant-ink:#233a30;--assistant-muted:#718078;max-width:1280px;margin:0 auto;padding:clamp(1rem,3vw,2.2rem)}
.assistant-hero{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 240px;min-height:225px;overflow:hidden;margin-bottom:24px;padding:clamp(24px,4vw,42px);border:1px solid #174733;border-radius:22px;background:radial-gradient(circle at 85% 20%,#c5dc8d35,transparent 28%),linear-gradient(118deg,#133b30,#1d5b42 65%,#32704a);color:#fff;box-shadow:0 16px 38px #123b2a20}
.assistant-hero-copy{position:relative;z-index:2;align-self:center}.assistant-kicker{display:flex;align-items:center;gap:8px;margin:0 0 10px;color:#91b79a;font-size:10px;font-weight:800;letter-spacing:1.7px}.assistant-hero .assistant-kicker{color:#d3e8ce}.assistant-live-dot{width:7px;height:7px;border-radius:50%;background:#b9db8d;box-shadow:0 0 0 4px #b9db8d25}.assistant-hero h1{margin:0;color:#fff;font-size:clamp(34px,4vw,48px);font-weight:650;letter-spacing:-1.8px;line-height:1.05}.assistant-hero h1 span{color:#c7de9d}.assistant-hero-copy>p:not(.assistant-kicker){max-width:550px;margin:12px 0 20px;color:#dfebe0;font-size:14px;line-height:1.6}.assistant-hero-topics{display:flex;flex-wrap:wrap;gap:8px}.assistant-hero-topics span{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid #ffffff30;border-radius:99px;background:#ffffff12;color:#f0f6ed;font-size:11px}.assistant-hero-topics svg{color:#c7de9d}
.assistant-hero-art{position:relative;display:grid;place-items:center;min-height:155px}.assistant-orbit{position:absolute;border:1px solid #eff8e62c;border-radius:50%}.orbit-one{width:190px;height:190px}.orbit-two{width:138px;height:138px}.assistant-hero-mark{position:relative;display:grid;width:104px;height:112px;place-items:center;border:1px solid #ffffff70;border-radius:33px 33px 33px 8px;background:linear-gradient(145deg,#d8e8bd,#a6c695);color:#24543c;font:650 58px Georgia,serif;box-shadow:18px 7px 0 #739b70,0 15px 30px #081c1430;transform:rotate(-5deg)}.assistant-speech-card{position:absolute;right:-3px;bottom:7px;z-index:2;display:grid;gap:3px;padding:10px 13px;border:1px solid #ffffff40;border-radius:12px;background:#ffffff20;backdrop-filter:blur(8px);box-shadow:0 8px 20px #082b1c20}.assistant-speech-card strong{font-size:11px}.assistant-speech-card small{color:#e2eee1;font-size:9px}
.assistant-layout{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:20px;align-items:start}.assistant-main{min-width:0}.assistant-thread{display:grid;align-content:start;gap:14px;min-height:330px;max-height:min(58vh,660px);overflow-y:auto;margin-bottom:14px;padding:clamp(16px,2.5vw,25px);border:1px solid #e0e9df;border-radius:20px;background:radial-gradient(ellipse at 100% 0,#edf4e955,transparent 35%),linear-gradient(145deg,#fff,#fafcf9);box-shadow:0 10px 28px #203f2908;scroll-behavior:smooth;overscroll-behavior:contain}
.assistant-welcome{display:flex;align-items:flex-start;gap:14px;max-width:670px;margin:auto;padding:23px 12px}.assistant-avatar{display:grid;flex:none;width:38px;height:38px;place-items:center;border:1px solid #d9e8d3;border-radius:13px 13px 13px 4px;background:linear-gradient(145deg,#edf5e7,#dcebd5);color:#346444;font:600 19px Georgia,serif}.assistant-avatar-welcome{width:48px;height:48px;font-size:24px}.assistant-welcome h2{margin:0 0 7px;color:var(--assistant-ink);font-size:clamp(20px,2.7vw,27px);letter-spacing:-.6px}.assistant-welcome p:last-child{max-width:540px;margin:0;color:var(--assistant-muted);font-size:13px;line-height:1.7}.assistant-message-label{margin:2px 0 7px;color:#65846a;font-size:9px;font-weight:800;letter-spacing:1.3px}
.assistant-message{display:flex;align-items:flex-start;gap:10px;max-width:92%;animation:message-arrive .22s ease-out}.assistant-message.user{justify-self:end;flex-direction:row-reverse}.assistant-message.user .assistant-avatar{border-color:#e8ddce;border-radius:13px 13px 4px 13px;background:#f6eee5;color:#7e6042;font:700 11px system-ui}.assistant-message-card{min-width:0;padding:13px 16px;border:1px solid #e2eae0;border-radius:5px 16px 16px 16px;background:#fff;box-shadow:0 4px 14px #263f2a08}.assistant-message.user .assistant-message-card{border-color:#dce9d7;border-radius:16px 5px 16px 16px;background:linear-gradient(145deg,#f1f6ed,#eaf2e6)}.assistant-message-meta{display:flex;align-items:center;gap:10px;margin-bottom:7px}.assistant-message-meta strong{color:var(--assistant-ink);font-size:11px}.assistant-message-meta time{color:#8c9990;font-size:10px}.assistant-message-card>p{margin:0;color:#394b40;font-size:13px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}.assistant-sources{margin-top:12px;border-top:1px solid #edf1eb;padding-top:9px}.assistant-sources summary{width:max-content;max-width:100%;color:#47714e;font-size:11px;font-weight:700;cursor:pointer}.assistant-sources ul{display:grid;gap:8px;margin:10px 0 0;padding:0;list-style:none}.assistant-sources li{display:flex;align-items:flex-start;gap:8px;padding:9px 10px;border-radius:10px;background:#f5f8f3}.source-mark{display:grid;flex:none;width:20px;height:20px;place-items:center;border-radius:7px;background:#e2eee0;color:#47734d}.assistant-sources li>span:last-child{display:grid;gap:3px}.assistant-sources strong{color:#405e45;font-size:11px}.assistant-sources small{color:#839086;font-size:10px}
.assistant-typing{display:flex;align-items:center;gap:10px;width:max-content;margin-left:48px;padding:11px 14px;border:1px solid #e1eae0;border-radius:5px 14px 14px;background:#fff;color:var(--assistant-muted);font-size:11px}.typing-dots{display:flex;gap:3px}.typing-dots i{width:5px;height:5px;border-radius:50%;background:#65916b;animation:typing-pulse 1s infinite ease-in-out}.typing-dots i:nth-child(2){animation-delay:.15s}.typing-dots i:nth-child(3){animation-delay:.3s}
.assistant-composer{display:grid;gap:9px;padding:15px 17px;border:1px solid #dfe8dd;border-radius:17px;background:#fff;box-shadow:0 8px 24px #243f2b0a}.assistant-composer>label{color:var(--assistant-ink);font-size:12px;font-weight:750}.assistant-input-wrap{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end}.assistant-input-wrap textarea{width:100%;min-height:64px;resize:vertical;padding:12px 13px;border:1px solid #dce7da;border-radius:11px;background:#fbfdf9;color:var(--assistant-ink);font:inherit;font-size:13px;line-height:1.55}.assistant-input-wrap textarea::placeholder{color:#87958a}.assistant-input-wrap textarea:focus{border-color:#6b9871;outline:3px solid #e4f0e1}.assistant-send{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-width:91px;min-height:46px;border-radius:11px;background:#1c5942;color:#fff;font-size:12px;font-weight:700}.assistant-send:hover:not(:disabled){background:#124632;transform:translateY(-1px)}.assistant-send:disabled{opacity:.55}.assistant-composer-foot{display:flex;justify-content:space-between;gap:10px;color:#7e8c81;font-size:10px}.assistant-privacy-note{display:flex;align-items:center;gap:6px;margin:9px 3px 0;color:#758379;font-size:10px}.assistant-privacy-note svg{color:#638969}
.assistant-prompts{position:sticky;top:16px;display:grid;gap:14px;padding:19px;border:1px solid #e0e9df;border-radius:19px;background:linear-gradient(155deg,#fff,#f8fbf6);box-shadow:0 10px 28px #203f2908}.assistant-prompts-heading{display:flex;align-items:center;gap:11px}.assistant-prompts-heading .assistant-kicker{margin-bottom:5px;font-size:8px;letter-spacing:1.2px}.assistant-prompts-heading h2{margin:0;color:var(--assistant-ink);font-size:19px;letter-spacing:-.4px}.assistant-prompt-spark{display:grid;flex:none;width:38px;height:38px;place-items:center;border:1px solid #e2ebda;border-radius:12px;background:#edf4e7;color:#50784d;font-size:19px}.assistant-prompts-intro{margin:-5px 0 0;color:var(--assistant-muted);font-size:11px;line-height:1.5}.assistant-prompt-group{display:grid;gap:7px}.assistant-prompt-group h3{display:flex;align-items:center;gap:7px;margin:0;color:#59715d;font-size:10px;font-weight:800;letter-spacing:.45px;text-transform:uppercase}.assistant-prompt-group h3 svg{color:#6a906d}.assistant-prompt-list{display:grid;gap:6px}.assistant-prompt-list button{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:39px;padding:8px 10px;text-align:left;border:1px solid #e7ede5;border-radius:10px;background:#fff;color:#46584b;font:inherit;font-size:11px;line-height:1.45;cursor:pointer;transition:transform .16s,border-color .16s,background .16s,box-shadow .16s}.assistant-prompt-list button svg{flex:none;color:#8aa18a;opacity:.5}.assistant-prompt-list button:hover:not(:disabled){transform:translateX(2px);border-color:#bfd4ba;background:#f5f9f2;box-shadow:0 4px 12px #23452a0a}.assistant-prompt-list button:focus-visible{outline:3px solid var(--focus-ring,#397957);outline-offset:2px}.assistant-prompt-list button:disabled{opacity:.55;cursor:wait}.assistant-prompt-footer{display:flex;align-items:center;gap:8px;padding-top:10px;border-top:1px solid #e9eee7;color:#738077;font-size:10px}
@keyframes message-arrive{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@keyframes typing-pulse{0%,60%,100%{opacity:.35;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
@media(max-width:980px){.assistant-layout{grid-template-columns:minmax(0,1fr) 275px;gap:14px}.assistant-prompts{padding:15px}.assistant-hero{grid-template-columns:minmax(0,1fr) 190px}}
@media(max-width:760px){.assistant-page{padding:16px}.assistant-hero{grid-template-columns:minmax(0,1fr) 125px;min-height:0;padding:25px 20px}.assistant-hero-art{min-height:130px}.assistant-hero-mark{width:75px;height:82px;font-size:42px;border-radius:25px 25px 25px 7px}.orbit-one{width:135px;height:135px}.orbit-two{width:98px;height:98px}.assistant-speech-card{right:-4px;bottom:1px;padding:8px}.assistant-speech-card small{font-size:8px}.assistant-layout{grid-template-columns:1fr}.assistant-prompts{position:static;grid-row:1}.assistant-prompt-group{gap:8px}.assistant-prompt-list{grid-template-columns:repeat(2,minmax(0,1fr))}.assistant-thread{max-height:55vh;min-height:250px}.assistant-prompt-footer{margin-top:0}}
@media(max-width:500px){.assistant-page{padding:12px}.assistant-hero{grid-template-columns:minmax(0,1fr);padding:22px 18px}.assistant-hero-art{position:absolute;right:0;bottom:0;width:125px;min-height:120px;opacity:.65}.assistant-hero-copy{padding-right:25px}.assistant-hero-topics{max-width:320px}.assistant-hero-topics span{font-size:10px}.assistant-prompt-list{grid-template-columns:1fr}.assistant-prompts{gap:12px;padding:15px}.assistant-thread{padding:13px;max-height:52vh}.assistant-message{max-width:100%;gap:7px}.assistant-avatar{width:31px;height:31px;border-radius:10px 10px 10px 3px;font-size:16px}.assistant-message-card{padding:11px 12px}.assistant-input-wrap{grid-template-columns:minmax(0,1fr)}.assistant-send{justify-self:end}.assistant-composer-foot{font-size:9px}.assistant-welcome{gap:10px;padding:15px 2px}.assistant-avatar-welcome{width:39px;height:39px;font-size:20px}}
@media(prefers-reduced-motion:reduce){.assistant-page *, .assistant-page *::before,.assistant-page *::after{animation:none!important;scroll-behavior:auto!important;transition:none!important}}
</style>
