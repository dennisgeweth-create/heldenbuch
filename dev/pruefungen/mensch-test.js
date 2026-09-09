// Prueft die beiden Menschen: breit oder scharf.
const fs = require('fs');
// Beide Dateien in EINEM eval: sonst sieht util.js die Tabellen aus
// data.js nicht — im Browser liegen sie im selben Geltungsbereich.
const quelle = fs.readFileSync('js/data.js', 'utf8') + '\n'
             + fs.readFileSync('js/util.js', 'utf8');
const namen = [...quelle.matchAll(/^const ([A-Za-z_][A-Za-z0-9_]*)/gm)].map(m => m[1]);
eval(quelle + ';globalThis.M = {' + namen.join(', ') + '};');
Object.assign(globalThis, M);
let gut = 0, schlecht = 0;
const ist = (n, a, b) => { const A=JSON.stringify(a), B=JSON.stringify(b);
  if (A===B) { gut++; return; } schlecht++; console.log('  FEHLER '+n+'\n     ist  '+A+'\n     soll '+B); };
const wahr = (n, a) => ist(n, !!a, true);

const mensch = VOELKER.find(v => v.name === 'Mensch');
ist('der Mensch hat zwei Untergruppen', mensch.unter.map(u => u.name), ['Vielseitig', 'Begabt']);
ist('das Volk selbst gibt nichts mehr', mensch.boni, {});
ist('vielseitig: ueberall einer', mensch.unter[0].boni, {str:1,dex:1,con:1,int:1,wis:1,cha:1});
ist('begabt: zwei nach Wahl', wahlBoniZahl(mensch, mensch.unter[1]), 2);
wahr('begabt: mit Talent', brauchtTalent(mensch.unter[1]));
wahr('vielseitig: ohne Talent', !brauchtTalent(mensch.unter[0]));
ist('der Halbelf traegt es weiter am Volk',
  wahlBoniZahl(VOELKER.find(v => v.name === 'Halbelf'), null), 2);

const grund = {str:15, dex:14, con:13, int:12, wis:10, cha:8};
const basis = {name:'Probe', volk:'Mensch', klasse:'Kämpfer', hintergrund:'Soldat',
               attribute: grund, fertigkeiten:['athletik']};

const breit = assistentPlan({...basis, untervolk:'Vielseitig'});
ist('vielseitig: Staerke 16', breit.neu.str, 16);
ist('vielseitig: Charisma 9', breit.neu.cha, 9);
ist('vielseitig: kein Talent im Bogen',
  (breit.neu.features || []).filter(f => /Talent/.test(f.source || '')).length, 0);

const talent = {name:'Athlet', description:'<p>Trainiert.</p>', halb:['str','dex'],
                effects:[{target:'str', mode:'bonus', value:0}]};
const scharf = assistentPlan({...basis, untervolk:'Begabt',
  wahlBoni:{dex:1, con:1}, talentDaten:{...talent, attr:'str'}});
ist('begabt: Geschick 15', scharf.neu.dex, 15);
ist('begabt: Konstitution 14', scharf.neu.con, 14);
ist('begabt: Charisma bleibt 8', scharf.neu.cha, 8);
ist('begabt: das halbe Talent hebt die Staerke', scharf.neu.str, 16);
const tf = (scharf.neu.features || []).find(f => f.name === 'Athlet');
wahr('begabt: das Talent steht im Bogen', tf);
ist('  … mit seiner Beschreibung', tf.description, '<p>Trainiert.</p>');
ist('  … mit seinen Effekten', tf.effects.length, 1);
wahr('  … und aktiv', tf.effectsActive);
wahr('  … und in der Vorschau', scharf.zeilen.some(z => z.was === 'Talent' && z.neu === 'Athlet'));
// Ohne Talentwahl darf nichts erfunden werden.
const ohne = assistentPlan({...basis, untervolk:'Begabt', wahlBoni:{dex:1, con:1}});
ist('ohne Wahl kein Talent', (ohne.neu.features || []).filter(f => f.name === 'Athlet').length, 0);
ist('ohne Wahl keine halbe Steigerung', ohne.neu.str, 15);
// Die Volksmerkmale bleiben unberuehrt.
const zwerg = assistentPlan({name:'Z', volk:'Zwerg', untervolk:'Hügelzwerg', klasse:'Kleriker',
  hintergrund:'Akolyth', attribute: grund});
ist('der Zwerg bekommt seine Konstitution', zwerg.neu.con, 15);
wahr('und seine Merkmale', (zwerg.neu.features || []).some(f => f.name === 'Dunkelsicht'));

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
