const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sass = require('sass');
const postcss = require('postcss');
const css = postcss.parse(sass.compile(path.join(__dirname, '../src/assets/style/app.scss')).css);
const tokens = {};
css.walkRules(rule => { if(rule.selector === ':root') rule.walkDecls(decl => { tokens[decl.prop] = decl.value; }); });
function luminance(hex) {
 const channels = hex.replace('#','').match(/../g).map(value => parseInt(value,16)/255).map(value => value<=.04045 ? value/12.92 : ((value+.055)/1.055)**2.4);
 return channels[0]*.2126 + channels[1]*.7152 + channels[2]*.0722;
}
function contrast(a,b) { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
const pairs = [
 ['body text',()=>tokens['--ink'],()=>tokens['--bg']],
 ['supporting text',()=>tokens['--accessible-text'],()=>tokens['--bg']],
 ['input placeholders',()=>tokens['--accessible-text'],()=>'#ffffff'],
 ['emerald green buttons',()=>'#ffffff',()=>tokens['--primary']],
 ['sidebar labels',()=>'#c3d9c9',()=>'#123f33'],
 ['banner text',()=>'#d0e4d4',()=>'#164b3a'],
 ['active status',()=>'#365d28',()=>'#edf4e7'],
 ['inactive status',()=>'#586352',()=>'#edf0ea'],
 ['peach icons',()=>'#88581b',()=>'#f9edde'],
 ['lavender icons',()=>'#6f4677',()=>'#f4eafa'],
];
for(const [name,foreground,background] of pairs) test(name+' meets 4.5:1 contrast',()=>{const ratio=contrast(foreground(),background());assert.ok(ratio>=4.5,name+': '+ratio.toFixed(2));});
