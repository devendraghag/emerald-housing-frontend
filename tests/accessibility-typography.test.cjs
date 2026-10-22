const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const sass=require('sass');
const postcss=require('postcss');
test('visible text uses at least 12px at every responsive breakpoint',()=>{
 const css=postcss.parse(sass.compile(path.join(__dirname,'../src/assets/style/app.scss')).css);
 const undersized=[];
 css.walkDecls('font-size',decl=>{const match=decl.value.match(/^(\d+(?:\.\d+)?)px$/);if(match&&Number(match[1])<12)undersized.push(decl.parent.selector+': '+decl.value);});
 assert.deepEqual(undersized,[]);
});
test('JavaScript fallback remains available when the app cannot run',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 assert.match(html,/<noscript>[^<]+<\/noscript>/);
});
