// Keep the editable reference in sync with the shipping card catalogue.
const fs=require('fs');
const domains=['nature','water','fire','affliction','holy'];
const label=n=>n===0?'Instant':`${n}T`;
let md='# Current spell reference\n\nUpdated 23 September 2026. **130 spells — 26 per Domain.** Six combat slots. Shopping may temporarily hold extra spells; reduce to six before battle. Bracketed clauses require the named Domain attunement. Upgrade columns show the complete upgraded effect. All calculated values round down.\n\nTriggers start Dormant. A copy arms after its first completed cast and its entire event chain. Armed Triggers can chain and each copy fires at most once per tick. Retrigger repeats the latest eligible Armed Trigger this Cycle without starting further Trigger chains.\n\n';
let index='# Spell catalogue\n\n130 spells. Gold price equals stars + 1. See [complete spell and upgrade reference](../../docs/Current_Spell_Reference.md).\n\n';
for(const d of domains){
 const cards=JSON.parse(fs.readFileSync(`src/config/${d}/spell.json`,'utf8'));
 const title=d[0].toUpperCase()+d.slice(1);
 md+=`## ${title}\n\n| Stars | Spell | Cast | Base | Upgrade cast | Upgrade |\n| --- | --- | --- | --- | --- | --- |\n`;
 index+=`## ${title}\n\n`;
 for(const c of cards){md+=`| ${'★'.repeat(c.stars)} | ${c.name} | ${label(c.castTicks)} | ${c.rules} | ${label(c.upgrade.castTicks)} | ${c.upgrade.rules} |\n`;index+=`- ${'★'.repeat(c.stars)} **${c.name}** (${label(c.castTicks)}) — ${c.rules}\n`;}
 md+='\n';index+='\n';
}
fs.writeFileSync('docs/Current_Spell_Reference.md',md.trimEnd()+'\n');
fs.writeFileSync('docs/Spell_and_Augment_Reference.md',md+'\n---\n\n'+fs.readFileSync('docs/Current_Augment_Reference.md','utf8'));
fs.writeFileSync('src/config/CARDS.md',index.trimEnd()+'\n');
