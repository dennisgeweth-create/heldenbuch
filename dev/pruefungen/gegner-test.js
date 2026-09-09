// Prueft die Erkennung: stehen da Attribute oder Modifikatoren?
const fs = require('fs');
const quelle = fs.readFileSync('js/data.js','utf8') + '\n' + fs.readFileSync('js/util.js','utf8')
  + '\n' + fs.readFileSync('js/src/2b-gegner.jsx','utf8').split('// ── Werteübersicht')[0];
const namen = [...quelle.matchAll(/^const ([A-Za-z_][A-Za-z0-9_]*)/gm)].map(m => m[1]);
eval(quelle + ';globalThis.M = {' + namen.join(', ') + '};');
Object.assign(globalThis, M);

let gut = 0, schlecht = 0;
const ist = (n,a,b) => { const A=JSON.stringify(a),B=JSON.stringify(b);
  if (A===B) { gut++; return; } schlecht++; console.log('  FEHLER '+n+'\n     ist  '+A+'\n     soll '+B); };
const wahr = (n,a) => ist(n, !!a, true);

const echt = {str:16, dex:12, con:14, int:8, wis:10, cha:6};
const mods = {str:3, dex:1, con:2, int:-1, wis:0, cha:-2};

wahr('echte Werte werden nicht gemeldet', !siehtNachModAus(echt));
wahr('Modifikatoren schon', siehtNachModAus(mods));
// Der Standardgegner hat ueberall 10 — der darf nie gemeldet werden.
wahr('der Standard (alles 10) nicht', !siehtNachModAus({str:10,dex:10,con:10,int:10,wis:10,cha:10}));
// Ein Schwarm Ratten mit Intelligenz 2 ist echt, solange der Rest passt.
wahr('eine einzelne kleine Zahl reicht nicht',
  !siehtNachModAus({str:9, dex:15, con:11, int:2, wis:10, cha:4}));
// Genau der Fall aus dem Testlauf: Ruestungsklasse 5, Initiative −5.
wahr('der Fall vom Tisch wird erkannt', siehtNachModAus({str:0,dex:0,con:1,int:0,wis:1,cha:0}));
ist('  … und die Ruestungsklasse waere', 10 + mod(0), 5);
ist('  … die Initiative', mod(2), -4);

const um = modsZuWerten(mods);
ist('umgerechnet: +3 wird 16', um.str, 16);
ist('  … +1 wird 12', um.dex, 12);
ist('  … 0 wird 10', um.wis, 10);
ist('  … −2 wird 6', um.cha, 6);
wahr('und danach meldet nichts mehr', !siehtNachModAus(um));
// Der Modifikator stimmt nach dem Umrechnen — darauf kommt es an.
wahr('die Modifikatoren stimmen wieder',
  Object.keys(mods).every(k => mod(um[k]) === mods[k]));
ist('nichts faellt unter 1', modsZuWerten({str:-9,dex:-9,con:-9,int:-9,wis:-9,cha:-9}).str, 1);
ist('und nichts ueber 30', modsZuWerten({str:99,dex:0,con:0,int:0,wis:0,cha:0}).str, 30);

ist('Modifikator als Text, positiv', modText(3), '+3');
ist('  … null', modText(0), '+0');
ist('  … negativ mit echtem Minus', modText(-4), '−4');

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
