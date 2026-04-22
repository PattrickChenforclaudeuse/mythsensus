
// ════════════════════════════════════════
// GODS
// ════════════════════════════════════════
let GODS=[],GODS_LOADED=false;
async function loadGods(){
  if(GODS_LOADED)return;
  try{const r=await fetch('../mythsensus-gods.json');if(!r.ok)throw 0;GODS=await r.json();GODS_LOADED=true;}
  catch(e){
    GODS=[
      {name:'Apollo',mythology:'Greek',symbol:'☀️',represents:['sun','creativity','music','light','healing'],messages:['Let your light guide the way.','Clarity arrives when you look inward.'],tier:'Legendary'},
      {name:'Athena',mythology:'Greek',symbol:'🦉',represents:['wisdom','strategy','justice','craft'],messages:['Wisdom begins with stillness.','Strategy before action.'],tier:'Legendary'},
      {name:'Thor',mythology:'Norse',symbol:'⚡',represents:['strength','protection','thunder','courage'],messages:['Courage is forged in challenge.','Your strength is your foundation.'],tier:'Epic'},
      {name:'Odin',mythology:'Norse',symbol:'🐦',represents:['wisdom','knowledge','mystery','journey'],messages:['All knowledge comes at a price.','The journey itself is the answer.'],tier:'Mythic'},
      {name:'Isis',mythology:'Egyptian',symbol:'🌙',represents:['healing','magic','motherhood','love'],messages:['Healing flows from acceptance.','Magic lives in everyday moments.'],tier:'Legendary'},
      {name:'Thoth',mythology:'Egyptian',symbol:'📜',represents:['knowledge','writing','truth','moon'],messages:['Record what you observe.','Truth is revealed through patience.'],tier:'Epic'},
      {name:'Lakshmi',mythology:'Hindu',symbol:'🌸',represents:['abundance','prosperity','beauty','grace'],messages:['Abundance flows where gratitude lives.','Beauty exists in all things.'],tier:'Rare'},
      {name:'Ganesh',mythology:'Hindu',symbol:'🐘',represents:['beginnings','obstacles','wisdom','luck'],messages:['Every obstacle is a doorway.','New beginnings carry their own wisdom.'],tier:'Uncommon'},
      {name:'Amaterasu',mythology:'Japanese',symbol:'🌅',represents:['sun','warmth','harmony','renewal'],messages:['Light returns after every darkness.','Renewal is always possible.'],tier:'Mythic'},
      {name:'Hermes',mythology:'Greek',symbol:'🪄',represents:['communication','travel','messages','change'],messages:['The message is already on its way.','Movement brings new possibilities.'],tier:'Uncommon'},
      {name:'Freya',mythology:'Norse',symbol:'🍀',represents:['love','beauty','fertility','magic'],messages:['Love is the truest magic.','Beauty is a way of seeing.'],tier:'Rare'},
      {name:'Ra',mythology:'Egyptian',symbol:'👁️',represents:['sun','creation','power','renewal'],messages:['A new cycle always begins.','Creation starts from within.'],tier:'Epic'},
      {name:'Quan Yin',mythology:'Chinese',symbol:'🕊️',represents:['compassion','mercy','kindness','peace'],messages:['Compassion begins with yourself.','Peace is found in acceptance.'],tier:'Legendary'},
      {name:'Hecate',mythology:'Greek',symbol:'🔮',represents:['magic','crossroads','intuition','darkness'],messages:['Crossroads are moments of power.','Trust your inner knowing.'],tier:'Rare'},
      {name:'Morrigan',mythology:'Celtic',symbol:'🦅',represents:['fate','transformation','battle','prophecy'],messages:['Transformation is rarely comfortable.','You are stronger than you know.'],tier:'Epic'},
      {name:'Shiva',mythology:'Hindu',symbol:'🌀',represents:['transformation','destruction','creation','meditation'],messages:['What falls away makes room for what comes.','Stillness holds all movement.'],tier:'Mythic'},
      {name:'Saraswati',mythology:'Hindu',symbol:'🎵',represents:['creativity','art','learning','music','wisdom'],messages:['Every creation begins as a thought.','Knowledge opens what force cannot.'],tier:'Legendary'},
      {name:'Anubis',mythology:'Egyptian',symbol:'⚖️',represents:['justice','truth','death','protection'],messages:['Every choice leaves a mark.','Honesty is its own protection.'],tier:'Rare'},
      {name:'Loki',mythology:'Norse',symbol:'🔥',represents:['change','chaos','creativity','cunning'],messages:['Not all disruption is destruction.','The unexpected path often leads furthest.'],tier:'Epic'},
      {name:'Artemis',mythology:'Greek',symbol:'🏹',represents:['independence','nature','protection','moon'],messages:['Your own compass is the most reliable.','Space to breathe is not a luxury.'],tier:'Rare'},
      {name:'Horus',mythology:'Egyptian',symbol:'🦁',represents:['sky','power','strength','victory'],messages:['Rise above the immediate view.','Persistence outlasts opposition.'],tier:'Epic'},
      {name:'Brigid',mythology:'Celtic',symbol:'🌺',represents:['creativity','healing','fire','inspiration'],messages:['The creative spark never truly goes out.','Tend your inner flame.'],tier:'Rare'},
      {name:'Mercury',mythology:'Roman',symbol:'📨',represents:['communication','travel','messages','trade'],messages:['Words carry more than their meaning.','A well-timed message changes everything.'],tier:'Uncommon'},
      {name:'Kali',mythology:'Hindu',symbol:'🌑',represents:['transformation','power','liberation','time'],messages:['What is shed creates space for what matters.','Power comes from accepting reality.'],tier:'Mythic'},
    ];
    GODS_LOADED=true;
  }
}
const TIERS=[
  {name:'Common',nameEN:'Common',nameTH:'ทั่วไป',color:'#9a8a72',weight:40},
  {name:'Uncommon',nameEN:'Uncommon',nameTH:'ไม่ค่อยพบ',color:'#6090c0',weight:28},
  {name:'Rare',nameEN:'Rare',nameTH:'หายาก',color:'#4aba50',weight:18},
  {name:'Epic',nameEN:'Epic',nameTH:'มหากาพย์',color:'#b070e0',weight:9},
  {name:'Legendary',nameEN:'Legendary',nameTH:'ตำนาน',color:'#c8a45a',weight:4},
  {name:'Mythic',nameEN:'Mythic',nameTH:'เทพปกรณัม',color:'#ff9030',weight:.9},
  {name:'Hidden',nameEN:'???',nameTH:'???',color:'#ffffff',weight:.1},
];
function pickTier(){const r=Math.random()*100;let c=0;for(const T of TIERS){c+=T.weight;if(r<c)return T;}return TIERS[0];}
function godsOfTier(T){const g=GODS.filter(g=>g.tier===T.name);return g.length?g:GODS;}
