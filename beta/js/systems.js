// ════════════════════════════════════════
// 2-LEVEL NAVIGATION STATE MACHINE
// ════════════════════════════════════════
// Groups (top nav) + sub-tabs (secondary nav) → panel IDs.
// Each sub-tab entry: [key, panel_id, tx_label_key, locked?]
const GROUPS = {
  free: {
    default: 'blessing',
    tabs: [
      ['blessing',   'blessing',    'sub_blessing',   false],
      ['organum',    'organum',     'sub_organum',    false],
      ['preview',    'chart',       'sub_preview',    false],
      ['collection', 'collection',  'sub_collection', false],
      ['streak',     'streak',      'sub_streak',     false],
      ['history',    'history',     'sub_history7',   false],
    ],
  },
  premium: {
    default: 'blueprint',
    tabs: [
      ['blueprint', 'blueprint',         'sub_generate', false],
      ['reports',   'premium-reports',   'sub_reports',  false],
    ],
  },
  subscription: {
    default: 'sky',
    tabs: [
      ['sky',       'sky',       'sub_sky',        false],
      ['resonance', 'resonance', 'sub_resonance',  false],
      ['organum',   'organum',   'sub_organum_plus', false],
      ['brief',     'brief',     'sub_brief',      false],
      ['freq',      'freq',      'sub_freq',       false],
      ['history',   'history',   'sub_history_all', false],
    ],
  },
  addon: {
    default: 'deep',
    tabs: [
      ['deep',       'deep',       'sub_deep',       false],
      // All add-ons unlocked for beta testing — will flip to `true` (locked,
      // requires payment) at online launch.
      ['mirror',     'mirror',     'sub_mirror',     false],
      ['pet',        'pet',        'sub_pet',        false],
      ['companions', 'companions', 'sub_companions', false],
      ['exercise',   'exercise',   'sub_exercise',   false],
      ['food',       'food',       'sub_food',       false],
      ['product',    'product',    'sub_product',    false],
      ['compat',     'compat',     'sub_compat',     false],
    ],
  },
  profile: {
    default: 'me',
    tabs: [
      ['me',       'profile',  'sub_me',       false],
      ['multi',    'multi',    'sub_multi',    false],
      ['login',    'login',    'sub_login',    false],
      ['settings', 'settings', 'sub_settings', false],
    ],
  },
};

let CUR_GROUP = 'free';
let CUR_SUB   = 'blessing';

function setGroup(g) {
  if (!GROUPS[g]) g = 'free';
  CUR_GROUP = g;
  document.querySelectorAll('.group-btn').forEach(b=>b.classList.remove('active'));
  const gb = document.getElementById('group-'+g);
  if (gb) gb.classList.add('active');

  // Render the sub-tab bar for this group.
  const bar = document.getElementById('navSubs');
  bar.innerHTML = GROUPS[g].tabs.map(([key, panel, txKey, locked]) =>
    `<button class="sub-btn${locked?' locked':''}" data-sub="${key}" data-panel="${panel}" ` +
    `onclick="showSubTab('${key}')" data-t="${txKey}">${t(txKey)}</button>`
  ).join('');

  // Restore last sub for this group, or default.
  const last = localStorage.getItem('ms_last_sub_' + g);
  const available = GROUPS[g].tabs.map(x=>x[0]);
  const target = (last && available.includes(last)) ? last : GROUPS[g].default;
  showSubTab(target);
}

function showSubTab(subKey) {
  const entry = GROUPS[CUR_GROUP].tabs.find(x => x[0] === subKey);
  if (!entry) return;
  const [, panelId] = entry;
  CUR_SUB = subKey;
  localStorage.setItem('ms_last_sub_' + CUR_GROUP, subKey);

  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('panel-' + panelId);
  if (panel) panel.classList.add('active');
  const btn = document.querySelector('.sub-btn[data-sub="' + subKey + '"]');
  if (btn) btn.classList.add('active');

  // Panel-specific lazy renderers (kept from original showTab).
  if (panelId === 'history')  renderHistoryPanel();
  if (panelId === 'sky') {
    const dob = document.getElementById('profDob').value;
    if (dob && !document.getElementById('skyResults').classList.contains('active')) calcSky();
  }
  if (panelId === 'chart') {
    const dob = document.getElementById('profDob').value;
    if (dob && !document.getElementById('chartResults').classList.contains('active')) calcChart();
  }
  if (panelId === 'blueprint')        syncAllForms();
  if (panelId === 'deep')             renderDeepReadings();
  if (panelId === 'resonance')        renderResonance();
  if (panelId === 'brief')            renderMonthlyBrief();
  if (panelId === 'freq')             renderFreqHistory();
  if (panelId === 'collection')       renderCollection();
  if (panelId === 'streak')           renderStreak();
  if (panelId === 'premium-reports')  renderSavedReports();
  if (panelId === 'mirror')           renderMirror();
  if (panelId === 'pet')              renderPet();
  if (panelId === 'companions')       renderCompanions();
  if (panelId === 'exercise')         renderExercise();
  if (panelId === 'food')             renderFood();
  if (panelId === 'product')          renderProduct();
  if (panelId === 'compat')           renderCompat();
  if (panelId === 'multi')            renderMultiProfiles();
  if (panelId === 'login')            renderLoginMgmt();
  if (panelId === 'settings')         renderSettings();
}

// Legacy shim — some old callers still call showTab(panelId). Route
// them through the new nav by finding the group that owns that panel.
function showTab(n) {
  // Map legacy keys (which were panel ids) to (group, sub).
  const map = {
    blessing: ['free','blessing'], organum: ['free','organum'],
    profile:  ['profile','me'],    sky:     ['subscription','sky'],
    chart:    ['free','preview'],  blueprint:['premium','blueprint'],
    history:  ['free','history'],
  };
  const t = map[n];
  if (t) { setGroup(t[0]); showSubTab(t[1]); return; }
  // Fallback: assume n is a sub key in current group.
  showSubTab(n);
}

// ════════════════════════════════════════
// GODS
// ════════════════════════════════════════
let GODS=[],GODS_LOADED=false;
/* GODS_FULL_START — auto-injected, do not edit */
const GODS_FULL = [{"name":"Brahma","mythology":"Hinduism","symbol":"🔥","represents":["creation","knowledge","universe"],"messages":["The cosmic thread of creation weaves serenity into your destiny."],"tier":"Mythic"},{"name":"Vishnu","mythology":"Hinduism","symbol":"🌊","represents":["preservation","dharma","cosmic order"],"messages":["The ancient aura of preservation awakens within your spirit. The doors of opportunity swing wide before you."],"tier":"Mythic"},{"name":"Shiva","mythology":"Hinduism","symbol":"🔥","represents":["destruction","transformation","meditation"],"messages":["You are wrapped in the clarity of destruction, shielded and empowered."],"tier":"Mythic"},{"name":"Saraswati","mythology":"Hinduism","symbol":"🌊","represents":["knowledge","music","arts","wisdom"],"messages":["The essence of knowledge resonates in your heart, granting harmony beyond measure."],"tier":"Legendary"},{"name":"Lakshmi","mythology":"Hinduism","symbol":"🌍","represents":["wealth","fortune","prosperity","beauty"],"messages":["You stand at the crossroads of wealth and insight. Both claim you as their own."],"tier":"Legendary"},{"name":"Parvati","mythology":"Hinduism","symbol":"🌍","represents":["love","fertility","devotion"],"messages":["The Earth sings the song of love, and you alone can hear its brilliance."],"tier":"Epic"},{"name":"Durga","mythology":"Hinduism","symbol":"🔥","represents":["war","strength","protection"],"messages":["Through the portal of war, infinite courage awaits your embrace."],"tier":"Legendary"},{"name":"Kali","mythology":"Hinduism","symbol":"🔥","represents":["time","death","liberation","power"],"messages":["The wisdom of time flows through you. The universe conspires to fulfill your purpose."],"tier":"Legendary"},{"name":"Ganesha","mythology":"Hinduism","symbol":"🌍","represents":["wisdom","beginnings","obstacle removal"],"messages":["The Earth of wisdom purifies your spirit, leaving only strength."],"tier":"Legendary"},{"name":"Hanuman","mythology":"Hinduism","symbol":"🌬","represents":["devotion","strength","courage"],"messages":["In the presence of devotion, even shadows become devotion."],"tier":"Epic"},{"name":"Krishna","mythology":"Hinduism","symbol":"🌊","represents":["love","compassion","tenderness"],"messages":["Like a river from love, truth carves new paths through your life."],"tier":"Legendary"},{"name":"Rama","mythology":"Hinduism","symbol":"🔥","represents":["virtue","duty","righteousness"],"messages":["The essence of virtue resonates in your heart, granting clarity beyond measure."],"tier":"Epic"},{"name":"Indra","mythology":"Hinduism","symbol":"🌬","represents":["thunder","rain","war","heaven"],"messages":["The whisper of thunder carries devotion across the ages to find you."],"tier":"Epic"},{"name":"Agni","mythology":"Hinduism","symbol":"🔥","represents":["fire","sacrifice","messenger"],"messages":["Ancient glow stirs within as fire recognizes your worth."],"tier":"Epic"},{"name":"Varuna","mythology":"Hinduism","symbol":"🌊","represents":["water","ocean","cosmic law"],"messages":["The sacred fires of water forge within you an unbreakable devotion."],"tier":"Epic"},{"name":"Vayu","mythology":"Hinduism","symbol":"🌬","represents":["wind","breath","life force"],"messages":["The veil between worlds thins near wind, revealing insight within you."],"tier":"Common"},{"name":"Surya","mythology":"Hinduism","symbol":"🔥","represents":["sun","light","health"],"messages":["Sacred pulse flows from sun to illuminate your journey. Every challenge becomes a stepping stone to greatness."],"tier":"Epic"},{"name":"Chandra","mythology":"Hinduism","symbol":"🌊","represents":["moon","night","emotions"],"messages":["The Water of moon purifies your spirit, leaving only radiance."],"tier":"Uncommon"},{"name":"Yama","mythology":"Hinduism","symbol":"🌍","represents":["death","justice","underworld"],"messages":["Through the portal of death, infinite tenacity awaits your embrace."],"tier":"Common"},{"name":"Kubera","mythology":"Hinduism","symbol":"⚔️","represents":["wealth","treasures","north"],"messages":["Your soul mirrors the spark of wealth. The universe conspires to fulfill your purpose."],"tier":"Common"},{"name":"Kartikeya","mythology":"Hinduism","symbol":"🔥","represents":["war","victory","youth"],"messages":["The Fire sings the song of war, and you alone can hear its truth."],"tier":"Epic"},{"name":"Radha","mythology":"Hinduism","symbol":"🌊","represents":["love","devotion","tenderness"],"messages":["The Water speaks through love, carrying a message of courage for you."],"tier":"Epic"},{"name":"Sita","mythology":"Hinduism","symbol":"🌍","represents":["purity","dedication","earth"],"messages":["When Earth meets compassion, destiny reshapes itself around your will."],"tier":"Common"},{"name":"Draupadi","mythology":"Hinduism","symbol":"🔥","represents":["fire","justice","dignity"],"messages":["The glow that shaped fire now shapes your future. The universe conspires to fulfill your purpose."],"tier":"Rare"},{"name":"Gayatri","mythology":"Hinduism","symbol":"🔥","represents":["knowledge","light","mantra"],"messages":["The ancient energy of knowledge awakens within your spirit. Your legacy shall echo through generations."],"tier":"Common"},{"name":"Tara","mythology":"Hinduism","symbol":"🌊","represents":["compassion","stars","protection"],"messages":["Where compassion touches the earth, clarity blossoms. So it is with you."],"tier":"Common"},{"name":"Kamadeva","mythology":"Hinduism","symbol":"🌬","represents":["love","desire","spring"],"messages":["The Air within you aligns with love, creating unstoppable strength."],"tier":"Rare"},{"name":"Rati","mythology":"Hinduism","symbol":"🌊","represents":["passion","pleasure","beauty"],"messages":["In the presence of passion, even shadows become patience."],"tier":"Rare"},{"name":"Brihaspati","mythology":"Hinduism","symbol":"🌬","represents":["wisdom","prayer","devotion"],"messages":["Your connection to wisdom deepens with each breath. Transformation awaits at every crossroad."],"tier":"Rare"},{"name":"Budha","mythology":"Hinduism","symbol":"🌬","represents":["mercury","intelligence","communication"],"messages":["In mercury's light, your energy shines with renewed purpose."],"tier":"Common"},{"name":"Shukra","mythology":"Hinduism","symbol":"🌊","represents":["venus","luxury","art"],"messages":["Let the brilliance of venus guide your steps toward eternal wisdom."],"tier":"Uncommon"},{"name":"Shani","mythology":"Hinduism","symbol":"🌍","represents":["saturn","discipline","karma"],"messages":["The Earth within you aligns with saturn, creating unstoppable power."],"tier":"Rare"},{"name":"Rahu","mythology":"Hinduism","symbol":"🌬","represents":["eclipse","obsession","ambition"],"messages":["Through the portal of eclipse, infinite fortitude awaits your embrace."],"tier":"Uncommon"},{"name":"Ketu","mythology":"Hinduism","symbol":"🔥","represents":["moksha","spirituality","detachment"],"messages":["The breath that shaped moksha now shapes your future. Great fortune awaits those who walk this path."],"tier":"Common"},{"name":"Mangala","mythology":"Hinduism","symbol":"🔥","represents":["mars","energy","courage"],"messages":["Like a river from mars, patience carves new paths through your life."],"tier":"Rare"},{"name":"Soma","mythology":"Hinduism","symbol":"🌊","represents":["moon","elixir","immortality"],"messages":["The sacred fires of moon forge within you an unbreakable insight."],"tier":"Rare"},{"name":"Rudra","mythology":"Hinduism","symbol":"🌬","represents":["storm","howling","hunt"],"messages":["The essence of ages past flows through storm into your being. Stand tall in your divine inheritance."],"tier":"Uncommon"},{"name":"Mitra","mythology":"Hinduism","symbol":"🔥","represents":["friendship","oath","sun"],"messages":["Where friendship touches the earth, insight blossoms. So it is with you."],"tier":"Common"},{"name":"Aryaman","mythology":"Hinduism","symbol":"🔥","represents":["chivalry","honor","milky way"],"messages":["Like a river from chivalry, radiance carves new paths through your life."],"tier":"Common"},{"name":"Bhaga","mythology":"Hinduism","symbol":"🌍","represents":["wealth","marriage","fortune"],"messages":["In the presence of wealth, even shadows become insight."],"tier":"Common"},{"name":"Pushan","mythology":"Hinduism","symbol":"🌍","represents":["travel","roads","nourishment"],"messages":["Through travel, you discover the breath that transforms all it touches."],"tier":"Uncommon"},{"name":"Savitar","mythology":"Hinduism","symbol":"🔥","represents":["motion","light","inspiration"],"messages":["The Fire of motion purifies your spirit, leaving only truth."],"tier":"Uncommon"},{"name":"Tvashtar","mythology":"Hinduism","symbol":"⚔️","represents":["craftsmanship","tools","creation"],"messages":["Your connection to craftsmanship deepens with each breath. Your legacy shall echo through generations."],"tier":"Rare"},{"name":"Vishvakarman","mythology":"Hinduism","symbol":"⚔️","represents":["architecture","divine craftsman"],"messages":["A sacred blessing binds you to architecture. Stand tall in your divine inheritance."],"tier":"Common"},{"name":"Aditi","mythology":"Hinduism","symbol":"🌬","represents":["infinity","sky","motherhood"],"messages":["Through the portal of infinity, infinite purity awaits your embrace."],"tier":"Uncommon"},{"name":"Ushas","mythology":"Hinduism","symbol":"🔥","represents":["dawn","beauty","new beginnings"],"messages":["Sacred glow flows from dawn to illuminate your journey. Great fortune awaits those who walk this path."],"tier":"Common"},{"name":"Ratri","mythology":"Hinduism","symbol":"🌊","represents":["night","darkness","rest"],"messages":["The eternal force of night flows unbroken through your lineage."],"tier":"Rare"},{"name":"Prithvi","mythology":"Hinduism","symbol":"🌍","represents":["earth","fertility","abundance"],"messages":["earth has marked you with radiance. Embrace this sacred gift."],"tier":"Rare"},{"name":"Vac","mythology":"Hinduism","symbol":"🌬","represents":["speech","sound","wisdom"],"messages":["By the grace of speech, power becomes your birthright."],"tier":"Common"},{"name":"Nirrti","mythology":"Hinduism","symbol":"🌍","represents":["destruction","decay","misfortune"],"messages":["In the presence of destruction, even shadows become fortitude."],"tier":"Uncommon"},{"name":"Ashvins","mythology":"Hinduism","symbol":"🌬","represents":["healing","twins","dawn"],"messages":["Where healing touches the earth, wisdom blossoms. So it is with you."],"tier":"Common"},{"name":"Maruts","mythology":"Hinduism","symbol":"🌬","represents":["storm","wind","warriors"],"messages":["Where storm touches the earth, clarity blossoms. So it is with you."],"tier":"Rare"},{"name":"Ribhus","mythology":"Hinduism","symbol":"⚔️","represents":["craftsmanship","skill","divine artisans"],"messages":["Through the portal of craftsmanship, infinite harmony awaits your embrace."],"tier":"Common"},{"name":"Narasimha","mythology":"Hinduism","symbol":"🔥","represents":["protection","ferocity","justice"],"messages":["When Fire meets abundance, your deepest wishes begin to manifest."],"tier":"Epic"},{"name":"Vamana","mythology":"Hinduism","symbol":"🌍","represents":["humility","cosmic expansion"],"messages":["In humility's light, your echo shines with renewed purpose."],"tier":"Common"},{"name":"Parashurama","mythology":"Hinduism","symbol":"⚔️","represents":["warrior","discipline","renunciation"],"messages":["brilliance descends like starlight from warrior. Your path is blessed."],"tier":"Rare"},{"name":"Varahi","mythology":"Hinduism","symbol":"🌍","represents":["strength","earth","protection"],"messages":["A sacred light binds you to strength. Stand tall in your divine inheritance."],"tier":"Common"},{"name":"Matangi","mythology":"Hinduism","symbol":"🌬","represents":["speech","music","outcaste wisdom"],"messages":["The Air within you aligns with speech, creating unstoppable courage."],"tier":"Uncommon"},{"name":"Bagalamukhi","mythology":"Hinduism","symbol":"🌬","represents":["paralysis","stun","victory"],"messages":["The eternal blessing of paralysis flows unbroken through your lineage."],"tier":"Rare"},{"name":"Dhumavati","mythology":"Hinduism","symbol":"🌬","represents":["void","poverty","asceticism"],"messages":["The mantle that shaped void now shapes your future. Transformation awaits at every crossroad."],"tier":"Uncommon"},{"name":"Chinnamasta","mythology":"Hinduism","symbol":"🔥","represents":["self-sacrifice","courage","kundalini"],"messages":["The ancient pact of self-sacrifice awakens, blessing you with brilliance. Nothing can diminish the light within you."],"tier":"Common"},{"name":"Kamala","mythology":"Hinduism","symbol":"🌊","represents":["lotus","wealth","gratitude"],"messages":["The pulse of ages past flows through lotus into your being. Walk forward with unshakable confidence."],"tier":"Rare"},{"name":"Bhairavi","mythology":"Hinduism","symbol":"🔥","represents":["terror","fierce grace","tapas"],"messages":["When the world trembles, terror holds you steady with truth."],"tier":"Uncommon"},{"name":"Tripura Sundari","mythology":"Hinduism","symbol":"🔥","represents":["beauty","desire","supreme consciousness"],"messages":["Under the gaze of beauty, your path illuminates with purity."],"tier":"Common"},{"name":"Bhuvaneshvari","mythology":"Hinduism","symbol":"🌍","represents":["space","cosmos","nourishment"],"messages":["By the grace of space, serenity becomes your birthright."],"tier":"Uncommon"},{"name":"Annapurna","mythology":"Hinduism","symbol":"🌍","represents":["food","nourishment","abundance"],"messages":["When the world trembles, food holds you steady with radiance."],"tier":"Common"},{"name":"Ganga","mythology":"Hinduism","symbol":"🌊","represents":["purification","river","salvation"],"messages":["Your connection to purification deepens with each breath. Transformation awaits at every crossroad."],"tier":"Uncommon"},{"name":"Yamuna","mythology":"Hinduism","symbol":"🌊","represents":["devotion","river","love"],"messages":["Let the serenity of devotion guide your steps toward radiant joy."],"tier":"Common"},{"name":"Sarayu","mythology":"Hinduism","symbol":"🌊","represents":["sacred waters","purity"],"messages":["In sacred waters's light, your aura shines with renewed purpose."],"tier":"Uncommon"},{"name":"Narmada","mythology":"Hinduism","symbol":"🌊","represents":["atonement","river","healing"],"messages":["Through atonement, you discover the bond that transforms all it touches."],"tier":"Rare"},{"name":"Kubja","mythology":"Hinduism","symbol":"🌍","represents":["devotion","humility","transformation"],"messages":["Between earth and sky, devotion plants the seed of resilience in your soul."],"tier":"Common"},{"name":"Garuda","mythology":"Hinduism","symbol":"🌬","represents":["speed","devotion","serpent enemy"],"messages":["speed has marked you with grace. Embrace this sacred gift."],"tier":"Uncommon"},{"name":"Nandi","mythology":"Hinduism","symbol":"🌍","represents":["joy","devotion","gatekeeper"],"messages":["Your soul mirrors the blessing of joy. Your legacy shall echo through generations."],"tier":"Common"},{"name":"Shesha","mythology":"Hinduism","symbol":"🌊","represents":["eternity","serpent","foundation"],"messages":["The ancient breath of eternity awakens within your spirit. Abundance flows to you from every direction."],"tier":"Uncommon"},{"name":"Airavata","mythology":"Hinduism","symbol":"🌊","represents":["clouds","rain","elephant"],"messages":["You are wrapped in the abundance of clouds, shielded and empowered."],"tier":"Common"},{"name":"Jambavan","mythology":"Hinduism","symbol":"🌍","represents":["strength","wisdom","bear"],"messages":["In the presence of strength, even shadows become clarity."],"tier":"Uncommon"},{"name":"Dhanvantari","mythology":"Hinduism","symbol":"🌊","represents":["medicine","healing","health"],"messages":["The Water sings the song of medicine, and you alone can hear its strength."],"tier":"Common"},{"name":"Hayagriva","mythology":"Hinduism","symbol":"🌬","represents":["knowledge","wisdom","horse"],"messages":["Your soul mirrors the blessing of knowledge. Great fortune awaits those who walk this path."],"tier":"Common"},{"name":"Matsya","mythology":"Hinduism","symbol":"🌊","represents":["preservation","flood","fish"],"messages":["Sacred echo flows from preservation to illuminate your journey. Joy and fulfillment are your sacred inheritance."],"tier":"Common"},{"name":"Kurma","mythology":"Hinduism","symbol":"🌍","represents":["stability","foundation","turtle"],"messages":["Between earth and sky, stability plants the seed of courage in your soul."],"tier":"Common"},{"name":"Kalki","mythology":"Hinduism","symbol":"🔥","represents":["future","justice","renewal"],"messages":["You are wrapped in the purity of future, shielded and empowered."],"tier":"Epic"},{"name":"Dattatreya","mythology":"Hinduism","symbol":"🌬","represents":["trinity","yoga","guru"],"messages":["Under the gaze of trinity, your path illuminates with courage."],"tier":"Common"},{"name":"Skanda","mythology":"Hinduism","symbol":"🔥","represents":["war","beauty","asceticism"],"messages":["Between earth and sky, war plants the seed of patience in your soul."],"tier":"Common"},{"name":"Ayyappan","mythology":"Hinduism","symbol":"🔥","represents":["dharma","celibacy","truth"],"messages":["Where dharma touches the earth, patience blossoms. So it is with you."],"tier":"Uncommon"},{"name":"Balaji","mythology":"Hinduism","symbol":"🔥","represents":["prosperity","grace","devotion"],"messages":["brilliance descends like starlight from prosperity. Your path is blessed."],"tier":"Rare"},{"name":"Jagannath","mythology":"Hinduism","symbol":"🌍","represents":["universe","cosmic lord","festivals"],"messages":["The sacred fires of universe forge within you an unbreakable harmony."],"tier":"Common"},{"name":"Vitthala","mythology":"Hinduism","symbol":"🌍","represents":["patience","devotion","standing"],"messages":["The cosmic thread of patience weaves harmony into your destiny."],"tier":"Uncommon"},{"name":"Murugan","mythology":"Hinduism","symbol":"🔥","represents":["youth","beauty","divine power"],"messages":["A sacred resonance binds you to youth. Rise and claim your destiny."],"tier":"Common"},{"name":"Arunachala","mythology":"Hinduism","symbol":"🔥","represents":["fire","mountain","self-inquiry"],"messages":["Through fire, you discover the essence that transforms all it touches."],"tier":"Common"},{"name":"Naga","mythology":"Hinduism","symbol":"🌊","represents":["serpent","underground","water"],"messages":["serpent has marked you with serenity. Embrace this sacred gift."],"tier":"Common"},{"name":"Makara","mythology":"Hinduism","symbol":"🌊","represents":["sea creature","gatekeeper","boundary"],"messages":["Through sea creature, you discover the energy that transforms all it touches."],"tier":"Common"},{"name":"Yaksha","mythology":"Hinduism","symbol":"🌍","represents":["nature spirit","wealth","guardianship"],"messages":["Your connection to nature spirit deepens with each breath. Peace and prosperity follow in your wake."],"tier":"Common"},{"name":"Yakshi","mythology":"Hinduism","symbol":"🌍","represents":["nature spirit","fertility","forest"],"messages":["Let the brilliance of nature spirit guide your steps toward eternal wisdom."],"tier":"Common"},{"name":"Apsara","mythology":"Hinduism","symbol":"🌊","represents":["dance","beauty","cloud","water"],"messages":["The cosmic thread of dance weaves insight into your destiny."],"tier":"Common"},{"name":"Gandharva","mythology":"Hinduism","symbol":"🌬","represents":["music","fragrance","heaven"],"messages":["Like a river from music, courage carves new paths through your life."],"tier":"Rare"},{"name":"Kinnara","mythology":"Hinduism","symbol":"🌬","represents":["music","love","half-human half-horse"],"messages":["The glow of music is your shield and your compass. Trust it."],"tier":"Uncommon"},{"name":"Vidyadhara","mythology":"Hinduism","symbol":"🌬","represents":["knowledge","sky","supernatural"],"messages":["The Air speaks through knowledge, carrying a message of patience for you."],"tier":"Uncommon"},{"name":"Chitragupta","mythology":"Hinduism","symbol":"⚔️","represents":["records","karma","judgment"],"messages":["You carry the pulse of records. Rise and claim your destiny."],"tier":"Common"},{"name":"Ardhanarishvara","mythology":"Hinduism","symbol":"🔥","represents":["unity","balance","masculine-feminine"],"messages":["The essence of unity resonates in your heart, granting purity beyond measure."],"tier":"Epic"},{"name":"Harihara","mythology":"Hinduism","symbol":"🔥","represents":["preservation-destruction","unity"],"messages":["preservation-destruction whispers its secrets to those who seek resilience. You are chosen."],"tier":"Rare"},{"name":"Mohini","mythology":"Hinduism","symbol":"🌊","represents":["enchantment","beauty","illusion"],"messages":["The ancient force of enchantment awakens within your spirit. Joy and fulfillment are your sacred inheritance."],"tier":"Uncommon"},{"name":"Manasa","mythology":"Hinduism","symbol":"🌊","represents":["snakes","fertility","cure of poison"],"messages":["By the grace of snakes, strength becomes your birthright."],"tier":"Common"},{"name":"Shitala","mythology":"Hinduism","symbol":"🌊","represents":["disease","cooling","healing"],"messages":["Your connection to disease deepens with each breath. Every challenge becomes a stepping stone to greatness."],"tier":"Common"},{"name":"Mariamman","mythology":"Hinduism","symbol":"🌊","represents":["rain","disease cure","south"],"messages":["rain whispers its secrets to those who seek patience. You are chosen."],"tier":"Uncommon"},{"name":"Meenakshi","mythology":"Hinduism","symbol":"🌊","represents":["fish eyes","beauty","rule"],"messages":["fish eyes has marked you with clarity. Embrace this sacred gift."],"tier":"Uncommon"},{"name":"Renuka","mythology":"Hinduism","symbol":"🔥","represents":["purity","devotion","sacrifice"],"messages":["When the world trembles, purity holds you steady with patience."],"tier":"Rare"},{"name":"Padmavati","mythology":"Hinduism","symbol":"🌊","represents":["lotus","prosperity","grace"],"messages":["A sacred blessing binds you to lotus. Walk forward with unshakable confidence."],"tier":"Rare"},{"name":"Tulasi","mythology":"Hinduism","symbol":"🌍","represents":["basil","devotion","purity"],"messages":["The Earth of basil purifies your spirit, leaving only abundance."],"tier":"Uncommon"},{"name":"Ahalya","mythology":"Hinduism","symbol":"🌍","represents":["patience","redemption","stone"],"messages":["The whisper of patience carries truth across the ages to find you."],"tier":"Common"},{"name":"Shabari","mythology":"Hinduism","symbol":"🌍","represents":["devotion","patience","faith"],"messages":["By the grace of devotion, serenity becomes your birthright."],"tier":"Rare"},{"name":"Mandodari","mythology":"Hinduism","symbol":"🌊","represents":["beauty","virtue","wisdom"],"messages":["The essence of ages past flows through beauty into your being. Embrace the magnificent being you are."],"tier":"Common"},{"name":"Lopamudra","mythology":"Hinduism","symbol":"🔥","represents":["intelligence","tapas","alchemy"],"messages":["The veil between worlds thins near intelligence, revealing purity within you."],"tier":"Uncommon"},{"name":"Savitri","mythology":"Hinduism","symbol":"🔥","represents":["devotion","death-conquering","love"],"messages":["The Fire of devotion purifies your spirit, leaving only patience."],"tier":"Uncommon"},{"name":"Damayanti","mythology":"Hinduism","symbol":"🌊","represents":["beauty","love","steadfastness"],"messages":["When Water meets truth, the stars align in your favor."],"tier":"Rare"},{"name":"Manu","mythology":"Hinduism","symbol":"🌍","represents":["law","first man","survival"],"messages":["The Earth of law purifies your spirit, leaving only abundance."],"tier":"Common"},{"name":"Narada","mythology":"Hinduism","symbol":"🌬","represents":["music","storytelling","devotion"],"messages":["The Air of music dances through your veins. Your time of awakening has come."],"tier":"Common"},{"name":"Vyasa","mythology":"Hinduism","symbol":"🌬","represents":["literature","knowledge","epic compiler"],"messages":["literature whispers its secrets to those who seek power. You are chosen."],"tier":"Common"},{"name":"Valmiki","mythology":"Hinduism","symbol":"🌬","represents":["poetry","transformation","epic"],"messages":["The aura of ages past flows through poetry into your being. Your time of awakening has come."],"tier":"Common"},{"name":"Agastya","mythology":"Hinduism","symbol":"🌊","represents":["ocean","south","knowledge"],"messages":["The essence of ocean resonates in your heart, granting insight beyond measure."],"tier":"Uncommon"},{"name":"Vasishtha","mythology":"Hinduism","symbol":"🌬","represents":["meditation","divine cow","brahman"],"messages":["The song that shaped meditation now shapes your future. Every challenge becomes a stepping stone to greatness."],"tier":"Uncommon"},{"name":"Vishvamitra","mythology":"Hinduism","symbol":"🔥","represents":["creation","gayatri","warrior-sage"],"messages":["The glow of creation is your shield and your compass. Trust it."],"tier":"Common"},{"name":"Atri","mythology":"Hinduism","symbol":"🌬","represents":["creation","stars","mind-born"],"messages":["Under the blessing of creation, your serenity becomes a beacon for others."],"tier":"Common"},{"name":"Bharadwaja","mythology":"Hinduism","symbol":"🌬","represents":["knowledge","archery","vedas"],"messages":["A sacred light binds you to knowledge. Your time of awakening has come."],"tier":"Uncommon"},{"name":"Jamadagni","mythology":"Hinduism","symbol":"🔥","represents":["fire","ritual","austerity"],"messages":["When the world trembles, fire holds you steady with serenity."],"tier":"Uncommon"},{"name":"Gautama","mythology":"Hinduism","symbol":"🌬","represents":["truth","logic","justice"],"messages":["From truth's realm, a gift of resilience descends upon you now."],"tier":"Common"},{"name":"Kashyapa","mythology":"Hinduism","symbol":"🌍","represents":["creation","progenitor","life"],"messages":["The whisper of creation carries strength across the ages to find you."],"tier":"Common"},{"name":"Pulastya","mythology":"Hinduism","symbol":"🌬","represents":["ancestors","mind-born","demons"],"messages":["In the presence of ancestors, even shadows become purity."],"tier":"Rare"},{"name":"Marichi","mythology":"Hinduism","symbol":"🔥","represents":["light","ray","creation"],"messages":["The ancient pact of light awakens, blessing you with tenacity. Let nothing dim your sacred fire."],"tier":"Uncommon"},{"name":"Kratu","mythology":"Hinduism","symbol":"🔥","represents":["sacrifice","inspiration","will"],"messages":["You stand at the crossroads of sacrifice and harmony. Both claim you as their own."],"tier":"Uncommon"},{"name":"Angiras","mythology":"Hinduism","symbol":"🔥","represents":["fire","hymns","wisdom"],"messages":["You are the living testament of fire's blessing. Let nothing dim your sacred fire."],"tier":"Common"},{"name":"Daksha","mythology":"Hinduism","symbol":"🔥","represents":["ritual","skill","creation"],"messages":["The ancient bond of ritual awakens within your spirit. Peace and prosperity follow in your wake."],"tier":"Common"},{"name":"Bhumi","mythology":"Hinduism","symbol":"🌍","represents":["earth","patience","abundance"],"messages":["You carry the spirit of earth. Your time of awakening has come."],"tier":"Rare"},{"name":"Chhaya","mythology":"Hinduism","symbol":"🌍","represents":["shadow","reflection","patience"],"messages":["In shadow's light, your spark shines with renewed purpose."],"tier":"Common"},{"name":"Sanjna","mythology":"Hinduism","symbol":"🔥","represents":["consciousness","dawn","truth"],"messages":["You stand at the crossroads of consciousness and harmony. Both claim you as their own."],"tier":"Common"},{"name":"Rohini","mythology":"Hinduism","symbol":"🌍","represents":["fertility","beauty","abundance"],"messages":["Through fertility, you discover the breath that transforms all it touches."],"tier":"Uncommon"},{"name":"Revati","mythology":"Hinduism","symbol":"🌊","represents":["journey","nourishment","wealth"],"messages":["By the grace of journey, harmony becomes your birthright."],"tier":"Epic"},{"name":"Ashlesha","mythology":"Hinduism","symbol":"🌊","represents":["serpent","insight","mysticism"],"messages":["serpent whispers its secrets to those who seek resilience. You are chosen."],"tier":"Uncommon"},{"name":"Diti","mythology":"Hinduism","symbol":"🌍","represents":["earth","motherhood","demons"],"messages":["From the depths of earth, radiance rises to meet your spirit. Your spirit is unconquerable."],"tier":"Uncommon"},{"name":"Vinayaki","mythology":"Hinduism","symbol":"🌍","represents":["feminine wisdom","obstacles","grace"],"messages":["strength descends like starlight from feminine wisdom. Your path is blessed."],"tier":"Common"},{"name":"Pratyangira","mythology":"Hinduism","symbol":"🔥","represents":["fierce protection","dark magic removal"],"messages":["The ancient song of fierce protection awakens within your spirit. The doors of opportunity swing wide before you."],"tier":"Uncommon"},{"name":"Sharabha","mythology":"Hinduism","symbol":"🔥","represents":["fierce","eight-legged","pacifier"],"messages":["The Fire of fierce purifies your spirit, leaving only clarity."],"tier":"Rare"},{"name":"Kamadhenu","mythology":"Hinduism","symbol":"🌍","represents":["wish-fulfilling","abundance","cow"],"messages":["From wish-fulfilling's realm, a gift of clarity descends upon you now."],"tier":"Common"},{"name":"Uchchaihshravas","mythology":"Hinduism","symbol":"🌬","represents":["divine horse","speed","white"],"messages":["The glow of divine horse is your shield and your compass. Trust it."],"tier":"Uncommon"},{"name":"Jatayu","mythology":"Hinduism","symbol":"🌬","represents":["sacrifice","eagle","heroism"],"messages":["You carry the breath of sacrifice. Walk forward with unshakable confidence."],"tier":"Common"},{"name":"Sampati","mythology":"Hinduism","symbol":"🌬","represents":["sight","eagle","sacrifice"],"messages":["By the grace of sight, strength becomes your birthright."],"tier":"Common"},{"name":"Ravana","mythology":"Hinduism","symbol":"🔥","represents":["power","knowledge","devotion to shiva"],"messages":["Under the blessing of power, your devotion becomes a beacon for others."],"tier":"Uncommon"},{"name":"Mahabali","mythology":"Hinduism","symbol":"🌍","represents":["generosity","prosperity","king"],"messages":["You are wrapped in the resilience of generosity, shielded and empowered."],"tier":"Common"},{"name":"Prahlada","mythology":"Hinduism","symbol":"🔥","represents":["devotion","faith","courage"],"messages":["devotion sees the breath hidden within you and calls it forth. Embrace the magnificent being you are."],"tier":"Common"},{"name":"Hiranyakashipu","mythology":"Hinduism","symbol":"⚔️","represents":["power","immortality","tyranny"],"messages":["The echo that shaped power now shapes your future. Every challenge becomes a stepping stone to greatness."],"tier":"Common"},{"name":"Vritra","mythology":"Hinduism","symbol":"🌊","represents":["drought","darkness","resistance"],"messages":["Your connection to drought deepens with each breath. Great fortune awaits those who walk this path."],"tier":"Common"},{"name":"Bali","mythology":"Hinduism","symbol":"🌍","represents":["charity","power","underworld king"],"messages":["Where charity touches the earth, truth blossoms. So it is with you."],"tier":"Uncommon"},{"name":"Jalandhara","mythology":"Hinduism","symbol":"🌊","represents":["water","illusion","devotion"],"messages":["From water's realm, a gift of resilience descends upon you now."],"tier":"Uncommon"},{"name":"Taraka","mythology":"Hinduism","symbol":"🔥","represents":["penance","power","star"],"messages":["A sacred tide binds you to penance. Walk forward with unshakable confidence."],"tier":"Common"},{"name":"Mahishasura","mythology":"Hinduism","symbol":"🌍","represents":["buffalo","strength","ambition"],"messages":["The veil between worlds thins near buffalo, revealing fortitude within you."],"tier":"Uncommon"},{"name":"Raktabija","mythology":"Hinduism","symbol":"🔥","represents":["blood","multiplication","resilience"],"messages":["Under the blessing of blood, your purity becomes a beacon for others."],"tier":"Common"},{"name":"Bhadrakali","mythology":"Hinduism","symbol":"🔥","represents":["gentle terror","protection","time"],"messages":["When Fire meets compassion, miracles unfold before your eyes."],"tier":"Uncommon"},{"name":"Chamunda","mythology":"Hinduism","symbol":"🔥","represents":["death","battlefield","liberation"],"messages":["Sacred flame flows from death to illuminate your journey. Every challenge becomes a stepping stone to greatness."],"tier":"Common"},{"name":"Yogamaya","mythology":"Hinduism","symbol":"🌬","represents":["illusion","divine plan","mystery"],"messages":["From illusion's realm, a gift of power descends upon you now."],"tier":"Uncommon"},{"name":"Nirriti","mythology":"Hinduism","symbol":"🌍","represents":["misery","death","southwest"],"messages":["The eternal essence of misery flows unbroken through your lineage."],"tier":"Rare"},{"name":"Kubera Lakshmi","mythology":"Hinduism","symbol":"⚔️","represents":["hidden treasure","divine wealth"],"messages":["Your soul mirrors the light of hidden treasure. Transformation awaits at every crossroad."],"tier":"Rare"},{"name":"Sankarshana","mythology":"Hinduism","symbol":"🌍","represents":["destruction","plow","serpent"],"messages":["Through the portal of destruction, infinite purity awaits your embrace."],"tier":"Uncommon"},{"name":"Pradyumna","mythology":"Hinduism","symbol":"🔥","represents":["love","creation","intelligence"],"messages":["Where love touches the earth, resilience blossoms. So it is with you."],"tier":"Uncommon"},{"name":"Aniruddha","mythology":"Hinduism","symbol":"🌬","represents":["unstoppable","protection","mind"],"messages":["From unstoppable's realm, a gift of truth descends upon you now."],"tier":"Common"},{"name":"Vasudeva","mythology":"Hinduism","symbol":"🌬","represents":["all-pervading","supreme","origin"],"messages":["The whisper of all-pervading carries courage across the ages to find you."],"tier":"Common"},{"name":"Chhinnamastika","mythology":"Hinduism","symbol":"🔥","represents":["self-sacrifice","blood","kundalini"],"messages":["Between earth and sky, self-sacrifice plants the seed of brilliance in your soul."],"tier":"Common"},{"name":"Kamakhya","mythology":"Hinduism","symbol":"🔥","represents":["desire","feminine power","tantra"],"messages":["desire whispers its secrets to those who seek insight. You are chosen."],"tier":"Uncommon"},{"name":"Bhairava","mythology":"Hinduism","symbol":"🔥","represents":["terror","annihilation","guardian"],"messages":["You are wrapped in the power of terror, shielded and empowered."],"tier":"Common"},{"name":"Nataraja","mythology":"Hinduism","symbol":"🔥","represents":["cosmic dance","creation-destruction"],"messages":["The whisper of cosmic dance carries devotion across the ages to find you."],"tier":"Common"},{"name":"Dakshinamurti","mythology":"Hinduism","symbol":"🌍","represents":["silence","teaching","wisdom"],"messages":["When Earth meets fortitude, all obstacles dissolve like morning mist."],"tier":"Uncommon"},{"name":"Pashupatinath","mythology":"Hinduism","symbol":"🌍","represents":["lord of animals","compassion"],"messages":["You carry the tide of lord of animals. The cosmos celebrates your existence."],"tier":"Rare"},{"name":"Ardhanari","mythology":"Hinduism","symbol":"🔥","represents":["half-male-half-female","unity"],"messages":["From the depths of half-male-half-female, radiance rises to meet your spirit. Your time of awakening has come."],"tier":"Rare"},{"name":"Lingodbhava","mythology":"Hinduism","symbol":"🔥","represents":["infinite pillar","formless","origin"],"messages":["The fortitude of infinite pillar flows through you. The doors of opportunity swing wide before you."],"tier":"Rare"},{"name":"Neelakantha","mythology":"Hinduism","symbol":"🌊","represents":["blue throat","sacrifice","poison"],"messages":["The current of ages past flows through blue throat into your being. Your time of awakening has come."],"tier":"Uncommon"},{"name":"Panchamukha","mythology":"Hinduism","symbol":"🌬","represents":["five faces","all directions"],"messages":["When Air meets grace, a golden path reveals itself beneath your feet."],"tier":"Uncommon"},{"name":"Chandrasekhara","mythology":"Hinduism","symbol":"🌊","represents":["crescent moon","beauty","calm"],"messages":["Under the gaze of crescent moon, your path illuminates with purity."],"tier":"Common"},{"name":"Veerabhadra","mythology":"Hinduism","symbol":"🔥","represents":["warrior","fury","destruction"],"messages":["You are wrapped in the insight of warrior, shielded and empowered."],"tier":"Common"},{"name":"Tripurantaka","mythology":"Hinduism","symbol":"🔥","represents":["three cities destroyer","arrow"],"messages":["The cosmic thread of three cities destroyer weaves devotion into your destiny."],"tier":"Uncommon"},{"name":"Gangadhara","mythology":"Hinduism","symbol":"🌊","represents":["bearer of Ganga","mercy","flow"],"messages":["The tide of ages past flows through bearer of Ganga into your being. Stand tall in your divine inheritance."],"tier":"Common"},{"name":"Khandoba","mythology":"Hinduism","symbol":"⚔️","represents":["martial deity","Maharashtra","protection"],"messages":["Let the patience of martial deity guide your steps toward lasting peace."],"tier":"Uncommon"},{"name":"Vitthal","mythology":"Hinduism","symbol":"🌍","represents":["patience","standing brick","devotion"],"messages":["The glow of ages past flows through patience into your being. Walk forward with unshakable confidence."],"tier":"Common"},{"name":"Yellamma","mythology":"Hinduism","symbol":"🌍","represents":["fertility","south India","devotion"],"messages":["Between earth and sky, fertility plants the seed of brilliance in your soul."],"tier":"Common"},{"name":"Ayyanar","mythology":"Hinduism","symbol":"🌍","represents":["village guardian","Tamil","protection"],"messages":["Like a river from village guardian, devotion carves new paths through your life."],"tier":"Common"},{"name":"Karuppasamy","mythology":"Hinduism","symbol":"🌍","represents":["guardian","Tamil","justice"],"messages":["The cosmic thread of guardian weaves serenity into your destiny."],"tier":"Common"},{"name":"Sudalaimadan","mythology":"Hinduism","symbol":"🌍","represents":["death","guardian","Tamil"],"messages":["The tide of death is your shield and your compass. Trust it."],"tier":"Rare"},{"name":"Dravidian Mother","mythology":"Hinduism","symbol":"🌍","represents":["fertility","nature","south"],"messages":["The harmony of fertility flows through you. The doors of opportunity swing wide before you."],"tier":"Common"},{"name":"Bhudevi","mythology":"Hinduism","symbol":"🌍","represents":["earth goddess","Vishnu consort"],"messages":["Sacred mantle flows from earth goddess to illuminate your journey. The universe conspires to fulfill your purpose."],"tier":"Uncommon"},{"name":"Shridevi","mythology":"Hinduism","symbol":"🔥","represents":["royal fortune","Vishnu consort"],"messages":["The insight of royal fortune flows through you. Great fortune awaits those who walk this path."],"tier":"Common"},{"name":"Varahalakshmi","mythology":"Hinduism","symbol":"🌍","represents":["boons","Friday","prosperity"],"messages":["The Earth of boons purifies your spirit, leaving only wisdom."],"tier":"Common"},{"name":"Svaha","mythology":"Hinduism","symbol":"🔥","represents":["offering","fire","ritual"],"messages":["A sacred current binds you to offering. Your spirit is unconquerable."],"tier":"Common"},{"name":"Svadha","mythology":"Hinduism","symbol":"🔥","represents":["ancestral offering","pitru"],"messages":["The cosmic thread of ancestral offering weaves clarity into your destiny."],"tier":"Common"},{"name":"Swarga Lakshmi","mythology":"Hinduism","symbol":"🌬","represents":["heaven","celestial bliss","beauty"],"messages":["When Air meets brilliance, sacred bonds form to protect your journey."],"tier":"Common"},{"name":"Dhanya Lakshmi","mythology":"Hinduism","symbol":"🌍","represents":["food grains","nourishment","harvest"],"messages":["You carry the breath of food grains. Stand tall in your divine inheritance."],"tier":"Common"},{"name":"Veera Lakshmi","mythology":"Hinduism","symbol":"🔥","represents":["valor","courage","strength"],"messages":["The essence of valor resonates in your heart, granting power beyond measure."],"tier":"Uncommon"},{"name":"Vijaya Lakshmi","mythology":"Hinduism","symbol":"🔥","represents":["victory","success","triumph"],"messages":["Where victory touches the earth, abundance blossoms. So it is with you."],"tier":"Rare"},{"name":"Gaja Lakshmi","mythology":"Hinduism","symbol":"🌍","represents":["elephants","royal power","prosperity"],"messages":["The current of elephants is your shield and your compass. Trust it."],"tier":"Rare"},{"name":"Santana Lakshmi","mythology":"Hinduism","symbol":"🌍","represents":["progeny","children","lineage"],"messages":["Where progeny touches the earth, fortitude blossoms. So it is with you."],"tier":"Rare"},{"name":"Aishwarya Lakshmi","mythology":"Hinduism","symbol":"⚔️","represents":["opulence","luxury","magnificence"],"messages":["The cosmic thread of opulence weaves harmony into your destiny."],"tier":"Common"},{"name":"Vidya Lakshmi","mythology":"Hinduism","symbol":"🌬","represents":["knowledge","education","learning"],"messages":["Where knowledge touches the earth, harmony blossoms. So it is with you."],"tier":"Uncommon"},{"name":"Adi Lakshmi","mythology":"Hinduism","symbol":"🌊","represents":["primal source","origin","first mother"],"messages":["A sacred flame binds you to primal source. Your time of awakening has come."],"tier":"Rare"},{"name":"Dhara","mythology":"Hinduism","symbol":"🌍","represents":["earth support","firmness","foundation"],"messages":["In the presence of earth support, even shadows become grace."],"tier":"Common"},{"name":"Anala","mythology":"Hinduism","symbol":"🔥","represents":["fire","energy","vitality"],"messages":["The whisper of fire carries patience across the ages to find you."],"tier":"Uncommon"},{"name":"Anila","mythology":"Hinduism","symbol":"🌬","represents":["wind","breath of life","movement"],"messages":["The Air of wind dances through your veins. Your time of awakening has come."],"tier":"Rare"},{"name":"Pratyusha","mythology":"Hinduism","symbol":"🔥","represents":["dawn","light","awakening"],"messages":["Between earth and sky, dawn plants the seed of harmony in your soul."],"tier":"Uncommon"},{"name":"Prabhasa","mythology":"Hinduism","symbol":"🔥","represents":["splendor","brilliance","illumination"],"messages":["The veil between worlds thins near splendor, revealing truth within you."],"tier":"Common"},{"name":"Soma Vasu","mythology":"Hinduism","symbol":"🌊","represents":["moon","nourishment","plant"],"messages":["The ancient light of moon awakens within your spirit. The doors of opportunity swing wide before you."],"tier":"Uncommon"},{"name":"Aapa","mythology":"Hinduism","symbol":"🌊","represents":["water","purification","ocean"],"messages":["The ancient pact of water awakens, blessing you with courage. Walk forward with unshakable confidence."],"tier":"Uncommon"},{"name":"Dhruva","mythology":"Hinduism","symbol":"🌍","represents":["pole star","immovable","devotion"],"messages":["From the depths of pole star, compassion rises to meet your spirit. Nothing can diminish the light within you."],"tier":"Rare"},{"name":"Chyavana","mythology":"Hinduism","symbol":"🌊","represents":["rejuvenation","medicine","devotion"],"messages":["The veil between worlds thins near rejuvenation, revealing clarity within you."],"tier":"Uncommon"},{"name":"Kapila","mythology":"Hinduism","symbol":"🌬","represents":["philosophy","Samkhya","cow"],"messages":["When the world trembles, philosophy holds you steady with abundance."],"tier":"Common"},{"name":"Durvasa","mythology":"Hinduism","symbol":"🔥","represents":["anger","penance","curse","power"],"messages":["Embrace the song of anger, for it is the key to your transformation."],"tier":"Rare"},{"name":"Zeus","mythology":"Greek Mythology","symbol":"🌬","represents":["sky","thunder","king of gods"],"messages":["sky has marked you with insight. Embrace this sacred gift."],"tier":"Mythic"},{"name":"Hera","mythology":"Greek Mythology","symbol":"🌬","represents":["marriage","family","queen of gods"],"messages":["The ancient pact of marriage awakens, blessing you with strength. Your time of awakening has come."],"tier":"Legendary"},{"name":"Poseidon","mythology":"Greek Mythology","symbol":"🌊","represents":["sea","earthquakes","horses"],"messages":["Like a river from sea, courage carves new paths through your life."],"tier":"Legendary"},{"name":"Athena","mythology":"Greek Mythology","symbol":"🌬","represents":["wisdom","warfare","crafts"],"messages":["Like a river from wisdom, strength carves new paths through your life."],"tier":"Legendary"},{"name":"Apollo","mythology":"Greek Mythology","symbol":"🔥","represents":["sun","music","prophecy","healing"],"messages":["The force of ages past flows through sun into your being. Nothing can diminish the light within you."],"tier":"Legendary"},{"name":"Artemis","mythology":"Greek Mythology","symbol":"🌍","represents":["moon","hunt","wilderness"],"messages":["The resonance that shaped moon now shapes your future. The doors of opportunity swing wide before you."],"tier":"Epic"},{"name":"Ares","mythology":"Greek Mythology","symbol":"🔥","represents":["war","courage","bloodshed"],"messages":["The ancient resonance of war awakens within your spirit. The universe conspires to fulfill your purpose."],"tier":"Epic"},{"name":"Aphrodite","mythology":"Greek Mythology","symbol":"🌊","represents":["love","beauty","desire"],"messages":["When the world trembles, love holds you steady with power."],"tier":"Epic"},{"name":"Hephaestus","mythology":"Greek Mythology","symbol":"⚔️","represents":["forge","fire","metalwork"],"messages":["Through the portal of forge, infinite insight awaits your embrace."],"tier":"Epic"},{"name":"Hermes","mythology":"Greek Mythology","symbol":"🌬","represents":["travel","trade","thieves","messages"],"messages":["Where travel touches the earth, harmony blossoms. So it is with you."],"tier":"Epic"},{"name":"Demeter","mythology":"Greek Mythology","symbol":"🌍","represents":["harvest","agriculture","seasons"],"messages":["The cosmic thread of harvest weaves grace into your destiny."],"tier":"Epic"},{"name":"Dionysus","mythology":"Greek Mythology","symbol":"🌊","represents":["wine","festivity","ecstasy"],"messages":["The eternal energy of wine flows unbroken through your lineage."],"tier":"Epic"},{"name":"Hades","mythology":"Greek Mythology","symbol":"🌍","represents":["underworld","death","riches"],"messages":["Like a river from underworld, patience carves new paths through your life."],"tier":"Legendary"},{"name":"Persephone","mythology":"Greek Mythology","symbol":"🌍","represents":["spring","underworld queen"],"messages":["A sacred spirit binds you to spring. Walk forward with unshakable confidence."],"tier":"Epic"},{"name":"Hestia","mythology":"Greek Mythology","symbol":"🔥","represents":["hearth","home","family"],"messages":["When the world trembles, hearth holds you steady with tenacity."],"tier":"Epic"},{"name":"Eros","mythology":"Greek Mythology","symbol":"🌬","represents":["love","desire","attraction"],"messages":["Sacred echo flows from love to illuminate your journey. Your legacy shall echo through generations."],"tier":"Epic"},{"name":"Nike","mythology":"Greek Mythology","symbol":"🌬","represents":["victory","speed","strength"],"messages":["The veil between worlds thins near victory, revealing tenacity within you."],"tier":"Common"},{"name":"Hecate","mythology":"Greek Mythology","symbol":"🌊","represents":["magic","crossroads","moon"],"messages":["The whisper of magic carries compassion across the ages to find you."],"tier":"Epic"},{"name":"Pan","mythology":"Greek Mythology","symbol":"🌍","represents":["nature","shepherds","fertility"],"messages":["Where nature touches the earth, resilience blossoms. So it is with you."],"tier":"Uncommon"},{"name":"Helios","mythology":"Greek Mythology","symbol":"🔥","represents":["sun","sight","oath"],"messages":["The Fire of sun dances through your veins. Your spirit is unconquerable."],"tier":"Epic"},{"name":"Selene","mythology":"Greek Mythology","symbol":"🌊","represents":["moon","night","silver"],"messages":["wisdom descends like starlight from moon. Your path is blessed."],"tier":"Rare"},{"name":"Eos","mythology":"Greek Mythology","symbol":"🔥","represents":["dawn","hope","new beginnings"],"messages":["Through dawn, you discover the breath that transforms all it touches."],"tier":"Uncommon"},{"name":"Kronos","mythology":"Greek Mythology","symbol":"🌍","represents":["time","harvest","ages"],"messages":["Under the blessing of time, your tenacity becomes a beacon for others."],"tier":"Epic"},{"name":"Rhea","mythology":"Greek Mythology","symbol":"🌍","represents":["motherhood","fertility","comfort"],"messages":["By the grace of motherhood, courage becomes your birthright."],"tier":"Uncommon"},{"name":"Atlas","mythology":"Greek Mythology","symbol":"🌍","represents":["endurance","astronomy","sky-bearer"],"messages":["You are the living testament of endurance's tide. Stand tall in your divine inheritance."],"tier":"Epic"},{"name":"Prometheus","mythology":"Greek Mythology","symbol":"🔥","represents":["foresight","fire-bringer","craft"],"messages":["The whisper of foresight carries grace across the ages to find you."],"tier":"Legendary"},{"name":"Hyperion","mythology":"Greek Mythology","symbol":"🔥","represents":["light","watchfulness","sun"],"messages":["From the depths of light, clarity rises to meet your spirit. Your time of awakening has come."],"tier":"Common"},{"name":"Themis","mythology":"Greek Mythology","symbol":"🌍","represents":["justice","law","divine order"],"messages":["You are the living testament of justice's mantle. Your spirit is unconquerable."],"tier":"Uncommon"},{"name":"Mnemosyne","mythology":"Greek Mythology","symbol":"🌊","represents":["memory","language","remembrance"],"messages":["When you call upon memory, compassion answers without hesitation."],"tier":"Common"},{"name":"Oceanus","mythology":"Greek Mythology","symbol":"🌊","represents":["ocean","world river","flow"],"messages":["The Water of ocean dances through your veins. Let nothing dim your sacred fire."],"tier":"Uncommon"},{"name":"Tethys","mythology":"Greek Mythology","symbol":"🌊","represents":["fresh water","nursing","nourishment"],"messages":["The eternal spirit of fresh water flows unbroken through your lineage."],"tier":"Rare"},{"name":"Coeus","mythology":"Greek Mythology","symbol":"🌬","represents":["intellect","foresight","knowledge"],"messages":["The courage of intellect flows through you. Your inner light shall guide nations."],"tier":"Uncommon"},{"name":"Phoebe","mythology":"Greek Mythology","symbol":"🌊","represents":["radiance","prophecy","moon"],"messages":["Ancient tide stirs within as radiance recognizes your worth."],"tier":"Rare"},{"name":"Iapetus","mythology":"Greek Mythology","symbol":"🌍","represents":["mortality","craftsmanship","west"],"messages":["Under the gaze of mortality, your path illuminates with strength."],"tier":"Rare"},{"name":"Crius","mythology":"Greek Mythology","symbol":"🌬","represents":["constellations","heavenly stars"],"messages":["patience descends like starlight from constellations. Your path is blessed."],"tier":"Common"},{"name":"Iris","mythology":"Greek Mythology","symbol":"🌊","represents":["rainbow","messages","sea"],"messages":["Through the portal of rainbow, infinite tenacity awaits your embrace."],"tier":"Common"},{"name":"Nemesis","mythology":"Greek Mythology","symbol":"🌍","represents":["retribution","balance","justice"],"messages":["retribution whispers its secrets to those who seek serenity. You are chosen."],"tier":"Epic"},{"name":"Tyche","mythology":"Greek Mythology","symbol":"🌍","represents":["fortune","luck","prosperity"],"messages":["Where fortune touches the earth, truth blossoms. So it is with you."],"tier":"Uncommon"},{"name":"Morpheus","mythology":"Greek Mythology","symbol":"🌬","represents":["dreams","sleep","visions"],"messages":["From the depths of dreams, tenacity rises to meet your spirit. Let nothing dim your sacred fire."],"tier":"Common"},{"name":"Hypnos","mythology":"Greek Mythology","symbol":"🌬","represents":["sleep","rest","tranquility"],"messages":["The Air speaks through sleep, carrying a message of serenity for you."],"tier":"Common"},{"name":"Thanatos","mythology":"Greek Mythology","symbol":"🌍","represents":["death","peaceful passing"],"messages":["death sees the gift hidden within you and calls it forth. Your spirit is unconquerable."],"tier":"Uncommon"},{"name":"Asclepius","mythology":"Greek Mythology","symbol":"🌊","represents":["healing","medicine","serpent"],"messages":["Embrace the gift of healing, for it is the key to your transformation."],"tier":"Uncommon"},{"name":"Hygeia","mythology":"Greek Mythology","symbol":"🌊","represents":["health","cleanliness","prevention"],"messages":["The Water sings the song of health, and you alone can hear its serenity."],"tier":"Uncommon"},{"name":"Triton","mythology":"Greek Mythology","symbol":"🌊","represents":["sea","trumpet","waves"],"messages":["serenity descends like starlight from sea. Your path is blessed."],"tier":"Uncommon"},{"name":"Amphitrite","mythology":"Greek Mythology","symbol":"🌊","represents":["sea queen","calm waters"],"messages":["The echo that shaped sea queen now shapes your future. Great fortune awaits those who walk this path."],"tier":"Uncommon"},{"name":"Nereus","mythology":"Greek Mythology","symbol":"🌊","represents":["old man of sea","truth","prophecy"],"messages":["The Water within you aligns with old man of sea, creating unstoppable compassion."],"tier":"Rare"},{"name":"Proteus","mythology":"Greek Mythology","symbol":"🌊","represents":["shape-shifting","prophecy","sea"],"messages":["From shape-shifting's realm, a gift of abundance descends upon you now."],"tier":"Rare"},{"name":"Scylla","mythology":"Greek Mythology","symbol":"🌊","represents":["danger","strait","monster"],"messages":["The veil between worlds thins near danger, revealing wisdom within you."],"tier":"Common"},{"name":"Circe","mythology":"Greek Mythology","symbol":"🌊","represents":["sorcery","transformation","herbs"],"messages":["The whisper of sorcery carries courage across the ages to find you."],"tier":"Uncommon"},{"name":"Perses","mythology":"Greek Mythology","symbol":"🔥","represents":["destruction","ravaging"],"messages":["Where destruction touches the earth, brilliance blossoms. So it is with you."],"tier":"Common"},{"name":"Astraea","mythology":"Greek Mythology","symbol":"🌬","represents":["justice","innocence","stars"],"messages":["In the presence of justice, even shadows become serenity."],"tier":"Common"},{"name":"Eris","mythology":"Greek Mythology","symbol":"🔥","represents":["discord","chaos","strife"],"messages":["The Fire sings the song of discord, and you alone can hear its insight."],"tier":"Common"},{"name":"Enyo","mythology":"Greek Mythology","symbol":"🔥","represents":["war","destruction","bloodshed"],"messages":["The sacred fires of war forge within you an unbreakable patience."],"tier":"Common"},{"name":"Phobos","mythology":"Greek Mythology","symbol":"🔥","represents":["fear","panic","rout"],"messages":["The ancient tide of fear awakens within your spirit. The universe conspires to fulfill your purpose."],"tier":"Common"},{"name":"Deimos","mythology":"Greek Mythology","symbol":"🔥","represents":["dread","terror","war"],"messages":["Through the portal of dread, infinite compassion awaits your embrace."],"tier":"Uncommon"},{"name":"Aether","mythology":"Greek Mythology","symbol":"🌬","represents":["upper sky","light","brightness"],"messages":["upper sky whispers its secrets to those who seek fortitude. You are chosen."],"tier":"Common"},{"name":"Nyx","mythology":"Greek Mythology","symbol":"🌊","represents":["night","darkness","shadow"],"messages":["The light that shaped night now shapes your future. Your inner light shall guide nations."],"tier":"Legendary"},{"name":"Erebus","mythology":"Greek Mythology","symbol":"🌍","represents":["deep darkness","shadow"],"messages":["deep darkness has marked you with grace. Embrace this sacred gift."],"tier":"Common"},{"name":"Hemera","mythology":"Greek Mythology","symbol":"🔥","represents":["day","daylight","daytime"],"messages":["Blessed by day, you walk with compassion as your eternal companion."],"tier":"Common"},{"name":"Pontus","mythology":"Greek Mythology","symbol":"🌊","represents":["sea","deep ocean"],"messages":["From sea's realm, a gift of compassion descends upon you now."],"tier":"Common"},{"name":"Uranus","mythology":"Greek Mythology","symbol":"🌬","represents":["sky","heavens","father"],"messages":["A sacred echo binds you to sky. Nothing can diminish the light within you."],"tier":"Uncommon"},{"name":"Gaia","mythology":"Greek Mythology","symbol":"🌍","represents":["earth","mother","creation"],"messages":["A sacred aura binds you to earth. Your spirit is unconquerable."],"tier":"Legendary"},{"name":"Tartarus","mythology":"Greek Mythology","symbol":"🌍","represents":["abyss","punishment","depth"],"messages":["You are wrapped in the serenity of abyss, shielded and empowered."],"tier":"Rare"},{"name":"Jupiter","mythology":"Roman Mythology","symbol":"🌬","represents":["sky","thunder","state"],"messages":["The cosmic thread of sky weaves clarity into your destiny."],"tier":"Epic"},{"name":"Juno","mythology":"Roman Mythology","symbol":"🌬","represents":["marriage","childbirth","queen"],"messages":["A sacred glow binds you to marriage. Rise and claim your destiny."],"tier":"Common"},{"name":"Mars","mythology":"Roman Mythology","symbol":"🔥","represents":["war","agriculture","guardian"],"messages":["The sacred fires of war forge within you an unbreakable purity."],"tier":"Epic"},{"name":"Venus","mythology":"Roman Mythology","symbol":"🌊","represents":["love","beauty","victory"],"messages":["Your soul mirrors the light of love. Every challenge becomes a stepping stone to greatness."],"tier":"Epic"},{"name":"Mercury","mythology":"Roman Mythology","symbol":"🌬","represents":["trade","messages","trickery"],"messages":["The whisper of trade carries harmony across the ages to find you."],"tier":"Rare"},{"name":"Minerva","mythology":"Roman Mythology","symbol":"🌬","represents":["wisdom","strategic war","craft"],"messages":["You are wrapped in the power of wisdom, shielded and empowered."],"tier":"Common"},{"name":"Neptune","mythology":"Roman Mythology","symbol":"🌊","represents":["sea","freshwater","horses"],"messages":["The ancient gift of sea awakens within your spirit. Peace and prosperity follow in your wake."],"tier":"Rare"},{"name":"Diana","mythology":"Roman Mythology","symbol":"🌍","represents":["moon","hunt","crossroads"],"messages":["The cosmic thread of moon weaves insight into your destiny."],"tier":"Rare"},{"name":"Vulcan","mythology":"Roman Mythology","symbol":"🔥","represents":["fire","forge","volcanoes"],"messages":["From fire's realm, a gift of truth descends upon you now."],"tier":"Common"},{"name":"Ceres","mythology":"Roman Mythology","symbol":"🌍","represents":["agriculture","grain","motherly love"],"messages":["Let the wisdom of agriculture guide your steps toward boundless prosperity."],"tier":"Common"},{"name":"Bacchus","mythology":"Roman Mythology","symbol":"🌊","represents":["wine","pleasure","freedom"],"messages":["In the presence of wine, even shadows become wisdom."],"tier":"Common"},{"name":"Pluto","mythology":"Roman Mythology","symbol":"🌍","represents":["underworld","wealth","death"],"messages":["When you call upon underworld, tenacity answers without hesitation."],"tier":"Rare"},{"name":"Proserpina","mythology":"Roman Mythology","symbol":"🌍","represents":["spring","underworld queen"],"messages":["Your soul mirrors the flame of spring. Joy and fulfillment are your sacred inheritance."],"tier":"Rare"},{"name":"Janus","mythology":"Roman Mythology","symbol":"🌬","represents":["beginnings","doors","transitions","duality"],"messages":["Where others see darkness, beginnings grants you the sight of harmony."],"tier":"Epic"},{"name":"Saturn","mythology":"Roman Mythology","symbol":"🌍","represents":["time","agriculture","liberation"],"messages":["You stand at the crossroads of time and purity. Both claim you as their own."],"tier":"Epic"},{"name":"Vesta","mythology":"Roman Mythology","symbol":"🔥","represents":["hearth","home","sacred flame"],"messages":["Ancient pulse stirs within as hearth recognizes your worth."],"tier":"Common"},{"name":"Bellona","mythology":"Roman Mythology","symbol":"🔥","represents":["war","destruction","conquest"],"messages":["The Fire of war dances through your veins. Your time of awakening has come."],"tier":"Rare"},{"name":"Fortuna","mythology":"Roman Mythology","symbol":"🌍","represents":["fortune","luck","fate"],"messages":["You carry the breath of fortune. Your time of awakening has come."],"tier":"Uncommon"},{"name":"Faunus","mythology":"Roman Mythology","symbol":"🌍","represents":["forest","plains","fertility"],"messages":["When you call upon forest, serenity answers without hesitation."],"tier":"Rare"},{"name":"Flora","mythology":"Roman Mythology","symbol":"🌍","represents":["flowers","spring","bloom"],"messages":["The sacred fires of flowers forge within you an unbreakable grace."],"tier":"Common"},{"name":"Pomona","mythology":"Roman Mythology","symbol":"🌍","represents":["fruit trees","orchards","abundance"],"messages":["When the world trembles, fruit trees holds you steady with compassion."],"tier":"Common"},{"name":"Silvanus","mythology":"Roman Mythology","symbol":"🌍","represents":["woods","fields","boundaries"],"messages":["Your connection to woods deepens with each breath. The doors of opportunity swing wide before you."],"tier":"Rare"},{"name":"Aurora","mythology":"Roman Mythology","symbol":"🔥","represents":["dawn","renewal","light"],"messages":["dawn crowns you with clarity. Walk boldly into what awaits."],"tier":"Common"},{"name":"Luna","mythology":"Roman Mythology","symbol":"🌊","represents":["moon","night","magic"],"messages":["When the world trembles, moon holds you steady with clarity."],"tier":"Common"},{"name":"Sol Invictus","mythology":"Roman Mythology","symbol":"🔥","represents":["unconquered sun","light","victory"],"messages":["From unconquered sun's realm, a gift of power descends upon you now."],"tier":"Uncommon"},{"name":"Cupid","mythology":"Roman Mythology","symbol":"🌬","represents":["love","desire","arrows"],"messages":["When you call upon love, strength answers without hesitation."],"tier":"Common"},{"name":"Victoria","mythology":"Roman Mythology","symbol":"🌬","represents":["victory","triumph","success"],"messages":["From victory's realm, a gift of clarity descends upon you now."],"tier":"Rare"},{"name":"Pax","mythology":"Roman Mythology","symbol":"🌍","represents":["peace","harmony","prosperity"],"messages":["abundance descends like starlight from peace. Your path is blessed."],"tier":"Common"},{"name":"Concordia","mythology":"Roman Mythology","symbol":"🌍","represents":["agreement","harmony","unity"],"messages":["Your soul mirrors the flame of agreement. Your inner light shall guide nations."],"tier":"Uncommon"},{"name":"Spes","mythology":"Roman Mythology","symbol":"🌬","represents":["hope","expectation","future"],"messages":["The ancient pact of hope awakens, blessing you with patience. Rise and claim your destiny."],"tier":"Common"},{"name":"Fides","mythology":"Roman Mythology","symbol":"🌬","represents":["trust","faith","honesty"],"messages":["Let the resilience of trust guide your steps toward profound transformation."],"tier":"Common"},{"name":"Pietas","mythology":"Roman Mythology","symbol":"🌍","represents":["duty","piety","devotion"],"messages":["The essence of duty resonates in your heart, granting abundance beyond measure."],"tier":"Common"},{"name":"Clementia","mythology":"Roman Mythology","symbol":"🌊","represents":["mercy","gentleness","clemency"],"messages":["The sacred fires of mercy forge within you an unbreakable wisdom."],"tier":"Common"},{"name":"Libertas","mythology":"Roman Mythology","symbol":"🌬","represents":["freedom","liberty","independence"],"messages":["The pulse of ages past flows through freedom into your being. Embrace the magnificent being you are."],"tier":"Uncommon"},{"name":"Justitia","mythology":"Roman Mythology","symbol":"⚔️","represents":["justice","fairness","law"],"messages":["The Metal of justice purifies your spirit, leaving only strength."],"tier":"Common"},{"name":"Terminus","mythology":"Roman Mythology","symbol":"🌍","represents":["boundaries","limits","property"],"messages":["The essence of boundaries resonates in your heart, granting truth beyond measure."],"tier":"Uncommon"},{"name":"Portunus","mythology":"Roman Mythology","symbol":"🌊","represents":["harbors","doors","keys"],"messages":["Blessed by harbors, you walk with resilience as your eternal companion."],"tier":"Common"},{"name":"Vertumnus","mythology":"Roman Mythology","symbol":"🌍","represents":["seasons","change","gardens"],"messages":["Let the truth of seasons guide your steps toward triumphant renewal."],"tier":"Common"},{"name":"Carmenta","mythology":"Roman Mythology","symbol":"🌬","represents":["childbirth","prophecy","alphabet"],"messages":["When the world trembles, childbirth holds you steady with wisdom."],"tier":"Uncommon"},{"name":"Mithras","mythology":"Roman Mythology","symbol":"🔥","represents":["light","truth","cosmic order"],"messages":["The cosmic thread of light weaves radiance into your destiny."],"tier":"Rare"},{"name":"Magna Mater","mythology":"Roman Mythology","symbol":"🌍","represents":["great mother","nature","fertility"],"messages":["great mother whispers its secrets to those who seek strength. You are chosen."],"tier":"Uncommon"},{"name":"Isis Romana","mythology":"Roman Mythology","symbol":"🌊","represents":["magic","fertility","navigation"],"messages":["The essence of magic resonates in your heart, granting clarity beyond measure."],"tier":"Rare"},{"name":"Serapis","mythology":"Roman Mythology","symbol":"🔥","represents":["sun","healing","afterlife"],"messages":["Sacred force flows from sun to illuminate your journey. Your legacy shall echo through generations."],"tier":"Rare"},{"name":"Epona","mythology":"Roman Mythology","symbol":"🌍","represents":["horses","fertility","sovereignty"],"messages":["Under the gaze of horses, your path illuminates with fortitude."],"tier":"Uncommon"},{"name":"Sulis","mythology":"Roman Mythology","symbol":"🌊","represents":["healing waters","curse","springs"],"messages":["The Water speaks through healing waters, carrying a message of harmony for you."],"tier":"Common"},{"name":"Coventina","mythology":"Roman Mythology","symbol":"🌊","represents":["wells","springs","abundance"],"messages":["The Water within you aligns with wells, creating unstoppable serenity."],"tier":"Rare"},{"name":"Lares","mythology":"Roman Mythology","symbol":"🌍","represents":["home guardians","ancestors","hearth"],"messages":["In home guardians's light, your flame shines with renewed purpose."],"tier":"Common"},{"name":"Penates","mythology":"Roman Mythology","symbol":"🌍","represents":["pantry","household","storeroom"],"messages":["The eternal flame of pantry flows unbroken through your lineage."],"tier":"Common"},{"name":"Genius","mythology":"Roman Mythology","symbol":"🌬","represents":["spirit","life force","personality"],"messages":["Where spirit touches the earth, radiance blossoms. So it is with you."],"tier":"Common"},{"name":"Manes","mythology":"Roman Mythology","symbol":"🌍","represents":["ancestors","underworld spirits"],"messages":["ancestors crowns you with clarity. Walk boldly into what awaits."],"tier":"Uncommon"},{"name":"Liber Pater","mythology":"Roman Mythology","symbol":"🌊","represents":["wine","fertility","freedom"],"messages":["insight descends like starlight from wine. Your path is blessed."],"tier":"Common"},{"name":"Ops","mythology":"Roman Mythology","symbol":"🌍","represents":["earth","wealth","abundance"],"messages":["Embrace the energy of earth, for it is the key to your transformation."],"tier":"Common"},{"name":"Quirinus","mythology":"Roman Mythology","symbol":"🌬","represents":["state","assembly","Romulus deified"],"messages":["state crowns you with courage. Walk boldly into what awaits."],"tier":"Common"},{"name":"Dea Tacita","mythology":"Roman Mythology","symbol":"🌍","represents":["silence","underworld","ghosts"],"messages":["compassion descends like starlight from silence. Your path is blessed."],"tier":"Common"},{"name":"Volturnus","mythology":"Roman Mythology","symbol":"🌊","represents":["river","east wind","waters"],"messages":["river has marked you with grace. Embrace this sacred gift."],"tier":"Rare"},{"name":"Angerona","mythology":"Roman Mythology","symbol":"🌍","represents":["secrecy","silence","solstice"],"messages":["The whisper of secrecy carries tenacity across the ages to find you."],"tier":"Common"},{"name":"Laverna","mythology":"Roman Mythology","symbol":"🌍","represents":["thieves","fraud","underworld"],"messages":["The brilliance of thieves flows through you. Abundance flows to you from every direction."],"tier":"Uncommon"},{"name":"Robigus","mythology":"Roman Mythology","symbol":"🌍","represents":["wheat","protection from blight"],"messages":["Between earth and sky, wheat plants the seed of clarity in your soul."],"tier":"Rare"},{"name":"Feronia","mythology":"Roman Mythology","symbol":"🌍","represents":["freedom","wildlife","fertility"],"messages":["You are the living testament of freedom's spark. The universe bends toward your will."],"tier":"Common"},{"name":"Summanus","mythology":"Roman Mythology","symbol":"🌬","represents":["night thunder","nocturnal sky"],"messages":["In night thunder's light, your tide shines with renewed purpose."],"tier":"Uncommon"},{"name":"Vejovis","mythology":"Roman Mythology","symbol":"🌬","represents":["healing","anti-Jupiter","youth"],"messages":["In healing's light, your essence shines with renewed purpose."],"tier":"Common"},{"name":"Lucina","mythology":"Roman Mythology","symbol":"🔥","represents":["childbirth","light","midwifery"],"messages":["The Fire sings the song of childbirth, and you alone can hear its grace."],"tier":"Common"},{"name":"Furrina","mythology":"Roman Mythology","symbol":"🌊","represents":["springs","mystery","underground water"],"messages":["Under the blessing of springs, your compassion becomes a beacon for others."],"tier":"Common"},{"name":"Consus","mythology":"Roman Mythology","symbol":"🌍","represents":["grain storage","secret counsel"],"messages":["The Earth of grain storage dances through your veins. Your spirit is unconquerable."],"tier":"Uncommon"},{"name":"Acca Larentia","mythology":"Roman Mythology","symbol":"🌍","represents":["nursing","earth mother","Rome"],"messages":["The essence of nursing resonates in your heart, granting harmony beyond measure."],"tier":"Uncommon"},{"name":"Tiberinus","mythology":"Roman Mythology","symbol":"🌊","represents":["Tiber river","Rome","father"],"messages":["The Water speaks through Tiber river, carrying a message of insight for you."],"tier":"Common"},{"name":"Cardea","mythology":"Roman Mythology","symbol":"⚔️","represents":["door hinges","thresholds","health"],"messages":["The Metal of door hinges dances through your veins. Your spirit is unconquerable."],"tier":"Common"},{"name":"Aeolus","mythology":"Greek Mythology","symbol":"🌬","represents":["wind keeper","storms","island ruler"],"messages":["Where others see darkness, wind keeper grants you the sight of wisdom."],"tier":"Uncommon"},{"name":"Amphion","mythology":"Greek Mythology","symbol":"🌬","represents":["music","walls of Thebes","lyre"],"messages":["Where music touches the earth, truth blossoms. So it is with you."],"tier":"Common"},{"name":"Dike","mythology":"Greek Mythology","symbol":"🌍","represents":["justice","moral order","seasons"],"messages":["The eternal glow of justice flows unbroken through your lineage."],"tier":"Common"},{"name":"Eirene","mythology":"Greek Mythology","symbol":"🌍","represents":["peace","spring","prosperity"],"messages":["From peace's realm, a gift of courage descends upon you now."],"tier":"Uncommon"},{"name":"Eunomia","mythology":"Greek Mythology","symbol":"🌍","represents":["good order","lawfulness","pasture"],"messages":["The cosmic thread of good order weaves courage into your destiny."],"tier":"Rare"},{"name":"Metis","mythology":"Greek Mythology","symbol":"🌊","represents":["wisdom","cunning counsel","prudence"],"messages":["wisdom sees the glow hidden within you and calls it forth. Walk forward with unshakable confidence."],"tier":"Uncommon"},{"name":"Styx","mythology":"Greek Mythology","symbol":"🌊","represents":["hatred","underworld river","oath"],"messages":["Where hatred touches the earth, brilliance blossoms. So it is with you."],"tier":"Common"},{"name":"Pallas","mythology":"Greek Mythology","symbol":"⚔️","represents":["warcraft","campaign","wisdom"],"messages":["When the world trembles, warcraft holds you steady with truth."],"tier":"Uncommon"},{"name":"Bia","mythology":"Greek Mythology","symbol":"⚔️","represents":["force","power","compulsion"],"messages":["You are wrapped in the serenity of force, shielded and empowered."],"tier":"Common"},{"name":"Kratos","mythology":"Greek Mythology","symbol":"⚔️","represents":["strength","might","sovereign rule"],"messages":["The essence of strength resonates in your heart, granting grace beyond measure."],"tier":"Uncommon"},{"name":"Zelus","mythology":"Greek Mythology","symbol":"🔥","represents":["zeal","rivalry","emulation"],"messages":["The Fire sings the song of zeal, and you alone can hear its clarity."],"tier":"Common"},{"name":"Ganymede","mythology":"Greek Mythology","symbol":"🌊","represents":["cupbearer","youth","beauty"],"messages":["Your connection to cupbearer deepens with each breath. Peace and prosperity follow in your wake."],"tier":"Rare"},{"name":"Hebe","mythology":"Greek Mythology","symbol":"🌊","represents":["youth","prime of life","forgiveness"],"messages":["Sacred blessing flows from youth to illuminate your journey. Great fortune awaits those who walk this path."],"tier":"Uncommon"},{"name":"Harmonia","mythology":"Greek Mythology","symbol":"🌍","represents":["harmony","concord","balance"],"messages":["Between earth and sky, harmony plants the seed of devotion in your soul."],"tier":"Common"},{"name":"Priapus","mythology":"Greek Mythology","symbol":"🌍","represents":["fertility","garden","livestock"],"messages":["The eternal pulse of fertility flows unbroken through your lineage."],"tier":"Common"},{"name":"Chiron","mythology":"Greek Mythology","symbol":"🌍","represents":["centaur","healing","teaching","wisdom"],"messages":["The sacred fires of centaur forge within you an unbreakable brilliance."],"tier":"Common"},{"name":"Leto","mythology":"Greek Mythology","symbol":"🌊","represents":["motherhood","modesty","demure"],"messages":["The veil between worlds thins near motherhood, revealing grace within you."],"tier":"Rare"},{"name":"Hecatoncheires","mythology":"Greek Mythology","symbol":"🌍","represents":["hundred-handed","storms","guardians"],"messages":["Where others see darkness, hundred-handed grants you the sight of compassion."],"tier":"Rare"},{"name":"Electra","mythology":"Greek Mythology","symbol":"🌬","represents":["amber","clouds","Pleiad star"],"messages":["The ancient pact of amber awakens, blessing you with wisdom. Embrace the magnificent being you are."],"tier":"Rare"},{"name":"Doris","mythology":"Greek Mythology","symbol":"🌊","represents":["sea bounty","ocean","Nereid mother"],"messages":["The spirit of ages past flows through sea bounty into your being. The universe bends toward your will."],"tier":"Uncommon"},{"name":"Thetis","mythology":"Greek Mythology","symbol":"🌊","represents":["sea nymph","destiny","mother of Achilles"],"messages":["The whisper of sea nymph carries strength across the ages to find you."],"tier":"Uncommon"},{"name":"Eurynome","mythology":"Greek Mythology","symbol":"🌊","represents":["wide pasture","dancing","creation"],"messages":["Under the blessing of wide pasture, your courage becomes a beacon for others."],"tier":"Rare"},{"name":"Clytie","mythology":"Greek Mythology","symbol":"🔥","represents":["sunflower","devotion","unrequited love"],"messages":["Where sunflower touches the earth, compassion blossoms. So it is with you."],"tier":"Uncommon"},{"name":"Philotes","mythology":"Greek Mythology","symbol":"🌊","represents":["friendship","affection","intercourse"],"messages":["Through the portal of friendship, infinite resilience awaits your embrace."],"tier":"Common"},{"name":"Apate","mythology":"Greek Mythology","symbol":"🌬","represents":["deceit","guile","fraud"],"messages":["You carry the flame of deceit. Let nothing dim your sacred fire."],"tier":"Common"},{"name":"Aidos","mythology":"Greek Mythology","symbol":"🌍","represents":["modesty","shame","humility","respect"],"messages":["modesty crowns you with harmony. Walk boldly into what awaits."],"tier":"Uncommon"},{"name":"Aletheia","mythology":"Greek Mythology","symbol":"🌬","represents":["truth","sincerity","disclosure"],"messages":["The abundance of truth flows through you. The doors of opportunity swing wide before you."],"tier":"Uncommon"},{"name":"Horkos","mythology":"Greek Mythology","symbol":"⚔️","represents":["oath","punishment of perjury"],"messages":["Like a river from oath, radiance carves new paths through your life."],"tier":"Common"},{"name":"Achelous","mythology":"Greek Mythology","symbol":"🌊","represents":["river","fresh water","shape-shifting"],"messages":["river has marked you with patience. Embrace this sacred gift."],"tier":"Common"},{"name":"Chrysus","mythology":"Greek Mythology","symbol":"⚔️","represents":["gold","riches","precious things"],"messages":["Blessed by gold, you walk with courage as your eternal companion."],"tier":"Common"},{"name":"Algea","mythology":"Greek Mythology","symbol":"🌊","represents":["sorrow","pain","grief"],"messages":["Through sorrow, you discover the pulse that transforms all it touches."],"tier":"Uncommon"},{"name":"Arete Greek","mythology":"Greek Mythology","symbol":"🔥","represents":["virtue","excellence","valor"],"messages":["The compassion of virtue flows through you. Transformation awaits at every crossroad."],"tier":"Common"},{"name":"Dolus","mythology":"Greek Mythology","symbol":"🌬","represents":["trickery","cunning","craftiness"],"messages":["Like a river from trickery, insight carves new paths through your life."],"tier":"Common"},{"name":"Geras","mythology":"Greek Mythology","symbol":"🌍","represents":["old age","time","experience"],"messages":["You carry the energy of old age. Rise and claim your destiny."],"tier":"Common"},{"name":"Chrysaor","mythology":"Greek Mythology","symbol":"⚔️","represents":["golden sword","Pegasus brother","giant"],"messages":["The Metal of golden sword dances through your veins. Your time of awakening has come."],"tier":"Uncommon"},{"name":"Amaterasu","mythology":"Shinto","symbol":"🔥","represents":["sun","universe","light"],"messages":["Your connection to sun deepens with each breath. Your inner light shall guide nations."],"tier":"Mythic"},{"name":"Tsukuyomi","mythology":"Shinto","symbol":"🌊","represents":["moon","night","order"],"messages":["Embrace the echo of moon, for it is the key to your transformation."],"tier":"Legendary"},{"name":"Susanoo","mythology":"Shinto","symbol":"🌊","represents":["storm","sea","valor"],"messages":["The Water within you aligns with storm, creating unstoppable abundance."],"tier":"Legendary"},{"name":"Izanagi","mythology":"Shinto","symbol":"🌬","represents":["creation","life","purification"],"messages":["When Air meets purity, hidden truths illuminate your way forward."],"tier":"Epic"},{"name":"Izanami","mythology":"Shinto","symbol":"🌍","represents":["creation","death","underworld"],"messages":["radiance descends like starlight from creation. Your path is blessed."],"tier":"Epic"},{"name":"Inari","mythology":"Shinto","symbol":"🌍","represents":["rice","foxes","prosperity","fertility"],"messages":["Where others see darkness, rice grants you the sight of clarity."],"tier":"Legendary"},{"name":"Hachiman","mythology":"Shinto","symbol":"⚔️","represents":["war","archery","culture"],"messages":["Under the blessing of war, your resilience becomes a beacon for others."],"tier":"Epic"},{"name":"Raijin","mythology":"Shinto","symbol":"🌬","represents":["thunder","lightning","storms"],"messages":["The Air of thunder dances through your veins. Your spirit is unconquerable."],"tier":"Epic"},{"name":"Fujin","mythology":"Shinto","symbol":"🌬","represents":["wind","sky","air"],"messages":["wind has marked you with serenity. Embrace this sacred gift."],"tier":"Epic"},{"name":"Ryujin","mythology":"Shinto","symbol":"🌊","represents":["sea","dragon","storms"],"messages":["The ancient glow of sea awakens within your spirit. The universe conspires to fulfill your purpose."],"tier":"Epic"},{"name":"Ebisu","mythology":"Shinto","symbol":"🌊","represents":["fishermen","luck","prosperity"],"messages":["The song of ages past flows through fishermen into your being. Your time of awakening has come."],"tier":"Epic"},{"name":"Daikokuten","mythology":"Shinto/Buddhism","symbol":"🌍","represents":["wealth","commerce","households"],"messages":["Through the portal of wealth, infinite grace awaits your embrace."],"tier":"Epic"},{"name":"Bishamonten","mythology":"Shinto/Buddhism","symbol":"⚔️","represents":["warriors","fortune","dignity"],"messages":["From warriors's realm, a gift of harmony descends upon you now."],"tier":"Uncommon"},{"name":"Benzaiten","mythology":"Shinto/Buddhism","symbol":"🌊","represents":["music","poetry","arts","water"],"messages":["A sacred resonance binds you to music. Walk forward with unshakable confidence."],"tier":"Epic"},{"name":"Fukurokuju","mythology":"Shinto/Buddhism","symbol":"🌿","represents":["longevity","wisdom","happiness"],"messages":["When you call upon longevity, brilliance answers without hesitation."],"tier":"Uncommon"},{"name":"Jurojin","mythology":"Shinto/Buddhism","symbol":"🌿","represents":["longevity","health","wisdom"],"messages":["From the depths of longevity, tenacity rises to meet your spirit. Rise and claim your destiny."],"tier":"Uncommon"},{"name":"Hotei","mythology":"Shinto/Buddhism","symbol":"🌍","represents":["abundance","contentment","fortune"],"messages":["The sacred fires of abundance forge within you an unbreakable abundance."],"tier":"Uncommon"},{"name":"Ame-no-Uzume","mythology":"Shinto","symbol":"🔥","represents":["dawn","mirth","revelry"],"messages":["The ancient aura of dawn awakens within your spirit. Your inner light shall guide nations."],"tier":"Rare"},{"name":"Sarutahiko","mythology":"Shinto","symbol":"🌍","represents":["crossroads","guidance","earth"],"messages":["crossroads sees the aura hidden within you and calls it forth. Let nothing dim your sacred fire."],"tier":"Common"},{"name":"Okuninushi","mythology":"Shinto","symbol":"🌍","represents":["nation-building","farming","medicine"],"messages":["The Earth sings the song of nation-building, and you alone can hear its devotion."],"tier":"Common"},{"name":"Takemikazuchi","mythology":"Shinto","symbol":"⚔️","represents":["thunder","swords","martial arts"],"messages":["The Metal of thunder purifies your spirit, leaving only truth."],"tier":"Common"},{"name":"Toyotama-hime","mythology":"Shinto","symbol":"🌊","represents":["sea","beauty","dragon princess"],"messages":["The Water speaks through sea, carrying a message of clarity for you."],"tier":"Uncommon"},{"name":"Konohanasakuya-hime","mythology":"Shinto","symbol":"🔥","represents":["cherry blossoms","volcanoes","beauty"],"messages":["Your soul mirrors the blessing of cherry blossoms. Your legacy shall echo through generations."],"tier":"Common"},{"name":"Iwanaga-hime","mythology":"Shinto","symbol":"🌍","represents":["rock","longevity","endurance"],"messages":["The energy of ages past flows through rock into your being. Embrace the magnificent being you are."],"tier":"Uncommon"},{"name":"Kagutsuchi","mythology":"Shinto","symbol":"🔥","represents":["fire","destruction","forge"],"messages":["Let the fortitude of fire guide your steps toward lasting peace."],"tier":"Common"},{"name":"Suijin","mythology":"Shinto","symbol":"🌊","represents":["water","rivers","fishing"],"messages":["Sacred echo flows from water to illuminate your journey. Transformation awaits at every crossroad."],"tier":"Uncommon"},{"name":"Tenjin","mythology":"Shinto","symbol":"🌬","represents":["scholarship","learning","calligraphy"],"messages":["In the presence of scholarship, even shadows become patience."],"tier":"Common"},{"name":"Kannon","mythology":"Buddhism/Shinto","symbol":"🌊","represents":["compassion","mercy","salvation"],"messages":["The Water speaks through compassion, carrying a message of tenacity for you."],"tier":"Common"},{"name":"Jizo","mythology":"Buddhism/Shinto","symbol":"🌍","represents":["children","travelers","protection"],"messages":["The ancient pact of children awakens, blessing you with purity. Walk forward with unshakable confidence."],"tier":"Uncommon"},{"name":"Fudo Myoo","mythology":"Buddhism/Shinto","symbol":"🔥","represents":["immovable wisdom","fire","protection"],"messages":["Under the gaze of immovable wisdom, your path illuminates with resilience."],"tier":"Common"},{"name":"Amida","mythology":"Buddhism/Shinto","symbol":"🔥","represents":["infinite light","pure land","compassion"],"messages":["You carry the song of infinite light. Stand tall in your divine inheritance."],"tier":"Common"},{"name":"Kisshoten","mythology":"Buddhism/Shinto","symbol":"🌊","represents":["beauty","happiness","fertility"],"messages":["You are wrapped in the grace of beauty, shielded and empowered."],"tier":"Common"},{"name":"Emma-O","mythology":"Buddhism/Shinto","symbol":"🌍","represents":["underworld judge","justice","death"],"messages":["In the presence of underworld judge, even shadows become brilliance."],"tier":"Common"},{"name":"Uzume","mythology":"Shinto","symbol":"🔥","represents":["happiness","dance","dawn"],"messages":["clarity descends like starlight from happiness. Your path is blessed."],"tier":"Common"},{"name":"Omoikane","mythology":"Shinto","symbol":"🌬","represents":["wisdom","intelligence","thought"],"messages":["Through wisdom, you discover the bond that transforms all it touches."],"tier":"Common"},{"name":"Takeminakata","mythology":"Shinto","symbol":"🌊","represents":["wind","water","hunt","agriculture"],"messages":["When Water meets strength, ancient doors open to reveal new worlds."],"tier":"Common"},{"name":"Ninigi","mythology":"Shinto","symbol":"🌍","represents":["rice","prosperity","divine descent"],"messages":["In the presence of rice, even shadows become clarity."],"tier":"Common"},{"name":"Suseri-hime","mythology":"Shinto","symbol":"🌍","represents":["trials","persistence","love"],"messages":["Like a river from trials, brilliance carves new paths through your life."],"tier":"Uncommon"},{"name":"Otohime","mythology":"Shinto","symbol":"🌊","represents":["sea palace","beauty","enchantment"],"messages":["A sacred resonance binds you to sea palace. Rise and claim your destiny."],"tier":"Rare"},{"name":"Yamato-takeru","mythology":"Shinto","symbol":"⚔️","represents":["valor","war","tragedy"],"messages":["Your soul mirrors the flame of valor. Abundance flows to you from every direction."],"tier":"Uncommon"},{"name":"Tamayori-hime","mythology":"Shinto","symbol":"🌊","represents":["spirit medium","dragon daughter"],"messages":["Through the portal of spirit medium, infinite devotion awaits your embrace."],"tier":"Common"},{"name":"Ugajin","mythology":"Shinto","symbol":"🌍","represents":["harvest","fertility","snakes"],"messages":["You stand at the crossroads of harvest and purity. Both claim you as their own."],"tier":"Uncommon"},{"name":"Shinatsuhiko","mythology":"Shinto","symbol":"🌬","represents":["wind","breath","passages"],"messages":["Where others see darkness, wind grants you the sight of radiance."],"tier":"Rare"},{"name":"Wakahirume","mythology":"Shinto","symbol":"🔥","represents":["weaving","dawn sun","service"],"messages":["Ancient pulse stirs within as weaving recognizes your worth."],"tier":"Uncommon"},{"name":"Ama-no-Minakanushi","mythology":"Shinto","symbol":"🌬","represents":["universe center","creation","source"],"messages":["The Air within you aligns with universe center, creating unstoppable harmony."],"tier":"Rare"},{"name":"Takamimusubi","mythology":"Shinto","symbol":"🔥","represents":["divine creation","productivity"],"messages":["Let the brilliance of divine creation guide your steps toward triumphant renewal."],"tier":"Uncommon"},{"name":"Kamimusubi","mythology":"Shinto","symbol":"🌍","represents":["divine creation","growth","birth"],"messages":["You are wrapped in the grace of divine creation, shielded and empowered."],"tier":"Uncommon"},{"name":"Oyamatsumi","mythology":"Shinto","symbol":"🌍","represents":["mountains","sea","war"],"messages":["The ancient pact of mountains awakens, blessing you with insight. Nothing can diminish the light within you."],"tier":"Uncommon"},{"name":"Watatsumi","mythology":"Shinto","symbol":"🌊","represents":["sea","tides","depth"],"messages":["The essence of sea resonates in your heart, granting abundance beyond measure."],"tier":"Common"},{"name":"Tsukihime","mythology":"Shinto","symbol":"🌊","represents":["moon maiden","beauty","reflection"],"messages":["The Water of moon maiden purifies your spirit, leaving only harmony."],"tier":"Uncommon"},{"name":"Kotoamatsukami","mythology":"Shinto","symbol":"🌬","represents":["heavenly","distinguished","first"],"messages":["The essence of heavenly resonates in your heart, granting insight beyond measure."],"tier":"Common"},{"name":"Kukurihime","mythology":"Shinto","symbol":"🌊","represents":["mediation","boundaries","purification"],"messages":["From mediation's realm, a gift of brilliance descends upon you now."],"tier":"Common"},{"name":"Amatsu-Mikaboshi","mythology":"Shinto","symbol":"🔥","represents":["stars","night","chaos"],"messages":["Embrace the flame of stars, for it is the key to your transformation."],"tier":"Rare"},{"name":"Kuebiko","mythology":"Shinto","symbol":"🌍","represents":["knowledge","agriculture","scarecrow"],"messages":["Sacred breath flows from knowledge to illuminate your journey. Joy and fulfillment are your sacred inheritance."],"tier":"Rare"},{"name":"Uke Mochi","mythology":"Shinto","symbol":"🌍","represents":["food","agriculture","nourishment"],"messages":["The blessing of ages past flows through food into your being. Rise and claim your destiny."],"tier":"Common"},{"name":"Ama-Tsu-Mara","mythology":"Shinto","symbol":"⚔️","represents":["smithing","metalwork","craft"],"messages":["The tide of smithing is your shield and your compass. Trust it."],"tier":"Common"},{"name":"Futodama","mythology":"Shinto","symbol":"🌬","represents":["divination","ritual","offerings"],"messages":["Your connection to divination deepens with each breath. Transformation awaits at every crossroad."],"tier":"Rare"},{"name":"Koyane","mythology":"Shinto","symbol":"🌬","represents":["prayer","rituals","liturgy"],"messages":["The veil between worlds thins near prayer, revealing insight within you."],"tier":"Rare"},{"name":"Omizunu","mythology":"Shinto","symbol":"🌊","represents":["water","rivers","irrigation"],"messages":["The eternal light of water flows unbroken through your lineage."],"tier":"Common"},{"name":"Mihashira","mythology":"Shinto","symbol":"🌍","represents":["three pillars","sacred","foundation"],"messages":["The cosmic thread of three pillars weaves power into your destiny."],"tier":"Common"},{"name":"Yatagarasu","mythology":"Shinto","symbol":"🔥","represents":["guidance","sun","three-legged crow"],"messages":["The essence that shaped guidance now shapes your future. Your legacy shall echo through generations."],"tier":"Uncommon"},{"name":"Komainu","mythology":"Shinto","symbol":"🌍","represents":["protection","temple","lion-dog"],"messages":["When the world trembles, protection holds you steady with harmony."],"tier":"Common"},{"name":"Shimenawa","mythology":"Shinto","symbol":"🌿","represents":["sacred rope","boundary","purity"],"messages":["You stand at the crossroads of sacred rope and radiance. Both claim you as their own."],"tier":"Uncommon"},{"name":"Kamado","mythology":"Shinto","symbol":"🔥","represents":["hearth","kitchen","fire"],"messages":["When Fire meets tenacity, your deepest wishes begin to manifest."],"tier":"Rare"},{"name":"Dosojin","mythology":"Shinto","symbol":"🌍","represents":["travelers","boundaries","roads"],"messages":["The veil between worlds thins near travelers, revealing abundance within you."],"tier":"Uncommon"},{"name":"Toshigami","mythology":"Shinto","symbol":"🌍","represents":["new year","harvest","ancestors"],"messages":["Your connection to new year deepens with each breath. Every challenge becomes a stepping stone to greatness."],"tier":"Rare"},{"name":"Yamanokami","mythology":"Shinto","symbol":"🌍","represents":["mountain","hunting","forestry"],"messages":["The Earth within you aligns with mountain, creating unstoppable power."],"tier":"Rare"},{"name":"Mizuchi","mythology":"Shinto","symbol":"🌊","represents":["river dragon","water","flood"],"messages":["The Water within you aligns with river dragon, creating unstoppable purity."],"tier":"Common"},{"name":"Nai-no-Kami","mythology":"Shinto","symbol":"🌍","represents":["earthquake","underworld","tremor"],"messages":["The veil between worlds thins near earthquake, revealing purity within you."],"tier":"Uncommon"},{"name":"Ogetsu-hime","mythology":"Shinto","symbol":"🌍","represents":["food","five grains","nourishment"],"messages":["You carry the aura of food. Stand tall in your divine inheritance."],"tier":"Uncommon"},{"name":"Ama-no-Tajikarao","mythology":"Shinto","symbol":"⚔️","represents":["strength","power","heavenly hand"],"messages":["Between earth and sky, strength plants the seed of courage in your soul."],"tier":"Common"},{"name":"Futsunushi","mythology":"Shinto","symbol":"⚔️","represents":["swords","lightning","conquest"],"messages":["Through swords, you discover the glow that transforms all it touches."],"tier":"Rare"},{"name":"Ajisukitakahikone","mythology":"Shinto","symbol":"🌬","represents":["thunder","agriculture","light"],"messages":["Between earth and sky, thunder plants the seed of insight in your soul."],"tier":"Common"},{"name":"Taka-Okami","mythology":"Shinto","symbol":"🌊","represents":["rain","mountain dragon","water"],"messages":["The sacred fires of rain forge within you an unbreakable strength."],"tier":"Uncommon"},{"name":"Kura-Okami","mythology":"Shinto","symbol":"🌊","represents":["snow","rain","darkness dragon"],"messages":["Like a river from snow, truth carves new paths through your life."],"tier":"Rare"},{"name":"Hayatama","mythology":"Shinto","symbol":"🌬","represents":["speed","spittle","purification"],"messages":["The veil between worlds thins near speed, revealing fortitude within you."],"tier":"Common"},{"name":"Kotoshironushi","mythology":"Shinto","symbol":"🌊","represents":["oracles","fishing","Ebisu origin"],"messages":["The veil between worlds thins near oracles, revealing purity within you."],"tier":"Common"},{"name":"Shiko-me","mythology":"Shinto","symbol":"🌍","represents":["ugly woman","underworld","pursuit"],"messages":["The ancient light of ugly woman awakens within your spirit. Joy and fulfillment are your sacred inheritance."],"tier":"Common"},{"name":"Oshiho-mimi","mythology":"Shinto","symbol":"🌍","represents":["rice ears","divine prince","descent"],"messages":["From the depths of rice ears, fortitude rises to meet your spirit. Your time of awakening has come."],"tier":"Common"},{"name":"Ho-Musubi","mythology":"Shinto","symbol":"🔥","represents":["fire starter","flame","warmth"],"messages":["The cosmic thread of fire starter weaves grace into your destiny."],"tier":"Rare"},{"name":"Kuraokami","mythology":"Shinto","symbol":"🌊","represents":["dark rain","valley dragon","water"],"messages":["Like a river from dark rain, truth carves new paths through your life."],"tier":"Rare"},{"name":"Sukunabikona","mythology":"Shinto","symbol":"🌊","represents":["medicine","hot springs","tiny god"],"messages":["The essence of medicine is your shield and your compass. Trust it."],"tier":"Uncommon"},{"name":"Kamui Fuchi","mythology":"Ainu","symbol":"🔥","represents":["hearth","fire","home protection"],"messages":["The spirit of ages past flows through hearth into your being. Nothing can diminish the light within you."],"tier":"Common"},{"name":"Kotan-kor-kamui","mythology":"Ainu","symbol":"🌬","represents":["village protector","owl","wisdom"],"messages":["You carry the essence of village protector. Walk forward with unshakable confidence."],"tier":"Uncommon"},{"name":"Repun-kamui","mythology":"Ainu","symbol":"🌊","represents":["sea","orca","fishing"],"messages":["sea has marked you with compassion. Embrace this sacred gift."],"tier":"Uncommon"},{"name":"Kim-un-kamui","mythology":"Ainu","symbol":"🌍","represents":["bear","mountain","hunting"],"messages":["Your connection to bear deepens with each breath. The universe conspires to fulfill your purpose."],"tier":"Uncommon"},{"name":"Chikap-kamui","mythology":"Ainu","symbol":"🌬","represents":["owl","night","forest guardian"],"messages":["The glow of owl is your shield and your compass. Trust it."],"tier":"Rare"},{"name":"Ape-fuchi-kamui","mythology":"Ainu","symbol":"🔥","represents":["fire","ancestor","hearth grandmother"],"messages":["fire whispers its secrets to those who seek radiance. You are chosen."],"tier":"Common"},{"name":"Wakka-ush-kamui","mythology":"Ainu","symbol":"🌊","represents":["water","rivers","fresh water"],"messages":["When Water meets grace, a golden path reveals itself beneath your feet."],"tier":"Rare"},{"name":"Shiramba-kamui","mythology":"Ainu","symbol":"🌿","represents":["vegetation","forests","growth"],"messages":["You stand at the crossroads of vegetation and courage. Both claim you as their own."],"tier":"Uncommon"},{"name":"Hashinau-uk-kamui","mythology":"Ainu","symbol":"🌍","represents":["hunting","fortune","blessing"],"messages":["The essence of hunting resonates in your heart, granting resilience beyond measure."],"tier":"Rare"},{"name":"Pauchi-kamui","mythology":"Ainu","symbol":"🔥","represents":["madness","disease","possession"],"messages":["The eternal blessing of madness flows unbroken through your lineage."],"tier":"Uncommon"},{"name":"Nusa-kor-kamui","mythology":"Ainu","symbol":"🌬","represents":["altar","spirit","offering"],"messages":["Like a river from altar, brilliance carves new paths through your life."],"tier":"Uncommon"},{"name":"Kinashut-kamui","mythology":"Ainu","symbol":"🌊","represents":["snakes","swamp","transformation"],"messages":["The essence of snakes resonates in your heart, granting purity beyond measure."],"tier":"Common"},{"name":"Urespa-kamui","mythology":"Ainu","symbol":"🌍","represents":["growth","mutual raising","community"],"messages":["When Earth meets devotion, ancient doors open to reveal new worlds."],"tier":"Rare"},{"name":"Toyouke-Omikami","mythology":"Shinto","symbol":"🌍","represents":["food","industry","agriculture"],"messages":["When you call upon food, grace answers without hesitation."],"tier":"Rare"},{"name":"Amenohohi","mythology":"Shinto","symbol":"🌍","represents":["agriculture","silkworm","descent"],"messages":["Where others see darkness, agriculture grants you the sight of radiance."],"tier":"Common"},{"name":"Watatsu-hime","mythology":"Shinto","symbol":"🌊","represents":["sea princess","ocean depth","pearl"],"messages":["From the depths of sea princess, radiance rises to meet your spirit. Your spirit is unconquerable."],"tier":"Uncommon"},{"name":"Tsukuyomi-no-Mikoto","mythology":"Shinto","symbol":"🌊","represents":["night ruler","order","solitude"],"messages":["From the depths of night ruler, insight rises to meet your spirit. Your time of awakening has come."],"tier":"Common"},{"name":"Okitsuhime","mythology":"Shinto","symbol":"🌊","represents":["offshore","fishing","deep ocean blessing"],"messages":["The essence of offshore resonates in your heart, granting brilliance beyond measure."],"tier":"Rare"},{"name":"Haniyasu-hime","mythology":"Shinto","symbol":"🌍","represents":["clay","pottery","earth surface"],"messages":["A sacred song binds you to clay. Let nothing dim your sacred fire."],"tier":"Common"},{"name":"Haniyasu-hiko","mythology":"Shinto","symbol":"🌍","represents":["clay","soil","foundation"],"messages":["The purity of clay flows through you. Abundance flows to you from every direction."],"tier":"Common"},{"name":"Kanayama-hiko","mythology":"Shinto","symbol":"⚔️","represents":["mining","metals","ore"],"messages":["When you call upon mining, power answers without hesitation."],"tier":"Uncommon"},{"name":"Kanayama-hime","mythology":"Shinto","symbol":"⚔️","represents":["metalwork","smelting","craft"],"messages":["The Metal speaks through metalwork, carrying a message of truth for you."],"tier":"Uncommon"},{"name":"Kukunochi","mythology":"Shinto","symbol":"🌿","represents":["trees","wood","forest spirit"],"messages":["The ancient pact of trees awakens, blessing you with insight. Walk forward with unshakable confidence."],"tier":"Common"},{"name":"Jade Emperor","mythology":"Chinese Mythology","symbol":"🌬","represents":["heaven","authority","supreme ruler"],"messages":["From the depths of heaven, tenacity rises to meet your spirit. The universe bends toward your will."],"tier":"Mythic"},{"name":"Queen Mother of the West","mythology":"Chinese Mythology","symbol":"🌊","represents":["immortality","paradise","peach"],"messages":["The blessing that shaped immortality now shapes your future. Every challenge becomes a stepping stone to greatness."],"tier":"Rare"},{"name":"Guanyin","mythology":"Chinese Buddhism","symbol":"🌊","represents":["mercy","compassion","salvation"],"messages":["The Water within you aligns with mercy, creating unstoppable truth."],"tier":"Legendary"},{"name":"Sun Wukong","mythology":"Chinese Mythology","symbol":"⚔️","represents":["mischief","power","transformation"],"messages":["The Metal of mischief dances through your veins. Let nothing dim your sacred fire."],"tier":"Legendary"},{"name":"Nezha","mythology":"Chinese Mythology","symbol":"🔥","represents":["protection","youth","rebellion"],"messages":["Your soul mirrors the spirit of protection. Every challenge becomes a stepping stone to greatness."],"tier":"Epic"},{"name":"Dragon King","mythology":"Chinese Mythology","symbol":"🌊","represents":["sea","rain","dragons","power"],"messages":["The ancient pact of sea awakens, blessing you with strength. Your spirit is unconquerable."],"tier":"Legendary"},{"name":"Chang'e","mythology":"Chinese Mythology","symbol":"🌊","represents":["moon","beauty","immortality"],"messages":["The eternal song of moon flows unbroken through your lineage."],"tier":"Legendary"},{"name":"Houyi","mythology":"Chinese Mythology","symbol":"🔥","represents":["archery","sun","heroism"],"messages":["archery has marked you with strength. Embrace this sacred gift."],"tier":"Epic"},{"name":"Erlang Shen","mythology":"Chinese Mythology","symbol":"⚔️","represents":["truth","third eye","warrior"],"messages":["Where truth touches the earth, purity blossoms. So it is with you."],"tier":"Epic"},{"name":"Zhong Kui","mythology":"Chinese Mythology","symbol":"⚔️","represents":["demon queller","protection","justice"],"messages":["Under the gaze of demon queller, your path illuminates with brilliance."],"tier":"Common"},{"name":"Mazu","mythology":"Chinese Mythology","symbol":"🌊","represents":["sea","navigation","fishermen"],"messages":["sea has marked you with brilliance. Embrace this sacred gift."],"tier":"Rare"},{"name":"Guan Yu","mythology":"Chinese Mythology","symbol":"⚔️","represents":["war","loyalty","righteousness"],"messages":["war sees the resonance hidden within you and calls it forth. Your spirit is unconquerable."],"tier":"Epic"},{"name":"Caishen","mythology":"Chinese Mythology","symbol":"⚔️","represents":["wealth","prosperity","fortune"],"messages":["The cosmic thread of wealth weaves purity into your destiny."],"tier":"Epic"},{"name":"Zao Jun","mythology":"Chinese Mythology","symbol":"🔥","represents":["kitchen","family","report to heaven"],"messages":["In kitchen's light, your breath shines with renewed purpose."],"tier":"Common"},{"name":"Tu Di Gong","mythology":"Chinese Mythology","symbol":"🌍","represents":["earth","locality","agriculture"],"messages":["You stand at the crossroads of earth and compassion. Both claim you as their own."],"tier":"Uncommon"},{"name":"Menshen","mythology":"Chinese Mythology","symbol":"⚔️","represents":["door guardians","protection"],"messages":["The aura that shaped door guardians now shapes your future. The universe conspires to fulfill your purpose."],"tier":"Rare"},{"name":"Lei Gong","mythology":"Chinese Mythology","symbol":"🌬","represents":["thunder","punishment","justice"],"messages":["The essence of thunder resonates in your heart, granting harmony beyond measure."],"tier":"Rare"},{"name":"Dian Mu","mythology":"Chinese Mythology","symbol":"🔥","represents":["lightning","mirrors","flash"],"messages":["The flame of lightning is your shield and your compass. Trust it."],"tier":"Uncommon"},{"name":"Feng Bo","mythology":"Chinese Mythology","symbol":"🌬","represents":["wind","goatskin bag","storms"],"messages":["The Air of wind dances through your veins. Your spirit is unconquerable."],"tier":"Uncommon"},{"name":"Yu Shi","mythology":"Chinese Mythology","symbol":"🌊","represents":["rain","agriculture","clouds"],"messages":["The veil between worlds thins near rain, revealing resilience within you."],"tier":"Common"},{"name":"Nuwa","mythology":"Chinese Mythology","symbol":"🌍","represents":["creation","humanity","repair of heaven"],"messages":["A sacred energy binds you to creation. Your time of awakening has come."],"tier":"Mythic"},{"name":"Fuxi","mythology":"Chinese Mythology","symbol":"🌊","represents":["civilization","trigrams","fishing"],"messages":["The Water of civilization purifies your spirit, leaving only devotion."],"tier":"Epic"},{"name":"Shennong","mythology":"Chinese Mythology","symbol":"🌍","represents":["agriculture","medicine","herbs"],"messages":["The Earth of agriculture purifies your spirit, leaving only fortitude."],"tier":"Rare"},{"name":"Huangdi","mythology":"Chinese Mythology","symbol":"🌍","represents":["civilization","war","Yellow Emperor"],"messages":["The spirit of civilization is your shield and your compass. Trust it."],"tier":"Epic"},{"name":"Yan Emperor","mythology":"Chinese Mythology","symbol":"🔥","represents":["fire","agriculture","medicine"],"messages":["The Fire speaks through fire, carrying a message of clarity for you."],"tier":"Uncommon"},{"name":"Pangu","mythology":"Chinese Mythology","symbol":"🌍","represents":["creation","chaos","cosmic egg"],"messages":["When Earth meets insight, a golden path reveals itself beneath your feet."],"tier":"Mythic"},{"name":"Xiwangmu","mythology":"Chinese Mythology","symbol":"⚔️","represents":["immortality","tigers","west"],"messages":["Like a river from immortality, courage carves new paths through your life."],"tier":"Common"},{"name":"Doumu","mythology":"Chinese Mythology","symbol":"🔥","represents":["stars","north star","mother of stars"],"messages":["The eternal flame of stars flows unbroken through your lineage."],"tier":"Rare"},{"name":"Zhenwu","mythology":"Chinese Mythology","symbol":"🌊","represents":["north","water","martial arts"],"messages":["Your connection to north deepens with each breath. The doors of opportunity swing wide before you."],"tier":"Epic"},{"name":"Wenchang Wang","mythology":"Chinese Mythology","symbol":"🌬","represents":["literature","exam","scholarship"],"messages":["Between earth and sky, literature plants the seed of serenity in your soul."],"tier":"Rare"},{"name":"Lu Dongbin","mythology":"Chinese Mythology","symbol":"⚔️","represents":["swordsmanship","healing","scholar"],"messages":["swordsmanship whispers its secrets to those who seek clarity. You are chosen."],"tier":"Common"},{"name":"He Xiangu","mythology":"Chinese Mythology","symbol":"🌊","represents":["lotus","purity","immortality"],"messages":["A sacred flame binds you to lotus. Your time of awakening has come."],"tier":"Common"},{"name":"Zhang Guolao","mythology":"Chinese Mythology","symbol":"🌍","represents":["longevity","donkey","magic"],"messages":["The ancient energy of longevity awakens within your spirit. The universe conspires to fulfill your purpose."],"tier":"Uncommon"},{"name":"Lan Caihe","mythology":"Chinese Mythology","symbol":"🌿","represents":["flowers","wandering","ambiguity"],"messages":["Through flowers, you discover the breath that transforms all it touches."],"tier":"Common"},{"name":"Han Xiangzi","mythology":"Chinese Mythology","symbol":"🌬","represents":["music","flute","nature"],"messages":["Sacred tide flows from music to illuminate your journey. Joy and fulfillment are your sacred inheritance."],"tier":"Uncommon"},{"name":"Cao Guojiu","mythology":"Chinese Mythology","symbol":"⚔️","represents":["theater","nobility","repentance"],"messages":["Sacred glow flows from theater to illuminate your journey. Great fortune awaits those who walk this path."],"tier":"Uncommon"},{"name":"Li Tieguai","mythology":"Chinese Mythology","symbol":"⚔️","represents":["medicine","iron crutch","healing"],"messages":["The Metal of medicine dances through your veins. Nothing can diminish the light within you."],"tier":"Common"},{"name":"Zhongli Quan","mythology":"Chinese Mythology","symbol":"🔥","represents":["fan","alchemy","military"],"messages":["The echo of fan is your shield and your compass. Trust it."],"tier":"Uncommon"},{"name":"Yanluo Wang","mythology":"Chinese Mythology","symbol":"🌍","represents":["underworld king","judgment","death"],"messages":["The glow of ages past flows through underworld king into your being. The universe bends toward your will."],"tier":"Rare"},{"name":"Meng Po","mythology":"Chinese Mythology","symbol":"🌊","represents":["forgetfulness","tea","reincarnation"],"messages":["forgetfulness whispers its secrets to those who seek devotion. You are chosen."],"tier":"Common"},{"name":"Ox-Head","mythology":"Chinese Mythology","symbol":"🌍","represents":["underworld guard","strength"],"messages":["You are the living testament of underworld guard's spark. The universe bends toward your will."],"tier":"Uncommon"},{"name":"Horse-Face","mythology":"Chinese Mythology","symbol":"🔥","represents":["underworld guard","speed"],"messages":["The sacred fires of underworld guard forge within you an unbreakable brilliance."],"tier":"Rare"},{"name":"Black Guard","mythology":"Chinese Mythology","symbol":"⚔️","represents":["escort","death","chains"],"messages":["From escort's realm, a gift of patience descends upon you now."],"tier":"Rare"},{"name":"White Guard","mythology":"Chinese Mythology","symbol":"🌬","represents":["escort","death","soul"],"messages":["Between earth and sky, escort plants the seed of abundance in your soul."],"tier":"Common"},{"name":"Zhu Rong","mythology":"Chinese Mythology","symbol":"🔥","represents":["fire","south","passion"],"messages":["The cosmic thread of fire weaves resilience into your destiny."],"tier":"Rare"},{"name":"Gong Gong","mythology":"Chinese Mythology","symbol":"🌊","represents":["water","floods","destruction"],"messages":["Let the radiance of water guide your steps toward divine purpose."],"tier":"Rare"},{"name":"Xuan Nu","mythology":"Chinese Mythology","symbol":"🔥","represents":["war","sex","strategy"],"messages":["The Fire speaks through war, carrying a message of truth for you."],"tier":"Common"},{"name":"Bi Fang","mythology":"Chinese Mythology","symbol":"🔥","represents":["fire bird","one-legged","omens"],"messages":["When the world trembles, fire bird holds you steady with brilliance."],"tier":"Uncommon"},{"name":"Qilin","mythology":"Chinese Mythology","symbol":"🌍","represents":["benevolence","prosperity","good omen"],"messages":["The current of benevolence is your shield and your compass. Trust it."],"tier":"Common"},{"name":"Fenghuang","mythology":"Chinese Mythology","symbol":"🔥","represents":["phoenix","virtue","grace"],"messages":["When you call upon phoenix, clarity answers without hesitation."],"tier":"Common"},{"name":"Bai Ze","mythology":"Chinese Mythology","symbol":"🌬","represents":["knowledge","supernatural","protection"],"messages":["From the depths of knowledge, strength rises to meet your spirit. Your time of awakening has come."],"tier":"Uncommon"},{"name":"Pixiu","mythology":"Chinese Mythology","symbol":"⚔️","represents":["wealth","protection","fortune"],"messages":["wealth sees the light hidden within you and calls it forth. The universe bends toward your will."],"tier":"Common"},{"name":"Taotie","mythology":"Chinese Mythology","symbol":"🌍","represents":["gluttony","mystery","ancient"],"messages":["Your connection to gluttony deepens with each breath. Abundance flows to you from every direction."],"tier":"Uncommon"},{"name":"Hundun","mythology":"Chinese Mythology","symbol":"🌬","represents":["chaos","formlessness","primordial"],"messages":["Embrace the spirit of chaos, for it is the key to your transformation."],"tier":"Common"},{"name":"Nuba","mythology":"Chinese Mythology","symbol":"🔥","represents":["drought","heat","daughter of Huangdi"],"messages":["The whisper of drought carries strength across the ages to find you."],"tier":"Uncommon"},{"name":"Hebo","mythology":"Chinese Mythology","symbol":"🌊","represents":["Yellow River","water","flood"],"messages":["The cosmic thread of Yellow River weaves courage into your destiny."],"tier":"Uncommon"},{"name":"Hou Tu","mythology":"Chinese Mythology","symbol":"🌍","represents":["earth mother","soil","underworld"],"messages":["In earth mother's light, your breath shines with renewed purpose."],"tier":"Uncommon"},{"name":"Tai Sui","mythology":"Chinese Mythology","symbol":"🌍","represents":["year star","Jupiter","fortune cycle"],"messages":["The Earth sings the song of year star, and you alone can hear its compassion."],"tier":"Common"},{"name":"Tian Hou","mythology":"Chinese Mythology","symbol":"🌊","represents":["empress of heaven","sea","protection"],"messages":["The sacred fires of empress of heaven forge within you an unbreakable harmony."],"tier":"Uncommon"},{"name":"Cheng Huang","mythology":"Chinese Mythology","symbol":"🌍","represents":["city god","justice","protection"],"messages":["city god sees the echo hidden within you and calls it forth. Your spirit is unconquerable."],"tier":"Rare"},{"name":"Tudi Gong","mythology":"Chinese Mythology","symbol":"🌍","represents":["local earth","wealth","boundaries"],"messages":["You stand at the crossroads of local earth and clarity. Both claim you as their own."],"tier":"Common"},{"name":"Yue Lao","mythology":"Chinese Mythology","symbol":"🔥","represents":["matchmaker","red thread","marriage"],"messages":["Where matchmaker touches the earth, wisdom blossoms. So it is with you."],"tier":"Rare"},{"name":"Sanxing","mythology":"Chinese Mythology","symbol":"🔥","represents":["three stars","fortune","longevity","prosperity"],"messages":["The whisper of three stars carries fortitude across the ages to find you."],"tier":"Common"},{"name":"Tai Yi","mythology":"Chinese Mythology","symbol":"🔥","represents":["supreme unity","stars","primordial"],"messages":["supreme unity sees the song hidden within you and calls it forth. Nothing can diminish the light within you."],"tier":"Common"},{"name":"Xuan Wu","mythology":"Chinese Mythology","symbol":"🌊","represents":["north","turtle-snake","water-dark"],"messages":["When Water meets wisdom, a golden path reveals itself beneath your feet."],"tier":"Common"},{"name":"Qing Long","mythology":"Chinese Mythology","symbol":"🌿","represents":["azure dragon","east","spring"],"messages":["Ancient aura stirs within as azure dragon recognizes your worth."],"tier":"Uncommon"},{"name":"Bai Hu","mythology":"Chinese Mythology","symbol":"⚔️","represents":["white tiger","west","autumn"],"messages":["The Metal of white tiger dances through your veins. Rise and claim your destiny."],"tier":"Uncommon"},{"name":"Zhu Que","mythology":"Chinese Mythology","symbol":"🔥","represents":["vermilion bird","south","summer"],"messages":["Your connection to vermilion bird deepens with each breath. Transformation awaits at every crossroad."],"tier":"Common"},{"name":"Xuan Wu Beast","mythology":"Chinese Mythology","symbol":"🌊","represents":["black tortoise","north","winter"],"messages":["The essence of black tortoise resonates in your heart, granting devotion beyond measure."],"tier":"Common"},{"name":"Yellow Dragon","mythology":"Chinese Mythology","symbol":"🌍","represents":["center","earth","emperor"],"messages":["The Earth within you aligns with center, creating unstoppable clarity."],"tier":"Rare"},{"name":"Ma Wang","mythology":"Chinese Mythology","symbol":"🌍","represents":["horse king","stables","cavalry"],"messages":["horse king crowns you with harmony. Walk boldly into what awaits."],"tier":"Uncommon"},{"name":"Liu Hai","mythology":"Chinese Mythology","symbol":"🌊","represents":["toad","wealth","immortal"],"messages":["You carry the bond of toad. Nothing can diminish the light within you."],"tier":"Common"},{"name":"Ji Gong","mythology":"Chinese Mythology","symbol":"🔥","represents":["eccentric monk","miracles","wine"],"messages":["Between earth and sky, eccentric monk plants the seed of strength in your soul."],"tier":"Rare"},{"name":"Yanshi Tianzun","mythology":"Chinese Mythology","symbol":"🌬","represents":["primordial heaven","Dao","creation"],"messages":["Where primordial heaven touches the earth, wisdom blossoms. So it is with you."],"tier":"Common"},{"name":"Lingbao Tianzun","mythology":"Chinese Mythology","symbol":"🌬","represents":["sacred jewel","scripture","merit"],"messages":["The veil between worlds thins near sacred jewel, revealing strength within you."],"tier":"Rare"},{"name":"Daode Tianzun","mythology":"Chinese Mythology","symbol":"🌬","represents":["virtue","Dao","Laozi deified"],"messages":["Through the portal of virtue, infinite serenity awaits your embrace."],"tier":"Uncommon"},{"name":"Lei Zu","mythology":"Chinese Mythology","symbol":"🌿","represents":["silk","weaving","civilization"],"messages":["Under the gaze of silk, your path illuminates with abundance."],"tier":"Common"},{"name":"Can Nu","mythology":"Chinese Mythology","symbol":"🌿","represents":["silk","silkworm goddess","devotion"],"messages":["The essence of silk resonates in your heart, granting grace beyond measure."],"tier":"Common"},{"name":"He Bo's Wife","mythology":"Chinese Mythology","symbol":"🌊","represents":["river bride","sacrifice","water"],"messages":["The ancient aura of river bride awakens within your spirit. Abundance flows to you from every direction."],"tier":"Uncommon"},{"name":"Lady of Xiang","mythology":"Chinese Mythology","symbol":"🌊","represents":["river spirit","sorrow","bamboo"],"messages":["Your connection to river spirit deepens with each breath. Transformation awaits at every crossroad."],"tier":"Uncommon"},{"name":"Jiutian Xuannu","mythology":"Chinese Mythology","symbol":"🔥","represents":["nine heavens","strategy","war"],"messages":["Embrace the force of nine heavens, for it is the key to your transformation."],"tier":"Common"},{"name":"Bixia Yuanjun","mythology":"Chinese Mythology","symbol":"🌍","represents":["dawn","Mount Tai","fertility"],"messages":["dawn has marked you with patience. Embrace this sacred gift."],"tier":"Common"},{"name":"Songzi Niangniang","mythology":"Chinese Mythology","symbol":"🌍","represents":["children","fertility","birth"],"messages":["The eternal echo of children flows unbroken through your lineage."],"tier":"Common"},{"name":"Tianfei","mythology":"Chinese Mythology","symbol":"🌊","represents":["heavenly consort","navigation","sea"],"messages":["Embrace the tide of heavenly consort, for it is the key to your transformation."],"tier":"Rare"},{"name":"Zhusheng Niangniang","mythology":"Chinese Mythology","symbol":"🌍","represents":["birth","registration","children"],"messages":["The Earth within you aligns with birth, creating unstoppable patience."],"tier":"Common"},{"name":"Xi He","mythology":"Chinese Mythology","symbol":"🔥","represents":["sun chariot","mother of suns","time"],"messages":["You are wrapped in the insight of sun chariot, shielded and empowered."],"tier":"Rare"},{"name":"Changxi","mythology":"Chinese Mythology","symbol":"🌊","represents":["mother of moons","lunar cycle","night"],"messages":["You are the living testament of mother of moons's flame. Let nothing dim your sacred fire."],"tier":"Common"},{"name":"Leizi","mythology":"Chinese Mythology","symbol":"🔥","represents":["lightning goddess","mirror","flash"],"messages":["The Fire of lightning goddess dances through your veins. Let nothing dim your sacred fire."],"tier":"Rare"},{"name":"Wutong Shen","mythology":"Chinese Mythology","symbol":"🌿","represents":["five paths","wealth","danger"],"messages":["Through the portal of five paths, infinite devotion awaits your embrace."],"tier":"Uncommon"},{"name":"Zhong Shan","mythology":"Chinese Mythology","symbol":"🌍","represents":["bell mountain","echoes","stability"],"messages":["From bell mountain's realm, a gift of clarity descends upon you now."],"tier":"Common"},{"name":"Kunlun Queen","mythology":"Chinese Mythology","symbol":"⚔️","represents":["western paradise","jade","immortals"],"messages":["The eternal blessing of western paradise flows unbroken through your lineage."],"tier":"Common"},{"name":"Wen Zhong","mythology":"Chinese Mythology","symbol":"⚔️","represents":["thunder","loyalty","third eye"],"messages":["The Metal speaks through thunder, carrying a message of tenacity for you."],"tier":"Uncommon"},{"name":"Daji","mythology":"Chinese Mythology","symbol":"🔥","represents":["fox spirit","beauty","temptation"],"messages":["The gift of fox spirit is your shield and your compass. Trust it."],"tier":"Uncommon"},{"name":"Jiang Ziya","mythology":"Chinese Mythology","symbol":"🌬","represents":["strategy","fishing","investiture"],"messages":["Sacred essence flows from strategy to illuminate your journey. Joy and fulfillment are your sacred inheritance."],"tier":"Rare"},{"name":"Chi You","mythology":"Chinese Mythology","symbol":"⚔️","represents":["war","weapons","tribal leader"],"messages":["From war's realm, a gift of truth descends upon you now."],"tier":"Rare"},{"name":"Kuafu","mythology":"Chinese Mythology","symbol":"🔥","represents":["giant","sun chase","ambition"],"messages":["Blessed by giant, you walk with tenacity as your eternal companion."],"tier":"Common"},{"name":"Jingwei","mythology":"Chinese Mythology","symbol":"🌊","represents":["perseverance","bird","sea filling"],"messages":["Where others see darkness, perseverance grants you the sight of courage."],"tier":"Common"},{"name":"Nian","mythology":"Chinese Mythology","symbol":"🔥","represents":["new year","fear","fireworks"],"messages":["The Fire within you aligns with new year, creating unstoppable tenacity."],"tier":"Uncommon"},{"name":"Suanni","mythology":"Chinese Mythology","symbol":"🔥","represents":["smoke","incense","guardian"],"messages":["A sacred bond binds you to smoke. Your spirit is unconquerable."],"tier":"Common"},{"name":"Bixi","mythology":"Chinese Mythology","symbol":"🌍","represents":["stone turtle","literature","strength"],"messages":["The Earth of stone turtle purifies your spirit, leaving only radiance."],"tier":"Uncommon"},{"name":"Pulao","mythology":"Chinese Mythology","symbol":"⚔️","represents":["roaring","bells","sound"],"messages":["Blessed by roaring, you walk with serenity as your eternal companion."],"tier":"Rare"},{"name":"Yazi","mythology":"Chinese Mythology","symbol":"⚔️","represents":["killing","weapons","bravery"],"messages":["The pulse that shaped killing now shapes your future. Your legacy shall echo through generations."],"tier":"Uncommon"},{"name":"Chiwen","mythology":"Chinese Mythology","symbol":"🌊","represents":["rain","swallowing","rooftop guardian"],"messages":["In the presence of rain, even shadows become truth."],"tier":"Common"},{"name":"Qiuniu","mythology":"Chinese Mythology","symbol":"🌬","represents":["music","love","melody"],"messages":["You stand at the crossroads of music and compassion. Both claim you as their own."],"tier":"Common"},{"name":"Chaofeng","mythology":"Chinese Mythology","symbol":"🌬","represents":["adventure","risk","roof guardian"],"messages":["The whisper of adventure carries purity across the ages to find you."],"tier":"Rare"},{"name":"Fucanlong","mythology":"Chinese Mythology","symbol":"🌍","represents":["underground treasure","volcano","gems"],"messages":["Let the tenacity of underground treasure guide your steps toward profound transformation."],"tier":"Rare"},{"name":"Odin","mythology":"Norse Mythology","symbol":"🌬","represents":["wisdom","war","death","runes"],"messages":["Like a river from wisdom, resilience carves new paths through your life."],"tier":"Mythic"},{"name":"Thor","mythology":"Norse Mythology","symbol":"🌬","represents":["thunder","strength","protection"],"messages":["Through thunder, you discover the essence that transforms all it touches."],"tier":"Legendary"},{"name":"Freya","mythology":"Norse Mythology","symbol":"🌊","represents":["love","beauty","war","magic"],"messages":["Your soul mirrors the echo of love. The doors of opportunity swing wide before you."],"tier":"Legendary"},{"name":"Freyr","mythology":"Norse Mythology","symbol":"🌍","represents":["fertility","sun","rain","peace"],"messages":["You stand at the crossroads of fertility and harmony. Both claim you as their own."],"tier":"Common"},{"name":"Loki","mythology":"Norse Mythology","symbol":"🔥","represents":["trickery","shape-shifting","chaos"],"messages":["From trickery's realm, a gift of patience descends upon you now."],"tier":"Legendary"},{"name":"Tyr","mythology":"Norse Mythology","symbol":"⚔️","represents":["law","justice","war","honor"],"messages":["The ancient glow of law awakens within your spirit. Peace and prosperity follow in your wake."],"tier":"Epic"},{"name":"Baldur","mythology":"Norse Mythology","symbol":"🔥","represents":["beauty","light","joy","purity"],"messages":["By the grace of beauty, compassion becomes your birthright."],"tier":"Legendary"},{"name":"Frigg","mythology":"Norse Mythology","symbol":"🌬","represents":["motherhood","marriage","prophecy"],"messages":["The veil between worlds thins near motherhood, revealing power within you."],"tier":"Epic"},{"name":"Heimdall","mythology":"Norse Mythology","symbol":"🔥","represents":["watchfulness","light","rainbow bridge"],"messages":["watchfulness whispers its secrets to those who seek truth. You are chosen."],"tier":"Epic"},{"name":"Hel","mythology":"Norse Mythology","symbol":"🌍","represents":["death","underworld","ancestors"],"messages":["You carry the bond of death. Rise and claim your destiny."],"tier":"Epic"},{"name":"Njord","mythology":"Norse Mythology","symbol":"🌊","represents":["sea","wind","wealth","fishing"],"messages":["The mantle of sea is your shield and your compass. Trust it."],"tier":"Uncommon"},{"name":"Skadi","mythology":"Norse Mythology","symbol":"🌍","represents":["winter","mountains","skiing","hunting"],"messages":["You stand at the crossroads of winter and compassion. Both claim you as their own."],"tier":"Uncommon"},{"name":"Idun","mythology":"Norse Mythology","symbol":"🌿","represents":["youth","apples","immortality","spring"],"messages":["Sacred gift flows from youth to illuminate your journey. Every challenge becomes a stepping stone to greatness."],"tier":"Common"},{"name":"Bragi","mythology":"Norse Mythology","symbol":"🌬","represents":["poetry","eloquence","wisdom"],"messages":["In poetry's light, your song shines with renewed purpose."],"tier":"Common"},{"name":"Vidar","mythology":"Norse Mythology","symbol":"🌍","represents":["silence","vengeance","survival"],"messages":["Where others see darkness, silence grants you the sight of devotion."],"tier":"Rare"},{"name":"Vali","mythology":"Norse Mythology","symbol":"🔥","represents":["vengeance","rebirth","archery"],"messages":["A sacred bond binds you to vengeance. Embrace the magnificent being you are."],"tier":"Common"},{"name":"Forseti","mythology":"Norse Mythology","symbol":"🌬","represents":["justice","peace","reconciliation"],"messages":["The ancient bond of justice awakens within your spirit. Your legacy shall echo through generations."],"tier":"Common"},{"name":"Sif","mythology":"Norse Mythology","symbol":"🌍","represents":["earth","harvest","golden hair"],"messages":["The Earth sings the song of earth, and you alone can hear its harmony."],"tier":"Uncommon"},{"name":"Nanna","mythology":"Norse Mythology","symbol":"🌊","represents":["joy","devotion","peace"],"messages":["Through joy, you discover the mantle that transforms all it touches."],"tier":"Common"},{"name":"Eir","mythology":"Norse Mythology","symbol":"🌊","represents":["healing","medicine","mercy"],"messages":["The Water within you aligns with healing, creating unstoppable brilliance."],"tier":"Uncommon"},{"name":"Saga","mythology":"Norse Mythology","symbol":"🌬","represents":["history","storytelling","memory"],"messages":["Let the courage of history guide your steps toward boundless prosperity."],"tier":"Common"},{"name":"Var","mythology":"Norse Mythology","symbol":"🌬","represents":["oaths","agreements","pledges"],"messages":["Under the gaze of oaths, your path illuminates with brilliance."],"tier":"Rare"},{"name":"Vor","mythology":"Norse Mythology","symbol":"🌬","represents":["wisdom","awareness","seeking"],"messages":["Sacred current flows from wisdom to illuminate your journey. Your inner light shall guide nations."],"tier":"Common"},{"name":"Syn","mythology":"Norse Mythology","symbol":"⚔️","represents":["defense","refusal","guarding"],"messages":["The Metal of defense dances through your veins. Walk forward with unshakable confidence."],"tier":"Uncommon"},{"name":"Snotra","mythology":"Norse Mythology","symbol":"🌬","represents":["prudence","wisdom","virtue"],"messages":["Blessed by prudence, you walk with truth as your eternal companion."],"tier":"Uncommon"},{"name":"Gna","mythology":"Norse Mythology","symbol":"🌬","represents":["messages","wind","swift"],"messages":["Let the radiance of messages guide your steps toward infinite compassion."],"tier":"Uncommon"},{"name":"Fulla","mythology":"Norse Mythology","symbol":"🌍","represents":["secrets","abundance","handmaiden"],"messages":["The mantle that shaped secrets now shapes your future. Peace and prosperity follow in your wake."],"tier":"Uncommon"},{"name":"Lofn","mythology":"Norse Mythology","symbol":"🌊","represents":["permission","forbidden love","gentleness"],"messages":["From the depths of permission, resilience rises to meet your spirit. Stand tall in your divine inheritance."],"tier":"Common"},{"name":"Sjofn","mythology":"Norse Mythology","symbol":"🌊","represents":["love","affection","turning minds"],"messages":["love crowns you with compassion. Walk boldly into what awaits."],"tier":"Uncommon"},{"name":"Hlin","mythology":"Norse Mythology","symbol":"🌍","represents":["protection","consolation","mourning"],"messages":["In protection's light, your energy shines with renewed purpose."],"tier":"Rare"},{"name":"Gerd","mythology":"Norse Mythology","symbol":"🌍","represents":["fertility","garden","beauty"],"messages":["Where fertility touches the earth, radiance blossoms. So it is with you."],"tier":"Common"},{"name":"Ran","mythology":"Norse Mythology","symbol":"🌊","represents":["sea","drowning","net","deep ocean"],"messages":["The Water within you aligns with sea, creating unstoppable harmony."],"tier":"Rare"},{"name":"Aegir","mythology":"Norse Mythology","symbol":"🌊","represents":["ocean","brewing","hospitality"],"messages":["The Water speaks through ocean, carrying a message of insight for you."],"tier":"Uncommon"},{"name":"Mimir","mythology":"Norse Mythology","symbol":"🌊","represents":["knowledge","wisdom","memory","well"],"messages":["Like a river from knowledge, radiance carves new paths through your life."],"tier":"Uncommon"},{"name":"Kvasir","mythology":"Norse Mythology","symbol":"🌊","represents":["wisdom","poetry","mead"],"messages":["wisdom has marked you with patience. Embrace this sacred gift."],"tier":"Rare"},{"name":"Ullr","mythology":"Norse Mythology","symbol":"🌍","represents":["hunting","archery","winter","skiing"],"messages":["From the depths of hunting, purity rises to meet your spirit. Rise and claim your destiny."],"tier":"Uncommon"},{"name":"Hodr","mythology":"Norse Mythology","symbol":"🌍","represents":["darkness","winter","blind strength"],"messages":["Ancient mantle stirs within as darkness recognizes your worth."],"tier":"Uncommon"},{"name":"Hermod","mythology":"Norse Mythology","symbol":"🌬","represents":["courage","messenger","underworld journey"],"messages":["When the world trembles, courage holds you steady with fortitude."],"tier":"Rare"},{"name":"Modi","mythology":"Norse Mythology","symbol":"🔥","represents":["courage","wrath","berserker"],"messages":["Ancient song stirs within as courage recognizes your worth."],"tier":"Uncommon"},{"name":"Magni","mythology":"Norse Mythology","symbol":"🌍","represents":["strength","might","future"],"messages":["Your soul mirrors the spark of strength. Every challenge becomes a stepping stone to greatness."],"tier":"Uncommon"},{"name":"Jormungandr","mythology":"Norse Mythology","symbol":"🌊","represents":["world serpent","ocean","doom"],"messages":["Your soul mirrors the pulse of world serpent. Transformation awaits at every crossroad."],"tier":"Epic"},{"name":"Fenrir","mythology":"Norse Mythology","symbol":"🔥","represents":["wolf","destruction","chaos","destiny"],"messages":["You are wrapped in the brilliance of wolf, shielded and empowered."],"tier":"Epic"},{"name":"Surtr","mythology":"Norse Mythology","symbol":"🔥","represents":["fire giant","ragnarok","destruction"],"messages":["The Fire within you aligns with fire giant, creating unstoppable serenity."],"tier":"Epic"},{"name":"Ymir","mythology":"Norse Mythology","symbol":"🌍","represents":["first giant","creation","ice"],"messages":["From the depths of first giant, strength rises to meet your spirit. The universe bends toward your will."],"tier":"Epic"},{"name":"Nidhogg","mythology":"Norse Mythology","symbol":"🌍","represents":["dragon","world tree gnawer","corpse"],"messages":["Embrace the breath of dragon, for it is the key to your transformation."],"tier":"Uncommon"},{"name":"Ratatoskr","mythology":"Norse Mythology","symbol":"🌿","represents":["squirrel","messenger","mischief"],"messages":["Where others see darkness, squirrel grants you the sight of serenity."],"tier":"Common"},{"name":"Huginn","mythology":"Norse Mythology","symbol":"🌬","represents":["thought","raven","wisdom"],"messages":["By the grace of thought, purity becomes your birthright."],"tier":"Common"},{"name":"Muninn","mythology":"Norse Mythology","symbol":"🌬","represents":["memory","raven","knowledge"],"messages":["You are wrapped in the truth of memory, shielded and empowered."],"tier":"Common"},{"name":"Sleipnir","mythology":"Norse Mythology","symbol":"🌬","represents":["eight-legged horse","travel","speed"],"messages":["The essence of eight-legged horse resonates in your heart, granting brilliance beyond measure."],"tier":"Common"},{"name":"Norns","mythology":"Norse Mythology","symbol":"🌊","represents":["fate","past-present-future","destiny"],"messages":["Through the portal of fate, infinite abundance awaits your embrace."],"tier":"Epic"},{"name":"Urd","mythology":"Norse Mythology","symbol":"🌊","represents":["past","fate","what was"],"messages":["Sacred echo flows from past to illuminate your journey. The universe conspires to fulfill your purpose."],"tier":"Rare"},{"name":"Verdandi","mythology":"Norse Mythology","symbol":"🌍","represents":["present","becoming","what is"],"messages":["Between earth and sky, present plants the seed of clarity in your soul."],"tier":"Common"},{"name":"Skuld","mythology":"Norse Mythology","symbol":"🌬","represents":["future","debt","what shall be"],"messages":["The cosmic thread of future weaves compassion into your destiny."],"tier":"Common"},{"name":"Valkyries","mythology":"Norse Mythology","symbol":"⚔️","represents":["chosen slain","battle","warrior maidens"],"messages":["The veil between worlds thins near chosen slain, revealing fortitude within you."],"tier":"Common"},{"name":"Brunhilde","mythology":"Norse Mythology","symbol":"⚔️","represents":["warrior","defiance","love","honor"],"messages":["You stand at the crossroads of warrior and brilliance. Both claim you as their own."],"tier":"Epic"},{"name":"Sigrun","mythology":"Norse Mythology","symbol":"⚔️","represents":["victory","rune","battle maiden"],"messages":["The ancient energy of victory awakens within your spirit. Abundance flows to you from every direction."],"tier":"Uncommon"},{"name":"Gunnr","mythology":"Norse Mythology","symbol":"⚔️","represents":["battle","war","chooser of slain"],"messages":["courage descends like starlight from battle. Your path is blessed."],"tier":"Common"},{"name":"Hildr","mythology":"Norse Mythology","symbol":"🔥","represents":["battle","resurrection","eternal fight"],"messages":["From battle's realm, a gift of grace descends upon you now."],"tier":"Uncommon"},{"name":"Thrud","mythology":"Norse Mythology","symbol":"⚔️","represents":["strength","power","Thor's daughter"],"messages":["The veil between worlds thins near strength, revealing insight within you."],"tier":"Common"},{"name":"Hyrrokkin","mythology":"Norse Mythology","symbol":"🔥","represents":["fire smoke","wolf rider","strength"],"messages":["The ancient spark of fire smoke awakens within your spirit. Abundance flows to you from every direction."],"tier":"Common"},{"name":"Angrboda","mythology":"Norse Mythology","symbol":"🌍","represents":["grief","mother of monsters","sorrow"],"messages":["Like a river from grief, devotion carves new paths through your life."],"tier":"Rare"},{"name":"Bestla","mythology":"Norse Mythology","symbol":"🌊","represents":["motherhood","ice","creation"],"messages":["Through motherhood, you discover the spirit that transforms all it touches."],"tier":"Common"},{"name":"Buri","mythology":"Norse Mythology","symbol":"🌊","represents":["first god","ice","progenitor"],"messages":["The echo of first god is your shield and your compass. Trust it."],"tier":"Uncommon"},{"name":"Borr","mythology":"Norse Mythology","symbol":"🌍","represents":["fatherhood","slaying","creation"],"messages":["Let the strength of fatherhood guide your steps toward unshakable strength."],"tier":"Uncommon"},{"name":"Audhumla","mythology":"Norse Mythology","symbol":"🌊","represents":["nourishment","primordial cow","ice"],"messages":["In the presence of nourishment, even shadows become brilliance."],"tier":"Rare"},{"name":"Dvalin","mythology":"Norse Mythology","symbol":"⚔️","represents":["craftsmanship","runes","smithing"],"messages":["Blessed by craftsmanship, you walk with brilliance as your eternal companion."],"tier":"Common"},{"name":"Andvari","mythology":"Norse Mythology","symbol":"⚔️","represents":["wealth","curse","ring","treasure"],"messages":["Let the truth of wealth guide your steps toward profound transformation."],"tier":"Rare"},{"name":"Wayland","mythology":"Norse Mythology","symbol":"⚔️","represents":["smithing","revenge","craftsmanship"],"messages":["The Metal sings the song of smithing, and you alone can hear its brilliance."],"tier":"Common"},{"name":"Volund","mythology":"Norse Mythology","symbol":"⚔️","represents":["smithing","wings","artisan"],"messages":["Let the brilliance of smithing guide your steps toward triumphant renewal."],"tier":"Common"},{"name":"Elli","mythology":"Norse Mythology","symbol":"🌍","represents":["old age","wrestling","inevitability"],"messages":["old age whispers its secrets to those who seek radiance. You are chosen."],"tier":"Common"},{"name":"Nott","mythology":"Norse Mythology","symbol":"🌊","represents":["night","darkness","grandmother of Thor"],"messages":["When you call upon night, truth answers without hesitation."],"tier":"Common"},{"name":"Dagr","mythology":"Norse Mythology","symbol":"🔥","represents":["day","light","radiance"],"messages":["Under the gaze of day, your path illuminates with insight."],"tier":"Uncommon"},{"name":"Sol Norse","mythology":"Norse Mythology","symbol":"🔥","represents":["sun","chariot","light"],"messages":["Sacred resonance flows from sun to illuminate your journey. Every challenge becomes a stepping stone to greatness."],"tier":"Common"},{"name":"Mani","mythology":"Norse Mythology","symbol":"🌊","represents":["moon","time","night sky"],"messages":["The essence of moon resonates in your heart, granting patience beyond measure."],"tier":"Common"},{"name":"Hati","mythology":"Norse Mythology","symbol":"🌊","represents":["wolf","moon chaser","eclipse"],"messages":["From the depths of wolf, strength rises to meet your spirit. The cosmos celebrates your existence."],"tier":"Common"},{"name":"Skoll","mythology":"Norse Mythology","symbol":"🔥","represents":["wolf","sun chaser","pursuit"],"messages":["The ancient pact of wolf awakens, blessing you with brilliance. Walk forward with unshakable confidence."],"tier":"Rare"},{"name":"Byggvir","mythology":"Norse Mythology","symbol":"🌍","represents":["barley","brewing","servant"],"messages":["The light of barley is your shield and your compass. Trust it."],"tier":"Rare"},{"name":"Beyla","mythology":"Norse Mythology","symbol":"🌍","represents":["bees","honey","earth"],"messages":["Through the portal of bees, infinite serenity awaits your embrace."],"tier":"Common"},{"name":"Hoenir","mythology":"Norse Mythology","symbol":"🌬","represents":["silence","spirit","creation"],"messages":["silence has marked you with compassion. Embrace this sacred gift."],"tier":"Common"},{"name":"Lodurr","mythology":"Norse Mythology","symbol":"🔥","represents":["warmth","appearance","blood","vitality"],"messages":["Sacred song flows from warmth to illuminate your journey. Joy and fulfillment are your sacred inheritance."],"tier":"Rare"},{"name":"Gefjon","mythology":"Norse Mythology","symbol":"🌍","represents":["plowing","fertility","virgins"],"messages":["The veil between worlds thins near plowing, revealing fortitude within you."],"tier":"Rare"},{"name":"Idunn","mythology":"Norse Mythology","symbol":"🌿","represents":["rejuvenation","golden apples","eternal youth"],"messages":["Through rejuvenation, you discover the current that transforms all it touches."],"tier":"Common"},{"name":"Kvasir Norse","mythology":"Norse Mythology","symbol":"🌊","represents":["mead of poetry","knowledge","peace"],"messages":["Blessed by mead of poetry, you walk with courage as your eternal companion."],"tier":"Common"},{"name":"Jord","mythology":"Norse Mythology","symbol":"🌍","represents":["earth","Thor's mother","ground"],"messages":["Where earth touches the earth, radiance blossoms. So it is with you."],"tier":"Uncommon"},{"name":"Grid","mythology":"Norse Mythology","symbol":"🌍","represents":["peace","giantess","magical belt"],"messages":["The whisper of peace carries grace across the ages to find you."],"tier":"Rare"},{"name":"Ran Norse","mythology":"Norse Mythology","symbol":"🌊","represents":["net","drowned souls","ocean depths"],"messages":["Blessed by net, you walk with truth as your eternal companion."],"tier":"Common"},{"name":"Ra","mythology":"Egyptian Mythology","symbol":"🔥","represents":["sun","creation","king of gods"],"messages":["From sun's realm, a gift of harmony descends upon you now."],"tier":"Mythic"},{"name":"Osiris","mythology":"Egyptian Mythology","symbol":"🌍","represents":["afterlife","resurrection","agriculture"],"messages":["Where afterlife touches the earth, insight blossoms. So it is with you."],"tier":"Legendary"},{"name":"Isis","mythology":"Egyptian Mythology","symbol":"🌊","represents":["magic","motherhood","healing"],"messages":["When you call upon magic, clarity answers without hesitation."],"tier":"Legendary"},{"name":"Horus","mythology":"Egyptian Mythology","symbol":"🌬","represents":["sky","war","protection","falcon"],"messages":["Where others see darkness, sky grants you the sight of strength."],"tier":"Legendary"},{"name":"Set","mythology":"Egyptian Mythology","symbol":"🔥","represents":["chaos","desert","storms","strength"],"messages":["chaos crowns you with harmony. Walk boldly into what awaits."],"tier":"Epic"},{"name":"Anubis","mythology":"Egyptian Mythology","symbol":"🌍","represents":["death","embalming","protection"],"messages":["The Earth of death dances through your veins. Walk forward with unshakable confidence."],"tier":"Legendary"},{"name":"Thoth","mythology":"Egyptian Mythology","symbol":"🌬","represents":["wisdom","writing","moon","magic"],"messages":["The Air of wisdom dances through your veins. Your time of awakening has come."],"tier":"Legendary"},{"name":"Bastet","mythology":"Egyptian Mythology","symbol":"🔥","represents":["cats","home","fertility","protection"],"messages":["You are the living testament of cats's glow. Let nothing dim your sacred fire."],"tier":"Epic"},{"name":"Hathor","mythology":"Egyptian Mythology","symbol":"🌊","represents":["love","beauty","music","dance"],"messages":["When Water meets purity, destiny reshapes itself around your will."],"tier":"Epic"},{"name":"Sekhmet","mythology":"Egyptian Mythology","symbol":"🔥","represents":["war","healing","lion","sun"],"messages":["In the presence of war, even shadows become purity."],"tier":"Epic"},{"name":"Ma'at","mythology":"Egyptian Mythology","symbol":"🌬","represents":["truth","justice","cosmic order"],"messages":["The eternal current of truth flows unbroken through your lineage."],"tier":"Epic"},{"name":"Ptah","mythology":"Egyptian Mythology","symbol":"🌍","represents":["creation","crafts","architecture"],"messages":["creation crowns you with patience. Walk boldly into what awaits."],"tier":"Epic"},{"name":"Nephthys","mythology":"Egyptian Mythology","symbol":"🌊","represents":["mourning","night","temple service"],"messages":["mourning whispers its secrets to those who seek courage. You are chosen."],"tier":"Epic"},{"name":"Sobek","mythology":"Egyptian Mythology","symbol":"🌊","represents":["crocodile","strength","military"],"messages":["From crocodile's realm, a gift of abundance descends upon you now."],"tier":"Epic"},{"name":"Khnum","mythology":"Egyptian Mythology","symbol":"🌍","represents":["potter","creation","Nile source"],"messages":["Under the blessing of potter, your resilience becomes a beacon for others."],"tier":"Common"},{"name":"Atum","mythology":"Egyptian Mythology","symbol":"🔥","represents":["creation","sunset","completion"],"messages":["Through creation, you discover the breath that transforms all it touches."],"tier":"Common"},{"name":"Shu","mythology":"Egyptian Mythology","symbol":"🌬","represents":["air","light","space between earth and sky"],"messages":["Blessed by air, you walk with grace as your eternal companion."],"tier":"Common"},{"name":"Tefnut","mythology":"Egyptian Mythology","symbol":"🌊","represents":["moisture","rain","dew"],"messages":["Like a river from moisture, power carves new paths through your life."],"tier":"Rare"},{"name":"Geb","mythology":"Egyptian Mythology","symbol":"🌍","represents":["earth","fertility","snakes"],"messages":["The sacred fires of earth forge within you an unbreakable truth."],"tier":"Uncommon"},{"name":"Nut","mythology":"Egyptian Mythology","symbol":"🌬","represents":["sky","stars","cosmos"],"messages":["The Air of sky purifies your spirit, leaving only resilience."],"tier":"Rare"},{"name":"Khepri","mythology":"Egyptian Mythology","symbol":"🔥","represents":["sunrise","scarab","rebirth"],"messages":["sunrise has marked you with purity. Embrace this sacred gift."],"tier":"Rare"},{"name":"Amun","mythology":"Egyptian Mythology","symbol":"🌬","represents":["hidden one","wind","creation"],"messages":["The tenacity of hidden one flows through you. Your legacy shall echo through generations."],"tier":"Epic"},{"name":"Mut","mythology":"Egyptian Mythology","symbol":"🌍","represents":["mother","vulture","queen"],"messages":["The ancient pact of mother awakens, blessing you with truth. Your time of awakening has come."],"tier":"Common"},{"name":"Khonsu","mythology":"Egyptian Mythology","symbol":"🌊","represents":["moon","time","healing"],"messages":["A sacred light binds you to moon. Let nothing dim your sacred fire."],"tier":"Common"},{"name":"Min","mythology":"Egyptian Mythology","symbol":"🌍","represents":["fertility","harvest","masculinity"],"messages":["When you call upon fertility, resilience answers without hesitation."],"tier":"Common"},{"name":"Montu","mythology":"Egyptian Mythology","symbol":"🔥","represents":["war","valor","bull","sun"],"messages":["abundance descends like starlight from war. Your path is blessed."],"tier":"Rare"},{"name":"Wepwawet","mythology":"Egyptian Mythology","symbol":"🌬","represents":["war","pathfinder","funerary"],"messages":["courage descends like starlight from war. Your path is blessed."],"tier":"Rare"},{"name":"Neith","mythology":"Egyptian Mythology","symbol":"⚔️","represents":["war","hunting","weaving","wisdom"],"messages":["You carry the energy of war. Your spirit is unconquerable."],"tier":"Common"},{"name":"Wadjet","mythology":"Egyptian Mythology","symbol":"🔥","represents":["cobra","protection","Lower Egypt"],"messages":["The whisper of cobra carries resilience across the ages to find you."],"tier":"Common"},{"name":"Nekhbet","mythology":"Egyptian Mythology","symbol":"🌬","represents":["vulture","protection","Upper Egypt"],"messages":["The Air within you aligns with vulture, creating unstoppable tenacity."],"tier":"Uncommon"},{"name":"Serqet","mythology":"Egyptian Mythology","symbol":"🌊","represents":["scorpion","healing","protection"],"messages":["The ancient energy of scorpion awakens within your spirit. Every challenge becomes a stepping stone to greatness."],"tier":"Uncommon"},{"name":"Mafdet","mythology":"Egyptian Mythology","symbol":"🔥","represents":["justice","execution","feline"],"messages":["The Fire within you aligns with justice, creating unstoppable patience."],"tier":"Uncommon"},{"name":"Aker","mythology":"Egyptian Mythology","symbol":"🌍","represents":["earth","horizon","guardian"],"messages":["From earth's realm, a gift of tenacity descends upon you now."],"tier":"Rare"},{"name":"Ammit","mythology":"Egyptian Mythology","symbol":"🔥","represents":["devourer","judgment","punishment"],"messages":["When Fire meets fortitude, the impossible becomes your reality."],"tier":"Common"},{"name":"Apis","mythology":"Egyptian Mythology","symbol":"🌍","represents":["bull","strength","fertility"],"messages":["The Earth of bull purifies your spirit, leaving only resilience."],"tier":"Common"},{"name":"Bes","mythology":"Egyptian Mythology","symbol":"🔥","represents":["protection","childbirth","home","humor"],"messages":["protection has marked you with power. Embrace this sacred gift."],"tier":"Rare"},{"name":"Taweret","mythology":"Egyptian Mythology","symbol":"🌊","represents":["pregnancy","childbirth","protection"],"messages":["The ancient pact of pregnancy awakens, blessing you with tenacity. Stand tall in your divine inheritance."],"tier":"Rare"},{"name":"Seshat","mythology":"Egyptian Mythology","symbol":"🌬","represents":["writing","wisdom","measurement"],"messages":["The Air sings the song of writing, and you alone can hear its wisdom."],"tier":"Uncommon"},{"name":"Renenutet","mythology":"Egyptian Mythology","symbol":"🌍","represents":["harvest","cobra","nourishment","fate"],"messages":["The Earth speaks through harvest, carrying a message of grace for you."],"tier":"Rare"},{"name":"Hapi","mythology":"Egyptian Mythology","symbol":"🌊","represents":["Nile flood","fertility","abundance"],"messages":["In Nile flood's light, your echo shines with renewed purpose."],"tier":"Common"},{"name":"Satet","mythology":"Egyptian Mythology","symbol":"🌊","represents":["Nile flood","archery","fertility"],"messages":["When Water meets power, destiny reshapes itself around your will."],"tier":"Common"},{"name":"Anuket","mythology":"Egyptian Mythology","symbol":"🌊","represents":["Nile cataracts","gazelle","water"],"messages":["The mantle that shaped Nile cataracts now shapes your future. Every challenge becomes a stepping stone to greatness."],"tier":"Uncommon"},{"name":"Meshkenet","mythology":"Egyptian Mythology","symbol":"🌍","represents":["childbirth","destiny","bricks"],"messages":["The Earth speaks through childbirth, carrying a message of power for you."],"tier":"Common"},{"name":"Heqet","mythology":"Egyptian Mythology","symbol":"🌊","represents":["frog","fertility","birth"],"messages":["The essence of frog resonates in your heart, granting harmony beyond measure."],"tier":"Uncommon"},{"name":"Meretseger","mythology":"Egyptian Mythology","symbol":"🌍","represents":["cobra","silence","protection of tombs"],"messages":["patience descends like starlight from cobra. Your path is blessed."],"tier":"Common"},{"name":"Pakhet","mythology":"Egyptian Mythology","symbol":"🔥","represents":["huntress","lioness","night prowler"],"messages":["When the world trembles, huntress holds you steady with abundance."],"tier":"Common"},{"name":"Amunet","mythology":"Egyptian Mythology","symbol":"🌬","represents":["hidden","air","invisibility"],"messages":["The Air speaks through hidden, carrying a message of radiance for you."],"tier":"Common"},{"name":"Kek","mythology":"Egyptian Mythology","symbol":"🌊","represents":["darkness","chaos","primordial"],"messages":["You are the living testament of darkness's spirit. Stand tall in your divine inheritance."],"tier":"Uncommon"},{"name":"Kauket","mythology":"Egyptian Mythology","symbol":"🌊","represents":["darkness feminine","chaos","primordial"],"messages":["A sacred bond binds you to darkness feminine. Your time of awakening has come."],"tier":"Uncommon"},{"name":"Naunet","mythology":"Egyptian Mythology","symbol":"🌊","represents":["primordial water","feminine","abyss"],"messages":["You stand at the crossroads of primordial water and strength. Both claim you as their own."],"tier":"Common"},{"name":"Heh","mythology":"Egyptian Mythology","symbol":"🌬","represents":["infinity","eternity","endlessness"],"messages":["The Air within you aligns with infinity, creating unstoppable abundance."],"tier":"Rare"},{"name":"Hauhet","mythology":"Egyptian Mythology","symbol":"🌬","represents":["infinity feminine","eternity"],"messages":["The ancient force of infinity feminine awakens within your spirit. Your inner light shall guide nations."],"tier":"Uncommon"},{"name":"Seker","mythology":"Egyptian Mythology","symbol":"🌍","represents":["death","Memphis","falcon"],"messages":["The abundance of death flows through you. Every challenge becomes a stepping stone to greatness."],"tier":"Common"},{"name":"Tatenen","mythology":"Egyptian Mythology","symbol":"🌍","represents":["primordial mound","emerging earth"],"messages":["The Earth speaks through primordial mound, carrying a message of devotion for you."],"tier":"Uncommon"},{"name":"Nehebkau","mythology":"Egyptian Mythology","symbol":"🌊","represents":["two-headed serpent","afterlife","bound"],"messages":["A sacred gift binds you to two-headed serpent. Nothing can diminish the light within you."],"tier":"Common"},{"name":"Mehen","mythology":"Egyptian Mythology","symbol":"🔥","represents":["coiled serpent","protection of Ra"],"messages":["When Fire meets courage, the impossible becomes your reality."],"tier":"Rare"},{"name":"Anat","mythology":"Egyptian Mythology","symbol":"🔥","represents":["war","love","hunt","Semitic"],"messages":["The Fire of war dances through your veins. Stand tall in your divine inheritance."],"tier":"Common"},{"name":"Astarte","mythology":"Egyptian Mythology","symbol":"🌊","represents":["war","horses","sea","Semitic"],"messages":["Through the portal of war, infinite patience awaits your embrace."],"tier":"Rare"},{"name":"Resheph","mythology":"Egyptian Mythology","symbol":"🔥","represents":["plague","war","thunder","Semitic"],"messages":["The ancient pact of plague awakens, blessing you with fortitude. Rise and claim your destiny."],"tier":"Rare"},{"name":"Dedwen","mythology":"Egyptian Mythology","symbol":"🔥","represents":["incense","Nubia","wealth"],"messages":["incense whispers its secrets to those who seek tenacity. You are chosen."],"tier":"Common"},{"name":"Qetesh","mythology":"Egyptian Mythology","symbol":"🌊","represents":["sacred ecstasy","fertility","beauty"],"messages":["sacred ecstasy crowns you with devotion. Walk boldly into what awaits."],"tier":"Uncommon"},{"name":"Ihy","mythology":"Egyptian Mythology","symbol":"🌬","represents":["music","sistrum","joy","child"],"messages":["A sacred current binds you to music. Your spirit is unconquerable."],"tier":"Uncommon"},{"name":"Nefertem","mythology":"Egyptian Mythology","symbol":"🌊","represents":["lotus","perfume","beauty","healing"],"messages":["The ancient pact of lotus awakens, blessing you with purity. The universe bends toward your will."],"tier":"Uncommon"},{"name":"Hu","mythology":"Egyptian Mythology","symbol":"🌬","represents":["authority","divine word","utterance"],"messages":["Your connection to authority deepens with each breath. Your legacy shall echo through generations."],"tier":"Uncommon"},{"name":"Sia","mythology":"Egyptian Mythology","symbol":"🌬","represents":["perception","thought","wisdom"],"messages":["The sacred fires of perception forge within you an unbreakable compassion."],"tier":"Uncommon"},{"name":"Heka","mythology":"Egyptian Mythology","symbol":"🔥","represents":["magic","medicine","divine power"],"messages":["When Fire meets truth, all obstacles dissolve like morning mist."],"tier":"Uncommon"},{"name":"Shezmu","mythology":"Egyptian Mythology","symbol":"🔥","represents":["wine","oil","execution","blood"],"messages":["wine sees the blessing hidden within you and calls it forth. Stand tall in your divine inheritance."],"tier":"Rare"},{"name":"Wosret","mythology":"Egyptian Mythology","symbol":"⚔️","represents":["Theban goddess","war","protection"],"messages":["Blessed by Theban goddess, you walk with patience as your eternal companion."],"tier":"Uncommon"},{"name":"Bat","mythology":"Egyptian Mythology","symbol":"🌊","represents":["cow","heavens","milky way"],"messages":["The sacred fires of cow forge within you an unbreakable clarity."],"tier":"Uncommon"},{"name":"Meret","mythology":"Egyptian Mythology","symbol":"🌬","represents":["singing","rejoicing","treasury"],"messages":["From the depths of singing, clarity rises to meet your spirit. Nothing can diminish the light within you."],"tier":"Common"},{"name":"Tutu","mythology":"Egyptian Mythology","symbol":"🌍","represents":["protection","sphinx","demon ward"],"messages":["The ancient pact of protection awakens, blessing you with insight. The universe bends toward your will."],"tier":"Common"},{"name":"Heryshaf","mythology":"Egyptian Mythology","symbol":"🌊","represents":["creation","ruler of riverbanks","ram"],"messages":["Under the blessing of creation, your brilliance becomes a beacon for others."],"tier":"Rare"},{"name":"Kherty","mythology":"Egyptian Mythology","symbol":"🌊","represents":["ferryman","underworld","ram god"],"messages":["The harmony of ferryman flows through you. Transformation awaits at every crossroad."],"tier":"Common"},{"name":"Sopdu","mythology":"Egyptian Mythology","symbol":"🌬","represents":["sky","stars","eastern frontier"],"messages":["Between earth and sky, sky plants the seed of devotion in your soul."],"tier":"Uncommon"},{"name":"Weneg","mythology":"Egyptian Mythology","symbol":"🌍","represents":["cosmic order","sky pillar","support"],"messages":["When you call upon cosmic order, patience answers without hesitation."],"tier":"Rare"},{"name":"Mandulis","mythology":"Egyptian Mythology","symbol":"🔥","represents":["sun","youth","Nubian solar god"],"messages":["The cosmic thread of sun weaves clarity into your destiny."],"tier":"Common"},{"name":"Quetzalcoatl","mythology":"Aztec Mythology","symbol":"🌬","represents":["feathered serpent","wind","knowledge"],"messages":["From the depths of feathered serpent, radiance rises to meet your spirit. Let nothing dim your sacred fire."],"tier":"Mythic"},{"name":"Tezcatlipoca","mythology":"Aztec Mythology","symbol":"🔥","represents":["night","sorcery","jaguar","conflict"],"messages":["The Fire within you aligns with night, creating unstoppable serenity."],"tier":"Epic"},{"name":"Huitzilopochtli","mythology":"Aztec Mythology","symbol":"🔥","represents":["sun","war","human sacrifice"],"messages":["sun sees the essence hidden within you and calls it forth. Stand tall in your divine inheritance."],"tier":"Epic"},{"name":"Tlaloc","mythology":"Aztec Mythology","symbol":"🌊","represents":["rain","fertility","water","lightning"],"messages":["The gift of rain is your shield and your compass. Trust it."],"tier":"Epic"},{"name":"Xochiquetzal","mythology":"Aztec Mythology","symbol":"🌊","represents":["beauty","love","flowers","arts"],"messages":["Through the portal of beauty, infinite strength awaits your embrace."],"tier":"Epic"},{"name":"Coatlicue","mythology":"Aztec Mythology","symbol":"🌍","represents":["earth mother","death","birth"],"messages":["Let the tenacity of earth mother guide your steps toward infinite compassion."],"tier":"Epic"},{"name":"Mictlantecuhtli","mythology":"Aztec Mythology","symbol":"🌍","represents":["death","underworld","bones"],"messages":["The whisper of death carries wisdom across the ages to find you."],"tier":"Epic"},{"name":"Mictecacihuatl","mythology":"Aztec Mythology","symbol":"🌍","represents":["death","underworld queen","bones"],"messages":["The ancient pact of death awakens, blessing you with power. Your time of awakening has come."],"tier":"Common"},{"name":"Chalchiuhtlicue","mythology":"Aztec Mythology","symbol":"🌊","represents":["water","rivers","jade skirt"],"messages":["In water's light, your force shines with renewed purpose."],"tier":"Uncommon"},{"name":"Tonatiuh","mythology":"Aztec Mythology","symbol":"🔥","represents":["sun","fifth sun","movement"],"messages":["You are the living testament of sun's spirit. Your spirit is unconquerable."],"tier":"Common"},{"name":"Xipe Totec","mythology":"Aztec Mythology","symbol":"🌍","represents":["spring","renewal","agriculture","gold"],"messages":["Under the gaze of spring, your path illuminates with insight."],"tier":"Common"},{"name":"Tlazolteotl","mythology":"Aztec Mythology","symbol":"🌍","represents":["purification","earth","filth eater"],"messages":["Where purification touches the earth, compassion blossoms. So it is with you."],"tier":"Common"},{"name":"Ehecatl","mythology":"Aztec Mythology","symbol":"🌬","represents":["wind","breath","Quetzalcoatl aspect"],"messages":["Where others see darkness, wind grants you the sight of fortitude."],"tier":"Rare"},{"name":"Xolotl","mythology":"Aztec Mythology","symbol":"🔥","represents":["lightning","death","twin","dog"],"messages":["When Fire meets truth, all obstacles dissolve like morning mist."],"tier":"Common"},{"name":"Centeotl","mythology":"Aztec Mythology","symbol":"🌍","represents":["maize","agriculture","youth"],"messages":["Blessed by maize, you walk with compassion as your eternal companion."],"tier":"Rare"},{"name":"Chicomecoatl","mythology":"Aztec Mythology","symbol":"🌍","represents":["maize","sustenance","seven serpent"],"messages":["maize has marked you with abundance. Embrace this sacred gift."],"tier":"Rare"},{"name":"Mayahuel","mythology":"Aztec Mythology","symbol":"🌍","represents":["agave","fertility","maguey"],"messages":["You are the living testament of agave's light. Embrace the magnificent being you are."],"tier":"Rare"},{"name":"Xiuhtecuhtli","mythology":"Aztec Mythology","symbol":"🔥","represents":["fire","time","turquoise lord"],"messages":["Like a river from fire, resilience carves new paths through your life."],"tier":"Common"},{"name":"Chantico","mythology":"Aztec Mythology","symbol":"🔥","represents":["hearth","home","volcanoes"],"messages":["hearth crowns you with harmony. Walk boldly into what awaits."],"tier":"Uncommon"},{"name":"Patecatl","mythology":"Aztec Mythology","symbol":"🌍","represents":["healing","medicine","peyote","fertility"],"messages":["You are wrapped in the truth of healing, shielded and empowered."],"tier":"Rare"},{"name":"Mixcoatl","mythology":"Aztec Mythology","symbol":"🌬","represents":["hunting","stars","milky way"],"messages":["The Air within you aligns with hunting, creating unstoppable wisdom."],"tier":"Common"},{"name":"Coyolxauhqui","mythology":"Aztec Mythology","symbol":"🌊","represents":["moon","bells","warrior"],"messages":["Ancient bond stirs within as moon recognizes your worth."],"tier":"Epic"},{"name":"Itzamna","mythology":"Mayan Mythology","symbol":"🌬","represents":["sky","creation","writing","healing"],"messages":["The song that shaped sky now shapes your future. Joy and fulfillment are your sacred inheritance."],"tier":"Legendary"},{"name":"Kukulkan","mythology":"Mayan Mythology","symbol":"🌬","represents":["feathered serpent","wind","rain"],"messages":["The ancient resonance of feathered serpent awakens within your spirit. The doors of opportunity swing wide before you."],"tier":"Legendary"},{"name":"Ixchel","mythology":"Mayan Mythology","symbol":"🌊","represents":["moon","medicine","weaving","fertility"],"messages":["The eternal gift of moon flows unbroken through your lineage."],"tier":"Epic"},{"name":"Hunab Ku","mythology":"Mayan Mythology","symbol":"🔥","represents":["supreme god","one being","balance"],"messages":["In supreme god's light, your light shines with renewed purpose."],"tier":"Common"},{"name":"Chaac","mythology":"Mayan Mythology","symbol":"🌊","represents":["rain","thunder","lightning","agriculture"],"messages":["The Water speaks through rain, carrying a message of serenity for you."],"tier":"Epic"},{"name":"Kinich Ahau","mythology":"Mayan Mythology","symbol":"🔥","represents":["sun","fire","jaguar","lord"],"messages":["Let the truth of sun guide your steps toward boundless prosperity."],"tier":"Epic"},{"name":"Ah Puch","mythology":"Mayan Mythology","symbol":"🌍","represents":["death","decay","underworld"],"messages":["Blessed by death, you walk with patience as your eternal companion."],"tier":"Common"},{"name":"Ixtab","mythology":"Mayan Mythology","symbol":"🌍","represents":["rope","afterlife","paradise"],"messages":["Blessed by rope, you walk with purity as your eternal companion."],"tier":"Rare"},{"name":"Hunahpu","mythology":"Mayan Mythology","symbol":"🔥","represents":["hero twin","sun","ballgame"],"messages":["The Fire sings the song of hero twin, and you alone can hear its devotion."],"tier":"Common"},{"name":"Xbalanque","mythology":"Mayan Mythology","symbol":"🌊","represents":["hero twin","moon","jaguar"],"messages":["The bond that shaped hero twin now shapes your future. Joy and fulfillment are your sacred inheritance."],"tier":"Rare"},{"name":"Yum Kaax","mythology":"Mayan Mythology","symbol":"🌍","represents":["maize","agriculture","forest"],"messages":["The Earth speaks through maize, carrying a message of fortitude for you."],"tier":"Rare"},{"name":"Ix Tab","mythology":"Mayan Mythology","symbol":"🌍","represents":["suicide","afterlife","paradise"],"messages":["Embrace the essence of suicide, for it is the key to your transformation."],"tier":"Rare"},{"name":"Bacab","mythology":"Mayan Mythology","symbol":"🌬","represents":["sky bearer","four directions","wind"],"messages":["The power of sky bearer flows through you. Abundance flows to you from every direction."],"tier":"Uncommon"},{"name":"Ek Chuaj","mythology":"Mayan Mythology","symbol":"🌍","represents":["cacao","merchants","war"],"messages":["Where cacao touches the earth, patience blossoms. So it is with you."],"tier":"Common"},{"name":"Camazotz","mythology":"Mayan Mythology","symbol":"🌍","represents":["bat","darkness","sacrifice","cave"],"messages":["Ancient resonance stirs within as bat recognizes your worth."],"tier":"Rare"},{"name":"Zipacna","mythology":"Mayan Mythology","symbol":"🌍","represents":["mountains","crocodile","strength"],"messages":["The Earth within you aligns with mountains, creating unstoppable purity."],"tier":"Common"},{"name":"Vucub Caquix","mythology":"Mayan Mythology","symbol":"🔥","represents":["pride","macaw","false sun"],"messages":["Through the portal of pride, infinite brilliance awaits your embrace."],"tier":"Common"},{"name":"Buluc Chabtan","mythology":"Mayan Mythology","symbol":"🔥","represents":["war","human sacrifice","sudden death"],"messages":["The spark that shaped war now shapes your future. Peace and prosperity follow in your wake."],"tier":"Common"},{"name":"Acan","mythology":"Mayan Mythology","symbol":"🌊","represents":["intoxication","wine","balche"],"messages":["Like a river from intoxication, grace carves new paths through your life."],"tier":"Common"},{"name":"Yaluk","mythology":"Mayan Mythology","symbol":"🌬","represents":["lightning","thunder bolt","chief"],"messages":["A sacred song binds you to lightning. Your spirit is unconquerable."],"tier":"Uncommon"},{"name":"Ixazaluoh","mythology":"Mayan Mythology","symbol":"🔥","represents":["weaving","dawn","creation"],"messages":["Let the fortitude of weaving guide your steps toward divine purpose."],"tier":"Uncommon"},{"name":"Tohil","mythology":"Mayan Mythology","symbol":"🔥","represents":["fire","rain","sun","patron"],"messages":["The sacred fires of fire forge within you an unbreakable resilience."],"tier":"Common"},{"name":"Hurakan","mythology":"Mayan Mythology","symbol":"🌬","represents":["storm","one-legged","creation"],"messages":["You stand at the crossroads of storm and power. Both claim you as their own."],"tier":"Uncommon"},{"name":"Tepeu","mythology":"Mayan Mythology","symbol":"🌬","represents":["sovereignty","creation","sky"],"messages":["Between earth and sky, sovereignty plants the seed of power in your soul."],"tier":"Rare"},{"name":"Gucumatz","mythology":"Mayan Mythology","symbol":"🌊","represents":["feathered serpent","creation","water"],"messages":["The Water of feathered serpent purifies your spirit, leaving only harmony."],"tier":"Rare"},{"name":"Xmucane","mythology":"Mayan Mythology","symbol":"🌍","represents":["grandmother","maize","divination"],"messages":["Where others see darkness, grandmother grants you the sight of brilliance."],"tier":"Common"},{"name":"Xpiyacoc","mythology":"Mayan Mythology","symbol":"🌬","represents":["grandfather","matchmaker","divination"],"messages":["You stand at the crossroads of grandfather and grace. Both claim you as their own."],"tier":"Uncommon"},{"name":"Kan-u-Uayeyab","mythology":"Mayan Mythology","symbol":"🌍","represents":["city guardian","direction","protection"],"messages":["Embrace the spirit of city guardian, for it is the key to your transformation."],"tier":"Common"},{"name":"Dagda","mythology":"Celtic Mythology","symbol":"🌍","represents":["abundance","strength","druid","cauldron"],"messages":["The Earth of abundance dances through your veins. Walk forward with unshakable confidence."],"tier":"Legendary"},{"name":"Brigid","mythology":"Celtic Mythology","symbol":"🔥","represents":["healing","poetry","smithcraft","spring"],"messages":["The ancient pact of healing awakens, blessing you with wisdom. Stand tall in your divine inheritance."],"tier":"Legendary"},{"name":"Lugh","mythology":"Celtic Mythology","symbol":"🔥","represents":["light","skill","crafts","harvest"],"messages":["From the depths of light, devotion rises to meet your spirit. The universe bends toward your will."],"tier":"Epic"},{"name":"Morrigan","mythology":"Celtic Mythology","symbol":"🔥","represents":["war","fate","death","crows"],"messages":["From war's realm, a gift of brilliance descends upon you now."],"tier":"Legendary"},{"name":"Danu","mythology":"Celtic Mythology","symbol":"🌊","represents":["mother","rivers","earth","fertility"],"messages":["You are wrapped in the tenacity of mother, shielded and empowered."],"tier":"Epic"},{"name":"Cernunnos","mythology":"Celtic Mythology","symbol":"🌍","represents":["forest","animals","fertility","antlers"],"messages":["Under the gaze of forest, your path illuminates with radiance."],"tier":"Epic"},{"name":"Manannán mac Lir","mythology":"Celtic Mythology","symbol":"🌊","represents":["sea","otherworld","mist","travel"],"messages":["The ancient pact of sea awakens, blessing you with purity. Rise and claim your destiny."],"tier":"Epic"},{"name":"Ogma","mythology":"Celtic Mythology","symbol":"🌬","represents":["eloquence","language","ogham","strength"],"messages":["The Air of eloquence purifies your spirit, leaving only grace."],"tier":"Common"},{"name":"Nuada","mythology":"Celtic Mythology","symbol":"⚔️","represents":["kingship","justice","silver hand"],"messages":["The ancient resonance of kingship awakens within your spirit. Your legacy shall echo through generations."],"tier":"Uncommon"},{"name":"Aengus","mythology":"Celtic Mythology","symbol":"🌬","represents":["love","youth","poetry","dreams"],"messages":["You stand at the crossroads of love and fortitude. Both claim you as their own."],"tier":"Common"},{"name":"Belenus","mythology":"Celtic Mythology","symbol":"🔥","represents":["sun","healing","fire","Beltane"],"messages":["You carry the light of sun. Rise and claim your destiny."],"tier":"Uncommon"},{"name":"Epona Celtic","mythology":"Celtic Mythology","symbol":"🌍","represents":["horses","fertility","sovereignty"],"messages":["The cosmic thread of horses weaves brilliance into your destiny."],"tier":"Uncommon"},{"name":"Rhiannon","mythology":"Celtic Mythology","symbol":"🌍","represents":["horses","enchantment","patience","birds"],"messages":["The energy of ages past flows through horses into your being. Your spirit is unconquerable."],"tier":"Epic"},{"name":"Arianrhod","mythology":"Celtic Mythology","symbol":"🌊","represents":["moon","stars","fate","silver wheel"],"messages":["The cosmic thread of moon weaves tenacity into your destiny."],"tier":"Rare"},{"name":"Cerridwen","mythology":"Celtic Mythology","symbol":"🌊","represents":["cauldron","transformation","knowledge"],"messages":["In cauldron's light, your blessing shines with renewed purpose."],"tier":"Common"},{"name":"Gwydion","mythology":"Celtic Mythology","symbol":"🌬","represents":["magic","trickery","enchantment"],"messages":["The eternal spark of magic flows unbroken through your lineage."],"tier":"Uncommon"},{"name":"Llyr","mythology":"Celtic Mythology","symbol":"🌊","represents":["sea","otherworld","depth"],"messages":["You stand at the crossroads of sea and truth. Both claim you as their own."],"tier":"Common"},{"name":"Bran the Blessed","mythology":"Celtic Mythology","symbol":"🌍","represents":["giant","protection","ravens"],"messages":["resilience descends like starlight from giant. Your path is blessed."],"tier":"Uncommon"},{"name":"Mabon","mythology":"Celtic Mythology","symbol":"🌍","represents":["youth","harvest","freedom","son"],"messages":["Sacred spark flows from youth to illuminate your journey. The universe conspires to fulfill your purpose."],"tier":"Uncommon"},{"name":"Blodeuwedd","mythology":"Celtic Mythology","symbol":"🌍","represents":["flowers","betrayal","owl","beauty"],"messages":["The Earth speaks through flowers, carrying a message of power for you."],"tier":"Common"},{"name":"Sucellos","mythology":"Celtic Mythology","symbol":"🌍","represents":["agriculture","hammer","wine","forests"],"messages":["Like a river from agriculture, insight carves new paths through your life."],"tier":"Uncommon"},{"name":"Nantosuelta","mythology":"Celtic Mythology","symbol":"🌊","represents":["nature","house","fertility","valley"],"messages":["The veil between worlds thins near nature, revealing resilience within you."],"tier":"Common"},{"name":"Taranis","mythology":"Celtic Mythology","symbol":"🌬","represents":["thunder","wheel","sky","storms"],"messages":["When you call upon thunder, compassion answers without hesitation."],"tier":"Common"},{"name":"Grannus","mythology":"Celtic Mythology","symbol":"🌊","represents":["healing","springs","sun","youth"],"messages":["The Water sings the song of healing, and you alone can hear its patience."],"tier":"Uncommon"},{"name":"Rosmerta","mythology":"Celtic Mythology","symbol":"🌍","represents":["abundance","fertility","prosperity"],"messages":["Like a river from abundance, purity carves new paths through your life."],"tier":"Rare"},{"name":"Perun","mythology":"Slavic Mythology","symbol":"🌬","represents":["thunder","lightning","war","oak"],"messages":["Through the portal of thunder, infinite grace awaits your embrace."],"tier":"Legendary"},{"name":"Veles","mythology":"Slavic Mythology","symbol":"🌍","represents":["underworld","cattle","magic","trickery"],"messages":["The Earth sings the song of underworld, and you alone can hear its truth."],"tier":"Epic"},{"name":"Mokosh","mythology":"Slavic Mythology","symbol":"🌍","represents":["earth","fertility","weaving","spinning"],"messages":["When the world trembles, earth holds you steady with clarity."],"tier":"Epic"},{"name":"Svarog","mythology":"Slavic Mythology","symbol":"🔥","represents":["sky","fire","blacksmith","creation"],"messages":["The Fire sings the song of sky, and you alone can hear its truth."],"tier":"Epic"},{"name":"Dazhbog","mythology":"Slavic Mythology","symbol":"🔥","represents":["sun","wealth","giving","prosperity"],"messages":["Under the gaze of sun, your path illuminates with strength."],"tier":"Epic"},{"name":"Stribog","mythology":"Slavic Mythology","symbol":"🌬","represents":["wind","air","distribution"],"messages":["Between earth and sky, wind plants the seed of courage in your soul."],"tier":"Common"},{"name":"Rod","mythology":"Slavic Mythology","symbol":"🌍","represents":["creation","birth","fate","family"],"messages":["creation whispers its secrets to those who seek abundance. You are chosen."],"tier":"Uncommon"},{"name":"Marzanna","mythology":"Slavic Mythology","symbol":"🌊","represents":["winter","death","rebirth","plague"],"messages":["Ancient force stirs within as winter recognizes your worth."],"tier":"Rare"},{"name":"Jarilo","mythology":"Slavic Mythology","symbol":"🌍","represents":["spring","fertility","vegetation","war"],"messages":["The Earth speaks through spring, carrying a message of radiance for you."],"tier":"Common"},{"name":"Lada","mythology":"Slavic Mythology","symbol":"🌊","represents":["love","beauty","spring","harmony"],"messages":["Blessed by love, you walk with power as your eternal companion."],"tier":"Common"},{"name":"Zorya","mythology":"Slavic Mythology","symbol":"🔥","represents":["dawn","dusk","star maidens","guardians"],"messages":["The Fire within you aligns with dawn, creating unstoppable insight."],"tier":"Common"},{"name":"Chernobog","mythology":"Slavic Mythology","symbol":"🌍","represents":["darkness","night","curse"],"messages":["The Earth sings the song of darkness, and you alone can hear its radiance."],"tier":"Common"},{"name":"Belobog","mythology":"Slavic Mythology","symbol":"🔥","represents":["light","sun","good fortune"],"messages":["light whispers its secrets to those who seek abundance. You are chosen."],"tier":"Common"},{"name":"Simargl","mythology":"Slavic Mythology","symbol":"🔥","represents":["seed","fire","winged dog","protection"],"messages":["The Fire sings the song of seed, and you alone can hear its brilliance."],"tier":"Rare"},{"name":"Kupala","mythology":"Slavic Mythology","symbol":"🌊","represents":["midsummer","water","fire","joy"],"messages":["Where others see darkness, midsummer grants you the sight of harmony."],"tier":"Common"},{"name":"Svantevit","mythology":"Slavic Mythology","symbol":"🔥","represents":["war","abundance","divination","four heads"],"messages":["Your soul mirrors the gift of war. Abundance flows to you from every direction."],"tier":"Common"},{"name":"Triglav","mythology":"Slavic Mythology","symbol":"🌬","represents":["three heads","sky-earth-underworld"],"messages":["The cosmic thread of three heads weaves patience into your destiny."],"tier":"Uncommon"},{"name":"Radegast","mythology":"Slavic Mythology","symbol":"🔥","represents":["hospitality","war","fertility","night"],"messages":["The ancient pact of hospitality awakens, blessing you with courage. Nothing can diminish the light within you."],"tier":"Rare"},{"name":"Domovoi","mythology":"Slavic Mythology","symbol":"🔥","represents":["home spirit","protection","hearth"],"messages":["In home spirit's light, your bond shines with renewed purpose."],"tier":"Uncommon"},{"name":"Leshy","mythology":"Slavic Mythology","symbol":"🌿","represents":["forest spirit","woods","trickery"],"messages":["The spark of ages past flows through forest spirit into your being. The cosmos celebrates your existence."],"tier":"Common"},{"name":"Vodyanoy","mythology":"Slavic Mythology","symbol":"🌊","represents":["water spirit","rivers","lakes"],"messages":["When the world trembles, water spirit holds you steady with serenity."],"tier":"Common"},{"name":"Rusalka","mythology":"Slavic Mythology","symbol":"🌊","represents":["water maiden","rivers","enchantment"],"messages":["Through the portal of water maiden, infinite brilliance awaits your embrace."],"tier":"Common"},{"name":"Poludnitsa","mythology":"Slavic Mythology","symbol":"🔥","represents":["noon witch","heat","harvest"],"messages":["When Fire meets compassion, the impossible becomes your reality."],"tier":"Rare"},{"name":"Baba Yaga","mythology":"Slavic Mythology","symbol":"🌍","represents":["witch","wisdom","forest","death"],"messages":["You are the living testament of witch's tide. Let nothing dim your sacred fire."],"tier":"Epic"},{"name":"Koschei","mythology":"Slavic Mythology","symbol":"⚔️","represents":["immortal","death hidden","sorcery"],"messages":["Sacred current flows from immortal to illuminate your journey. Your legacy shall echo through generations."],"tier":"Epic"},{"name":"Anu","mythology":"Sumerian Mythology","symbol":"🌬","represents":["sky","heaven","supreme authority"],"messages":["The veil between worlds thins near sky, revealing brilliance within you."],"tier":"Rare"},{"name":"Enlil","mythology":"Sumerian Mythology","symbol":"🌬","represents":["wind","storm","earth","authority"],"messages":["When Air meets compassion, the impossible becomes your reality."],"tier":"Legendary"},{"name":"Enki","mythology":"Sumerian Mythology","symbol":"🌊","represents":["water","wisdom","creation","magic"],"messages":["Between earth and sky, water plants the seed of resilience in your soul."],"tier":"Legendary"},{"name":"Inanna","mythology":"Sumerian Mythology","symbol":"🌊","represents":["love","war","fertility","heaven"],"messages":["love crowns you with wisdom. Walk boldly into what awaits."],"tier":"Mythic"},{"name":"Ninhursag","mythology":"Sumerian Mythology","symbol":"🌍","represents":["earth","mother","fertility","nature"],"messages":["Like a river from earth, harmony carves new paths through your life."],"tier":"Common"},{"name":"Ereshkigal","mythology":"Sumerian Mythology","symbol":"🌍","represents":["underworld","death","darkness"],"messages":["Through the portal of underworld, infinite harmony awaits your embrace."],"tier":"Epic"},{"name":"Nanna Sumerian","mythology":"Sumerian Mythology","symbol":"🌊","represents":["moon","wisdom","time"],"messages":["The purity of moon flows through you. Peace and prosperity follow in your wake."],"tier":"Common"},{"name":"Utu","mythology":"Sumerian Mythology","symbol":"🔥","represents":["sun","justice","truth"],"messages":["The veil between worlds thins near sun, revealing purity within you."],"tier":"Uncommon"},{"name":"Dumuzi","mythology":"Sumerian Mythology","symbol":"🌍","represents":["shepherds","vegetation","seasons"],"messages":["You carry the current of shepherds. Walk forward with unshakable confidence."],"tier":"Uncommon"},{"name":"Ninurta","mythology":"Sumerian Mythology","symbol":"⚔️","represents":["war","agriculture","hunting"],"messages":["The veil between worlds thins near war, revealing abundance within you."],"tier":"Common"},{"name":"Nergal","mythology":"Sumerian Mythology","symbol":"🔥","represents":["plague","war","underworld","sun"],"messages":["Where others see darkness, plague grants you the sight of compassion."],"tier":"Uncommon"},{"name":"Nammu","mythology":"Sumerian Mythology","symbol":"🌊","represents":["primordial sea","creation","mother"],"messages":["The ancient pact of primordial sea awakens, blessing you with brilliance. Stand tall in your divine inheritance."],"tier":"Common"},{"name":"Nisaba","mythology":"Sumerian Mythology","symbol":"🌬","represents":["writing","grain","wisdom","scribes"],"messages":["The Air speaks through writing, carrying a message of compassion for you."],"tier":"Common"},{"name":"Gula","mythology":"Sumerian Mythology","symbol":"🌊","represents":["healing","dogs","medicine"],"messages":["Under the gaze of healing, your path illuminates with tenacity."],"tier":"Uncommon"},{"name":"Nanshe","mythology":"Sumerian Mythology","symbol":"🌊","represents":["social justice","prophecy","fishing"],"messages":["Under the gaze of social justice, your path illuminates with patience."],"tier":"Common"},{"name":"Ningal","mythology":"Sumerian Mythology","symbol":"🌊","represents":["reeds","marshes","moon consort"],"messages":["Through the portal of reeds, infinite purity awaits your embrace."],"tier":"Common"},{"name":"Marduk","mythology":"Babylonian Mythology","symbol":"🔥","represents":["sun","justice","compassion","creation"],"messages":["In the presence of sun, even shadows become compassion."],"tier":"Mythic"},{"name":"Tiamat","mythology":"Babylonian Mythology","symbol":"🌊","represents":["primordial chaos","salt water","dragon"],"messages":["The ancient flame of primordial chaos awakens within your spirit. Every challenge becomes a stepping stone to greatness."],"tier":"Mythic"},{"name":"Ishtar","mythology":"Babylonian Mythology","symbol":"🌊","represents":["love","war","fertility","power"],"messages":["Where others see darkness, love grants you the sight of wisdom."],"tier":"Epic"},{"name":"Shamash","mythology":"Babylonian Mythology","symbol":"🔥","represents":["sun","justice","divination","truth"],"messages":["The Fire speaks through sun, carrying a message of devotion for you."],"tier":"Epic"},{"name":"Sin","mythology":"Babylonian Mythology","symbol":"🌊","represents":["moon","wisdom","cattle","night"],"messages":["The cosmic thread of moon weaves strength into your destiny."],"tier":"Rare"},{"name":"Ea","mythology":"Babylonian Mythology","symbol":"🌊","represents":["water","wisdom","incantation"],"messages":["Your soul mirrors the spark of water. Every challenge becomes a stepping stone to greatness."],"tier":"Common"},{"name":"Nabu","mythology":"Babylonian Mythology","symbol":"🌬","represents":["writing","wisdom","vegetation"],"messages":["You carry the spirit of writing. Rise and claim your destiny."],"tier":"Common"},{"name":"Adad","mythology":"Babylonian Mythology","symbol":"🌬","represents":["storm","rain","divination"],"messages":["When Air meets resilience, your deepest wishes begin to manifest."],"tier":"Common"},{"name":"Erra","mythology":"Babylonian Mythology","symbol":"🔥","represents":["plague","war","chaos"],"messages":["plague whispers its secrets to those who seek fortitude. You are chosen."],"tier":"Uncommon"},{"name":"Pazuzu","mythology":"Babylonian Mythology","symbol":"🌬","represents":["wind","demon","protection from evil"],"messages":["Where others see darkness, wind grants you the sight of tenacity."],"tier":"Uncommon"},{"name":"Lamassu","mythology":"Babylonian Mythology","symbol":"🌍","represents":["protection","winged bull","guardian"],"messages":["The ancient gift of protection awakens within your spirit. Transformation awaits at every crossroad."],"tier":"Rare"},{"name":"Ashur","mythology":"Assyrian Mythology","symbol":"🌬","represents":["war","wind","national god"],"messages":["Let the fortitude of war guide your steps toward boundless prosperity."],"tier":"Uncommon"},{"name":"Anshar","mythology":"Babylonian Mythology","symbol":"🌬","represents":["sky pivot","whole heaven"],"messages":["Ancient blessing stirs within as sky pivot recognizes your worth."],"tier":"Common"},{"name":"Kishar","mythology":"Babylonian Mythology","symbol":"🌍","represents":["whole earth","foundation"],"messages":["Your connection to whole earth deepens with each breath. Transformation awaits at every crossroad."],"tier":"Common"},{"name":"Apsu","mythology":"Babylonian Mythology","symbol":"🌊","represents":["fresh water","abyss","creation"],"messages":["The essence of fresh water resonates in your heart, granting harmony beyond measure."],"tier":"Uncommon"},{"name":"Lahmu","mythology":"Babylonian Mythology","symbol":"🌍","represents":["first gods","muddy","hairy"],"messages":["The sacred fires of first gods forge within you an unbreakable patience."],"tier":"Rare"},{"name":"Lahamu","mythology":"Babylonian Mythology","symbol":"🌍","represents":["first goddess","silt","creation"],"messages":["The Earth speaks through first goddess, carrying a message of abundance for you."],"tier":"Rare"},{"name":"Girra","mythology":"Sumerian Mythology","symbol":"🔥","represents":["fire","light","purification"],"messages":["The sacred fires of fire forge within you an unbreakable radiance."],"tier":"Uncommon"},{"name":"Uttu","mythology":"Sumerian Mythology","symbol":"🌍","represents":["weaving","clothing","spider"],"messages":["The grace of weaving flows through you. Your inner light shall guide nations."],"tier":"Uncommon"},{"name":"Geshtinanna","mythology":"Sumerian Mythology","symbol":"🌍","represents":["vine","dream interpretation","scribe"],"messages":["From vine's realm, a gift of radiance descends upon you now."],"tier":"Common"},{"name":"Enbilulu","mythology":"Sumerian Mythology","symbol":"🌊","represents":["canals","farming","irrigation"],"messages":["You stand at the crossroads of canals and power. Both claim you as their own."],"tier":"Rare"},{"name":"Dagon","mythology":"Mesopotamian Mythology","symbol":"🌊","represents":["grain","fish","fertility","agriculture"],"messages":["The glow of ages past flows through grain into your being. Let nothing dim your sacred fire."],"tier":"Uncommon"},{"name":"Ninkasi","mythology":"Sumerian Mythology","symbol":"🌊","represents":["beer","brewing","intoxication"],"messages":["You are the living testament of beer's resonance. Your spirit is unconquerable."],"tier":"Rare"},{"name":"Zababa","mythology":"Sumerian Mythology","symbol":"🔥","represents":["war","eagle","Kish patron"],"messages":["The ancient tide of war awakens within your spirit. Great fortune awaits those who walk this path."],"tier":"Rare"},{"name":"Phra Phrom","mythology":"Thai Buddhism","symbol":"🌬","represents":["creation","four faces","fortune"],"messages":["The Air of creation purifies your spirit, leaving only compassion."],"tier":"Legendary"},{"name":"Phra Narai","mythology":"Thai Buddhism","symbol":"🌊","represents":["preservation","protection","avatar"],"messages":["The eternal current of preservation flows unbroken through your lineage."],"tier":"Legendary"},{"name":"Phra Isuan","mythology":"Thai Buddhism","symbol":"🔥","represents":["destruction","dance","meditation"],"messages":["The courage of destruction flows through you. Every challenge becomes a stepping stone to greatness."],"tier":"Common"},{"name":"Nang Kwak","mythology":"Thai Folk","symbol":"🌍","represents":["beckoning","prosperity","trade"],"messages":["The Earth within you aligns with beckoning, creating unstoppable abundance."],"tier":"Epic"},{"name":"Mae Thorani","mythology":"Thai Buddhism","symbol":"🌍","represents":["earth","water","witness","merit"],"messages":["Where earth touches the earth, wisdom blossoms. So it is with you."],"tier":"Legendary"},{"name":"Thao Wessuwan","mythology":"Thai Buddhism","symbol":"⚔️","represents":["north","wealth","yaksha king"],"messages":["Under the blessing of north, your tenacity becomes a beacon for others."],"tier":"Epic"},{"name":"Phra Rahu","mythology":"Thai Astrology","symbol":"🌬","represents":["eclipse","ambition","karma"],"messages":["The essence of eclipse resonates in your heart, granting radiance beyond measure."],"tier":"Epic"},{"name":"Mae Phra Kwan Im","mythology":"Thai Buddhism","symbol":"🌊","represents":["mercy","compassion","bodhisattva"],"messages":["By the grace of mercy, abundance becomes your birthright."],"tier":"Epic"},{"name":"Phra Sangkachai","mythology":"Thai Buddhism","symbol":"🌍","represents":["wealth","good fortune","fullness"],"messages":["In the presence of wealth, even shadows become power."],"tier":"Common"},{"name":"Phra Sivali","mythology":"Thai Buddhism","symbol":"🌬","represents":["fortune","auspiciousness","travel"],"messages":["When you call upon fortune, harmony answers without hesitation."],"tier":"Common"},{"name":"Nang Tani","mythology":"Thai Folk","symbol":"🌿","represents":["banana tree","beauty","generosity"],"messages":["When Wood meets serenity, ancient doors open to reveal new worlds."],"tier":"Common"},{"name":"Mae Nak","mythology":"Thai Folk","symbol":"🌊","represents":["devotion","love","ghost wife"],"messages":["You stand at the crossroads of devotion and power. Both claim you as their own."],"tier":"Uncommon"},{"name":"Phi Fa","mythology":"Thai Folk","symbol":"🌬","represents":["sky spirit","healing","shamanism"],"messages":["Through sky spirit, you discover the blessing that transforms all it touches."],"tier":"Uncommon"},{"name":"Phra Mae Uma","mythology":"Thai Buddhism","symbol":"🔥","represents":["fertility","devotion","power"],"messages":["fertility crowns you with courage. Walk boldly into what awaits."],"tier":"Common"},{"name":"Phra Phikanet","mythology":"Thai Buddhism","symbol":"🌍","represents":["obstacle removal","arts","wisdom"],"messages":["From obstacle removal's realm, a gift of devotion descends upon you now."],"tier":"Common"},{"name":"Thao Maha Phrom","mythology":"Thai Buddhism","symbol":"🌬","represents":["great brahma","heaven","merit"],"messages":["Sacred spirit flows from great brahma to illuminate your journey. Your inner light shall guide nations."],"tier":"Common"},{"name":"Phra Athit","mythology":"Thai Cosmology","symbol":"🔥","represents":["sun","day","warmth"],"messages":["The purity of sun flows through you. The universe conspires to fulfill your purpose."],"tier":"Common"},{"name":"Phra Chan","mythology":"Thai Cosmology","symbol":"🌊","represents":["moon","night","coolness"],"messages":["The sacred fires of moon forge within you an unbreakable abundance."],"tier":"Uncommon"},{"name":"Kinnaree","mythology":"Thai Mythology","symbol":"🌬","represents":["half-bird half-woman","grace","dance"],"messages":["Through half-bird half-woman, you discover the flame that transforms all it touches."],"tier":"Epic"},{"name":"Garuda Thai","mythology":"Thai Mythology","symbol":"🌬","represents":["national symbol","power","sky"],"messages":["The ancient pact of national symbol awakens, blessing you with clarity. Nothing can diminish the light within you."],"tier":"Epic"},{"name":"Naga Thai","mythology":"Thai Mythology","symbol":"🌊","represents":["water","river","protection","serpent"],"messages":["When you call upon water, resilience answers without hesitation."],"tier":"Epic"},{"name":"Phi Phra Ya Nak","mythology":"Thai Folk","symbol":"🌊","represents":["great naga","Mekong","fireballs"],"messages":["The Water sings the song of great naga, and you alone can hear its power."],"tier":"Common"},{"name":"Hanuman Thai","mythology":"Thai Mythology","symbol":"🌬","represents":["monkey warrior","devotion","flight"],"messages":["The Air speaks through monkey warrior, carrying a message of resilience for you."],"tier":"Common"},{"name":"Phra Lak","mythology":"Thai Mythology","symbol":"🌍","represents":["loyalty","brother","sacrifice"],"messages":["Through loyalty, you discover the song that transforms all it touches."],"tier":"Common"},{"name":"Tosakan","mythology":"Thai Mythology","symbol":"🔥","represents":["ten-faced king","power","Lanka"],"messages":["The flame that shaped ten-faced king now shapes your future. The doors of opportunity swing wide before you."],"tier":"Common"},{"name":"Montho","mythology":"Thai Mythology","symbol":"🌊","represents":["beauty","devotion","celestial maiden"],"messages":["The essence of beauty resonates in your heart, granting compassion beyond measure."],"tier":"Common"},{"name":"Sita Thai","mythology":"Thai Mythology","symbol":"🌍","represents":["purity","devotion","earth daughter"],"messages":["The Earth sings the song of purity, and you alone can hear its patience."],"tier":"Common"},{"name":"Mekhala","mythology":"Thai Mythology","symbol":"🌊","represents":["lightning","jewel","sea goddess"],"messages":["Like a river from lightning, grace carves new paths through your life."],"tier":"Uncommon"},{"name":"Ramasun","mythology":"Thai Mythology","symbol":"🌬","represents":["thunder","axe","storm"],"messages":["Your connection to thunder deepens with each breath. Peace and prosperity follow in your wake."],"tier":"Uncommon"},{"name":"Phra Mae Khongkha","mythology":"Thai Mythology","symbol":"🌊","represents":["Ganges","river","purification","water"],"messages":["You are the living testament of Ganges's echo. The cosmos celebrates your existence."],"tier":"Common"},{"name":"Olorun","mythology":"Yoruba Mythology","symbol":"🔥","represents":["supreme deity","sky","sun"],"messages":["The Fire speaks through supreme deity, carrying a message of tenacity for you."],"tier":"Legendary"},{"name":"Ogun","mythology":"Yoruba Mythology","symbol":"⚔️","represents":["iron","war","labor","truth"],"messages":["The spark of iron is your shield and your compass. Trust it."],"tier":"Epic"},{"name":"Shango","mythology":"Yoruba Mythology","symbol":"🔥","represents":["thunder","lightning","fire","justice"],"messages":["The ancient essence of thunder awakens within your spirit. Every challenge becomes a stepping stone to greatness."],"tier":"Legendary"},{"name":"Oshun","mythology":"Yoruba Mythology","symbol":"🌊","represents":["love","river","fertility","beauty"],"messages":["From love's realm, a gift of resilience descends upon you now."],"tier":"Legendary"},{"name":"Yemoja","mythology":"Yoruba Mythology","symbol":"🌊","represents":["ocean","motherhood","children","moon"],"messages":["The echo that shaped ocean now shapes your future. Your inner light shall guide nations."],"tier":"Epic"},{"name":"Eshu","mythology":"Yoruba Mythology","symbol":"🌬","represents":["crossroads","trickster","communication"],"messages":["When you call upon crossroads, clarity answers without hesitation."],"tier":"Epic"},{"name":"Obatala","mythology":"Yoruba Mythology","symbol":"🌬","represents":["creation","purity","peace","cloth"],"messages":["The echo of creation is your shield and your compass. Trust it."],"tier":"Epic"},{"name":"Oya","mythology":"Yoruba Mythology","symbol":"🌬","represents":["wind","lightning","death","rebirth"],"messages":["Let the harmony of wind guide your steps toward lasting peace."],"tier":"Epic"},{"name":"Orunmila","mythology":"Yoruba Mythology","symbol":"🌬","represents":["wisdom","divination","destiny","Ifa"],"messages":["Where wisdom touches the earth, tenacity blossoms. So it is with you."],"tier":"Common"},{"name":"Aje","mythology":"Yoruba Mythology","symbol":"🌍","represents":["wealth","commerce","earth"],"messages":["Through the portal of wealth, infinite courage awaits your embrace."],"tier":"Rare"},{"name":"Nyame","mythology":"Akan Mythology","symbol":"🌬","represents":["supreme sky","omniscient","omnipotent"],"messages":["Blessed by supreme sky, you walk with patience as your eternal companion."],"tier":"Epic"},{"name":"Anansi","mythology":"Akan Mythology","symbol":"🌬","represents":["trickster","spider","stories","wisdom"],"messages":["In trickster's light, your resonance shines with renewed purpose."],"tier":"Epic"},{"name":"Asase Yaa","mythology":"Akan Mythology","symbol":"🌍","represents":["earth","fertility","truth","Thursday"],"messages":["Between earth and sky, earth plants the seed of tenacity in your soul."],"tier":"Common"},{"name":"Mawu-Lisa","mythology":"Fon Mythology","symbol":"🔥","represents":["moon-sun","creation","twins"],"messages":["The veil between worlds thins near moon-sun, revealing resilience within you."],"tier":"Epic"},{"name":"Legba","mythology":"Fon Mythology","symbol":"🌬","represents":["crossroads","communication","trickster"],"messages":["In the presence of crossroads, even shadows become radiance."],"tier":"Uncommon"},{"name":"Sakpata","mythology":"Fon Mythology","symbol":"🌍","represents":["earth","smallpox","healing","justice"],"messages":["You are wrapped in the wisdom of earth, shielded and empowered."],"tier":"Uncommon"},{"name":"Amma","mythology":"Dogon Mythology","symbol":"🌬","represents":["supreme creator","cosmic egg","order"],"messages":["The cosmic thread of supreme creator weaves fortitude into your destiny."],"tier":"Epic"},{"name":"Nommo","mythology":"Dogon Mythology","symbol":"🌊","represents":["water spirits","creation","ancestors"],"messages":["water spirits crowns you with wisdom. Walk boldly into what awaits."],"tier":"Rare"},{"name":"Bumba","mythology":"Kuba Mythology","symbol":"🌊","represents":["creation","vomiting world","first god"],"messages":["Between earth and sky, creation plants the seed of clarity in your soul."],"tier":"Common"},{"name":"Mwari","mythology":"Shona Mythology","symbol":"🌊","represents":["supreme being","rain","fertility"],"messages":["Ancient pulse stirs within as supreme being recognizes your worth."],"tier":"Common"},{"name":"Unkulunkulu","mythology":"Zulu Mythology","symbol":"🌍","represents":["creator","ancestor","reed origin"],"messages":["You stand at the crossroads of creator and strength. Both claim you as their own."],"tier":"Common"},{"name":"Inkosazana","mythology":"Zulu Mythology","symbol":"🌊","represents":["rain","agriculture","rainbow princess"],"messages":["Let the harmony of rain guide your steps toward radiant joy."],"tier":"Common"},{"name":"Kibuka","mythology":"Buganda Mythology","symbol":"🌬","represents":["war","guardian","sky warrior"],"messages":["Under the gaze of war, your path illuminates with wisdom."],"tier":"Common"},{"name":"Mukasa","mythology":"Buganda Mythology","symbol":"🌊","represents":["lake","prosperity","rain","fertility"],"messages":["Through the portal of lake, infinite devotion awaits your embrace."],"tier":"Rare"},{"name":"Nana Buluku","mythology":"Fon Mythology","symbol":"🌍","represents":["androgynous creator","supreme","ancient"],"messages":["The essence of androgynous creator resonates in your heart, granting patience beyond measure."],"tier":"Common"},{"name":"Pele","mythology":"Hawaiian Mythology","symbol":"🔥","represents":["volcanoes","fire","creation","passion"],"messages":["Where others see darkness, volcanoes grants you the sight of power."],"tier":"Mythic"},{"name":"Maui","mythology":"Polynesian Mythology","symbol":"🔥","represents":["trickster","demigod","sun","fishing"],"messages":["By the grace of trickster, fortitude becomes your birthright."],"tier":"Legendary"},{"name":"Lono","mythology":"Hawaiian Mythology","symbol":"🌊","represents":["fertility","agriculture","rain","music"],"messages":["The ancient resonance of fertility awakens within your spirit. Transformation awaits at every crossroad."],"tier":"Epic"},{"name":"Kane","mythology":"Hawaiian Mythology","symbol":"🔥","represents":["creation","sunlight","fresh water"],"messages":["Ancient glow stirs within as creation recognizes your worth."],"tier":"Epic"},{"name":"Ku","mythology":"Hawaiian Mythology","symbol":"⚔️","represents":["war","politics","fishing","sorcery"],"messages":["Through war, you discover the aura that transforms all it touches."],"tier":"Uncommon"},{"name":"Kanaloa","mythology":"Hawaiian Mythology","symbol":"🌊","represents":["ocean","underworld","squid","healing"],"messages":["Like a river from ocean, compassion carves new paths through your life."],"tier":"Common"},{"name":"Hi'iaka","mythology":"Hawaiian Mythology","symbol":"🔥","represents":["dance","medicine","lightning","sister"],"messages":["In dance's light, your pulse shines with renewed purpose."],"tier":"Common"},{"name":"Namaka","mythology":"Hawaiian Mythology","symbol":"🌊","represents":["sea","water spirit","rival of Pele"],"messages":["When Water meets compassion, sacred bonds form to protect your journey."],"tier":"Uncommon"},{"name":"Papa","mythology":"Hawaiian Mythology","symbol":"🌍","represents":["earth mother","foundation","fertility"],"messages":["The Earth sings the song of earth mother, and you alone can hear its grace."],"tier":"Uncommon"},{"name":"Wakea","mythology":"Hawaiian Mythology","symbol":"🌬","represents":["sky father","creation","expanse"],"messages":["The sacred fires of sky father forge within you an unbreakable brilliance."],"tier":"Common"},{"name":"Tangaroa","mythology":"Polynesian Mythology","symbol":"🌊","represents":["sea","fish","reptiles","ocean"],"messages":["The echo of ages past flows through sea into your being. Your time of awakening has come."],"tier":"Legendary"},{"name":"Tane","mythology":"Polynesian Mythology","symbol":"🌿","represents":["forests","birds","light","creation"],"messages":["The essence of forests resonates in your heart, granting serenity beyond measure."],"tier":"Epic"},{"name":"Tu","mythology":"Polynesian Mythology","symbol":"🔥","represents":["war","hunting","cooking","courage"],"messages":["Blessed by war, you walk with power as your eternal companion."],"tier":"Uncommon"},{"name":"Rongo","mythology":"Polynesian Mythology","symbol":"🌍","represents":["peace","agriculture","cultivated plants"],"messages":["purity descends like starlight from peace. Your path is blessed."],"tier":"Common"},{"name":"Papatuanuku","mythology":"Polynesian Mythology","symbol":"🌍","represents":["earth mother","fertility","nature"],"messages":["Your soul mirrors the mantle of earth mother. Peace and prosperity follow in your wake."],"tier":"Epic"},{"name":"Ranginui","mythology":"Polynesian Mythology","symbol":"🌬","represents":["sky father","rain","embrace"],"messages":["The essence of sky father resonates in your heart, granting clarity beyond measure."],"tier":"Epic"},{"name":"Hina","mythology":"Polynesian Mythology","symbol":"🌊","represents":["moon","beauty","tapa cloth"],"messages":["The Water of moon purifies your spirit, leaving only truth."],"tier":"Common"},{"name":"Oro","mythology":"Polynesian Mythology","symbol":"🔥","represents":["war","peace","fertility","Arioi"],"messages":["The Fire sings the song of war, and you alone can hear its wisdom."],"tier":"Common"},{"name":"Ta'aroa","mythology":"Polynesian Mythology","symbol":"🌬","represents":["creation","supreme","cosmic egg"],"messages":["The Air of creation purifies your spirit, leaving only abundance."],"tier":"Uncommon"},{"name":"Whiro","mythology":"Polynesian Mythology","symbol":"🌍","represents":["darkness","evil","lord of dead"],"messages":["In darkness's light, your glow shines with renewed purpose."],"tier":"Rare"},{"name":"Chaos","mythology":"Greek Cosmogony","symbol":"🌬","represents":["void","beginning","formlessness"],"messages":["When Air meets insight, miracles unfold before your eyes."],"tier":"Mythic"},{"name":"Nun","mythology":"Egyptian Cosmogony","symbol":"🌊","represents":["primordial waters","abyss","infinite"],"messages":["Like a river from primordial waters, grace carves new paths through your life."],"tier":"Mythic"},{"name":"Purusha","mythology":"Vedic Cosmogony","symbol":"🔥","represents":["cosmic being","sacrifice","universe body"],"messages":["Between earth and sky, cosmic being plants the seed of abundance in your soul."],"tier":"Mythic"},{"name":"Brahman","mythology":"Hindu Philosophy","symbol":"🔥","represents":["ultimate reality","infinite","absolute"],"messages":["By the grace of ultimate reality, radiance becomes your birthright."],"tier":"Legendary"},{"name":"Tiamat Primordial","mythology":"Babylonian Cosmogony","symbol":"🌊","represents":["salt water","chaos","dragon mother"],"messages":["Where salt water touches the earth, tenacity blossoms. So it is with you."],"tier":"Uncommon"},{"name":"Apsu Primordial","mythology":"Babylonian Cosmogony","symbol":"🌊","represents":["fresh water","calm","beginning"],"messages":["fresh water crowns you with grace. Walk boldly into what awaits."],"tier":"Common"},{"name":"Kuk","mythology":"Egyptian Cosmogony","symbol":"🌊","represents":["primordial darkness","obscurity"],"messages":["Let the serenity of primordial darkness guide your steps toward divine purpose."],"tier":"Uncommon"},{"name":"Ananke","mythology":"Greek Cosmogony","symbol":"⚔️","represents":["necessity","inevitability","compulsion"],"messages":["A sacred flame binds you to necessity. Let nothing dim your sacred fire."],"tier":"Legendary"},{"name":"Chronos Primordial","mythology":"Greek Cosmogony","symbol":"🌬","represents":["time","endless","ages"],"messages":["A sacred gift binds you to time. Your time of awakening has come."],"tier":"Epic"},{"name":"Phanes","mythology":"Orphic Cosmogony","symbol":"🔥","represents":["light","creation","golden wings","first-born"],"messages":["From light's realm, a gift of power descends upon you now."],"tier":"Legendary"},{"name":"Aion","mythology":"Greco-Roman Cosmogony","symbol":"🌬","represents":["eternal time","zodiac","unbounded"],"messages":["The essence of eternal time resonates in your heart, granting serenity beyond measure."],"tier":"Epic"},{"name":"Mbombo","mythology":"Kuba Cosmogony","symbol":"🔥","represents":["white giant","vomit creation","sun"],"messages":["When Fire meets tenacity, the impossible becomes your reality."],"tier":"Common"},{"name":"Coatlicue Primordial","mythology":"Aztec Cosmogony","symbol":"🌍","represents":["serpent skirt","earth","life-death"],"messages":["Through the portal of serpent skirt, infinite brilliance awaits your embrace."],"tier":"Rare"},{"name":"Kamuy","mythology":"Ainu Cosmogony","symbol":"🌬","represents":["divine nature","spirits","all things"],"messages":["The Air within you aligns with divine nature, creating unstoppable harmony."],"tier":"Common"},{"name":"Io","mythology":"Polynesian Cosmogony","symbol":"🌬","represents":["supreme being","parentless","first"],"messages":["Like a river from supreme being, harmony carves new paths through your life."],"tier":"Common"},{"name":"Wakan Tanka","mythology":"Lakota Cosmogony","symbol":"🌬","represents":["great mystery","sacred","everything"],"messages":["In the presence of great mystery, even shadows become brilliance."],"tier":"Mythic"},{"name":"Teotl","mythology":"Aztec Philosophy","symbol":"🔥","represents":["divine force","sacred energy","ever-moving"],"messages":["Ancient light stirs within as divine force recognizes your worth."],"tier":"Rare"},{"name":"Akasha","mythology":"Hindu-Buddhist","symbol":"🌬","represents":["ether","space","void","fifth element"],"messages":["In ether's light, your current shines with renewed purpose."],"tier":"Epic"},{"name":"The Nameless Witness","mythology":"Unknown","symbol":"🌬","represents":["observation","silence","memory"],"messages":["The Air speaks through observation, carrying a message of radiance for you."],"tier":"Legendary"},{"name":"Echo of the Forgotten Shrine","mythology":"Unknown","symbol":"🌍","represents":["echoes","sacred places","remnants"],"messages":["The tide that shaped echoes now shapes your future. Joy and fulfillment are your sacred inheritance."],"tier":"Epic"},{"name":"The Weaver Between Stars","mythology":"Unknown","symbol":"🌬","represents":["fate","cosmos","threads","connection"],"messages":["fate has marked you with wisdom. Embrace this sacred gift."],"tier":"Epic"},{"name":"Keeper of Closed Doors","mythology":"Unknown","symbol":"⚔️","represents":["secrets","barriers","hidden paths"],"messages":["From the depths of secrets, serenity rises to meet your spirit. Nothing can diminish the light within you."],"tier":"Uncommon"},{"name":"The Dreaming Tide","mythology":"Unknown","symbol":"🌊","represents":["dreams","ocean","subconscious","flow"],"messages":["The flame of ages past flows through dreams into your being. The cosmos celebrates your existence."],"tier":"Common"},{"name":"Ember of the First Dawn","mythology":"Unknown","symbol":"🔥","represents":["beginning","fire","hope","primeval light"],"messages":["The ancient force of beginning awakens within your spirit. Transformation awaits at every crossroad."],"tier":"Epic"},{"name":"The Silent Root","mythology":"Unknown","symbol":"🌍","represents":["underground","growth","patience","hidden strength"],"messages":["The ancient force of underground awakens within your spirit. Abundance flows to you from every direction."],"tier":"Uncommon"},{"name":"Voice of the Hollow Mountain","mythology":"Unknown","symbol":"🌍","represents":["resonance","emptiness","echoing wisdom"],"messages":["Between earth and sky, resonance plants the seed of abundance in your soul."],"tier":"Rare"},{"name":"The Wandering Mist","mythology":"Unknown","symbol":"🌊","represents":["travel","obscurity","gentle passage"],"messages":["When Water meets truth, the impossible becomes your reality."],"tier":"Common"},{"name":"Glimmer of the Last Star","mythology":"Unknown","symbol":"🔥","represents":["endings","hope","tiny light","perseverance"],"messages":["You are the living testament of endings's breath. Stand tall in your divine inheritance."],"tier":"Rare"},{"name":"The Unspoken Name","mythology":"Unknown","symbol":"🌬","represents":["language","power","forgotten words"],"messages":["The Air of language dances through your veins. Rise and claim your destiny."],"tier":"Common"},{"name":"Shade of the Ancient Grove","mythology":"Unknown","symbol":"🌿","represents":["forests","memory","ancestors","shade"],"messages":["The Wood of forests purifies your spirit, leaving only patience."],"tier":"Uncommon"},{"name":"The Breath Before Words","mythology":"Unknown","symbol":"🌬","represents":["potential","silence","anticipation"],"messages":["The sacred fires of potential forge within you an unbreakable brilliance."],"tier":"Common"},{"name":"Guardian of the Threshold","mythology":"Unknown","symbol":"⚔️","represents":["boundaries","transitions","protection"],"messages":["The sacred fires of boundaries forge within you an unbreakable harmony."],"tier":"Rare"},{"name":"Song of the Buried River","mythology":"Unknown","symbol":"🌊","represents":["hidden flows","music","underground water"],"messages":["The sacred fires of hidden flows forge within you an unbreakable purity."],"tier":"Rare"},{"name":"The Faceless Keeper","mythology":"Unknown","symbol":"🌍","represents":["anonymity","guardianship","eternal watch"],"messages":["The Earth of anonymity dances through your veins. Let nothing dim your sacred fire."],"tier":"Rare"},{"name":"Whisper of the Crescent Void","mythology":"Unknown","symbol":"🌊","represents":["emptiness","moon shadow","stillness"],"messages":["Sacred resonance flows from emptiness to illuminate your journey. Peace and prosperity follow in your wake."],"tier":"Common"},{"name":"The Iron Dreamer","mythology":"Unknown","symbol":"⚔️","represents":["metal","sleep","unbreakable visions"],"messages":["By the grace of metal, clarity becomes your birthright."],"tier":"Uncommon"},{"name":"Samshin Halmoni","mythology":"Korea","symbol":"🌍","represents":["Birth","fertility","three spirits"],"messages":["ปกป้องการเกิดและเด็กทารก บันดาลโชคให้ทายาท"],"tier":"Legendary"},{"name":"Dangun","mythology":"Korea","symbol":"🌿","represents":["Foundation","nation","bear totem"],"messages":["ให้พลังผู้ก่อตั้ง พลังงานบุกเบิกและวางรากฐาน"],"tier":"Mythic"},{"name":"Hwanung","mythology":"Korea","symbol":"🔥","represents":["Heaven descending","law","culture"],"messages":["เชื่อมฟ้าและดิน ให้ปัญญาในการปกครองและผู้นำ"],"tier":"Legendary"},{"name":"Dokkaebi","mythology":"Korea","symbol":"⚔️","represents":["Trickster","luck","justice"],"messages":["ไขประตูโชคลาภและทดสอบความซื่อสัตย์"],"tier":"Common"},{"name":"Jeseokcheon","mythology":"Korea","symbol":"🌊","represents":["Indra","celestial king","wisdom"],"messages":["ให้สติปัญญาและความสงบภายใน"],"tier":"Legendary"},{"name":"Baridegi","mythology":"Korea","symbol":"🌊","represents":["Shamanic guide","underworld","healing"],"messages":["นำทางวิญญาณและช่วยให้ผ่านช่วงเปลี่ยนสำคัญ"],"tier":"Legendary"},{"name":"Seonangshin","mythology":"Korea","symbol":"🌍","represents":["Village guardian","community"],"messages":["ปกป้องชุมชน ให้ความสามัคคีและเครือข่ายมนุษย์"],"tier":"Common"},{"name":"Habaek","mythology":"Korea","symbol":"🌊","represents":["River god","water deity"],"messages":["ให้พลังงานน้ำ ความยืดหยุ่นและการไหล"],"tier":"Legendary"},{"name":"Eoljjeong","mythology":"Korea","symbol":"⚔️","represents":["Clarity spirit","decision"],"messages":["ให้ clarity ในช่วงสับสนและช่วยตัดสินใจ"],"tier":"Common"},{"name":"Chamsuri","mythology":"Korea","symbol":"🔥","represents":["Star spirit","loyalty","purpose"],"messages":["บันดาลโชคให้ผู้ที่จงรักภักดีและมีเป้าหมายชัดเจน"],"tier":"Legendary"},{"name":"Palden Lhamo","mythology":"Tibet","symbol":"🔥","represents":["Wrathful protector","dharma guardian"],"messages":["ปกป้องจากสิ่งชั่วร้ายและให้กำลังใจฝ่าอุปสรรค"],"tier":"Legendary"},{"name":"Manjushri","mythology":"Tibet / India","symbol":"🌿","represents":["Wisdom","learning","discriminating awareness"],"messages":["เปิดปัญญาล้ำลึก บันดาลโชคด้านการเรียนและการสื่อสาร"],"tier":"Mythic"},{"name":"Tara (Green)","mythology":"Tibet / India","symbol":"🌿","represents":["Swift liberation","active compassion"],"messages":["ช่วยเหลือในยามฉุกเฉิน ให้ความรวดเร็วและประสิทธิภาพ"],"tier":"Mythic"},{"name":"Mahakala","mythology":"Tibet","symbol":"⚔️","represents":["Wrathful time","destruction of obstacles"],"messages":["ทำลายอุปสรรคและศัตรู ให้พลังปกป้องอย่างเด็ดขาด"],"tier":"Legendary"},{"name":"Vajrapani","mythology":"Tibet / India","symbol":"⚔️","represents":["Power","strength","lightning"],"messages":["ให้พลังกาย ใจ และวาจาที่เข้มแข็ง"],"tier":"Legendary"},{"name":"Sipaime","mythology":"Tibet","symbol":"🌍","represents":["Wheel of existence","cosmology","karma"],"messages":["เปิดเผยจักรวาลวิทยาและเส้นทางชีวิต ปกป้องจากกรรมเก่า"],"tier":"Legendary"},{"name":"Nyenchen Tanglha","mythology":"Tibet","symbol":"🌍","represents":["Mountain deity","endurance","sovereignty"],"messages":["ให้กำลังสู่ความสำเร็จในสภาพแวดล้อมที่ยากลำบาก"],"tier":"Legendary"},{"name":"Nechung","mythology":"Tibet","symbol":"⚔️","represents":["State oracle","prophecy","revelation"],"messages":["เปิดเผยความจริงซ่อนเร้นและทิศทางชีวิต"],"tier":"Legendary"},{"name":"Dorje Shugden","mythology":"Tibet","symbol":"🔥","represents":["Fortune","clarity","practice protector"],"messages":["ให้ความชัดเจนและทิศทางในการปฏิบัติธรรมและชีวิตประจำวัน"],"tier":"Legendary"},{"name":"Tsepame","mythology":"Tibet / India","symbol":"🔥","represents":["Amitayus","longevity","vital energy"],"messages":["ยืดอายุและเสริมสุขภาพ พลังงานชีวิตยาวนาน"],"tier":"Mythic"},{"name":"Al-Lat","mythology":"Arabia","symbol":"🌍","represents":["Mother goddess","fertility","sun"],"messages":["ให้ความอุดมสมบูรณ์ ปกป้องและบำรุงรักษา"],"tier":"Legendary"},{"name":"Al-Uzza","mythology":"Arabia","symbol":"🔥","represents":["Might","Venus","dawn star"],"messages":["ให้พลังงานและชัยชนะ เสริมความกล้าหาญ"],"tier":"Legendary"},{"name":"Manat","mythology":"Arabia","symbol":"🌊","represents":["Fate","destiny","time"],"messages":["ชี้นำโชคชะตาและบันทึกการกระทำ เป็นพยานให้คำสาบาน"],"tier":"Legendary"},{"name":"Khidr","mythology":"Middle East","symbol":"🌊","represents":["Immortal guide","esoteric wisdom","water of life"],"messages":["เป็นผู้นำทางให้ผู้ที่แสวงหาความจริง ปรากฏในยามวิกฤต"],"tier":"Mythic"},{"name":"Iblis (as cosmic force)","mythology":"Islam / Sufi","symbol":"🔥","represents":["Shadow","test","refusal of prostration"],"messages":["ตัวแทนการทดสอบและการเติบโตผ่านความขัดแย้ง"],"tier":"Epic"},{"name":"Ruh al-Qudus","mythology":"Islam","symbol":"🌿","represents":["Holy Spirit","inspiration","divine breath"],"messages":["นำพาแรงบันดาลใจและการเปิดเผยความจริง"],"tier":"Mythic"},{"name":"Israfil","mythology":"Islam","symbol":"⚔️","represents":["Trumpet","resurrection","music"],"messages":["ให้เสียงที่มีพลัง บันดาลโชคในการสื่อสารและดนตรี"],"tier":"Legendary"},{"name":"Ridwan","mythology":"Islam","symbol":"🔥","represents":["Guardian of paradise","reward"],"messages":["เป็นผู้ดูแลรางวัลและผลของความดีงาม"],"tier":"Legendary"},{"name":"Maalik","mythology":"Islam","symbol":"⚔️","represents":["Guardian of hell","accountability"],"messages":["เตือนให้ระวังผลกรรม สนับสนุนความรับผิดชอบ"],"tier":"Legendary"},{"name":"Harut and Marut","mythology":"Babylon / Islam","symbol":"🌊","represents":["Angelic knowledge","forbidden wisdom"],"messages":["ให้ความเข้าใจในเรื่องเร้นลับ แต่เตือนถึงอันตราย"],"tier":"Epic"},{"name":"Metatron","mythology":"Judaism / Kabbalah","symbol":"🔥","represents":["Scribe of God","Keter","Ain Soph"],"messages":["เชื่อมต่อมนุษย์กับ divine blueprint บันทึกวิญญาณและโชคชะตา"],"tier":"Mythic"},{"name":"Sandalphon","mythology":"Judaism / Kabbalah","symbol":"🌍","represents":["Prayer","earthly connection","Malkuth"],"messages":["รับส่งคำอธิษฐานและความปรารถนาลึกสุดไปยังจักรวาล"],"tier":"Mythic"},{"name":"Raziel","mythology":"Judaism / Kabbalah","symbol":"🌊","represents":["Secrets","Chokmah","divine mysteries"],"messages":["เปิดเผยความลับจักรวาลและให้ปัญญา hidden knowledge"],"tier":"Legendary"},{"name":"Tzaphkiel","mythology":"Judaism / Kabbalah","symbol":"🌊","represents":["Understanding","Binah","contemplation"],"messages":["บันดาลความเข้าใจลึกซึ้งและเห็นอกเห็นใจ"],"tier":"Legendary"},{"name":"Tzadkiel","mythology":"Judaism / Kabbalah","symbol":"🌿","represents":["Mercy","Chesed","abundance"],"messages":["ให้ความเมตตาและขยาย โชคลาภและความมั่งคั่ง"],"tier":"Legendary"},{"name":"Camael","mythology":"Judaism / Kabbalah","symbol":"🔥","represents":["Strength","Geburah","Mars energy"],"messages":["ให้พลังงานและความกล้าหาญ เสริมกำลังในการเผชิญความท้าทาย"],"tier":"Legendary"},{"name":"Haniel","mythology":"Judaism / Kabbalah","symbol":"🌿","represents":["Beauty","Netzach","Venus","love"],"messages":["เปิดหัวใจให้รัก ให้ความงามและความสัมพันธ์ที่ดี"],"tier":"Legendary"},{"name":"Michael","mythology":"Judaism / Kabbalah","symbol":"🔥","represents":["Protection","sun","Tiphareth"],"messages":["ให้ความกล้าหาญ ปกป้องจากสิ่งชั่วร้าย นำทางด้วยแสงสว่าง"],"tier":"Mythic"},{"name":"Gabriel","mythology":"Judaism / Kabbalah","symbol":"🌊","represents":["Messenger","moon","Yesod"],"messages":["นำพาข่าวสารและแรงบันดาลใจ ปลุกพลังงานสร้างสรรค์"],"tier":"Mythic"},{"name":"Uriel","mythology":"Judaism / Kabbalah","symbol":"🌍","represents":["Light of God","earth","Malkuth"],"messages":["ให้แสงสว่างในความมืดมนและปัญญาในวิกฤต"],"tier":"Legendary"},{"name":"Ahura Mazda","mythology":"Persia / Zoroastrian","symbol":"🔥","represents":["Wise Lord","light","truth (Asha)"],"messages":["ให้ปัญญา ความจริง และแสงสว่างในชีวิต"],"tier":"Mythic"},{"name":"Sraosha","mythology":"Persia / Zoroastrian","symbol":"⚔️","represents":["Obedience","discipline","divine word"],"messages":["นำพาคำสั่งสอนของจักรวาล เสริมวินัยและความฟังคำ"],"tier":"Legendary"},{"name":"Mithra","mythology":"Persia / Zoroastrian","symbol":"🔥","represents":["Covenant","friendship","sun","contracts"],"messages":["ให้พันธสัญญาที่แน่วแน่และมิตรภาพที่ยั่งยืน"],"tier":"Legendary"},{"name":"Anahita","mythology":"Persia / Zoroastrian","symbol":"🌊","represents":["Waters","fertility","purity","Venus"],"messages":["ให้ความอุดมสมบูรณ์ บริสุทธิ์ และพลังงานหญิง"],"tier":"Legendary"},{"name":"Asha Vahishta","mythology":"Persia / Zoroastrian","symbol":"🔥","represents":["Best truth","righteousness","fire"],"messages":["เสริมความถูกต้อง คุณธรรม และไฟแห่งความจริง"],"tier":"Mythic"},{"name":"Vohu Manah","mythology":"Persia / Zoroastrian","symbol":"🌿","represents":["Good mind","cattle","divine thought"],"messages":["เปิดจิตที่ดีงามและบันดาลแรงบันดาลใจสร้างสรรค์"],"tier":"Mythic"},{"name":"Spenta Armaiti","mythology":"Persia / Zoroastrian","symbol":"🌍","represents":["Holy devotion","earth","humility"],"messages":["ให้ความอ่อนน้อม ความอุดมสมบูรณ์ของแผ่นดิน"],"tier":"Mythic"},{"name":"Khshathra Vairya","mythology":"Persia / Zoroastrian","symbol":"⚔️","represents":["Desirable dominion","sky","metal"],"messages":["ให้อำนาจที่ชอบธรรมและความกล้าหาญปกครอง"],"tier":"Mythic"},{"name":"Verethraghna","mythology":"Persia / Zoroastrian","symbol":"🔥","represents":["Victory","war","boar","raptor"],"messages":["ให้ชัยชนะและพลังงานเอาชนะอุปสรรค"],"tier":"Legendary"},{"name":"Haoma","mythology":"Persia / Zoroastrian","symbol":"🌿","represents":["Sacred plant","healing","immortality"],"messages":["ให้สุขภาพดีและความมีชีวิตชีวา พลังงานในการรักษา"],"tier":"Legendary"},{"name":"Baiame","mythology":"Australia - Wiradjuri","symbol":"🌊","represents":["Sky father","creation","law"],"messages":["ให้กฎจักรวาลและบันดาลความสมดุลในชีวิต"],"tier":"Mythic"},{"name":"Rainbow Serpent","mythology":"Australia - Broad","symbol":"🌊","represents":["Creation","water","transformation"],"messages":["ปกป้องแหล่งน้ำ นำพาการเปลี่ยนแปลงและการเกิดใหม่"],"tier":"Mythic"},{"name":"Bunjil","mythology":"Australia - Kulin","symbol":"🌿","represents":["Wedge-tail eagle","creator","wisdom"],"messages":["ให้ปัญญาของนกอินทรี มองเห็นภาพรวมและเข้าใจสถานการณ์"],"tier":"Mythic"},{"name":"Wandjina","mythology":"Australia - Kimberley","symbol":"🌊","represents":["Rain","clouds","lightning","fertility"],"messages":["นำฝนและความอุดมสมบูรณ์ ให้โอกาสใหม่หลังภัยแล้ง"],"tier":"Legendary"},{"name":"Tiddalik","mythology":"Australia - Broad","symbol":"🌊","represents":["Greed","hoarding","flood"],"messages":["เตือนให้รู้จักพอดี ไม่กักตุนหรือขาดการแบ่งปัน"],"tier":"Epic"},{"name":"Namarrkun","mythology":"Australia - Arnhem Land","symbol":"⚔️","represents":["Lightning spirit","monsoon","electricity"],"messages":["ให้พลังงานฟ้าแลบและแรงบันดาลใจอย่างฉับพลัน"],"tier":"Legendary"},{"name":"Djang'kawu","mythology":"Australia - Yolŋu","symbol":"🌊","represents":["Creation sisters","water","sacred design"],"messages":["เปิดเส้นทางสร้างสรรค์และเริ่มต้นสิ่งใหม่"],"tier":"Legendary"},{"name":"Mimi Spirits","mythology":"Australia - Arnhem Land","symbol":"🌿","represents":["Art","teaching","thin rock spirits"],"messages":["ให้ศิลปะ การบอกเล่าเรื่องราว และการถ่ายทอดความรู้"],"tier":"Common"},{"name":"Yowie","mythology":"Australia - Broad","symbol":"🌿","represents":["Wild nature","mystery","boundaries"],"messages":["เตือนให้เคารพธรรมชาติและสิ่งที่ไม่รู้จัก"],"tier":"Epic"},{"name":"Altjira","mythology":"Australia - Aranda","symbol":"🌍","represents":["Dreamtime father","sky","emu feet"],"messages":["ให้พักพิงในความฝันและนำพาวิสัยทัศน์ลึกซึ้ง"],"tier":"Mythic"},{"name":"Wakan Tanka","mythology":"Lakota / Sioux","symbol":"🔥","represents":["Great Spirit","everything","universe"],"messages":["เชื่อมต่อกับ Great Mystery ให้ทิศทางและความหมายในชีวิต"],"tier":"Mythic"},{"name":"Coyote","mythology":"Plains / Southwest","symbol":"🌿","represents":["Trickster","change","creativity","humor"],"messages":["ให้ความยืดหยุ่นและปัญญาในการแก้ปัญหาด้วยอารมณ์ขัน"],"tier":"Epic"},{"name":"White Buffalo Calf Woman","mythology":"Lakota","symbol":"🌍","represents":["Sacred teachings","covenant","buffalo"],"messages":["นำพาพิธีกรรมศักดิ์สิทธิ์และรักษาสมดุลระหว่างโลกและฟ้า"],"tier":"Mythic"},{"name":"Raven","mythology":"Northwest Coast","symbol":"⚔️","represents":["Light bringer","creator","trickster"],"messages":["เปิดเผยความจริงซ่อนเร้นและนำแสงสว่างมาสู่โลก"],"tier":"Legendary"},{"name":"Spider Grandmother","mythology":"Hopi / Pueblo","symbol":"🌍","represents":["Creation weaver","wisdom","earth"],"messages":["ให้ปัญญาของผู้สูงวัยและเชื่อมทุกสิ่งเข้าหากัน"],"tier":"Mythic"},{"name":"Thunderbird","mythology":"Broad North America","symbol":"⚔️","represents":["Thunder","lightning","power","protection"],"messages":["ให้พลังงานของฟ้าร้องและปกป้องจากความชั่วร้าย"],"tier":"Legendary"},{"name":"Bear Spirit","mythology":"Broad North America","symbol":"🌍","represents":["Healing","strength","introspection"],"messages":["ให้พลังงานการรักษาและความแข็งแกร่งจากภายใน"],"tier":"Legendary"},{"name":"Kokopelli","mythology":"Southwest / Anasazi","symbol":"🌿","represents":["Music","fertility","trader","storytelling"],"messages":["นำดนตรีและความอุดมสมบูรณ์ เปิดหัวใจให้ความสุข"],"tier":"Legendary"},{"name":"Sedna","mythology":"Inuit","symbol":"🌊","represents":["Sea","marine life","sacrifice","fingers"],"messages":["ให้ความอุดมสมบูรณ์จากท้องทะเลและสอนการยอมรับ"],"tier":"Legendary"},{"name":"Gitchi Manitou","mythology":"Anishinaabe","symbol":"🔥","represents":["Great Mystery","benevolent spirit"],"messages":["ให้แสงสว่างภายในและเชื่อมทุกสิ่งด้วยความรัก"],"tier":"Mythic"}];
/* GODS_FULL_END */
async function loadGods(){
  if (GODS_LOADED) return;
  // Offline-first: use embedded GODS_FULL. Still try external fetch
  // in case a newer dataset is served when hosted online — but file://
  // runs will fall through immediately.
  try {
    const r = await fetch("../data/gods.json");
    if (r && r.ok) {
      const raw = await r.json();
      if (Array.isArray(raw) && raw.length > GODS_FULL.length) {
        GODS = raw; GODS_LOADED = true; return;
      }
    }
  } catch (e) { /* fall through to inline */ }
  if (typeof GODS_FULL !== "undefined" && Array.isArray(GODS_FULL)) {
    GODS = GODS_FULL; GODS_LOADED = true; return;
  }
  GODS = []; GODS_LOADED = true;
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
function randMsg(g){const m=g.messages||[];return m.length?m[Math.floor(Math.random()*m.length)]:'—';}

// ════════════════════════════════════════
// GOD BLESSING
// ════════════════════════════════════════
const MAX_DRAWS=3;let draws=0,blessHistory=[];
function updateBlessingStatus(){const el=document.getElementById('blessingStatus');if(!el)return;const l=MAX_DRAWS-draws;el.textContent=l>0?`${l} ${t('blessing_draws_left')}`:t('blessing_used');renderBlessingRecentPreview();}
function renderBlessingRecentPreview(){
  const wrap=document.getElementById('blessingRecentPreview');
  const list=document.getElementById('blessingRecentList');
  const title=document.getElementById('blessingRecentTitle');
  const more=document.getElementById('blessingRecentMore');
  if(!wrap||!list)return;
  // Only show preview when today's card area is empty (no draw shown yet this session).
  const card=document.getElementById('godCard');
  const cardRevealed=card && card.classList.contains('revealed');
  if(cardRevealed){wrap.style.display='none';return;}
  const all=(typeof getFullHistory==='function')?getFullHistory():[];
  const past=all.filter(h=>h&&h.type==='blessing').slice(0,3);
  const isTh=(typeof LANG!=='undefined'&&LANG==='th');
  if(title) title.textContent = isTh ? '✦ บันทึกพรล่าสุด ✦' : '✦ RECENT BLESSINGS ✦';
  if(more)  more.textContent  = isTh ? 'ดูประวัติทั้งหมด →' : 'VIEW ALL HISTORY →';
  if(!past.length){
    list.innerHTML = `<div style="text-align:center;padding:14px 8px;font-family:'Cormorant Garamond',serif;font-size:13px;color:var(--muted);line-height:1.6;font-style:italic">${isTh?'ยังไม่มีบันทึกพร — กดปุ่มด้านบนเพื่อรับพรจากเทพองค์แรก':'No blessings yet — tap the button above to receive your first divine message'}</div>`;
    wrap.style.display='block';
    return;
  }
  list.innerHTML = past.map(h=>`
    <div style="display:flex;align-items:center;gap:10px;padding:9px 8px;border-bottom:1px solid var(--border);font-family:'Cormorant Garamond',serif">
      <div style="font-size:20px;line-height:1;flex-shrink:0">${h.godSymbol||'✦'}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h.godName||'?'} <span style="color:var(--muted);font-size:11px">· ${h.godOrigin||''}</span></div>
        ${h.message?`<div style="font-size:11.5px;color:var(--muted);font-style:italic;margin-top:2px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">"${h.message}"</div>`:''}
      </div>
      <div style="font-size:9.5px;color:var(--gold2);font-family:'Josefin Sans',sans-serif;letter-spacing:1px;flex-shrink:0">${h.date||''}</div>
    </div>`).join('');
  wrap.style.display='block';
}
async function drawBlessing(){
  if(draws>=MAX_DRAWS)return;
  await loadGods();
  const T=pickTier(),pool=godsOfTier(T),god=pool[Math.floor(Math.random()*pool.length)];draws++;
  const card=document.getElementById('godCard');card.classList.remove('revealed');void card.offsetWidth;
  document.getElementById('tierBadge').textContent=LANG==='th'?T.nameTH:T.nameEN;
  document.getElementById('tierBadge').style.cssText=`background:${T.color}22;color:${T.color};border:1px solid ${T.color}55`;
  document.getElementById('godSymbol').textContent=god.symbol||'✦';
  document.getElementById('godName').textContent=god.name;
  document.getElementById('godOrigin').textContent=god.mythology||'';
  document.getElementById('godMessage').textContent='"'+randMsg(god)+'"';
  document.getElementById('godRepresents').textContent=(god.represents||[]).join(' · ');
  card.classList.add('revealed');updateBlessingStatus();blessHistory.unshift({T,god});renderHistory();saveBlessings();saveBlessingToHistory(god, T);
  if(draws>=MAX_DRAWS){const b=document.getElementById('drawBtn');b.disabled=true;b.textContent=t('blessing_used');}
}
function renderHistory(){
  const el=document.getElementById('historyList');if(blessHistory.length<2){el.innerHTML='';return;}
  el.innerHTML=`<div style="font-family:'Josefin Sans',sans-serif;font-size:9px;color:var(--muted);letter-spacing:2px;margin-bottom:7px;text-align:center">${t('blessing_history').toUpperCase()}</div>`+
    blessHistory.slice(1).map(h=>`<div class="history-item"><span style="color:${h.T.color}">${LANG==='th'?h.T.nameTH:h.T.nameEN}</span><span>${h.god.symbol||''} ${h.god.name}</span><span style="color:var(--muted);font-size:10px">${h.god.mythology||''}</span></div>`).join('');
}

// ════════════════════════════════════════
// 108 ORGANUM — WORD FREQUENCY VOTING
// ════════════════════════════════════════
let organumRunning=false;
let _lastWordData=null,_activeWord=null,_lastGodContrib=null;

function updateWordBars(wordCount,activeWord){
  const barsEl=document.getElementById('atBars');if(!barsEl)return;
  const entries=Object.entries(wordCount).sort((a,b)=>b[1].count-a[1].count).slice(0,12);
  if(!entries.length){barsEl.innerHTML='';return;}
  const maxC=entries[0][1].count||1;
  barsEl.innerHTML=entries.map(([w,d])=>{
    const isActive=w===activeWord;
    const esc=w.replace(/'/g,"\\'");
    return`<div class="at-row" onclick="selectWord('${esc}')" style="cursor:pointer;padding:3px 0">
      <div class="at-icon" style="font-size:10px;width:26px;color:var(--muted);text-align:right;flex-shrink:0">${d.count}×</div>
      <div class="at-label" style="width:85px;color:${isActive?'var(--gold)':'var(--text)'};font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${w}</div>
      <div class="at-track"><div class="at-fill" style="width:${(d.count/maxC*100).toFixed(0)}%;background:${isActive?'var(--gold)':'var(--gold3)'};transition:width .2s"></div></div>
      <div class="at-count">${d.count}</div>
    </div>`;
  }).join('');
}

async function runOrganum(){
  const q=document.getElementById('questionInput').value.trim();
  if(!q){alert(t('no_question'));return;}
  if(organumRunning)return;
  organumRunning=true;
  await loadGods();
  document.getElementById('oracleBtn').disabled=true;
  document.getElementById('consensusBox').classList.remove('active');
  document.getElementById('voteArena').classList.add('active');
  document.getElementById('atBars').innerHTML='';

  // Pick 108 gods (extend pool if needed)
  const src=[...GODS];
  while(src.length<108)src.push(...GODS);
  const tmp=[...src];const pool=[];
  for(let i=0;i<108;i++)pool.push(tmp.splice(Math.floor(Math.random()*tmp.length),1)[0]);

  const wordCount={};   // word → {count, gods:[]}
  const godContrib={};  // godName → {god, total keyword contributions}
  const ticker=document.getElementById('godTicker');
  const countEl=document.getElementById('voteCount');
  let voted=0;

  const iv=setInterval(()=>{
    if(voted>=108){clearInterval(iv);showOrganumResult(wordCount,godContrib);return;}
    const god=pool[voted];voted++;
    countEl.textContent=voted;
    const kws=(god.represents||[]);
    const sayingLabel=LANG==='th'?'พูดถึง:':'is saying:';
    ticker.textContent=`${god.symbol||'✦'} ${god.name} ${sayingLabel} ${kws.join(' · ')||'—'}`;

    // Tally each represents word
    kws.forEach(word=>{
      if(!wordCount[word])wordCount[word]={count:0,gods:[]};
      wordCount[word].count++;
      wordCount[word].gods.push(god);
    });
    // Track per-god total word contributions (loudness)
    if(!godContrib[god.name])godContrib[god.name]={god,total:0};
    godContrib[god.name].total+=kws.length;

    if(voted%3===0||voted===108)updateWordBars(wordCount,_activeWord);

    // Live loudest pair (by total keyword contribution)
    if(voted>15){
      const sorted=Object.values(godContrib).sort((a,b)=>b.total-a.total);
      const g1=sorted[0]?.god,g2=sorted.find(x=>x.god.name!==g1?.name)?.god;
      if(g1){document.getElementById('liveLoudPair').style.display='grid';fillLoudBox('ll1',g1);}
      if(g2)fillLoudBox('ll2',g2);
    }
  },22);
}

function fillLoudBox(prefix,god){
  document.getElementById(prefix+'sym').textContent=god.symbol||'✦';
  document.getElementById(prefix+'name').textContent=god.name;
  document.getElementById(prefix+'origin').textContent=god.mythology||'—';
  document.getElementById(prefix+'reps').textContent=(god.represents||[]).slice(0,5).join(' · ');
}

function showOrganumResult(wordCount,godContrib){
  _lastWordData=wordCount;_lastGodContrib=godContrib;
  const entries=Object.entries(wordCount).sort((a,b)=>b[1].count-a[1].count);
  const top1=entries[0],top2=entries[1];

  // Primary word
  if(top1){
    document.getElementById('crsIcon').textContent='✦';
    document.getElementById('crsType').textContent=top1[0].toUpperCase();
    const n1=top1[1].count;
    document.getElementById('crsSub').textContent=LANG==='th'?`${n1} เทพพูดถึงคำนี้`:`${n1} gods named this`;
    document.getElementById('crsMsg').textContent=LANG==='th'
      ?`เสียงส่วนใหญ่ของ 108 เทพกำลังชี้ไปที่ "${top1[0]}" — นี่คือสิ่งที่จักรวาลต้องการสื่อถึงคุณในขณะนี้`
      :`The collective voice of 108 gods points to "${top1[0]}" — this is what the universe is directing your attention toward right now.`;
  }
  // Secondary word
  if(top2){
    document.getElementById('secIcon').textContent='∿';
    document.getElementById('secName').textContent=top2[0].toUpperCase();
    const n2=top2[1].count;
    document.getElementById('secMsg').textContent=LANG==='th'?`${n2} เทพ · ${LANG==='th'?'ก็พูดถึงคำนี้ด้วย':''}`:`${n2} gods · also heard clearly`;
  }

  // Loudest gods = top 2 by total keyword contributions
  const sorted=Object.values(godContrib).sort((a,b)=>b.total-a.total);
  const loud1=sorted[0]?.god,loud2=sorted.find(x=>x.god.name!==loud1?.name)?.god;
  if(loud1){fillLoudBox('rl1',loud1);document.getElementById('rl1msg').textContent='"'+randMsg(loud1)+'"';}
  if(loud2){fillLoudBox('rl2',loud2);document.getElementById('rl2msg').textContent='"'+randMsg(loud2)+'"';}

  // Word tabs (top 12 words)
  _activeWord=top1?.[0]||null;
  updateWordBars(wordCount,_activeWord);
  renderWordTabs(entries.slice(0,12),wordCount);
  document.getElementById('consensusBox').classList.add('active');
  // Save to persistent history
  const _q = document.getElementById('questionInput').value.trim();
  const _top = entries[0];
  const _g1 = Object.values(godContrib).sort((a,b)=>b.total-a.total)[0];
  saveOrganumToHistory(_q, _top?_top[0]:'', _top?_top[1].count:0, _g1?_g1.god.name:'', _g1?_g1.god.symbol:'');
}

function renderWordTabs(topEntries,wordCount){
  wordCount=wordCount||_lastWordData;if(!wordCount)return;
  const entries=topEntries||Object.entries(wordCount).sort((a,b)=>b[1].count-a[1].count).slice(0,12);
  document.getElementById('typeTabs').innerHTML=entries.map(([w,d])=>{
    const esc=w.replace(/'/g,"\\'");
    return`<button class="type-tab-btn${w===_activeWord?' active':''}" data-word="${w}" onclick="selectWord('${esc}')">${w} <span style="opacity:.5">(${d.count})</span></button>`;
  }).join('');
  if(_activeWord&&wordCount[_activeWord])renderGodChips(_activeWord,wordCount);
}

function selectWord(w){
  _activeWord=w;
  document.querySelectorAll('.type-tab-btn').forEach(b=>b.classList.toggle('active',!!(b.dataset&&b.dataset.word===w)));
  if(_lastWordData){renderGodChips(w,_lastWordData);updateWordBars(_lastWordData,w);}
}

function renderGodChips(word,wordCount){
  const gods=(wordCount[word]||{gods:[]}).gods;
  const seen=new Set(),uniq=[];
  gods.forEach(g=>{if(!seen.has(g.name)){seen.add(g.name);uniq.push(g);}});
  document.getElementById('godChipList').innerHTML=uniq.map(g=>`<div class="god-chip">${g.symbol||'✦'} ${g.name} <span>${g.mythology||''}</span></div>`).join('');
}

function resetOrganum(){
  document.getElementById('questionInput').value='';
  document.getElementById('voteArena').classList.remove('active');
  document.getElementById('consensusBox').classList.remove('active');
  document.getElementById('voteCount').textContent='0';
  document.getElementById('godTicker').textContent='—';
  document.getElementById('atBars').innerHTML='';
  document.getElementById('liveLoudPair').style.display='none';
  document.getElementById('oracleBtn').disabled=false;
  organumRunning=false;_lastWordData=null;_activeWord=null;_lastGodContrib=null;
}

// ════════════════════════════════════════
// ASTRONOMY (Meeus)
// ════════════════════════════════════════
function dateToJD(y,m,d,h=12){if(m<=2){y--;m+=12;}const A=Math.floor(y/100),B=2-A+Math.floor(A/4);return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+h/24+B-1524.5;}
function n360(x){return((x%360)+360)%360;}
function sD(d){return Math.sin(d*Math.PI/180);}
function sunLon(jd){const T=(jd-2451545)/36525,L0=n360(280.46646+36000.76983*T),M=n360(357.52911+35999.05029*T),C=(1.914602-0.004817*T)*sD(M)+(0.019993-0.000101*T)*sD(2*M)+0.000289*sD(3*M);return n360(L0+C);}
function moonLon(jd){const T=(jd-2451545)/36525,L=n360(218.3165+481267.8813*T),M=n360(357.5291+35999.0503*T),Mp=n360(134.9634+477198.8676*T),D=n360(297.8502+445267.1115*T),F=n360(93.2721+483202.0175*T);return n360(L+6.2888*sD(Mp)+1.274*sD(2*D-Mp)+0.6583*sD(2*D)+0.2136*sD(2*Mp)-0.1851*sD(M)-0.1143*sD(2*F)+0.0588*sD(2*D-2*Mp)+0.0572*sD(2*D-M-Mp)+0.0533*sD(2*D+Mp));}
function mercuryLon(jd){const T=(jd-2451545)/36525,L=n360(252.2509+149474.0722*T),M=n360(174.7948+149474.0722*T);return n360(L+23.4405*sD(M)+2.9818*sD(2*M)+0.5255*sD(3*M));}
function venusLon(jd){return n360(181.9798+58519.213*((jd-2451545)/36525));}
function marsLon(jd){const T=(jd-2451545)/36525,L=n360(355.433+19141.6964*T),M=n360(19.373+19141.6964*T);return n360(L+10.6912*sD(M)+0.6228*sD(2*M));}
function jupiterLon(jd){const T=(jd-2451545)/36525,L=n360(34.3515+3036.3027*T),M=n360(20.9+3036.3027*T);return n360(L+5.5549*sD(M)+0.1683*sD(2*M));}
function saturnLon(jd){const T=(jd-2451545)/36525,L=n360(50.0774+1223.511*T),M=n360(317.0207+1223.511*T);return n360(L+6.3585*sD(M)-0.2204*sD(2*M));}
function uranusLon(jd){const T=(jd-2451545)/36525,L=n360(314.055+429.8777*T),M=n360(142.5905+429.8777*T);return n360(L+5.3117*sD(M));}
function neptuneLon(jd){const T=(jd-2451545)/36525,L=n360(304.3487+219.8862*T),M=n360(256.228+219.8862*T);return n360(L+1.0996*sD(M));}
const PFN={Sun:sunLon,Moon:moonLon,Mercury:mercuryLon,Venus:venusLon,Mars:marsLon,Jupiter:jupiterLon,Saturn:saturnLon,Uranus:uranusLon,Neptune:neptuneLon};
function daysToNextSign(p,lon,jd){const fn=PFN[p];if(!fn)return null;const cur=Math.floor(n360(lon)/30);for(let d=1;d<=1100;d++){if(Math.floor(n360(fn(jd+d))/30)!==cur)return d;}return null;}

const ELEM_OF=['fire','earth','air','water','fire','earth','air','water','fire','earth','air','water'];
const ELEM_C={fire:'#e06040',earth:'#60a060',air:'#a0b040',water:'#4080c0'};
const SIGNS=[
  {n:'Aries',th:'เมษ',g:'♈',rep:{en:'Initiative & new beginnings',th:'ริเริ่มและจุดเริ่มต้นใหม่'}},
  {n:'Taurus',th:'พฤษภ',g:'♉',rep:{en:'Stability & endurance',th:'ความมั่นคงและความอดทน'}},
  {n:'Gemini',th:'เมถุน',g:'♊',rep:{en:'Communication & curiosity',th:'การสื่อสารและความอยากรู้'}},
  {n:'Cancer',th:'กรกฎ',g:'♋',rep:{en:'Nurturing & emotional depth',th:'การดูแลและความลึกทางอารมณ์'}},
  {n:'Leo',th:'สิงห์',g:'♌',rep:{en:'Expression & vitality',th:'การแสดงออกและความมีชีวิตชีวา'}},
  {n:'Virgo',th:'กันย์',g:'♍',rep:{en:'Refinement & discernment',th:'การฝึกฝนและความสังเกต'}},
  {n:'Libra',th:'ตุลย์',g:'♎',rep:{en:'Harmony & relationship',th:'ความสมดุลและความสัมพันธ์'}},
  {n:'Scorpio',th:'พิจิก',g:'♏',rep:{en:'Depth & transformation',th:'ความลึกและการเปลี่ยนแปลง'}},
  {n:'Sagittarius',th:'ธนู',g:'♐',rep:{en:'Expansion & truth-seeking',th:'การขยายและการค้นหาความจริง'}},
  {n:'Capricorn',th:'มกร',g:'♑',rep:{en:'Structure & discipline',th:'โครงสร้างและระเบียบวินัย'}},
  {n:'Aquarius',th:'กุมภ์',g:'♒',rep:{en:'Innovation & future-thinking',th:'นวัตกรรมและการมองไปข้างหน้า'}},
  {n:'Pisces',th:'มีน',g:'♓',rep:{en:'Compassion & transcendence',th:'ความเมตตาและการเข้าถึงจิตวิญญาณ'}},
];
function lonToSign(lon){return SIGNS[Math.floor(n360(lon)/30)];}
function lonDegIn(lon){return n360(lon)%30;}

// ════════════════════════════════════════
// TODAY'S SKY
// ════════════════════════════════════════
const PINFO={
  Sun:{sym:'☀️',role:{en:'Core identity & life force',th:'แก่นตัวตนและพลังชีวิต'}},
  Moon:{sym:'🌙',role:{en:'Emotions & instinct',th:'อารมณ์และสัญชาตญาณ'}},
  Mercury:{sym:'☿',role:{en:'Thought & communication',th:'ความคิดและการสื่อสาร'}},
  Venus:{sym:'♀',role:{en:'Relating & values',th:'ความสัมพันธ์และคุณค่า'}},
  Mars:{sym:'♂',role:{en:'Drive & action',th:'แรงขับและการกระทำ'}},
  Jupiter:{sym:'♃',role:{en:'Expansion & meaning',th:'การขยายและความหมาย'}},
  Saturn:{sym:'♄',role:{en:'Structure & mastery',th:'โครงสร้างและความเชี่ยวชาญ'}},
  Uranus:{sym:'♅',role:{en:'Change & awakening',th:'การเปลี่ยนแปลงและการตื่นรู้'}},
  Neptune:{sym:'♆',role:{en:'Imagination & spirit',th:'จินตนาการและจิตวิญญาณ'}},
};
const PORDER=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'];
let _lastSkyCards=null;


// ════════════════════════════════════════
// PLANET × SIGN MOVING-TOWARD MEANINGS
// ════════════════════════════════════════
const PLANET_TOWARD_MEANING = {
  Sun: {
    Aries:'ตัวตนถึงจุดลุกโชน พลังงานพุ่งสูง เหมาะริเริ่มสิ่งใหม่',
    Taurus:'ตัวตนแสวงหาความมั่นคง สร้างรากฐาน และรักษาสิ่งมีค่า',
    Gemini:'ตัวตนอยากเรียนรู้ สื่อสาร และเชื่อมโยงสิ่งต่างๆ',
    Cancer:'ตัวตนหันเข้าหาบ้าน ครอบครัว และพื้นที่ปลอดภัย',
    Leo:'ตัวตนเปล่งประกาย สร้างสรรค์ และต้องการการรับรู้',
    Virgo:'ตัวตนมุ่งปรับปรุง วิเคราะห์ และทำให้ดีขึ้น',
    Libra:'ตัวตนแสวงหาความสมดุล ความยุติธรรม และความสัมพันธ์',
    Scorpio:'ตัวตนดำดิ่งสู่ความลึก การเปลี่ยนแปลง และพลังที่ซ่อนอยู่',
    Sagittarius:'ตัวตนโหยหาอิสรภาพ ปัญญา และขอบฟ้าใหม่',
    Capricorn:'ตัวตนมุ่งมั่นสู่เป้าหมาย โครงสร้าง และความสำเร็จระยะยาว',
    Aquarius:'ตัวตนอยากแตกต่าง นวัตกรรม และเปลี่ยนแปลงสังคม',
    Pisces:'ตัวตนละลายเข้าสู่จักรวาล จินตนาการ และความเมตตา',
  },
  Moon: {
    Aries:'อารมณ์ระเบิดแรง ตอบสนองเร็ว ต้องการพื้นที่ระบาย',
    Taurus:'อารมณ์ต้องการความสงบ ความแน่นอน และความสุขทางกาย',
    Gemini:'อารมณ์เปลี่ยนเร็ว ต้องการพูดคุย และประมวลผลด้วยถ้อยคำ',
    Cancer:'อารมณ์ละเอียดอ่อนมากขึ้น สัญชาตญาณแม่นยำ ต้องการการดูแล',
    Leo:'อารมณ์โอบอ้อมอารี ต้องการแสดงออก และได้รับความรัก',
    Virgo:'อารมณ์วิเคราะห์ กังวลรายละเอียด ต้องการระเบียบ',
    Libra:'อารมณ์แสวงหาความกลมกลืน หลีกเลี่ยงความขัดแย้ง',
    Scorpio:'อารมณ์เข้มข้น ลึก อ่อนไหวต่อพลังซ่อนเร้น',
    Sagittarius:'อารมณ์โปร่งเบา มองบวก อยากออกไปสัมผัสโลก',
    Capricorn:'อารมณ์สงวน มีวินัย ควบคุมตัวเองได้ดีขึ้น',
    Aquarius:'อารมณ์ห่างเหิน วิเคราะห์ อยากเข้าใจมากกว่ารู้สึก',
    Pisces:'อารมณ์ฝันๆ เปราะบาง และซึมซับพลังงานรอบข้างมากเป็นพิเศษ',
  },
  Mercury: {
    Aries:'การสื่อสารตรง รวดเร็ว กล้าพูด แต่ควรระวังคำพูดรุนแรง',
    Taurus:'การสื่อสารช้าลง รอบคอบ มีน้ำหนัก เหมาะเจรจาเรื่องมูลค่า',
    Gemini:'การสื่อสารคล่องแคล่วถึงจุดสูงสุด ไอเดียพุ่ง หลายหัวข้อพร้อมกัน',
    Cancer:'การสื่อสารเต็มไปด้วยอารมณ์ ระมัดระวัง เลือกคนเชื่อใจ',
    Leo:'การสื่อสารมีสีสัน ดึงดูด ชอบเล่าเรื่อง ต้องการผู้ฟัง',
    Virgo:'การสื่อสารละเอียด วิเคราะห์ ให้ข้อมูลครบถ้วน',
    Libra:'การสื่อสารทูตสันติ ชั่งน้ำหนัก พิจารณารอบด้าน',
    Scorpio:'การสื่อสารแทงทะลุ อยากรู้ความจริง พูดน้อยแต่มีพลัง',
    Sagittarius:'การสื่อสารกว้างไกล ปรัชญา วิสัยทัศน์ใหญ่',
    Capricorn:'การสื่อสารเป็นทางการ มีจุดยืน เน้นผลลัพธ์',
    Aquarius:'การสื่อสารแหวกแนว ไอเดียล้ำ มองการณ์ไกล',
    Pisces:'การสื่อสารเป็นกวี คลุมเครือ ใช้สัญชาตญาณมากกว่าตรรกะ',
  },
  Venus: {
    Aries:'ความรักหุนหันพลันแล่น กล้าหาญ ตื่นเต้นในความสัมพันธ์ใหม่',
    Taurus:'ความรักมั่นคง เซ็กซี่ ต้องการความสุขทางกายและความปลอดภัย',
    Gemini:'ความรักต้องการการสนทนา สติปัญญา และความหลากหลาย',
    Cancer:'ความรักดูแลเอาใจใส่ ต้องการบ้านและความอบอุ่น',
    Leo:'ความรักเต็มไปด้วยละคร โรแมนติก และความฝันแบบเทพนิยาย',
    Virgo:'ความรักแสดงออกด้วยการช่วยเหลือ ความใส่ใจ และความสมบูรณ์แบบ',
    Libra:'ความรักถึงจุดสมดุล สวยงาม และต้องการความเป็นหุ้นส่วน',
    Scorpio:'ความรักเข้มข้น หึงหวง ลึกซึ้ง และเปลี่ยนแปลงชีวิต',
    Sagittarius:'ความรักต้องการอิสระ การผจญภัย และการเติบโตร่วมกัน',
    Capricorn:'ความรักมุ่งมั่น จริงจัง สร้างอนาคตร่วมกันในระยะยาว',
    Aquarius:'ความรักเป็นมิตรภาพ ต้องการความเป็นปัจเจก ไม่ชอบถูกครอบงำ',
    Pisces:'ความรักฝันๆ เสียสละ ละลายเข้าหากัน มีมนต์เสน่ห์',
  },
  Mars: {
    Aries:'พลังงานและแรงขับสูงสุด ลงมือทำได้เลย ช่วงเวลาทอง',
    Taurus:'แรงขับสะสมช้าแต่มั่นคง ทนทาน ดีสำหรับงานระยะยาว',
    Gemini:'แรงขับกระจาย ทำหลายอย่างพร้อมกัน ระวังขาดโฟกัส',
    Cancer:'แรงขับปกป้อง แต่ระมัดระวัง มักไม่กล้าตรงๆ',
    Leo:'แรงขับสร้างสรรค์ ผู้นำ แสดงออก อยากเป็นที่หนึ่ง',
    Virgo:'แรงขับละเอียด วิจารณ์ตัวเอง ต้องการความสมบูรณ์แบบ',
    Libra:'แรงขับลังเล ชั่งน้ำหนัก ดีสำหรับการเจรจา',
    Scorpio:'แรงขับเข้มข้น ไม่ยอมแพ้ พลังทะลุทะลวงทุกอย่าง',
    Sagittarius:'แรงขับโผนโจน มุ่งหน้า อยากพิชิตเป้าหมายใหญ่',
    Capricorn:'แรงขับมีวินัย ยาวนาน ไต่บันไดสำเร็จทีละขั้น',
    Aquarius:'แรงขับแหวกแนว ปฏิรูป ต่อสู้เพื่ออุดมการณ์',
    Pisces:'แรงขับลังเล ซึมซับ ดีสำหรับศิลปะและจิตวิญญาณ',
  },
  Jupiter: {
    Aries:'โอกาสขยายตัวผ่านความกล้า การริเริ่ม และความเป็นผู้นำ',
    Taurus:'โอกาสด้านการเงิน ทรัพย์สิน และความมั่งคั่งทางวัตถุ',
    Gemini:'โอกาสผ่านการเรียนรู้ การสื่อสาร และการเชื่อมต่อ',
    Cancer:'โอกาสผ่านครอบครัว บ้าน และการดูแลผู้อื่น',
    Leo:'โอกาสผ่านความสร้างสรรค์ ความกล้าแสดงออก และความเป็นผู้นำ',
    Virgo:'โอกาสผ่านการบริการ การพัฒนาทักษะ และสุขภาพ',
    Libra:'โอกาสผ่านความสัมพันธ์ หุ้นส่วน และความร่วมมือ',
    Scorpio:'โอกาสผ่านการเปลี่ยนแปลงลึก การลงทุน และความลับ',
    Sagittarius:'โอกาสขยายตัวสูงสุด การเดินทาง ปรัชญา และความรู้',
    Capricorn:'โอกาสผ่านอาชีพ สถานะ และความสำเร็จที่จับต้องได้',
    Aquarius:'โอกาสผ่านนวัตกรรม เครือข่าย และการเปลี่ยนแปลงสังคม',
    Pisces:'โอกาสผ่านจิตวิญญาณ ศิลปะ และการเชื่อมต่อกับจักรวาล',
  },
  Saturn: {
    Aries:'ต้องเรียนรู้ความอดทนในการริเริ่ม ไม่เร่งรีบจนพลาด',
    Taurus:'ต้องสร้างความมั่นคงทางการเงินอย่างมีวินัย ไม่ฟุ่มเฟือย',
    Gemini:'ต้องโฟกัสความคิด ไม่กระจัดกระจาย สื่อสารอย่างมีความรับผิดชอบ',
    Cancer:'ต้องเรียนรู้ขอบเขตทางอารมณ์ ครอบครัว และความรู้สึกปลอดภัย',
    Leo:'ต้องพิสูจน์ตัวเองด้วยผลงาน ไม่ใช่แค่ความยิ่งใหญ่',
    Virgo:'ต้องทำงานอย่างมีระบบ วินัย และยอมรับความไม่สมบูรณ์',
    Libra:'ต้องเรียนรู้ความสัมพันธ์ที่สมดุล มีขอบเขต และยุติธรรม',
    Scorpio:'ต้องเผชิญความกลัว การควบคุม และพลังงานที่ซ่อนอยู่',
    Sagittarius:'ต้องทดสอบความเชื่อ ตรวจสอบความจริง ไม่หลอกตัวเอง',
    Capricorn:'ดาวพฤหัสฯ อยู่ในบ้าน — โครงสร้างและวินัยแข็งแกร่งที่สุด',
    Aquarius:'ต้องรับผิดชอบต่อสังคม สร้างสิ่งใหม่อย่างมีระบบ',
    Pisces:'ต้องเผชิญความสับสน ข้อจำกัด และการยอมรับสิ่งที่ควบคุมไม่ได้',
  },
  Uranus: {
    Aries:'คลื่นการเปลี่ยนแปลงผ่านความกล้า การปฏิวัติตัวตน',
    Taurus:'การเปลี่ยนแปลงระบบการเงิน เทคโนโลยีโลก และทรัพย์สิน',
    Gemini:'การปฏิวัติการสื่อสาร เทคโนโลยีข้อมูล และความคิด',
    Cancer:'การเปลี่ยนแปลงโครงสร้างครอบครัว บ้าน และรากเหง้า',
    Leo:'การปฏิวัติความสร้างสรรค์ ความบันเทิง และการแสดงออก',
    Virgo:'การเปลี่ยนแปลงวิธีทำงาน สุขภาพ และเทคโนโลยีในชีวิตประจำวัน',
    Libra:'การปฏิวัติความสัมพันธ์ ความยุติธรรม และศิลปะ',
    Scorpio:'การเปลี่ยนแปลงลึก พลังงาน เทคโนโลยีนิวเคลียร์และดิจิทัล',
    Sagittarius:'การปฏิวัติความเชื่อ การศึกษา และวิสัยทัศน์โลก',
    Capricorn:'การเปลี่ยนแปลงระบบ รัฐบาล และโครงสร้างอำนาจ',
    Aquarius:'การปฏิวัติสังคม เทคโนโลยี และมนุษยธรรมถึงจุดสูงสุด',
    Pisces:'การเปลี่ยนแปลงจิตวิญญาณ ศิลปะ และสิ่งที่มองไม่เห็น',
  },
  Neptune: {
    Aries:'จินตนาการผสมความกล้า แรงบันดาลใจสูง แต่ระวังหลงตัวเอง',
    Taurus:'จินตนาการเกี่ยวกับความงาม ความสุข และความมั่งคั่ง',
    Gemini:'จินตนาการด้านการสื่อสาร บทกวี และความคิดสร้างสรรค์',
    Cancer:'จินตนาการผ่านอารมณ์ ความฝัน และความทรงจำ',
    Leo:'จินตนาการผ่านศิลปะ ความรัก และความยิ่งใหญ่',
    Virgo:'จินตนาการถูกกรองผ่านความเป็นจริงและรายละเอียด',
    Libra:'จินตนาการความรักอุดมคติ ความงาม และความสัมพันธ์สมบูรณ์แบบ',
    Scorpio:'จินตนาการดำดิ่งสู่ความลึก ลึกลับ และพลังแห่งการเปลี่ยนแปลง',
    Sagittarius:'จินตนาการกว้างไกล เสรีภาพ และการค้นหาความหมาย',
    Capricorn:'จินตนาการเกี่ยวกับความสำเร็จ มรดก และโครงสร้างอุดมคติ',
    Aquarius:'จินตนาการโลกอุดมคติ สังคมใหม่ และเทคโนโลยีแห่งอนาคต',
    Pisces:'จินตนาการและจิตวิญญาณถึงจุดสูงสุด ละลายเข้ากับจักรวาล',
  },
};

// Mapping sign name (EN) → key
const SIGN_KEY_MAP = {
  Aries:'Aries',Taurus:'Taurus',Gemini:'Gemini',Cancer:'Cancer',
  Leo:'Leo',Virgo:'Virgo',Libra:'Libra',Scorpio:'Scorpio',
  Sagittarius:'Sagittarius',Capricorn:'Capricorn',Aquarius:'Aquarius',Pisces:'Pisces'
};
function getPlanetTowardMeaning(planet, signEn) {
  const pm = PLANET_TOWARD_MEANING[planet];
  if (!pm) return null;
  return pm[SIGN_KEY_MAP[signEn]] || null;
}

function calcSky(){
  const dob=document.getElementById('profDob').value;
  if(!dob){showTab('profile');return;}
  const _sp0=dob.split('-');if(_sp0.length!==3){showTab('profile');return;}
  const[yr,mo,dy]=[+_sp0[0],+_sp0[1],+_sp0[2]];
  const tv=document.getElementById('profTime').value;let bh=12;if(tv){const[h,m]=tv.split(':').map(Number);bh=h+m/60;}
  const name=document.getElementById('profName').value.trim();
  const jdB=dateToJD(yr,mo,dy,bh);
  const now=new Date();const jdN=dateToJD(now.getFullYear(),now.getMonth()+1,now.getDate(),now.getHours()+now.getMinutes()/60);const jdY=jdN-1;
  const cards=PORDER.map(p=>{
    const fn=PFN[p],nL=fn(jdB),tL=fn(jdN),yL=fn(jdY),nS=lonToSign(nL),tS=lonToSign(tL);
    const nxtI=(Math.floor(n360(tL)/30)+1)%12,nxtS=SIGNS[nxtI],days=daysToNextSign(p,tL,jdN);
    let rxD=n360(tL)-n360(yL);if(rxD>180)rxD-=360;if(rxD<-180)rxD+=360;
    return{p,nS,nD:lonDegIn(nL).toFixed(1),tS,tD:lonDegIn(tL).toFixed(1),nxtS,days,isRx:rxD<-0.01,elem:ELEM_OF[Math.floor(n360(tL)/30)]};
  });
  document.getElementById('skyPersonName').textContent=name||'✦';
  _lastSkyCards=cards;renderSkyCards(cards);
  document.getElementById('skyBirthForm').style.display='none';
  document.getElementById('skyResults').classList.add('active');
  savePrefs();
}
// ── 5 Life-Domain sub-tab filter (MASTER-BRIEF §5.1) ──
// Planets are grouped by traditional astrological rulership.
const SKY_DOMAIN_PLANETS = {
  all:     ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'],
  career:  ['Sun','Mercury','Saturn'],
  finance: ['Venus','Jupiter','Saturn'],
  love:    ['Moon','Venus','Mars'],
  health:  ['Sun','Mars','Mercury'],
  growth:  ['Jupiter','Uranus','Neptune'],
};
let _skyDomain = 'all';
function setSkyDomain(dom){
  if(!SKY_DOMAIN_PLANETS[dom]) dom = 'all';
  _skyDomain = dom;
  document.querySelectorAll('.sky-dom-btn').forEach(b=>{
    b.classList.toggle('active', b.getAttribute('data-dom')===dom);
  });
  const hintEl = document.getElementById('skyDomHint');
  if(hintEl) hintEl.textContent = t('sky_dom_hint_'+dom);
  if(_lastSkyCards) renderSkyCards(_lastSkyCards);
}

function renderSkyCards(cards){
  const allowed = SKY_DOMAIN_PLANETS[_skyDomain] || SKY_DOMAIN_PLANETS.all;
  const filtered = cards.filter(c => allowed.includes(c.p));
  document.getElementById('planetStrip').innerHTML=filtered.map(c=>{
    const pi=PINFO[c.p],tSn=LANG==='th'?c.tS.th:c.tS.n,nSn=LANG==='th'?c.nS.th:c.nS.n,nxSn=LANG==='th'?c.nxtS.th:c.nxtS.n;
    const ec=ELEM_C[c.elem]||'var(--gold3)',tp=(parseFloat(c.tD)/30*100).toFixed(0),np=(parseFloat(c.nD)/30*100).toFixed(0);
    return`<div class="pcard">
      <div class="pcard-top"><div class="p-sym">${pi.sym}</div><div><div class="p-name">${c.p}</div><div class="p-role">${pi.role[LANG]}</div></div>${c.isRx?`<div class="rx-tag">℞ ${t('sky_rx')}</div>`:''}</div>
      <div class="pcard-body">
        <div class="pos-block">
          <div class="pos-label">${t('sky_today')}</div>
          <div class="sign-row"><div class="sign-glyph">${c.tS.g}</div><div class="sign-name-big" style="color:${ec}">${tSn}</div><div class="sign-deg">${c.tD}°</div></div>
          <div class="deg-track"><div class="deg-fill" style="width:${tp}%;background:${ec}"></div></div>
          <div class="sign-rep">${c.tS.rep[LANG]}</div>
        </div>
        <div class="pos-block">
          <div class="pos-label">${t('sky_natal')}</div>
          <div class="sign-row"><div class="sign-glyph">${c.nS.g}</div><div class="sign-name-big" style="color:var(--muted)">${nSn}</div><div class="sign-deg">${c.nD}°</div></div>
          <div class="deg-track"><div class="deg-fill" style="width:${np}%;background:var(--muted)"></div></div>
          <div class="sign-rep">${c.nS.rep[LANG]}</div>
        </div>
        <div class="toward-block" style="flex-wrap:wrap;gap:6px">
          <div style="display:flex;align-items:center;gap:6px;width:100%">
            <div class="toward-label">${t('sky_toward')}</div><span style="color:var(--gold3);margin:0 2px">→</span>
            <div class="toward-glyph">${c.nxtS.g}</div><div class="toward-name">${nxSn}</div>
            ${c.days!=null?`<div class="days-pill">${t('sky_days',c.days)}</div>`:''}
          </div>
          ${(()=>{const m=getPlanetTowardMeaning(c.p,c.nxtS.n);return m?`<div style="width:100%;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:12px;color:var(--muted);padding-top:4px;border-top:1px solid var(--border);line-height:1.5">${m}</div>`:''})()}
        </div>
      </div>
    </div>`;
  }).join('');
}
function resetSky(){document.getElementById('skyResults').classList.remove('active');document.getElementById('skyBirthForm').style.display='block';_lastSkyCards=null;showTab('profile');}

// ════════════════════════════════════════
// MY CHART — 10 SYSTEMS CALCULATIONS
// ════════════════════════════════════════

// 1. Western — Sun sign
function calcWestern(jd){const s=lonToSign(sunLon(jd));return{label:{en:s.n,th:s.th},glyph:s.g,deg:lonDegIn(sunLon(jd)).toFixed(1),desc:{en:s.rep.en,th:s.rep.th}};}

// 2. BaZi — Year Pillar
const STEMS_EN=['Yang Wood','Yin Wood','Yang Fire','Yin Fire','Yang Earth','Yin Earth','Yang Metal','Yin Metal','Yang Water','Yin Water'];
const STEMS_TH=['หยางไม้','หยินไม้','หยางไฟ','หยินไฟ','หยางดิน','หยินดิน','หยางทอง','หยินทอง','หยางน้ำ','หยินน้ำ'];
const STEMS_CH=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const ANIMALS_EN=['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
const ANIMALS_TH=['หนู','วัว','เสือ','กระต่าย','มังกร','งู','ม้า','แพะ','ลิง','ไก่','สุนัข','หมู'];
const BRANCH_CH=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
function calcBaZi(year,month,day){
  // Before Feb 4 approx, use previous year
  let y=year;if(month<2||(month===2&&day<4))y--;
  const si=((y-4)%10+10)%10,bi=((y-4)%12+12)%12;
  const stem=LANG==='th'?STEMS_TH[si]:STEMS_EN[si];
  const animal=LANG==='th'?ANIMALS_TH[bi]:ANIMALS_EN[bi];
  const desc={en:`Year pillar: ${STEMS_EN[si]} ${ANIMALS_EN[bi]}`,th:`เสาปี: ${STEMS_CH[si]}${BRANCH_CH[bi]} — ${STEMS_TH[si]} ปี${ANIMALS_TH[bi]}`};
  return{label:{en:`${ANIMALS_EN[bi]} (${STEMS_EN[si]})`,th:`ปี${ANIMALS_TH[bi]} (${STEMS_TH[si]})`},glyph:'🎋',chGlyph:BRANCH_CH[bi],desc};}

// 3. Vedic — Moon Rashi
const RASHI_EN=['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];
const RASHI_TH=['เมษ','พฤษภ','มิถุน','กรกฎ','สิงห์','กันย์','ตุลา','พิจิก','ธนู','มกร','กุมภ์','มีน'];
function calcVedic(jd){
  // Apply ~23° ayanamsa offset (Lahiri approx)
  const sidereal=n360(moonLon(jd)-23.85);
  const idx=Math.floor(sidereal/30);
  const deg=(sidereal%30).toFixed(1);
  const desc={en:'Your Vedic Moon sign reflects emotional nature and subconscious patterns.',th:'ราศีจันทร์เวทิกสะท้อนธรรมชาติทางอารมณ์และรูปแบบจิตใต้สำนึก'};
  return{label:{en:`${RASHI_EN[idx]} (${deg}°)`,th:`${RASHI_TH[idx]} (${deg}°)`},glyph:SIGNS[idx].g,desc};}

// 4. Nine Star Ki
const NSK_NAMES_EN=['One White Water','Two Black Soil','Three Jade Wood','Four Green Wood','Five Yellow Soil','Six White Metal','Seven Red Metal','Eight White Soil','Nine Purple Fire'];
const NSK_NAMES_TH=['หนึ่งขาวน้ำ','สองดำดิน','สามหยกไม้','สี่เขียวไม้','ห้าเหลืองดิน','หกขาวทอง','เจ็ดแดงทอง','แปดขาวดิน','เก้าม่วงไฟ'];
const NSK_DESC_EN=['Adaptability, depth, introspection.','Care, support, receptivity.','Initiative, enthusiasm, progress.','Creativity, sensitivity, growth.','Core strength, centrality, leadership.','Leadership, integrity, heaven\'s timing.','Joy, expression, communication.','Stability, reliability, new cycles.','Passion, clarity, completion.'];
const NSK_DESC_TH=['ความปรับตัว ความลึก การไตร่ตรอง','การดูแล การสนับสนุน การรับรู้','ความริเริ่ม ความกระตือรือร้น ความก้าวหน้า','ความสร้างสรรค์ ความละเอียดอ่อน การเติบโต','ความแข็งแกร่งแกนกลาง ความเป็นศูนย์กลาง ภาวะผู้นำ','ภาวะผู้นำ ความซื่อสัตย์ จังหวะของฟ้า','ความสุข การแสดงออก การสื่อสาร','ความมั่นคง ความน่าเชื่อถือ วงจรใหม่','ความหลงใหล ความชัดเจน การสมบูรณ์'];
function calcNSK(year,month,day){
  let y=year;if(month<2||(month===2&&day<4))y--;
  let r=((5-(y-1984))%9+900)%9;if(r===0)r=9;
  const idx=r-1;
  return{label:{en:`Star ${r}`,th:`ดาวที่ ${r}`},glyph:'⭐',star:r,starName:{en:NSK_NAMES_EN[idx],th:NSK_NAMES_TH[idx]},desc:{en:NSK_DESC_EN[idx],th:NSK_DESC_TH[idx]}};}

// 5. เลข ๗ ตัว — Thai Numerology (simplified)
function digitalReduce(n,master=[11,22,33]){while(n>9&&!master.includes(n)){let s=0;String(n).split('').forEach(d=>s+=+d);n=s;}return n;}
function calcThaiNum(year,month,day){
  const d=digitalReduce(day),m=digitalReduce(month),y=digitalReduce(+String(year).split('').reduce((a,b)=>a+(+b),0));
  const destiny=digitalReduce(d+m+y);
  const desc={en:`Day ${d} · Month ${m} · Year ${y} · Destiny ${destiny}`,th:`วัน ${d} · เดือน ${m} · ปี ${y} · เลขชะตา ${destiny}`};
  return{label:{en:`Destiny ${destiny}`,th:`เลขชะตา ${destiny}`},glyph:'🔮',dest:destiny,desc};}

// 6. Pythagorean — Life Path
function calcPythagorean(year,month,day){
  const lp=digitalReduce(+String(year+month+day).split('').reduce((a,b)=>a+(+b),0),[11,22,33]);
  const archetypes={en:{1:'The Leader',2:'The Diplomat',3:'The Creator',4:'The Builder',5:'The Adventurer',6:'The Nurturer',7:'The Seeker',8:'The Executive',9:'The Humanitarian',11:'The Visionary',22:'The Master Builder',33:'The Master Teacher'},
    th:{1:'นักนำ',2:'นักทูต',3:'นักสร้างสรรค์',4:'นักก่อสร้าง',5:'นักผจญภัย',6:'ผู้ดูแล',7:'นักแสวงหา',8:'นักบริหาร',9:'นักมนุษยธรรม',11:'นักวิสัยทัศน์',22:'นักสร้างผลงานยิ่งใหญ่',33:'ครูผู้ยิ่งใหญ่'}};
  const arch=archetypes[LANG][lp]||'—';
  const desc={en:`Life Path ${lp}: ${archetypes.en[lp]||''}`,th:`เส้นทางชีวิต ${lp}: ${archetypes.th[lp]||''}`};
  return{label:{en:`${lp} — ${archetypes.en[lp]||''}`,th:`${lp} — ${archetypes.th[lp]||''}`},glyph:'🔢',lp,arch,desc};}

// 7. ระบบประเภทพลังงาน (simplified — based on Sun sign element)
function calcEnergyType(jdBirth){
  const idx=Math.floor(n360(sunLon(jdBirth))/30);
  const el=ELEM_OF[idx];
  const types={fire:{en:'Initiator',th:'ผู้ริเริ่ม',desc:{en:'You generate and direct energy outward. Action is your natural state.',th:'คุณสร้างและส่งพลังงานออกไปข้างนอก การกระทำคือสภาวะธรรมชาติของคุณ'}},
    earth:{en:'Builder',th:'ผู้สร้าง',desc:{en:'You sustain and ground energy. Consistency is your strength.',th:'คุณรักษาและยึดพลังงานไว้ ความสม่ำเสมอคือจุดแข็งของคุณ'}},
    air:{en:'Guide',th:'ผู้นำทาง',desc:{en:'You distribute and connect energy. Awareness is your gift.',th:'คุณกระจายและเชื่อมต่อพลังงาน การรับรู้คือของขวัญของคุณ'}},
    water:{en:'Mirror',th:'กระจกสะท้อน',desc:{en:'You receive and reflect energy. Sensitivity is your superpower.',th:'คุณรับและสะท้อนพลังงาน ความละเอียดอ่อนคือพลังพิเศษของคุณ'}}};
  const ty=types[el];
  return{label:{en:ty.en,th:ty.th},glyph:'⚡',el,desc:{en:ty.desc.en,th:ty.desc.th}};}

// 8. ไทยพราหมณ์ — Day Deity
function calcThaiBrahmin(year,month,day){
  const dow=new Date(year,month-1,day).getDay();
  const deities=[
    {name:{en:'Sun Deity (Surya)',th:'พระอาทิตย์'},color:{en:'Red',th:'แดง'},gem:{en:'Ruby',th:'ทับทิม'},sym:'🌞',tone:{en:'Vitality, authority, radiance.',th:'ชีวิตชีวา อำนาจ ความแจ่มใส'}},
    {name:{en:'Moon Deity (Chandra)',th:'พระจันทร์'},color:{en:'Cream/White',th:'ครีม/ขาว'},gem:{en:'Pearl',th:'มุก'},sym:'🌕',tone:{en:'Intuition, flow, emotional grace.',th:'สัญชาตญาณ ความลื่นไหล ความสง่างามทางอารมณ์'}},
    {name:{en:'Mars Deity (Mangala)',th:'พระอังคาร'},color:{en:'Pink/Rose',th:'ชมพู'},gem:{en:'Coral',th:'ปะการัง'},sym:'🌺',tone:{en:'Courage, energy, decisive action.',th:'ความกล้าหาญ พลังงาน การตัดสินใจ'}},
    {name:{en:'Mercury Deity (Buddha)',th:'พระพุธ'},color:{en:'Green',th:'เขียว'},gem:{en:'Emerald',th:'มรกต'},sym:'🌿',tone:{en:'Intelligence, adaptability, communication.',th:'ปัญญา ความยืดหยุ่น การสื่อสาร'}},
    {name:{en:'Jupiter Deity (Brihaspati)',th:'พระพฤหัสบดี'},color:{en:'Orange/Yellow',th:'ส้ม/เหลือง'},gem:{en:'Yellow Sapphire',th:'บุษราคัม'},sym:'🟡',tone:{en:'Wisdom, expansion, dharma.',th:'ปัญญา การขยาย ธรรมะ'}},
    {name:{en:'Venus Deity (Shukra)',th:'พระศุกร์'},color:{en:'Light Blue',th:'ฟ้าอ่อน'},gem:{en:'Diamond',th:'เพชร'},sym:'💠',tone:{en:'Harmony, beauty, grace.',th:'ความกลมกลืน ความงาม ความสง่า'}},
    {name:{en:'Saturn Deity (Shani)',th:'พระเสาร์'},color:{en:'Purple/Black',th:'ม่วง/ดำ'},gem:{en:'Blue Sapphire',th:'นิล'},sym:'⬛',tone:{en:'Discipline, karma, deep lessons.',th:'ระเบียบวินัย กรรม บทเรียนเชิงลึก'}},
  ];
  const d=deities[dow];
  return{label:{en:d.name.en,th:d.name.th},glyph:d.sym,color:{en:d.color.en,th:d.color.th},gem:{en:d.gem.en,th:d.gem.th},desc:{en:`${d.tone.en} Sacred color: ${d.color.en}. Gemstone: ${d.gem.en}.`,th:`${d.tone.th} สีมงคล: ${d.color.th} อัญมณี: ${d.gem.th}`}};}

// 9. Mayan Tzolk'in
const MAYAN_SIGNS_EN=['Imix (Crocodile)','Ik (Wind)','Akbal (Night)','Kan (Seed)','Chicchan (Serpent)','Cimi (Transformation)','Manik (Deer)','Lamat (Star)','Muluc (Moon)','Oc (Dog)','Chuen (Monkey)','Eb (Human)','Ben (Skywalker)','Ix (Jaguar)','Men (Eagle)','Cib (Warrior)','Caban (Earth)','Etznab (Mirror)','Cauac (Storm)','Ahau (Sun)'];
const MAYAN_SIGNS_TH=['อิมิก (จระเข้)','อิก (ลม)','อักบาล (กลางคืน)','กัน (เมล็ด)','ชิกชาน (งู)','ซิมิ (การเปลี่ยนแปลง)','มานิก (กวาง)','ลามัต (ดาว)','มูลุก (ดวงจันทร์)','โอก (สุนัข)','ชูเอน (ลิง)','เอบ (มนุษย์)','เบน (นักเดินฟ้า)','อิกซ์ (เสือจากัวร์)','เมน (นกอินทรี)','ซิบ (นักรบ)','กาบัน (แผ่นดิน)','เอตซ์นับ (กระจก)','เกาอัค (พายุ)','อาเฮา (ดวงอาทิตย์)'];
function calcMayan(jd){
  const kin=Math.floor(((jd-584283)%260+260)%260);
  const tone=(kin%13)+1,si=kin%20;
  const desc={en:`Tone ${tone} activates ${MAYAN_SIGNS_EN[si].split(' ')[0]} energy — present in cycles of 260 days.`,th:`โทน ${tone} กระตุ้นพลังงาน ${MAYAN_SIGNS_TH[si].split(' ')[0]} — วนซ้ำในวัฏจักร 260 วัน`};
  return{label:{en:`Tone ${tone} · ${MAYAN_SIGNS_EN[si]}`,th:`โทน ${tone} · ${MAYAN_SIGNS_TH[si]}`},glyph:'🗓️',tone,sign:{en:MAYAN_SIGNS_EN[si],th:MAYAN_SIGNS_TH[si]},desc};}

// 10. Celtic Tree
const CELTIC=[
  {tree:'Birch',th:'เบิร์ช',sym:'🌿',r:[[12,24],[1,20]],kw:{en:'New beginnings, resilience, clarity.',th:'จุดเริ่มต้นใหม่ ความอดทน ความกระจ่าง'}},
  {tree:'Rowan',th:'โรวัน',sym:'🍒',r:[[1,21],[2,17]],kw:{en:'Protection, vision, transformation.',th:'การปกป้อง วิสัยทัศน์ การเปลี่ยนแปลง'}},
  {tree:'Ash',th:'แอช',sym:'🌳',r:[[2,18],[3,17]],kw:{en:'Connection, perspective, expansion.',th:'การเชื่อมต่อ มุมมอง การขยาย'}},
  {tree:'Alder',th:'อัลเดอร์',sym:'🌲',r:[[3,18],[4,14]],kw:{en:'Foundation, confidence, groundedness.',th:'รากฐาน ความมั่นใจ ความมั่นคง'}},
  {tree:'Willow',th:'วิลโลว์',sym:'🌾',r:[[4,15],[5,12]],kw:{en:'Intuition, cycles, emotional wisdom.',th:'สัญชาตญาณ วัฏจักร ปัญญาทางอารมณ์'}},
  {tree:'Hawthorn',th:'ฮอว์ธอร์น',sym:'🌸',r:[[5,13],[6,9]],kw:{en:'Balance, duality, inner cleansing.',th:'สมดุล ความเป็นคู่ การชำระจากภายใน'}},
  {tree:'Oak',th:'โอ๊ก',sym:'🌰',r:[[6,10],[7,7]],kw:{en:'Strength, endurance, sovereignty.',th:'ความแข็งแกร่ง ความอดทน อำนาจ'}},
  {tree:'Holly',th:'ฮอลลี่',sym:'🫐',r:[[7,8],[8,4]],kw:{en:'Balance, polarity, purpose.',th:'สมดุล ความตรงข้าม เป้าหมาย'}},
  {tree:'Hazel',th:'เฮเซล',sym:'🌱',r:[[8,5],[9,1]],kw:{en:'Knowledge, creativity, inspiration.',th:'ความรู้ ความสร้างสรรค์ แรงบันดาลใจ'}},
  {tree:'Vine',th:'เถาวัลย์',sym:'🍇',r:[[9,2],[9,29]],kw:{en:'Harvest, prophecy, unpredictability.',th:'การเก็บเกี่ยว การพยากรณ์ ความไม่แน่นอน'}},
  {tree:'Ivy',th:'ไอวี่',sym:'🌿',r:[[9,30],[10,27]],kw:{en:'Perseverance, loyalty, spiral growth.',th:'ความอดทน ความซื่อสัตย์ การเติบโตแบบก้นหอย'}},
  {tree:'Reed',th:'อ้อ',sym:'🎋',r:[[10,28],[11,24]],kw:{en:'Purpose, direct action, finding roots.',th:'เป้าหมาย การกระทำตรงๆ การค้นหารากฐาน'}},
  {tree:'Elder',th:'เอลเดอร์',sym:'🌑',r:[[11,25],[12,23]],kw:{en:'Transition, rebirth, letting go.',th:'การเปลี่ยนผ่าน การเกิดใหม่ การปล่อยวาง'}},
];
function celticTree(month,day){
  for(const c of CELTIC){
    for(const[m,d]of c.r){if(month===m&&day>=d)return c;if(c.r[0][0]>c.r[1][0]){if(month===c.r[0][0]&&day>=c.r[0][1])return c;if(month===c.r[1][0]&&day<=c.r[1][1])return c;}}
  }
  // Elder fallback (Dec 24 - Dec 23 wrap)
  return CELTIC[0];
}
function calcCeltic(month,day){
  // Special case: Dec 24+
  let c;
  if(month===12&&day>=24)c=CELTIC[0];
  else if(month===12&&day<=23)c=CELTIC[12];
  else{
    for(const ct of CELTIC){
      const[[m1,d1],[m2,d2]]=ct.r;
      if((month===m1&&day>=d1)||(month===m2&&day<=d2)){c=ct;break;}
    }
  }
  c=c||CELTIC[0];
  return{label:{en:c.tree+' Tree',th:'ต้น'+c.th},glyph:c.sym,desc:{en:c.kw.en,th:c.kw.th}};}

// ════════════════════════════════════════
// MY CHART — CONSENSUS THEMES
// ════════════════════════════════════════
const THEME_DEF={
  action: {icon:'→',en:'Action & Leadership',th:'การกระทำและภาวะผู้นำ'},
  strength:{icon:'◼',en:'Strength & Foundation',th:'ความแข็งแกร่งและรากฐาน'},
  wisdom:  {icon:'◎',en:'Wisdom & Inner Knowing',th:'ปัญญาและการรู้แจ้ง'},
  harmony: {icon:'∿',en:'Harmony & Connection',th:'ความกลมกลืนและการเชื่อมต่อ'},
  creativity:{icon:'✦',en:'Creativity & Expression',th:'ความสร้างสรรค์และการแสดงออก'},
  emotion: {icon:'♡',en:'Intuition & Emotional Depth',th:'สัญชาตญาณและความลึกทางอารมณ์'},
  transformation:{icon:'🌀',en:'Transformation & Change',th:'การเปลี่ยนแปลงและการปรับตัว'},
  abundance:{icon:'★',en:'Abundance & Expansion',th:'ความอุดมสมบูรณ์และการขยาย'},
};

function detectThemes(data){
  const sc={};const add=(k,v=1)=>{sc[k]=(sc[k]||0)+v;};
  // 1. Western — Sun element
  const sunIdx=Math.floor(n360(sunLon(data.jdB))/30);
  const sunEl=ELEM_OF[sunIdx];
  if(sunEl==='fire'){add('action');add('creativity');}
  if(sunEl==='earth'){add('strength');add('abundance');}
  if(sunEl==='air'){add('harmony');add('wisdom');}
  if(sunEl==='water'){add('emotion');add('transformation');}
  // 2. BaZi — stem element (0-1=wood,2-3=fire,4-5=earth,6-7=metal,8-9=water)
  const si=((data.yr-4)%10+10)%10;
  if(si<=1)add('creativity');else if(si<=3)add('action');else if(si<=5)add('strength');else if(si<=7)add('wisdom');else add('emotion');
  // 3. Vedic — Moon element
  const sidereal=n360(moonLon(data.jdB)-23.85);
  const moonEl=ELEM_OF[Math.floor(sidereal/30)];
  if(moonEl==='fire')add('action');if(moonEl==='earth')add('strength');
  if(moonEl==='air')add('harmony');if(moonEl==='water')add('emotion');
  // 4. Nine Star Ki
  const r=data.nsk.star;
  if([3,6,9].includes(r))add('action');if([2,5,8].includes(r))add('strength');
  if([1,4].includes(r))add('wisdom');if([7].includes(r))add('harmony');
  // 5. Thai Numerology destiny
  const dest=data.thaiNum.dest||1;
  const destM={1:'action',2:'harmony',3:'creativity',4:'strength',5:'action',6:'harmony',7:'wisdom',8:'abundance',9:'transformation',11:'wisdom',22:'abundance',33:'harmony'};
  if(destM[dest])add(destM[dest]);
  // 6. Pythagorean life path
  const lp=data.pyth.lp;
  const lpMap={1:'action',2:'harmony',3:'creativity',4:'strength',5:'action',6:'harmony',7:'wisdom',8:'abundance',9:'transformation',11:'wisdom',22:'abundance',33:'harmony'};
  if(lpMap[lp])add(lpMap[lp]);
  // 7. Energy type
  const el=data.energy.el;
  if(el==='fire')add('action');if(el==='earth')add('strength');
  if(el==='air')add('harmony');if(el==='water')add('emotion');
  // 8. Thai Brahmin day
  const dow=new Date(data.yr,data.mo-1,data.dy).getDay();
  [['action'],['harmony','emotion'],['action','strength'],['wisdom'],['wisdom','abundance'],['harmony','creativity'],['strength','transformation']][dow].forEach(k=>add(k));
  // 9. Mayan tone
  const tone=data.mayan.tone;
  if([1,5,9,13].includes(tone))add('action');else if([2,6,10].includes(tone))add('harmony');
  else if([3,7,11].includes(tone))add('creativity');else add('wisdom');
  // 10. Celtic keywords
  const ck=data.celtic.desc.en;
  if(/strength|endurance|sovereignty|foundation|purpose/.test(ck))add('strength');
  if(/wisdom|knowledge|vision|perspective/.test(ck))add('wisdom');
  if(/creativity|inspiration/.test(ck))add('creativity');
  if(/harmony|balance|loyalty/.test(ck))add('harmony');
  if(/transformation|rebirth|transition/.test(ck))add('transformation');
  if(/intuition|emotional/.test(ck))add('emotion');
  return sc;
}

// ════════════════════════════════════════
// MY CHART — RENDER
// ════════════════════════════════════════
let _lastChartData=null;

function calcChart(){
  const dob=document.getElementById('profDob').value;
  if(!dob){showTab('profile');return;}
  const _sp1=dob.split('-');if(_sp1.length!==3){showTab('profile');return;}
  const[yr,mo,dy]=[+_sp1[0],+_sp1[1],+_sp1[2]];
  const tv=document.getElementById('profTime').value;let bh=12;if(tv){const[h,m]=tv.split(':').map(Number);bh=h+m/60;}
  const name=document.getElementById('profName').value.trim();
  const jdB=dateToJD(yr,mo,dy,bh);
  const data={
    name,yr,mo,dy,jdB,
    western:   calcWestern(jdB),
    bazi:      calcBaZi(yr,mo,dy),
    vedic:     calcVedic(jdB),
    nsk:       calcNSK(yr,mo,dy),
    thaiNum:   calcThaiNum(yr,mo,dy),
    pyth:      calcPythagorean(yr,mo,dy),
    energy:    calcEnergyType(jdB),
    brahmin:   calcThaiBrahmin(yr,mo,dy),
    mayan:     calcMayan(jdB),
    celtic:    calcCeltic(mo,dy),
  };
  _lastChartData=data;
  document.getElementById('chartPersonName').textContent=name||'✦';
  renderChart(data);
  document.getElementById('chartBirthForm').style.display='none';
  document.getElementById('chartResults').classList.add('active');
  savePrefs();
}

function renderChart(data){
  // ── Consensus ──
  const themeScores=detectThemes(data);
  const topThemes=Object.entries(themeScores).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const maxScore=topThemes[0]?.[1]||1;
  const consensusHtml=topThemes.length?`<div class="consensus-banner">
    <div class="consensus-banner-title">${LANG==='th'?'🔮 10 ศาสตร์พูดถึงสิ่งเดียวกัน':'🔮 What your 10 systems agree on'}</div>
    ${topThemes.map(([k,v])=>{const td=THEME_DEF[k];return`<div class="consensus-theme">
      <div class="cons-theme-icon">${td.icon}</div>
      <div class="cons-theme-name">${LANG==='th'?td.th:td.en}</div>
      <div class="cons-theme-bar"><div class="cons-theme-fill" style="width:${(v/maxScore*100).toFixed(0)}%"></div></div>
      <div class="cons-theme-count">${v} <span style="font-size:9px">${LANG==='th'?'ระบบ':'sys'}</span></div>
    </div>`;}).join('')}
  </div>`:''  ;

  // ── Rich descriptions ──
  const sunIdx=Math.floor(n360(sunLon(data.jdB))/30);
  const sunEl=ELEM_OF[sunIdx];
  const sidereal=n360(moonLon(data.jdB)-23.85);
  const moonRashiIdx=Math.floor(sidereal/30);
  const si=((data.yr-4)%10+10)%10;
  const stemEls=['wood','wood','fire','fire','earth','earth','metal','metal','water','water'];
  const stemEl=stemEls[si];
  const stemDescEN={wood:'growth, flexibility, and creative upward momentum',fire:'warmth, clarity, and dynamic outward energy',earth:'reliability, stability, and a nurturing capacity to ground others',metal:'precision, focus, and the ability to cut through complexity',water:'depth, adaptability, and hidden reserves of intuitive intelligence'};
  const stemDescTH={wood:'การเติบโต ความยืดหยุ่น และแรงขับขึ้นสร้างสรรค์',fire:'ความอบอุ่น ความชัดเจน และพลังงานไดนามิกออกสู่ภายนอก',earth:'ความน่าเชื่อถือ ความมั่นคง และความสามารถในการค้ำจุนผู้อื่น',metal:'ความแม่นยำ ความมุ่งเน้น และความสามารถตัดผ่านความซับซ้อน',water:'ความลึก ความปรับตัว และทรัพยากรจากสัญชาตญาณที่ซ่อนอยู่'};
  const sunElDescEN={fire:'You are wired to initiate — life feels most alive when you are breaking new ground and moving at the speed of inspiration.',earth:'You build what lasts — your power lies in patient, deliberate action and turning ideas into tangible, enduring results.',air:'You connect and communicate — ideas and relationships are your medium, and your gift is making the complex feel effortless.',water:'You feel and sense deeply — your intuition and emotional intelligence perceive what others miss entirely.'};
  const sunElDescTH={fire:'คุณถูกสร้างมาเพื่อริเริ่ม — ชีวิตรู้สึกมีชีวิตชีวาที่สุดเมื่อคุณกำลังบุกเบิกดินแดนใหม่ด้วยความเร็วของแรงบันดาลใจ',earth:'คุณสร้างสิ่งที่คงทน — พลังอยู่ที่การกระทำอย่างอดทนและมีเจตนาชัดเจน เปลี่ยนความคิดให้เป็นผลลัพธ์ที่จับต้องได้',air:'คุณเชื่อมต่อและสื่อสาร — ความคิดและความสัมพันธ์คือสื่อของคุณ ของขวัญของคุณคือทำให้สิ่งซับซ้อนรู้สึกเป็นธรรมชาติ',water:'คุณรู้สึกและรับรู้ลึกซึ้ง — สัญชาตญาณและความฉลาดทางอารมณ์ของคุณรับรู้สิ่งที่ผู้อื่นมองข้ามโดยสิ้นเชิง'};
  const lpDescEN={1:'You are here to lead, initiate, and forge your own path — independence and original thought are your birthright.',2:'You are here to harmonize and bridge — your gift is sensing what others need and making them feel truly seen.',3:'You are here to create, communicate, and inspire — self-expression is not optional for you, it is essential.',4:'You are here to build, organize, and establish what endures — reliability and precision are your superpowers.',5:'You are here to experience, adapt, and catalyze change — freedom is your oxygen.',6:'You are here to nurture, serve, and create beauty in the world — love expressed through responsibility.',7:'You are here to seek truth and deepen wisdom — solitude and reflection are not retreat, they are your method.',8:'You are here to achieve, command, and create abundance — power used with integrity is your highest calling.',9:'You are here to serve, complete cycles, and embody universal compassion — letting go is your greatest spiritual practice.',11:'You are here to inspire and bring vision into form — your sensitivity is a signal, not a weakness.',22:'You are here to build things that outlast you — the master builder whose legacy reshapes what is possible.',33:'You are here to teach love and raise the consciousness of those around you — service at the highest level.'};
  const lpDescTH={1:'คุณมาเพื่อนำ ริเริ่ม และเดินทางของตัวเอง — ความเป็นอิสระและความคิดสร้างสรรค์คือสิทธิโดยกำเนิดของคุณ',2:'คุณมาเพื่อประสานและสร้างสะพาน — ของขวัญของคุณคือการรับรู้ว่าผู้อื่นต้องการอะไรและทำให้เขารู้สึกถูกมองเห็น',3:'คุณมาเพื่อสร้างสรรค์ สื่อสาร และสร้างแรงบันดาลใจ — การแสดงออกไม่ใช่ตัวเลือกสำหรับคุณ มันคือสิ่งจำเป็น',4:'คุณมาเพื่อสร้าง จัดระเบียบ และสร้างสิ่งที่คงทน — ความน่าเชื่อถือและความแม่นยำคือพลังพิเศษของคุณ',5:'คุณมาเพื่อสัมผัสประสบการณ์ ปรับตัว และเป็นตัวเร่งการเปลี่ยนแปลง — อิสรภาพคืออากาศหายใจของคุณ',6:'คุณมาเพื่อดูแล รับใช้ และสร้างความงามในโลก — ความรักที่แสดงออกผ่านความรับผิดชอบ',7:'คุณมาเพื่อค้นหาความจริงและเจาะลึกปัญญา — ความโดดเดี่ยวและการไตร่ตรองไม่ใช่การถอยหนี มันคือวิธีการของคุณ',8:'คุณมาเพื่อบรรลุ นำ และสร้างความอุดมสมบูรณ์ — อำนาจที่ใช้ด้วยความซื่อสัตย์คือการเรียกร้องสูงสุดของคุณ',9:'คุณมาเพื่อรับใช้ ปิดวัฏจักร และแสดงความเมตตาสากล — การปล่อยวางคือการปฏิบัติทางจิตวิญญาณที่ยิ่งใหญ่ที่สุดของคุณ',11:'คุณมาเพื่อสร้างแรงบันดาลใจและนำวิสัยทัศน์มาสู่รูปแบบ — ความละเอียดอ่อนของคุณคือสัญญาณ ไม่ใช่จุดอ่อน',22:'คุณมาเพื่อสร้างสิ่งที่คงอยู่หลังจากคุณ — ผู้สร้างยิ่งใหญ่ที่มรดกปรับเปลี่ยนสิ่งที่เป็นไปได้',33:'คุณมาเพื่อสอนความรักและยกระดับจิตสำนึกของผู้รอบข้าง — การรับใช้ในระดับสูงสุด'};
  const dowNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dowNamesTH=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  const dow=new Date(data.yr,data.mo-1,data.dy).getDay();

  const richDescs={
    western:{
      en:`Your Sun in ${SIGNS[sunIdx].n} defines how your life force expresses outward into the world. ${sunElDescEN[sunEl]} As a ${SIGNS[sunIdx].n}, your natural domain is "${SIGNS[sunIdx].rep.en.toLowerCase()}" — this is where you instinctively thrive. The premium report unlocks your full natal chart: Rising Sign, Moon placement, and the 12 house themes that shape every area of life.`,
      th:`ดวงอาทิตย์ใน${SIGNS[sunIdx].th}กำหนดว่าพลังชีวิตของคุณแสดงออกสู่โลกอย่างไร ${sunElDescTH[sunEl]} ในฐานะ${SIGNS[sunIdx].th} ดินแดนธรรมชาติของคุณคือ "${SIGNS[sunIdx].rep.th}" — นี่คือสิ่งที่คุณเจริญรุ่งเรืองโดยสัญชาตญาณ รายงาน premium เปิดเผยดาวแผนที่เต็มรูปแบบ: Rising Sign ราศีจันทร์ และธีม 12 house`},
    bazi:{
      en:`Your Year Pillar ${data.bazi.label.en} carries the elemental signature of ${stemEl} — ${stemDescEN[stemEl]}. This is the energetic lens through which your entire generation experiences the world, and the foundational pattern you inherited. The premium report unlocks your full Four Pillars (month, day, and hour columns), revealing your true destined path, career timing, and relationship compatibility.`,
      th:`เสาปี ${data.bazi.label.th} มีลายเซ็นธาตุ${stemEl==='wood'?'ไม้':stemEl==='fire'?'ไฟ':stemEl==='earth'?'ดิน':stemEl==='metal'?'ทอง':'น้ำ'} — ${stemDescTH[stemEl]} นี่คือเลนส์พลังงานที่รุ่นของคุณมองโลก และรูปแบบพื้นฐานที่คุณสืบทอดมา รายงาน premium เปิด 4 เสาเต็มรูปแบบ (เสาเดือน วัน ชั่วโมง) เผยเส้นทางชะตา จังหวะอาชีพ และความเข้ากันได้ในความสัมพันธ์`},
    vedic:{
      en:`Your Vedic Moon in ${RASHI_EN[moonRashiIdx]} (calculated in sidereal coordinates using Lahiri ayanamsa) reveals the architecture of your inner world — emotional instincts, subconscious patterns, and the texture of your mental nature. Where your Western Sun shows who you perform, your Vedic Moon shows who you are when no one is watching. The premium report adds your Lagna (Ascendant), planetary periods (Dasha), and the transits that mark your life's turning points.`,
      th:`ดวงจันทร์เวทิกใน${RASHI_TH[moonRashiIdx]} (คำนวณในพิกัด sidereal ด้วย Lahiri ayanamsa) เผยโครงสร้างของโลกภายใน — สัญชาตญาณทางอารมณ์ รูปแบบจิตใต้สำนึก และพื้นผิวธรรมชาติของจิตใจ ขณะที่ดวงอาทิตย์ตะวันตกแสดงว่าคุณแสดงตัวอย่างไร ดวงจันทร์เวทิกแสดงว่าคุณเป็นใครเมื่อไม่มีใครดู รายงาน premium เพิ่ม Lagna, ช่วงดาว (Dasha) และการเปลี่ยนผ่านที่หมายถึงจุดเปลี่ยนของชีวิต`},
    nsk:{
      en:`Nine Star Ki Star ${data.nsk.star} — ${data.nsk.starName.en} — reflects the cyclical energy field you were born into and the quality of chi you naturally embody. ${data.nsk.star<=3?'Lower-numbered stars carry yin, receptive energy: your power builds quietly, works through accumulation, and compounds over time.':data.nsk.star>=7?'Higher-numbered stars carry strong yang: you project energy outward, work best through direct engagement, and are energized by results.':'Middle stars balance both directions: you are naturally a bridge between yin and yang, inner and outer worlds.'} Popular in Japan and Korea, this system tracks your annual nine-year cycle. The premium report reveals where you are in that cycle right now.`,
      th:`Nine Star Ki ดาวที่ ${data.nsk.star} — ${data.nsk.starName.th} — สะท้อนสนามพลังงานวัฏจักรที่คุณเกิดมาและคุณภาพของชี่ที่คุณแสดงออกมาโดยธรรมชาติ ${data.nsk.star<=3?'ดาวหมายเลขต่ำมีพลังงานหยิน รับรู้: พลังของคุณสะสมอย่างเงียบๆ ทำงานผ่านการสะสม และทวีคูณตามเวลา':data.nsk.star>=7?'ดาวหมายเลขสูงมีหยางแข็งแกร่ง: คุณฉายพลังงานออกสู่ภายนอก ทำงานดีที่สุดผ่านการมีส่วนร่วมโดยตรง':'ดาวกลางสมดุลทั้งสองทิศทาง: คุณเป็นสะพานระหว่างหยินและหยาง โลกภายในและภายนอก'} ระบบนี้นิยมในญี่ปุ่นและเกาหลี ติดตามวัฏจักร 9 ปีของคุณ รายงาน premium เผยว่าคุณอยู่ที่ไหนในวัฏจักรนั้นตอนนี้`},
    thaiNum:{
      en:`Your Destiny number ${data.thaiNum.dest} in Thai Base-9 Numerology is distilled from the day, month, and year of your birth — reduced to its essential vibration. This number reveals your soul's primary learning theme and the energetic signature you carry into every major life event and crossroads. The premium report reveals all 7 core numbers (day, month, year, destiny, karma, path, and soul), their interactions, and your hidden strengths and blind spots.`,
      th:`เลขชะตา ${data.thaiNum.dest} ในเลขศาสตร์ไทย ๗ ตัว ๙ ฐาน ถูกกลั่นจากวัน เดือน และปีเกิดของคุณ — ลดลงสู่การสั่นพ้องที่สำคัญ เลขนี้เผยธีมการเรียนรู้หลักของจิตวิญญาณและลายเซ็นพลังงานที่คุณพาเข้าสู่เหตุการณ์สำคัญและทางแยกในชีวิต รายงาน premium เผย 7 ตัวเลขหลักทั้งหมด และจุดแข็งที่ซ่อนอยู่กับจุดบอดของคุณ`},
    pyth:{
      en:`Life Path ${data.pyth.lp} — ${data.pyth.arch.en||data.pyth.arch} — is the master current running beneath every chapter of your life. ${lpDescEN[data.pyth.lp]||'Your life path carries a unique frequency that shapes every major decision and relationship.'} This number doesn't change — it is the throughline of your entire lifetime. The premium report adds your Expression number (outer gifts), Soul Urge (inner drive), and Personal Year number (what 2025–2026 holds for you).`,
      th:`เส้นทางชีวิต ${data.pyth.lp} — ${data.pyth.arch.th||data.pyth.arch} — คือกระแสหลักที่ไหลอยู่ใต้ทุกบทของชีวิตคุณ ${lpDescTH[data.pyth.lp]||'เส้นทางชีวิตของคุณมีความถี่เฉพาะที่หล่อหลอมการตัดสินใจและความสัมพันธ์สำคัญทุกอย่าง'} เลขนี้ไม่เปลี่ยน — มันคือเส้นด้ายที่ผ่านตลอดชีวิตทั้งหมดของคุณ รายงาน premium เพิ่มเลข Expression, Soul Urge และ Personal Year`},
    energy:{
      en:`As a ${data.energy.label.en} (${data.energy.el} element), your natural operating mode is ${data.energy.el==='fire'?'generative and initiating — you produce energy for others to use, and feel drained when forced into passivity':data.energy.el==='earth'?'sustaining and stabilizing — you hold things together, and feel drained when asked to constantly improvise without structure':data.energy.el==='air'?'distributing and bridging — you move ideas and people toward connection, and feel drained by isolation or repetitive routine':'receptive and reflecting — you absorb and process the emotional field around you, and feel drained by environments that ignore depth'}. The premium report uses your exact birth time to calculate your full Human Design type, strategy, authority, and profile.`,
      th:`ในฐานะ${data.energy.label.th} (ธาตุ${data.energy.el==='fire'?'ไฟ':data.energy.el==='earth'?'ดิน':data.energy.el==='air'?'ลม':'น้ำ'}) โหมดการทำงานธรรมชาติของคุณคือ${data.energy.el==='fire'?'สร้างและริเริ่ม — คุณผลิตพลังงานให้ผู้อื่นใช้ และรู้สึกหมดแรงเมื่อถูกบังคับให้อยู่นิ่ง':data.energy.el==='earth'?'รักษาและให้ความมั่นคง — คุณยึดสิ่งต่างๆ เข้าด้วยกัน และหมดแรงเมื่อต้องด้นสดตลอดเวลา':data.energy.el==='air'?'กระจายและสร้างสะพาน — คุณเคลื่อนความคิดและผู้คนสู่การเชื่อมต่อ และหมดแรงจากการโดดเดี่ยว':'รับและสะท้อน — คุณดูดซับสนามอารมณ์รอบตัว และหมดแรงจากสภาพแวดล้อมที่ไม่ยอมรับความลึก'} รายงาน premium ใช้เวลาเกิดที่แน่นอนเพื่อคำนวณ Human Design type, strategy, authority และ profile ฉบับสมบูรณ์`},
    brahmin:{
      en:`Born on a ${dowNames[dow]}, you carry the vibration of ${data.brahmin.label.en}. ${data.brahmin.desc.en} In Thai Brahmin tradition, your birth day determines your protective deity, your power color that amplifies fortune, and the gemstone aligned with your energy. These are not superstitions — they are centuries of pattern recognition codified into practical guidance. The premium report reveals your full planetary alignment and auspicious timing for major decisions.`,
      th:`เกิดวัน${dowNamesTH[dow]} คุณแบกรับการสั่นพ้องของ${data.brahmin.label.th} ${data.brahmin.desc.th} ในประเพณีไทยพราหมณ์ วันเกิดของคุณกำหนดเทพผู้ปกป้อง สีแห่งอำนาจที่ขยายโชค และอัญมณีที่สอดคล้องกับพลังงานของคุณ สิ่งเหล่านี้ไม่ใช่ไสยศาสตร์ — มันคือการจดจำรูปแบบหลายศตวรรษที่รวบรวมเป็นแนวทางปฏิบัติ`},
    mayan:{
      en:`Your Tzolk'in position is ${data.mayan.label.en}. In the Mayan sacred calendar, each of the 260 unique day-signs carries a specific frequency — yours appears once every 260 days and defines your galactic resonance signature. ${data.mayan.desc.en} The Tzolk'in was used not for prediction but for alignment — understanding the energy available on any given day. The premium report reveals your full Mayan profile including the shadow and gift expressions of your galactic tone.`,
      th:`ตำแหน่ง Tzolk'in ของคุณคือ ${data.mayan.label.th} ในปฏิทินศักดิ์สิทธิ์มายัน แต่ละสัญลักษณ์วันทั้ง 260 แบบมีความถี่เฉพาะ — ของคุณปรากฏขึ้นทุก 260 วัน และกำหนดลายเซ็นการสั่นพ้องกาแลคซีของคุณ ${data.mayan.desc.th} Tzolk'in ถูกใช้ไม่ใช่เพื่อการทำนาย แต่เพื่อการจัดตำแหน่ง รายงาน premium เผยโปรไฟล์มายันเต็มรูปแบบ`},
    celtic:{
      en:`Your Celtic birth tree, ${data.celtic.label.en}, carries the ancient wisdom encoded by the Druids in the Ogham — the sacred tree alphabet. ${data.celtic.desc.en} The Druids understood that each tree embodies a distinct intelligence: a way of growing, a strategy for surviving, and a relationship with time and transformation. Your birth tree is a mirror of your own native intelligence and the gifts you carry most naturally. The premium report reveals your companion tree, shadow season, and the spiral of growth mapped across your life decades.`,
      th:`ต้นไม้เซลติกแห่งชาติกาลของคุณ ${data.celtic.label.th} แบกรับปัญญาโบราณที่เดรอิดบันทึกไว้ใน Ogham — ตัวอักษรต้นไม้ศักดิ์สิทธิ์ ${data.celtic.desc.th} เดรอิดเข้าใจว่าต้นไม้แต่ละต้นมีสติปัญญาเฉพาะ: วิธีการเติบโต กลยุทธ์ในการอยู่รอด และความสัมพันธ์กับเวลาและการเปลี่ยนแปลง ต้นไม้แห่งชาติกาลของคุณคือกระจกสะท้อนสติปัญญาธรรมชาติของคุณ รายงาน premium เผยต้นไม้คู่หู ฤดูแห่งเงา และวงก้นหอยแห่งการเติบโต`},
  };

  const systems=[
    {key:'western', title:{en:'Western Astrology',th:'โหราศาสตร์ตะวันตก'}, sub:{en:'Sun Sign',th:'ราศีดวงอาทิตย์'}, icon:'☀️', result:data.western.glyph+' '+data.western.label[LANG], desc:richDescs.western[LANG], freeNote:{en:'Sun sign, degree position',th:'ราศีและองศาดวงอาทิตย์'}},
    {key:'bazi',    title:{en:'BaZi Four Pillars',th:'สี่เสาชะตา (BaZi)'}, sub:{en:'Year Pillar',th:'เสาปี'}, icon:'🎋', result:data.bazi.label[LANG], desc:richDescs.bazi[LANG], freeNote:{en:'Year pillar only',th:'เฉพาะเสาปี'}},
    {key:'vedic',   title:{en:'Vedic Jyotish',th:'โหราศาสตร์เวทิก'}, sub:{en:'Moon Rashi',th:'ราศีจันทร์'}, icon:'🌙', result:data.vedic.glyph+' '+data.vedic.label[LANG], desc:richDescs.vedic[LANG], freeNote:{en:'Moon sign (sidereal)',th:'ราศีจันทร์ (sidereal)'}},
    {key:'nsk',     title:{en:'Nine Star Ki',th:'Nine Star Ki'}, sub:{en:'Popular in Japan & Korea',th:'นิยมในญี่ปุ่นและเกาหลี'}, icon:'⭐', result:'★ '+data.nsk.label[LANG]+' — '+data.nsk.starName[LANG], desc:richDescs.nsk[LANG], freeNote:{en:'Star number & element',th:'ดาวและธาตุ'}},
    {key:'thaiNum', title:{en:'Thai Numerology',th:'เลข ๗ ตัว ๙ ฐาน'}, sub:{en:'7-Number System',th:'เลขศาสตร์ไทย'}, icon:'🔮', result:data.thaiNum.label[LANG], desc:richDescs.thaiNum[LANG], freeNote:{en:'Core destiny numbers',th:'เลขชะตาหลัก'}},
    {key:'pyth',    title:{en:'Pythagorean Numerology',th:'เลขศาสตร์พีทาโกรัส'}, sub:{en:'Life Path',th:'เส้นทางชีวิต'}, icon:'🔢', result:data.pyth.label[LANG], desc:richDescs.pyth[LANG], freeNote:{en:'Life path number & archetype',th:'เลขเส้นทางและต้นแบบ'}},
    {key:'energy',  title:{en:'Energy Type System',th:'ระบบประเภทพลังงาน'}, sub:{en:'Energy Type (simplified)',th:'ประเภทพลังงาน (ประมาณการ)'}, icon:'⚡', result:data.energy.label[LANG], desc:richDescs.energy[LANG], freeNote:{en:'Elemental energy type',th:'ประเภทพลังงานตามธาตุ'}},
    {key:'brahmin', title:{en:'Thai Brahmin',th:'ไทยพราหมณ์'}, sub:{en:'Day Deity & Sacred Color',th:'เทพแห่งวันเกิดและสีมงคล'}, icon:'🏛️', result:data.brahmin.glyph+' '+data.brahmin.label[LANG], desc:richDescs.brahmin[LANG], freeNote:{en:'Day deity, color & gemstone',th:'เทพประจำวัน สีและอัญมณีมงคล'}},
    {key:'mayan',   title:{en:"Mayan Tzolk'in",th:"มายัน Tzolk'in"}, sub:{en:'Day Sign & Tone',th:'สัญลักษณ์วันและโทน'}, icon:'🗓️', result:data.mayan.label[LANG], desc:richDescs.mayan[LANG], freeNote:{en:"Tzolk'in day sign & tone",th:"สัญลักษณ์วันและโทน Tzolk'in"}},
    {key:'celtic',  title:{en:'Celtic Tree Astrology',th:'โหราศาสตร์ต้นไม้เซลติก'}, sub:{en:'Birth Tree',th:'ต้นไม้แห่งชาติกาล'}, icon:'🌳', result:data.celtic.glyph+' '+data.celtic.label[LANG], desc:richDescs.celtic[LANG], freeNote:{en:'Birth tree & qualities',th:'ต้นไม้ประจำตัวและคุณสมบัติ'}},
  ];

  document.getElementById('sysGrid').innerHTML=consensusHtml+systems.map(s=>`
    <div class="sys-card">
      <div class="sys-header">
        <div class="sys-icon">${s.icon}</div>
        <div>
          <div class="sys-name-main">${s.sub[LANG]}</div>
          <div class="sys-name-full">${s.title[LANG]}</div>
        </div>
      </div>
      <div class="free-badge">${t('free_tier')}</div>
      <div class="sys-result-big">${s.result}</div>
      <div class="sys-desc">${s.desc}</div>
      <div class="sys-lock">🔒 ${t('premium_unlock')}</div>
    </div>`).join('');
  document.getElementById('lifeGuideContainer').innerHTML=renderLifeGuide(data);
}

function resetChart(){document.getElementById('chartResults').classList.remove('active');document.getElementById('chartBirthForm').style.display='block';_lastChartData=null;showTab('profile');}

// ════════════════════════════════════════
// MOON PHASE + TODAY BAR
// ════════════════════════════════════════
function moonPhase(jd){
  const angle=n360(moonLon(jd)-sunLon(jd));
  const idx=Math.floor(angle/45);
  return[
    {en:'New Moon',th:'ดวงจันทร์ใหม่',icon:'🌑'},
    {en:'Waxing Crescent',th:'จันทร์เสี้ยวขึ้น',icon:'🌒'},
    {en:'First Quarter',th:'จันทร์ครึ่งดวงขึ้น',icon:'🌓'},
    {en:'Waxing Gibbous',th:'จันทร์โตขึ้น',icon:'🌔'},
    {en:'Full Moon',th:'จันทร์เต็มดวง',icon:'🌕'},
    {en:'Waning Gibbous',th:'จันทร์เริ่มลด',icon:'🌖'},
    {en:'Last Quarter',th:'จันทร์ครึ่งดวงลด',icon:'🌗'},
    {en:'Waning Crescent',th:'จันทร์เสี้ยวลด',icon:'🌘'},
  ][idx];
}

function renderTodayBar(){
  const now=new Date();
  const jdN=dateToJD(now.getFullYear(),now.getMonth()+1,now.getDate(),now.getHours()+now.getMinutes()/60);
  const phase=moonPhase(jdN);
  const moonSign=lonToSign(moonLon(jdN));
  const dow=now.getDay();
  const dayIcons=['🌞','🌕','🌺','🌿','🟡','💠','⬛'];
  const dayNamesTH=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  const dayNamesEN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  document.getElementById('tb-phase-icon').textContent=phase.icon;
  document.getElementById('tb-phase-name').textContent=LANG==='th'?phase.th:phase.en;
  document.getElementById('tb-moon-sign').textContent=LANG==='th'?moonSign.th:moonSign.n;
  document.getElementById('tb-day-icon').textContent=dayIcons[dow]+' ';
  document.getElementById('tb-day-deity').textContent=LANG==='th'?dayNamesTH[dow]:dayNamesEN[dow];
  renderDesktopRails(phase, moonSign, dow, dayIcons, dayNamesTH, dayNamesEN);
}

// ── Desktop side-rail content (visible only on viewports >= 1200px) ──
const _cosmicTipsTH = [
  'พระจันทร์วันนี้ส่งเสริมความสงบภายใน — ลองพักจากโลกออนไลน์สัก 10 นาที',
  'ดาวพฤหัสเสริมดวงการเงิน — ช่วงเวลาดีในการวางแผนระยะยาว',
  'ดาวศุกร์สอดคล้องกับความรัก — บอกคนที่คุณห่วงใยว่า "ขอบคุณ"',
  'ดาวเสาร์เตือนเรื่องวินัย — งานเล็ก ๆ วันนี้สำคัญกว่าที่คิด',
  'ดาวอังคารให้พลังกล้าหาญ — กล้าเริ่มสิ่งที่เลื่อนมานาน',
  'ดาวพุธช่วยเรื่องการสื่อสาร — เขียนสิ่งที่ค้างคาใจออกมา',
  'พระอาทิตย์ส่องความมั่นใจ — ยืนตัวตรง หายใจลึก แล้วลุย',
];
const _cosmicTipsEN = [
  "Today's moon favors inner stillness — try 10 minutes off-screen",
  'Jupiter blesses long-term plans — a fine moment to map the months ahead',
  'Venus aligns with love — tell someone you care "thank you"',
  'Saturn asks for discipline — the tiny task matters more than you think',
  'Mars lends courage — begin the thing you have been postponing',
  'Mercury clears communication — write down what is unsaid',
  'The Sun amplifies confidence — stand tall, breathe deep, proceed',
];

function renderDesktopRails(phase, moonSign, dow, dayIcons, dayNamesTH, dayNamesEN){
  const railLeft = document.getElementById('deskRailLeft');
  if (!railLeft) return;
  const isTh = (typeof LANG!=='undefined' && LANG==='th');
  const set = (id, txt) => { const el = document.getElementById(id); if (el) txt!==undefined && (el.textContent = txt); };
  set('railTodayTitle',  isTh ? '✦ ท้องฟ้าวันนี้' : "✦ Today's Sky");
  set('railPhase',       phase.icon);
  set('railPhaseName',   isTh ? phase.th : phase.en);
  set('railMoonSign',    (isTh ? 'พระจันทร์อยู่ใน ' : 'Moon in ') + (isTh ? moonSign.th : moonSign.n));
  set('railDeityTitle',  isTh ? '✦ เทพประจำวัน' : "✦ Day's Deity");
  set('railDeityIcon',   dayIcons[dow]);
  set('railDeityName',   isTh ? ('วัน'+dayNamesTH[dow]) : dayNamesEN[dow]+'day');
  // Right rail
  set('railTipTitle',    isTh ? '✦ คาถาของวันนี้' : '✦ Cosmic Tip');
  const tipIdx = (new Date().getDate() + dow) % _cosmicTipsTH.length;
  set('railTipBody',     isTh ? _cosmicTipsTH[tipIdx] : _cosmicTipsEN[tipIdx]);
  set('railStatsTitle',  isTh ? '✦ เส้นทางของคุณ' : '✦ Your Journey');
  // Stats from full history
  let blessings = 0, organum = 0, reports = 0;
  try {
    const hist = (typeof getFullHistory==='function') ? getFullHistory() : [];
    blessings = hist.filter(h=>h&&h.type==='blessing').length;
    organum   = hist.filter(h=>h&&h.type==='organum').length;
    reports   = parseInt(localStorage.getItem('mth_reports_viewed')||'0',10)||0;
  } catch(e) {}
  set('railStatBlessings', isTh ? (blessings+' ครั้งที่รับพร') : (blessings+' blessings drawn'));
  set('railStatOrganum',   isTh ? (organum+' ครั้งที่ถามโอเรกุรัม') : (organum+' questions asked'));
  set('railStatReports',   isTh ? (reports+' รายงานที่เปิด') : (reports+' reports viewed'));
}

// ════════════════════════════════════════
// LOCAL STORAGE — PERSIST PREFS
// ════════════════════════════════════════
function saveProfile(){
  const dob=document.getElementById('profDob').value;
  if(!dob){document.getElementById('profStatus').textContent=LANG==='th'?'⚠ กรุณากรอกวันเกิดก่อน':'⚠ Please enter your date of birth';return;}
  savePrefs();
  // show saved badge
  const badge=document.getElementById('profSavedBadge');
  if(badge)badge.style.display='block';
  document.getElementById('profStatus').textContent=t('prof_saved');
  // Reset sky/chart so they recompute with new data
  document.getElementById('skyResults').classList.remove('active');
  document.getElementById('skyBirthForm').style.display='block';
  document.getElementById('chartResults').classList.remove('active');
  document.getElementById('chartBirthForm').style.display='block';
  _lastSkyCards=null; _lastChartData=null;
  // sync all forms immediately
  syncAllForms();
}

// ── Single source of truth for profile data ──
function getStoredProfile(){
  return{
    name:  localStorage.getItem('mth_name')||'',
    dob:   localStorage.getItem('mth_dob')||'',
    time:  localStorage.getItem('mth_time')||'',
    gender:localStorage.getItem('mth_gender')||'ชาย',
    city:  localStorage.getItem('mth_city')||'13.75,100.5,7',
  };
}

// ── Push stored profile into every form on the page ──
function syncAllForms(){
  const p=getStoredProfile();
  // profile panel
  const set=(id,v)=>{const el=document.getElementById(id);if(el&&v)el.value=v;};
  set('profName',p.name);set('profDob',p.dob);set('profTime',p.time);
  set('profGender',p.gender);set('profCity',p.city);
  // cosmic blueprint form
  set('cb-f-name',p.name);set('cb-f-dob',p.dob);
  set('cb-f-gender',p.gender);set('cb-f-city',p.city);
  if(p.time){
    const[hh,mm]=p.time.split(':');
    set('cb-f-time-h',hh||'12');set('cb-f-time-m',mm||'0');
  }
  // show saved badge if DOB exists
  const badge=document.getElementById('profSavedBadge');
  if(badge)badge.style.display=p.dob?'block':'none';
  // Render the cross-system Consensus Preview if we have enough profile data.
  try { renderConsensusPreview(); } catch(e) { console.warn('consensus preview failed:', e); }
}

// ── Consensus Preview ──────────────────────────────────────
// Shows "X systems agree on Y" cards above the form so the user grasps the
// app's value prop *before* clicking Generate. Reads profile, builds a chart,
// extracts cross-system themes via _deriveConsensusThemes().
function renderConsensusPreview(){
  const host = document.getElementById('cb-consensus-preview');
  if (!host) return;
  const chart = _getMS26ChartFromProfile();
  if (!chart) { host.style.display='none'; host.innerHTML=''; return; }

  const isTh = LANG === 'th';
  const themes = _deriveConsensusThemes(chart);
  const score  = chart.score || (chart.cosmicScore && chart.cosmicScore.total) || null;
  const tier   = (chart.cosmicScore && chart.cosmicScore.tier) || (chart.score && chart.score.tier) || '';

  const cards = themes.slice(0, 3).map(th => `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:14px 16px;border-left:3px solid var(--gold)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:18px">${th.icon}</span>
        <span style="font-family:'Josefin Sans',sans-serif;font-size:9.5px;letter-spacing:2px;color:var(--gold);text-transform:uppercase">
          ${th.systems.length} ${isTh?'ศาสตร์เห็นตรงกัน':'systems agree'}
        </span>
      </div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:14.5px;color:var(--text);line-height:1.55">${th.message}</div>
      <div style="font-family:'Josefin Sans',sans-serif;font-size:8.5px;letter-spacing:1px;color:var(--muted);margin-top:6px">
        ${th.systems.join(' · ')}
      </div>
    </div>
  `).join('');

  host.style.display='block';
  host.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--gold3);border-radius:10px;padding:18px 18px 16px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:14px">
        <div>
          <div style="font-family:'Cinzel Decorative',serif;font-size:13px;color:var(--gold);letter-spacing:3px">
            ${isTh?'✦ Consensus Preview':'✦ CONSENSUS PREVIEW'}
          </div>
          <div style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:12.5px;color:var(--muted);margin-top:2px">
            ${isTh?'สิ่งที่ 26 ศาสตร์เห็นตรงกันเกี่ยวกับคุณ — กดสร้างรายงานเพื่อดูฉบับเต็ม':'What 26 systems agree on about you — generate the full report for depth'}
          </div>
        </div>
        ${score ? `<div style="text-align:right">
          <div style="font-family:'Cinzel Decorative',serif;font-size:24px;color:var(--gold)">${score.total||score}</div>
          <div style="font-family:'Josefin Sans',sans-serif;font-size:8.5px;letter-spacing:2px;color:var(--muted);text-transform:uppercase">${tier||(isTh?'Cosmic Score':'Cosmic Score')}</div>
        </div>` : ''}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
        ${cards}
      </div>
    </div>
  `;
}

// Derive cross-system "consensus themes" from a chart. Each theme is a claim
// that 2+ traditions independently make about the user — this is the whole
// premise of Mythsensus, so the logic must be transparent and rule-based.
//
// AI-HOOK: when window.MYTH_AI.deriveConsensusThemes() is available (online
// launch with LLM), defer to it — the offline fallback below is intentionally
// simple and rule-based so we ship something now.
function _deriveConsensusThemes(chart){
  if (window.MYTH_AI && typeof window.MYTH_AI.deriveConsensusThemes === 'function') {
    try { const r = window.MYTH_AI.deriveConsensusThemes(chart); if (r && r.length) return r; }
    catch(e) { console.warn('AI consensus failed, falling back:', e); }
  }
  const isTh = LANG === 'th';
  const themes = [];

  // Theme 1: ELEMENT consensus (BaZi Day Master + Nine Star Ki + Vedic if present)
  const baziEl = chart.bazi && chart.bazi.dayMasterElement;
  const nskEl  = chart.ninestar && chart.ninestar.starElement;
  if (baziEl && nskEl) {
    const same = baziEl === nskEl;
    themes.push({
      icon: same ? '🔥' : '⚖️',
      systems: ['BaZi','Nine Star Ki'],
      message: same
        ? (isTh
            ? `ธาตุของคุณคือ <strong style="color:var(--gold)">${baziEl}</strong> — ทั้ง BaZi และ Nine Star Ki เห็นตรงกัน เป็นสัญญาณว่าธาตุนี้คือพลังหลักจริงๆ`
            : `Your element is <strong style="color:var(--gold)">${baziEl}</strong> — both BaZi and Nine Star Ki agree, signalling this is genuinely your core force`)
        : (isTh
            ? `BaZi ให้ธาตุ <strong style="color:var(--gold)">${baziEl}</strong> · Nine Star Ki ให้ <strong style="color:var(--gold)">${nskEl}</strong> — สองพลังที่ต้องสมดุลในตัวคุณ`
            : `BaZi gives <strong style="color:var(--gold)">${baziEl}</strong> · Nine Star Ki gives <strong style="color:var(--gold)">${nskEl}</strong> — two forces you must balance within`)
    });
  }

  // Theme 2: LIFE PATH consensus (Numerology Life Path + Western Sun + Vedic Lagna)
  const lp  = chart.numerology && chart.numerology.lifePath;
  const sun = chart.western && (chart.western.sunSignTh||chart.western.sunSign);
  const lag = chart.vedic && chart.vedic.lagna;
  if (lp && sun && lag) {
    themes.push({
      icon: '🌟',
      systems: ['Numerology','Western','Vedic'],
      message: isTh
        ? `Life Path <strong style="color:var(--gold)">${lp}</strong> · ดวงอาทิตย์ <strong style="color:var(--gold)">${sun}</strong> · Lagna <strong style="color:var(--gold)">${lag}</strong> — สามศาสตร์อิสระชี้ไปที่บทบาทเดียวกันในชีวิตของคุณ`
        : `Life Path <strong style="color:var(--gold)">${lp}</strong> · Sun in <strong style="color:var(--gold)">${sun}</strong> · Lagna <strong style="color:var(--gold)">${lag}</strong> — three independent systems point to the same life role`
    });
  }

  // Theme 3: TIMING consensus (Vedic Mahadasha + Personal Year + current Luck Pillar)
  const dasha = chart.vedicMahadasha && chart.vedicMahadasha.currentDasha;
  const py    = chart.numerology && chart.numerology.personalYear2026;
  // luckPillars[0] is an OBJECT ({stem, branch, stemTh, branchTh, ageStart, ageEnd, period}),
  // not a string — stringifying directly produced "[object Object]" in the preview card.
  // Also, luckPillars[0] is the FIRST pillar (childhood), not current. Use bazi.currentLuckPillar
  // if present, otherwise compose from stemTh+branchTh.
  const lp1raw = chart.bazi && chart.bazi.luckPillars && chart.bazi.luckPillars[0];
  const lp1    = chart.bazi && chart.bazi.currentLuckPillarTh
    || (lp1raw && (lp1raw.stemTh || lp1raw.stem) + ' ' + (lp1raw.branchTh || lp1raw.branch))
    || '';
  if (dasha && py) {
    themes.push({
      icon: '⏳',
      systems: ['Vedic Mahadasha','Numerology PY', lp1?'BaZi Luck':null].filter(Boolean),
      message: isTh
        ? `ช่วงนี้: Mahadasha <strong style="color:var(--gold)">${dasha}</strong> · Personal Year <strong style="color:var(--gold)">${py}</strong>${lp1?` · Luck Pillar <strong style="color:var(--gold)">${lp1}</strong>`:''} — ธีมพลังงานปีนี้ถูกขีดเส้นไว้แล้ว`
        : `This period: Mahadasha <strong style="color:var(--gold)">${dasha}</strong> · Personal Year <strong style="color:var(--gold)">${py}</strong>${lp1?` · Luck Pillar <strong style="color:var(--gold)">${lp1}</strong>`:''} — the energy theme of this year is set`
    });
  }

  // Fallback if not enough data
  if (themes.length === 0) {
    themes.push({
      icon: '✦',
      systems: ['—'],
      message: isTh
        ? 'กรอกข้อมูลให้ครบเพื่อปลดล็อก consensus จาก 26 ศาสตร์'
        : 'Complete your profile to unlock 26-system consensus themes'
    });
  }
  return themes;
}

// ════════════════════════════════════════════════════════════
// AI GENERATION HOOKS — placeholder so we can swap template -> LLM at online launch
// ════════════════════════════════════════════════════════════
// Pattern: every render function checks window.MYTH_AI.fn first; if present
// the LLM result is used, otherwise the rule-based template below runs.
// At online launch we register window.MYTH_AI = { deriveConsensusThemes,
// generateBrief, ... } pointing at fetch('/api/generate', { ... }).
//
// Wiring reference (online launch only, do NOT paste inside this file):
//   window.MYTH_AI = {
//     async deriveConsensusThemes(chart) {
//       const r = await fetch('/api/consensus', { method:'POST',
//         body: JSON.stringify(chart) });
//       return r.json();
//     },
//     async generateBrief(chart)  { /* ... */ },
//     async generateMirror(chart) { /* ... */ },
//   };
//
// All renderers stay synchronous in the offline build by skipping AI hooks
// when they're undefined or when they throw.
window.MYTH_AI = window.MYTH_AI || null;

function savePrefs(){
  try{
    const name  =document.getElementById('profName')?.value||'';
    const dob   =document.getElementById('profDob')?.value||'';
    const time  =document.getElementById('profTime')?.value||'';
    const gender=document.getElementById('profGender')?.value||'ชาย';
    const city  =document.getElementById('profCity')?.value||'13.75,100.5,7';
    if(name)  localStorage.setItem('mth_name',name);
    if(dob)   localStorage.setItem('mth_dob',dob);
    if(time)  localStorage.setItem('mth_time',time);
    localStorage.setItem('mth_gender',gender);
    localStorage.setItem('mth_city',city);
    localStorage.setItem('mth_lang',LANG);
  }catch(e){}
}

function loadPrefs(){
  try{
    const lang=localStorage.getItem('mth_lang')||'th';
    if(lang!==LANG)toggleLang();
    syncAllForms();
    const dob=localStorage.getItem('mth_dob')||'';
    if(dob){
      const hint=document.createElement('div');
      hint.style.cssText='text-align:center;margin-bottom:12px;font-family:\'Josefin Sans\',sans-serif;font-size:10px;color:var(--gold3);letter-spacing:1px;';
      hint.innerHTML=`✦ ${LANG==='th'?'พบข้อมูลเดิม':'Previous entry found'} — <button onclick="calcChart()" style="font-family:\'Josefin Sans\',sans-serif;font-size:10px;background:none;border:none;color:var(--gold);cursor:pointer;letter-spacing:1px;text-decoration:underline">${t('quick_load')}</button>`;
      const form=document.getElementById('chartBirthForm');if(!form)return;
      if(form&&!form.querySelector('.quick-hint')){hint.className='quick-hint';form.prepend(hint);}
    }
  }catch(e){}
}

function initBlessings(){
  try{
    const today=new Date().toDateString();
    if(localStorage.getItem('mth_bless_date')===today){
      draws=parseInt(localStorage.getItem('mth_bless_count')||'0');
      const saved=localStorage.getItem('mth_bless_history');
      if(saved){
        const raw=JSON.parse(saved);
        // Rebuild lightweight history objects (tier ref by nameEN, god by name+symbol+mythology+represents)
        blessHistory=raw.map(h=>({
          T:TIERS.find(t=>t.nameEN===h.tName)||TIERS[0],
          god:{name:h.gName,symbol:h.gSymbol,mythology:h.gMythology,represents:h.gRep||[],messages:h.gMsg||[]}
        }));
      }
    }else{
      draws=0;blessHistory=[];
      localStorage.setItem('mth_bless_date',today);
      localStorage.setItem('mth_bless_count','0');
      localStorage.removeItem('mth_bless_history');
    }
  }catch(e){draws=0;blessHistory=[];}
  if(draws>=MAX_DRAWS){const b=document.getElementById('drawBtn');if(b){b.disabled=true;b.textContent=t('blessing_used');}}
}

function saveBlessings(){
  try{
    localStorage.setItem('mth_bless_count',draws);
    localStorage.setItem('mth_bless_date',new Date().toDateString());
    const slim=blessHistory.map(h=>({
      tName:h.T.nameEN,
      gName:h.god.name,gSymbol:h.god.symbol||'',
      gMythology:h.god.mythology||'',
      gRep:h.god.represents||[],
      gMsg:h.god.messages||[]
    }));
    localStorage.setItem('mth_bless_history',JSON.stringify(slim));
  }catch(e){}
}

// ════════════════════════════════════════
// COPY MY CHART SUMMARY
// ════════════════════════════════════════
function copyChartSummary(){
  if(!_lastChartData)return;
  const d=_lastChartData;
  const lines=[
    `✦ MYTHSENSUS — ${d.name||'My Reading'}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `☀️ ${LANG==='th'?'โหราศาสตร์ตะวันตก':'Western'}: ${d.western.glyph} ${d.western.label[LANG]}`,
    `🎋 BaZi: ${d.bazi.label[LANG]}`,
    `🌙 ${LANG==='th'?'เวทิก':'Vedic'}: ${d.vedic.label[LANG]}`,
    `⭐ Nine Star Ki: ${d.nsk.label[LANG]} — ${d.nsk.starName[LANG]}`,
    `🔮 ${LANG==='th'?'เลข ๗ ตัว':'Thai Num'}: ${d.thaiNum.label[LANG]}`,
    `🔢 ${LANG==='th'?'พีทาโกรัส':'Pythagorean'}: ${d.pyth.label[LANG]}`,
    `⚡ ${LANG==='th'?'ประเภทพลังงาน':'Energy Type'}: ${d.energy.label[LANG]}`,
    `🏛️ ${LANG==='th'?'ไทยพราหมณ์':'Thai Brahmin'}: ${d.brahmin.label[LANG]}`,
    `🗓️ ${LANG==='th'?'มายัน':'Mayan'}: ${d.mayan.label[LANG]}`,
    `🌳 ${LANG==='th'?'เซลติก':'Celtic'}: ${d.celtic.label[LANG]}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `mythsensus.com`,
  ];
  navigator.clipboard.writeText(lines.join('\n')).then(()=>{
    const btn=document.getElementById('copyChartBtn');
    if(btn){btn.textContent=t('copy_done');btn.classList.add('copied');setTimeout(()=>{btn.textContent=t('copy_chart');btn.classList.remove('copied');},2200);}
  }).catch(()=>{});
}

// ════════════════════════════════════════
// LIFE GUIDE — derive from chart data
// ════════════════════════════════════════
function deriveLifeGuide(data){
  const el=data.energy.el;
  const yr=data.yr,mo=data.mo,dy=data.dy,jdB=data.jdB;
  let y=yr;if(mo<2||(mo===2&&dy<4))y--;
  const si=((y-4)%10+10)%10;
  const bi=((y-4)%12+12)%12;
  const BAZI_EL=['wood','wood','fire','fire','earth','earth','metal','metal','water','water'];
  const baziEl=BAZI_EL[si];
  const sidereal=n360(moonLon(jdB)-23.85);
  const vIdx=Math.floor(sidereal/30);
  const VEL=['fire','earth','air','water','fire','earth','air','water','fire','earth','air','water'];
  const vedicEl=VEL[vIdx];
  const star=data.nsk.star;
  const tone=data.mayan.tone;
  const dow=new Date(yr,mo-1,dy).getDay();
  const L=LANG==='en';

  const LOVE_STYLE={
    fire:{en:'Passionate & Direct — you love boldly and expect the same. Chemistry and spontaneity ignite you; you thrive with partners who match your intensity.',th:'หลงใหลและตรงไปตรงมา — คุณรักอย่างกล้าหาญและคาดหวังสิ่งเดียวกัน เคมีและความเป็นธรรมชาติทำให้คุณมีชีวิตชีวา'},
    earth:{en:'Loyal & Steadfast — you love through acts of service and long-term devotion. Stability and trust are non-negotiable. You are the partner who stays.',th:'ซื่อสัตย์และมั่นคง — คุณแสดงความรักผ่านการกระทำและความทุ่มเทระยะยาว ความมั่นคงและความไว้วางใจคือสิ่งที่ขาดไม่ได้'},
    air:{en:'Intellectual & Free-spirited — you love through conversation and shared curiosity. You need a partner who stimulates your mind as much as your heart.',th:'ปัญญาและอิสระ — คุณรักผ่านการสนทนาและความอยากรู้ร่วมกัน คุณต้องการคู่ที่กระตุ้นความคิดได้พอๆ กับหัวใจ'},
    water:{en:'Intuitive & Deeply Feeling — you love with your whole being. You sense what your partner feels before they say it. Empathy is your greatest gift.',th:'สัญชาตญาณและรู้สึกลึกซึ้ง — คุณรักอย่างสมบูรณ์ คุณรู้สึกสิ่งที่คู่รักรู้สึกก่อนที่พวกเขาจะพูด ความเห็นอกเห็นใจคือของขวัญที่ยิ่งใหญ่'},
  };
  const LOVE_MOON={
    fire:{en:'Your Vedic Moon in a fire sign brings emotional courage. You need to be truly seen and celebrated in love.',th:'ดวงจันทร์เวทิกในราศีไฟให้ความกล้าทางอารมณ์ คุณต้องการได้รับการมองเห็นและยกย่องในความรักอย่างแท้จริง'},
    earth:{en:'Your Vedic Moon in an earth sign grounds your emotional life. You feel most loved when life is secure and rhythmic.',th:'ดวงจันทร์เวทิกในราศีดินทำให้ชีวิตอารมณ์มั่นคง คุณรู้สึกถูกรักมากที่สุดเมื่อชีวิตปลอดภัยและมีจังหวะ'},
    air:{en:'Your Vedic Moon in an air sign craves mental connection. You fall in love through words, wit, and shared discovery.',th:'ดวงจันทร์เวทิกในราศีลมต้องการการเชื่อมต่อทางความคิด คุณตกหลุมรักผ่านคำพูดและการค้นพบร่วมกัน'},
    water:{en:'Your Vedic Moon in a water sign makes love a spiritual experience. You bond through vulnerability, shared dreams, and unspoken feeling.',th:'ดวงจันทร์เวทิกในราศีน้ำทำให้ความรักเป็นประสบการณ์ทางจิตวิญญาณ คุณผูกพันผ่านความเปราะบางและความรู้สึกที่ไม่ได้พูด'},
  };
  const LOVE_WARN={
    fire:{en:'Watch for impatience — let the connection breathe and grow at its own pace.',th:'ระวังความใจร้อน — ให้เวลาความสัมพันธ์เติบโตในจังหวะของตัวเอง'},
    earth:{en:'Open up emotionally — your partner needs your inner world, not just your devoted actions.',th:'เปิดใจแสดงอารมณ์ — คู่รักต้องการโลกภายในของคุณ ไม่ใช่แค่การกระทำที่ทุ่มเท'},
    air:{en:'Commit to presence — love needs more than great ideas and stimulating conversation.',th:'ให้ความสำคัญกับการอยู่ด้วยกัน — ความรักต้องการมากกว่าแค่ไอเดียดีๆ'},
    water:{en:'Set emotional boundaries — your open heart is a gift, but it also needs protection.',th:'ตั้งขอบเขตทางอารมณ์ — หัวใจที่เปิดกว้างคือของขวัญ แต่ก็ต้องการการปกป้อง'},
  };
  const LOVE_DAY_EN=['Sunday — solar energy; bold confessions and radiant dates','Monday — lunar flow; gentle romance and emotional honesty','Tuesday — Martian fire; passionate dates and brave declarations','Wednesday — Mercury wit; playful connection and deep conversation','Thursday — Jovian warmth; expansive love and heartfelt giving','Friday — Venusian grace; the classic day of beauty and romance','Saturday — Saturnine depth; serious commitment and lasting bonds'];
  const LOVE_DAY_TH=['อาทิตย์ — พลังแสงสุริยะ คำสารภาพรักที่โดดเด่น','จันทร์ — ความลื่นไหลดวงจันทร์ ความโรแมนติกอ่อนโยน','อังคาร — ไฟดาวอังคาร วันออกเดทที่ร้อนแรง','พุธ — ไหวพริบดาวพุธ การเชื่อมต่อสนุกสนานและเชิงลึก','พฤหัส — ความอบอุ่นดาวพฤหัส ความรักที่กว้างขวาง','ศุกร์ — ความสง่าดาวศุกร์ วันคลาสสิกแห่งความงามและความโรแมนติก','เสาร์ — ความลึกดาวเสาร์ ความมุ่งมั่นจริงจังและพันธะที่ยั่งยืน'];

  const PET_TYPE={
    wood:{en:'Birds or fish — movement, sound, and calm energy match your Wood nature.',th:'นกหรือปลา — การเคลื่อนไหว เสียง และพลังงานสงบตรงกับธรรมชาติไม้ของคุณ'},
    fire:{en:'Dogs or energetic cats — warm, playful companions who match your Fire vitality.',th:'สุนัขหรือแมวที่มีพลัง — เพื่อนที่อบอุ่นและสนุกสนานตรงกับชีวิตชีวาไฟของคุณ'},
    earth:{en:'Rabbits, tortoises, or calm dog breeds — steady animals that mirror your grounding energy.',th:'กระต่าย เต่า หรือสุนัขสายพันธุ์สงบ — สัตว์มั่นคงที่สะท้อนพลังงานที่มั่นคงของคุณ'},
    metal:{en:'Independent cats or birds — self-sufficient companions who respect your need for space.',th:'แมวอิสระหรือนก — เพื่อนพึ่งตัวเองที่เคารพความต้องการพื้นที่ส่วนตัว'},
    water:{en:'Fish or gentle aquatic pets — quiet creatures whose calm presence soothes your depth.',th:'ปลาหรือสัตว์น้ำที่อ่อนโยน — สัตว์เงียบสงบที่ปลอบประโลมความลึกของคุณ'},
  };
  const PET_BOND={
    fire:{en:'You bond through active play and adventure — your pet needs to be a co-explorer.',th:'คุณผูกพันผ่านการเล่นและการผจญภัย สัตว์เลี้ยงของคุณต้องเป็นนักสำรวจร่วม'},
    earth:{en:'Your loyalty creates a lifelong bond. Daily routines and consistent care are your love language.',th:'ความภักดีของคุณสร้างสายสัมพันธ์ตลอดชีวิต กิจวัตรประจำวันและการดูแลสม่ำเสมอคือภาษารัก'},
    air:{en:'Mental stimulation is key — choose a pet that can be trained, talked to, and kept curious.',th:'การกระตุ้นทางความคิดคือสิ่งสำคัญ เลือกสัตว์เลี้ยงที่ฝึกได้ พูดคุยด้วยได้'},
    water:{en:'You sense your pet\'s emotions intuitively. You will be an extraordinary caregiver for sensitive animals.',th:'คุณรับรู้อารมณ์สัตว์เลี้ยงได้โดยสัญชาตญาณ คุณจะเป็นผู้ดูแลที่ยอดเยี่ยมสำหรับสัตว์ที่ละเอียดอ่อน'},
  };
  const PET_ANIMAL_EN=['Rat — smart social pets who learn tricks and love interactive toys','Ox — calm loyal animals; you will give your pet lifelong dedication','Tiger — bold pets: dogs, parrots, or adventurous cats match your spirit','Rabbit — gentle creatures; small affectionate animals will adore you','Dragon — exotic or rare pets suit your grand spirit','Snake — quiet contemplative pets like fish or reptiles resonate with you','Horse — active outdoor breeds and working dogs align with your love of freedom','Goat — nurturing bond; gentle dogs or singing birds suit your creative nature','Monkey — intelligent playful pets who keep pace with your boundless energy','Rooster — pets thriving on structured routine respond to you best','Dog — deeply loyal; you will find a soulmate bond with any devoted animal','Pig — joyful affectionate pets; animals who eat, cuddle, and play will complete you'];
  const PET_ANIMAL_TH=['หนู — สัตว์เลี้ยงฉลาด ชอบสังคม เรียนรู้ท่าใหม่และชอบของเล่น','วัว — สัตว์สงบ ซื่อสัตย์ คุณจะทุ่มเทให้สัตว์เลี้ยงตลอดชีวิต','เสือ — สัตว์เลี้ยงกล้าหาญ สุนัข นกแก้ว หรือแมวผจญภัยตรงกับจิตวิญญาณ','กระต่าย — สัตว์อ่อนโยน สัตว์เล็กที่รักใคร่จะชื่นชอบคุณ','มังกร — สัตว์เลี้ยงแปลกหรือหายากเหมาะกับจิตวิญญาณยิ่งใหญ่','งู — สัตว์เลี้ยงสงบ ใคร่ครวญ เช่นปลาหรือสัตว์เลื้อยคลาน','ม้า — สายพันธุ์กลางแจ้งและสุนัขทำงานสอดคล้องกับความรักอิสรภาพ','แพะ — สายสัมพันธ์เอาใจใส่ สุนัขอ่อนโยนหรือนกร้องเพลงเหมาะกับธรรมชาติสร้างสรรค์','ลิง — สัตว์เลี้ยงฉลาดและสนุกที่ตามทันพลังงานไม่มีขีดจำกัด','ไก่ — สัตว์เลี้ยงที่เจริญงอกงามด้วยกิจวัตรมีโครงสร้างตอบสนองได้ดีที่สุด','สุนัข — ซื่อสัตย์อย่างลึกซึ้ง คุณจะพบสายสัมพันธ์วิญญาณกับสัตว์ที่ซื่อสัตย์ใดก็ตาม','หมู — สัตว์เลี้ยงสนุกสนานและรักใคร่ สัตว์ที่กิน กอด และเล่นจะทำให้คุณสมบูรณ์'];

  const FOOD_ELEM={
    wood:{en:'Sour & green — leafy vegetables, citrus, fermented foods, light grains. Eat lightly and often to keep Wood energy flowing.',th:'เปรี้ยวและเขียว — ผักใบเขียว ผลไม้ตระกูลส้ม อาหารหมัก ธัญพืชเบา รับประทานเบาๆ และบ่อยครั้ง'},
    fire:{en:'Bitter & warming — bitter greens, dark chocolate, warming spices (ginger, chilli), red foods. Prioritise protein to sustain your flame.',th:'ขมและอุ่น — ผักขม ช็อกโกแลตดำ เครื่องเทศอุ่น (ขิง พริก) อาหารสีแดง ให้ความสำคัญกับโปรตีน'},
    earth:{en:'Sweet & grounding — root vegetables, wholegrains, legumes, natural sweeteners. Eat slowly at fixed mealtimes.',th:'หวานและมั่นคง — ผักราก ธัญพืชครบส่วน พืชตระกูลถั่ว สารให้ความหวานธรรมชาติ รับประทานช้าๆ ตามเวลา'},
    metal:{en:'Pungent & clean — onion, garlic, white rice, pears, almonds. Spicy yet precise flavours match Metal clarity.',th:'ฉุนและสะอาด — หัวหอม กระเทียม ข้าวขาว ลูกแพร์ อัลมอนด์ รสชาติเผ็ดแต่ชัดเจน'},
    water:{en:'Salty & dark — seaweed, miso, dark beans, mushrooms, bone broth. Deep mineral-rich foods restore Water energy.',th:'เค็มและเข้ม — สาหร่าย มิโซะ ถั่วดำ เห็ด น้ำซุปกระดูก อาหารอุดมแร่ธาตุฟื้นฟูพลังงานน้ำ'},
  };
  const FOOD_STYLE={
    fire:{en:'Eat before you\'re starving — your fire depletes fast. Protein-rich, quick-energy foods keep your flame steady throughout the day.',th:'รับประทานก่อนหิวมาก พลังงานไฟของคุณสูญเสียเร็ว อาหารโปรตีนสูงและให้พลังงานเร็วรักษาเปลวไฟ'},
    earth:{en:'Eat on a schedule — your body thrives on rhythm. Skipping meals causes energy crashes. Ground yourself with regular fuel.',th:'รับประทานตามตาราง ร่างกายของคุณเจริญงอกงามด้วยจังหวะ การข้ามมื้อทำให้พลังงานตก'},
    air:{en:'Variety is your medicine — rotate cuisines, explore new flavours, eat socially. Isolation kills your appetite and energy.',th:'ความหลากหลายคือยาของคุณ สลับอาหารนานาชาติ ลองรสชาติใหม่ และรับประทานแบบสังคม'},
    water:{en:'Nourish gently — your sensitive system responds best to warm, soothing, easily digestible foods. Avoid eating when stressed.',th:'บำรุงอย่างอ่อนโยน ระบบที่ละเอียดอ่อนของคุณตอบสนองดีที่สุดกับอาหารอุ่น ปลอบประโลม และย่อยง่าย'},
  };
  const FOOD_TONE_EN=[null,'Tone 1 — begin fresh: light cleanse or reset to start a new cycle','Tone 2 — balance cold and warm foods equally today','Tone 3 — energising: fruits, seeds, quick proteins','Tone 4 — structured meals: fixed times and measured portions','Tone 5 — bold flavours and superfoods; you can handle intensity','Tone 6 — raw and fresh foods align with your flowing energy','Tone 7 — eat slowly, chew fully, listen to your body','Tone 8 — balanced plate: equal protein, carbs, and greens','Tone 9 — warm cooked foods to close cycles and restore vitality','Tone 10 — dense nourishing foods: legumes, nuts, wholegrains','Tone 11 — intuitive eating; no rules, trust your body today','Tone 12 — bitter and fermented foods support your reflective mind','Tone 13 — cleansing foods and herbal teas to complete your cycle'];
  const FOOD_TONE_TH=[null,'โทน 1 — เริ่มใหม่ ดีท็อกซ์เบาๆ หรือรีเซ็ตวงจร','โทน 2 — สมดุลอาหารเย็นและอุ่นในปริมาณเท่ากัน','โทน 3 — อาหารเพิ่มพลังงาน ผลไม้ เมล็ด โปรตีนเร็ว','โทน 4 — มื้ออาหารมีโครงสร้าง เวลาที่กำหนดและปริมาณที่วัดได้','โทน 5 — รสชาติเข้มข้นและซูเปอร์ฟู้ด คุณรับความเข้มข้นได้','โทน 6 — อาหารดิบและสดสอดคล้องกับพลังงานที่ลื่นไหล','โทน 7 — รับประทานช้าๆ เคี้ยวอย่างเต็มที่ ฟังสัญญาณร่างกาย','โทน 8 — จานที่สมดุล โปรตีน คาร์โบไฮเดรต และผักเขียวเท่าๆ กัน','โทน 9 — อาหารอุ่นและปรุงสุกเพื่อปิดวงจรและฟื้นฟูชีวิตชีวา','โทน 10 — อาหารหนักแน่นและบำรุง ถั่ว ถั่วเปลือกแข็ง ธัญพืชครบส่วน','โทน 11 — รับประทานตามสัญชาตญาณ ไม่มีกฎ ไว้ใจร่างกาย','โทน 12 — อาหารขมและหมักสนับสนุนจิตใจที่ใคร่ครวญ','โทน 13 — อาหารทำความสะอาดและชาสมุนไพรเพื่อสมบูรณ์วงจร'];

  const FIT_STYLE={
    fire:{en:'High-intensity & competitive — HIIT, sprinting, martial arts, team sports. You need the fire of a real challenge to stay engaged.',th:'ความเข้มข้นสูงและการแข่งขัน — HIIT วิ่ง ศิลปะการต่อสู้ กีฬาทีม คุณต้องการไฟของความท้าทายจริงๆ'},
    earth:{en:'Strength & consistency — weightlifting, hiking, Pilates, long-distance running. You build slowly but become exceptionally strong.',th:'ความแข็งแกร่งและความสม่ำเสมอ — การยกน้ำหนัก การเดินป่า พิลาทิส วิ่งระยะไกล คุณสร้างช้าแต่แข็งแกร่งมาก'},
    air:{en:'Variety & social — group fitness, cycling, dancing, team sports. Isolation kills your motivation; train with others to thrive.',th:'ความหลากหลายและสังคม — คลาสกลุ่ม ปั่นจักรยาน เต้น กีฬาทีม การอยู่โดดเดี่ยวฆ่าแรงจูงใจ'},
    water:{en:'Flow & intuition — swimming, yoga, dance, tai chi. You need movement that feels like meditation, not performance.',th:'การไหลและสัญชาตญาณ — ว่ายน้ำ โยคะ เต้น ไทเก็ก คุณต้องการการเคลื่อนไหวที่รู้สึกเหมือนการทำสมาธิ'},
  };
  const FIT_RECOVERY_EN={1:'Water Star — rest deeply between sessions. Your energy runs in tides; honour the lows.',2:'Soil Star — consistency over intensity. Fixed sleep and grounding practices are your best recovery.',3:'Wood Star — active recovery: walks, stretching, light movement keeps your momentum.',4:'Wood Star — creative cross-training refreshes you. Mix modalities to keep Wood energy growing.',5:'Central Earth — most resilient star. Full rest is still essential; never skip it.',6:'Metal Star — structured rest: fixed sleep, breathwork, cold recovery. Precision is your medicine.',7:'Metal Star — social recovery; talk, laugh, share meals. Joy restores Metal energy fastest.',8:'Earth Star — slow and steady. Long sleep, hot baths, grounding food restore you best.',9:'Fire Star — your energy spikes and crashes. Schedule complete rest days or you will burn out.'};
  const FIT_RECOVERY_TH={1:'ดาวน้ำ — พักให้ลึกระหว่างเซสชั่น พลังงานของคุณวิ่งเป็นคลื่น เคารพช่วงต่ำ',2:'ดาวดิน — ความสม่ำเสมอเหนือความเข้มข้น การนอนตามกิจวัตรและการปฏิบัติที่มั่นคงคือการฟื้นตัวที่ดีที่สุด',3:'ดาวไม้ — การฟื้นตัวแบบแอคทีฟ เดิน ยืดเส้น การเคลื่อนไหวเบารักษาแรงผลักดัน',4:'ดาวไม้ — การฝึกข้ามสายแบบสร้างสรรค์ช่วยฟื้นฟู ผสมรูปแบบเพื่อรักษาพลังงานไม้',5:'แผ่นดินกลาง — ดาวที่ยืดหยุ่นมากที่สุด การพักผ่อนเต็มที่ยังจำเป็น อย่าเพิกเฉย',6:'ดาวทอง — การพักแบบมีโครงสร้าง เวลานอนที่กำหนด การหายใจ ความเย็น ความแม่นยำคือยา',7:'ดาวทอง — การฟื้นตัวแบบสังคม พูดคุย หัวเราะ รับประทานร่วมกัน ความสุขฟื้นฟูเร็วที่สุด',8:'ดาวดิน — ช้าและสม่ำเสมอ การนอนยาว อาบน้ำร้อน อาหารมั่นคงฟื้นฟูได้ดีที่สุด',9:'ดาวไฟ — พลังงานพุ่งและตก กำหนดวันพักผ่อนสมบูรณ์หรือคุณจะหมดแรงอย่างรวดเร็ว'};
  const FIT_TONE_EN=[null,'Tone 1 — begin a brand-new training cycle today','Tone 2 — train with a partner; duality keeps you consistent','Tone 3 — activation day: warmup, mobility, power preparation','Tone 4 — form day: perfect your technique, not your output','Tone 5 — go hard; Tone 5 is raw empowerment — push your limit','Tone 6 — flow training; find your rhythm and sustain it','Tone 7 — self-check; assess progress and adjust your approach','Tone 8 — harmony training: full-body balance, no extremes','Tone 9 — completion push; finish strong and close the cycle','Tone 10 — set your next milestone and train toward it','Tone 11 — liberation session; break routine and move freely','Tone 12 — light movement while reflecting on your journey','Tone 13 — one final peak effort before the new cycle begins'];
  const FIT_TONE_TH=[null,'โทน 1 — เริ่มวงจรการฝึกใหม่วันนี้','โทน 2 — ฝึกกับคู่ ความคู่ขนานทำให้สม่ำเสมอ','โทน 3 — วันเปิดใช้งาน อบอุ่น ความคล่องตัว การเตรียมพลัง','โทน 4 — วันฟอร์ม ทำเทคนิคให้สมบูรณ์แบบ ไม่ใช่ผลลัพธ์','โทน 5 — ออกแรงเต็มที่ โทน 5 คือพลังอำนาจดิบ ทดสอบขีดจำกัด','โทน 6 — ฝึกแบบไหล หาจังหวะและรักษาไว้','โทน 7 — ตรวจสอบตนเอง ประเมินความก้าวหน้าและปรับแนวทาง','โทน 8 — ฝึกความกลมกลืน สมดุลทั้งร่างกาย ไม่มีสุดขั้ว','โทน 9 — ผลักดันสมบูรณ์ จบอย่างแข็งแกร่งและปิดวงจร','โทน 10 — กำหนดเป้าหมายถัดไปและฝึกเพื่อไปถึง','โทน 11 — เซสชั่นการปลดปล่อย ทำลายกิจวัตรและเคลื่อนไหวอย่างอิสระ','โทน 12 — การเคลื่อนไหวเบาขณะสะท้อนเส้นทาง','โทน 13 — ความพยายามพีคสุดท้ายก่อนวงจรใหม่เริ่มต้น'];

  return{
    love:[
      {icon:'♡',label:L?'Your Love Style':'สไตล์การรัก',text:L?LOVE_STYLE[el].en:LOVE_STYLE[el].th,source:L?'Energy Type · '+data.energy.label.en:'ประเภทพลังงาน · '+data.energy.label.th},
      {icon:'🌙',label:L?'Emotional Needs':'ความต้องการทางอารมณ์',text:L?LOVE_MOON[vedicEl].en:LOVE_MOON[vedicEl].th,source:L?'Vedic Moon · '+data.vedic.label.en:'ดวงจันทร์เวทิก · '+data.vedic.label.th},
      {icon:'📅',label:L?'Best Day for Love':'วันที่ดีที่สุดสำหรับความรัก',text:L?LOVE_DAY_EN[dow]:LOVE_DAY_TH[dow],source:L?'Thai Brahmin · '+data.brahmin.label.en:'ไทยพราหมณ์ · '+data.brahmin.label.th},
      {icon:'⚠',label:L?'Watch Out For':'ควรระวัง',text:L?LOVE_WARN[el].en:LOVE_WARN[el].th,source:L?'Western · '+data.western.label.en:'โหราตะวันตก · '+data.western.label.en},
    ],
    pets:[
      {icon:'🐾',label:L?'Best Pet for You':'สัตว์เลี้ยงที่เหมาะกับคุณ',text:L?PET_TYPE[baziEl].en:PET_TYPE[baziEl].th,source:L?'BaZi Element · '+baziEl:'ธาตุปาจี · '+baziEl},
      {icon:'💞',label:L?'How You Bond':'วิธีที่คุณผูกพัน',text:L?PET_BOND[el].en:PET_BOND[el].th,source:L?'Energy Type · '+data.energy.label.en:'ประเภทพลังงาน · '+data.energy.label.th},
      {icon:'🐉',label:L?'Animal Affinity':'สัตว์ที่มีความสัมพันธ์',text:L?PET_ANIMAL_EN[bi]:PET_ANIMAL_TH[bi],source:L?'BaZi Animal · '+data.bazi.label.en:'สัตว์ปาจี · '+data.bazi.label.th},
    ],
    food:[
      {icon:'🌿',label:L?'Your Elemental Diet':'อาหารตามธาตุ',text:L?FOOD_ELEM[baziEl].en:FOOD_ELEM[baziEl].th,source:L?'BaZi Element · '+baziEl:'ธาตุปาจี · '+baziEl},
      {icon:'🍽',label:L?'Eating Style':'สไตล์การรับประทาน',text:L?FOOD_STYLE[el].en:FOOD_STYLE[el].th,source:L?'Energy Type · '+data.energy.label.en:'ประเภทพลังงาน · '+data.energy.label.th},
      {icon:'✦',label:L?'Today\'s Food Tone':'โทนอาหารวันนี้',text:L?FOOD_TONE_EN[tone]:FOOD_TONE_TH[tone],source:L?'Mayan Tone '+tone:'โทนมายัน '+tone},
    ],
    fitness:[
      {icon:'⚡',label:L?'Training Style':'สไตล์การฝึก',text:L?FIT_STYLE[el].en:FIT_STYLE[el].th,source:L?'Energy Type · '+data.energy.label.en:'ประเภทพลังงาน · '+data.energy.label.th},
      {icon:'🌀',label:L?'Recovery Method':'วิธีการฟื้นตัว',text:L?FIT_RECOVERY_EN[star]:FIT_RECOVERY_TH[star],source:L?'Nine Star Ki · Star '+star:'เก้าดาวคี · ดาวที่ '+star},
      {icon:'🗓',label:L?'Today\'s Training Tone':'โทนการฝึกวันนี้',text:L?FIT_TONE_EN[tone]:FIT_TONE_TH[tone],source:L?'Mayan Tone '+tone:'โทนมายัน '+tone},
    ],
  };
}

function renderLifeGuide(data){
  const guide=deriveLifeGuide(data);
  const L=LANG==='en';
  const domainKeys=['love','pets','food','fitness'];
  const domainLabels={love:L?'♡ Love':'♡ ความรัก',pets:L?'🐾 Pets':'🐾 สัตว์เลี้ยง',food:L?'🌾 Food':'🌾 อาหาร',fitness:L?'⚡ Fitness':'⚡ ออกกำลังกาย'};
  const tabs=domainKeys.map((k,i)=>`<button class="ldt-btn${i===0?' active':''}" id="ldt-${k}" onclick="switchLifeTab('${k}',this)">${domainLabels[k]}</button>`).join('');
  const panels=domainKeys.map((k,i)=>{
    const items=guide[k].map(it=>`
      <div class="lg-item">
        <div class="lg-item-top">
          <span class="lg-item-icon">${it.icon}</span>
          <span class="lg-item-label">${it.label}</span>
        </div>
        <div class="lg-item-text">${it.text}</div>
        <div class="lg-item-source">${it.source}</div>
      </div>`).join('');
    return`<div class="life-domain-panel${i===0?' active':''}" id="ldp-${k}">${items}</div>`;
  }).join('');
  return`<div class="life-guide">
    <div class="life-guide-header">
      <div class="life-guide-title">${L?'YOUR LIFE GUIDE':'คู่มือชีวิตของคุณ'}</div>
      <div class="life-guide-sub">${L?'Personalized from your 10-system chart':'วิเคราะห์จากดวงชะตา 10 ศาสตร์ของคุณ'}</div>
    </div>
    <div class="life-domain-tabs">${tabs}</div>
    ${panels}
  </div>`;
}

let _lifeTab='love';
function switchLifeTab(key,btn){
  _lifeTab=key;
  document.querySelectorAll('.ldt-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.life-domain-panel').forEach(p=>p.classList.remove('active'));
  const activeBtn=btn||document.getElementById('ldt-'+key);
  if(activeBtn)activeBtn.classList.add('active');
  const p=document.getElementById('ldp-'+key);if(p)p.classList.add('active');
}

// ════════════════════════════════════════
// NEW-PANEL RENDERERS
// ════════════════════════════════════════

// Shared — build a MS26 chart from the saved profile (or null if no DOB yet).
function _getMS26ChartFromProfile(){
  const dob = (document.getElementById('profDob')||{}).value || localStorage.getItem('mth_dob');
  if (!dob || !window.MS26) return null;
  const [y,m,d] = dob.split('-').map(Number);
  if (!y||!m||!d) return null;
  const name    = localStorage.getItem('mth_name') || 'ผู้ใช้';
  const gender  = localStorage.getItem('mth_gender') || 'ชาย';
  const time    = localStorage.getItem('mth_time') || '12:00';
  const city    = localStorage.getItem('mth_city') || '13.75,100.5,7';
  const [hh,mm] = time.split(':').map(Number);
  const [lat,lon,tz] = city.split(',').map(Number);
  // Life Path Resonance context (saved by Subscription → Resonance panel).
  // Without these the chart's Path Resonance scoring runs against defaults
  // and the Premium report differs from the add-on panels.
  const workCountry = localStorage.getItem('mth_country')  || '';
  const domain      = localStorage.getItem('mth_career')   || '';
  const industry    = localStorage.getItem('mth_industry') || '';
  try {
    return window.MS26.calculate({
      name, gender, year:y, month:m, day:d,
      hour:hh||12, minute:mm||0,
      lat:lat||13.75, lon:lon||100.5, timezone:tz||7,
      workCountry, domain, industry,
    });
  } catch(e) { console.error(e); return null; }
}

function _emptyDeepHint(id){
  document.getElementById(id).innerHTML =
    `<div class="tier-lock" style="border-color:var(--border)">
       <div class="tier-lock-icon">🌟</div>
       <div class="tier-lock-title">${t('no_profile_title')}</div>
       <div class="tier-lock-desc">${t('no_profile_desc')}</div>
       <button class="ghost-btn" onclick="setGroup('profile');showSubTab('me')">${t('no_profile_cta')}</button>
     </div>`;
}

// ── Deep Readings: 26-system sub-nav + per-system card ────
// Each entry: [key, label-TX, emoji, getter(chart) → {title, origin, insight, reading, stats[]}]
// insight = 1-2 line personalised summary (shown front-and-centre)
// reading = full Thai narrative (shown in collapsible details)
// origin  = bilingual string via LANG global
const DEEP_SYSTEMS = [
  ['western','ds_western','☀️',(c)=>({
    title:`${c.western.sunSignTh} (${c.western.sunSign})`,
    origin: LANG==='th' ? 'กรีก/โรมัน · ~2,500 ปี' : 'Greece / Rome · 2,500 yrs',
    insight: LANG==='th'
      ? `ดวงอาทิตย์ <strong>${c.western.sunSignTh}</strong> · ดวงจันทร์ <strong>${c.western.moonSignTh}</strong> · ราศีขึ้น <strong>${c.western.ascSignTh}</strong><br>ดาวพฤหัสบดีใน ${c.western.jupiterSign} · ดาวเสาร์ใน ${c.western.saturnSign} — ดาวใหญ่แห่งปี 2026`
      : `Sun <strong>${c.western.sunSign}</strong> · Moon <strong>${c.western.moonSignTh}</strong> · Asc <strong>${c.western.ascSignTh}</strong><br>Jupiter in ${c.western.jupiterSign} · Saturn in ${c.western.saturnSign} — the two major forces of 2026`,
    reading: c.western.reading||'',
    stats:[
      [LANG==='th'?'ดวงอาทิตย์':'Sun', c.western.sunSignTh],
      [LANG==='th'?'ดวงจันทร์':'Moon', c.western.moonSignTh],
      [LANG==='th'?'ราศีขึ้น':'Asc', c.western.ascSignTh],
      [LANG==='th'?'ดาวพฤหัส':'Jupiter', c.western.jupiterSign],
      [LANG==='th'?'ดาวเสาร์':'Saturn', c.western.saturnSign],
    ]
  })],
  ['bazi','ds_bazi','☯️',(c)=>({
    title:`${c.bazi.dayStem}${c.bazi.dayBranch} — ${c.bazi.dayMasterTh}`,
    origin: LANG==='th' ? 'จีน · ~1,400 ปี' : 'China · 1,400 yrs',
    insight: LANG==='th'
      ? `Day Master <strong>${c.bazi.dayMasterTh}</strong> — เสริมกำลังด้วยธาตุ <strong>${c.bazi.luckyElement}</strong> · หลีกเลี่ยง <strong>${c.bazi.avoidElement}</strong><br>Luck Pillar ปัจจุบัน: <strong>${c.bazi.currentLuckPillarTh || c.bazi.currentLuckPillar || '—'}</strong>`
      : `Day Master <strong>${c.bazi.dayMasterTh}</strong> — boost with <strong>${c.bazi.luckyElement}</strong> · avoid <strong>${c.bazi.avoidElement}</strong><br>Current Luck Pillar: <strong>${c.bazi.currentLuckPillarTh || c.bazi.currentLuckPillar || '—'}</strong>`,
    reading: c.bazi.reading||'',
    stats:[
      [LANG==='th'?'เสาปี':'Year', `${c.bazi.yearStemTh} ${c.bazi.yearBranchTh}`],
      [LANG==='th'?'เสาเดือน':'Month', `${c.bazi.monthStemTh} ${c.bazi.monthBranchTh}`],
      [LANG==='th'?'Day Master':'Day Master', c.bazi.dayMasterTh],
      [LANG==='th'?'ธาตุเสริม':'Lucky El', c.bazi.luckyElement],
      [LANG==='th'?'ธาตุระวัง':'Avoid El', c.bazi.avoidElement],
    ]
  })],
  ['vedic','ds_vedic','🕉️',(c)=>({
    title:`Nakshatra ${c.vedic.moonNakshatra} · Lagna ${c.vedic.lagna}`,
    origin: LANG==='th' ? 'อินเดีย · ~3,000 ปี' : 'India · 3,000 yrs',
    insight: LANG==='th'
      ? `Lagna <strong>${c.vedic.lagna}</strong> · Nakshatra <strong>${c.vedic.moonNakshatra}</strong> (Pada ${c.vedic.nakshatraPada||1})<br>เทพนักษัตร: <strong>${c.vedic.nakshatraLord||'—'}</strong> — สะท้อนแรงจูงใจและสัญชาตญาณลึก`
      : `Lagna <strong>${c.vedic.lagna}</strong> · Nakshatra <strong>${c.vedic.moonNakshatra}</strong> (Pada ${c.vedic.nakshatraPada||1})<br>Nakshatra Lord: <strong>${c.vedic.nakshatraLord||'—'}</strong> — shapes your deepest motivation`,
    reading: c.vedic.reading||'',
    stats:[
      ['Lagna', c.vedic.lagna],
      ['Nakshatra', c.vedic.moonNakshatra],
      ['Pada', c.vedic.nakshatraPada||'-'],
      [LANG==='th'?'เทพ':'Lord', c.vedic.nakshatraLord||'-'],
    ]
  })],
  ['ninestar','ds_nsk','⭐',(c)=>({
    title:`${LANG==='th'?'ดาว':'Star'} ${c.ninestar.star} ${c.ninestar.starName}`,
    origin: LANG==='th' ? 'ญี่ปุ่น / เกาหลี · ~1,200 ปี' : 'Japan / Korea · 1,200 yrs',
    insight: LANG==='th'
      ? `ดาว <strong>${c.ninestar.star} ${c.ninestar.starName}</strong> · ธาตุ ${c.ninestar.starElement}<br>ทิศนำโชค: <strong>${c.ninestar.starDirection||'—'}</strong> · ทิศนอน: <strong>${c.ninestar.directionSleep||'—'}</strong>`
      : `Star <strong>${c.ninestar.star} ${c.ninestar.starName}</strong> · Element ${c.ninestar.starElement}<br>Lucky direction: <strong>${c.ninestar.starDirection||'—'}</strong> · Sleep direction: <strong>${c.ninestar.directionSleep||'—'}</strong>`,
    reading: c.ninestar.reading||'',
    stats:[
      [LANG==='th'?'ดาว':'Star', c.ninestar.star],
      [LANG==='th'?'ธาตุ':'Element', c.ninestar.starElement],
      [LANG==='th'?'ทิศนำโชค':'Lucky Dir', c.ninestar.starDirection||'-'],
      [LANG==='th'?'ทิศนอน':'Sleep Dir', c.ninestar.directionSleep||'-'],
    ]
  })],
  ['numerology','ds_num','🔢',(c)=>({
    title:`Life Path ${c.numerology.lifePath} · Personal Year ${c.numerology.personalYear2026}`,
    origin: LANG==='th' ? 'กรีก (พีทาโกรัส) · ~2,500 ปี' : 'Greece (Pythagorean) · 2,500 yrs',
    insight: LANG==='th'
      ? `Life Path <strong>${c.numerology.lifePath}</strong> · Destiny <strong>${c.numerology.destiny||'—'}</strong><br>Personal Year 2026: <strong>${c.numerology.personalYear2026}</strong> — ธีมพลังงานหลักของปีนี้`
      : `Life Path <strong>${c.numerology.lifePath}</strong> · Destiny <strong>${c.numerology.destiny||'—'}</strong><br>Personal Year 2026: <strong>${c.numerology.personalYear2026}</strong> — your main energy theme this year`,
    reading: c.numerology.reading||'',
    stats:[
      ['Life Path', c.numerology.lifePath],
      [LANG==='th'?'ปีนี้':'Personal Year', c.numerology.personalYear2026],
      ['Destiny', c.numerology.destiny||'-'],
    ]
  })],
  ['humandesign','ds_hd','⚡',(c)=>({
    title: c.humandesign.typeTh||c.humandesign.type,
    origin: LANG==='th' ? 'สังเคราะห์สมัยใหม่ · ~35 ปี' : 'Modern synthesis · 35 yrs',
    insight: LANG==='th'
      ? `ประเภท: <strong>${c.humandesign.typeTh||c.humandesign.type}</strong> · กลยุทธ์: <strong>${c.humandesign.strategyTh||c.humandesign.strategy}</strong><br>Profile: <strong>${c.humandesign.profile||'—'}</strong> — แนวทางการตัดสินใจและพลังงานชีวิต`
      : `Type: <strong>${c.humandesign.typeTh||c.humandesign.type}</strong> · Strategy: <strong>${c.humandesign.strategyTh||c.humandesign.strategy}</strong><br>Profile: <strong>${c.humandesign.profile||'—'}</strong> — your life strategy and energy blueprint`,
    reading: c.humandesign.reading||'',
    stats:[
      [LANG==='th'?'ประเภท':'Type', c.humandesign.typeTh||c.humandesign.type],
      [LANG==='th'?'กลยุทธ์':'Strategy', c.humandesign.strategyTh||c.humandesign.strategy],
      ['Profile', c.humandesign.profile||'-'],
    ]
  })],
  ['mayan','ds_mayan','🌀',(c)=>({
    title:`Kin ${c.mayan.kin} · ${c.mayan.daySignName||c.mayan.daySign}`,
    origin: LANG==='th' ? 'มายา (เม็กซิโก) · ~2,000 ปี' : 'Maya (Mexico) · 2,000 yrs',
    insight: LANG==='th'
      ? `Kin <strong>${c.mayan.kin}</strong> · Day Sign <strong>${c.mayan.daySignName||c.mayan.daySign}</strong> · Tone <strong>${c.mayan.toneNumber||'—'}</strong><br>Tzolk'in เชื่อมพลังของคุณกับวัฏจักร 260 วันศักดิ์สิทธิ์ของมายา`
      : `Kin <strong>${c.mayan.kin}</strong> · Day Sign <strong>${c.mayan.daySignName||c.mayan.daySign}</strong> · Tone <strong>${c.mayan.toneNumber||'—'}</strong><br>The Tzolk'in connects your energy to the Maya 260-day sacred cycle`,
    reading: c.mayan.reading||'',
    stats:[
      ['Kin', c.mayan.kin],
      [LANG==='th'?'Day Sign':'Day Sign', c.mayan.daySignName||c.mayan.daySign],
      [LANG==='th'?'เสียง':'Tone', c.mayan.toneNumber||'-'],
    ]
  })],
  ['celtic','ds_celtic','🌳',(c)=>({
    title: c.celtic.treeNameTh||c.celtic.treeName,
    origin: LANG==='th' ? 'เซลติก / ดรูอิด · ~2,000 ปี' : 'Celtic / Druid · 2,000 yrs',
    insight: LANG==='th'
      ? `ต้นไม้ประจำตัว: <strong>${c.celtic.treeNameTh||c.celtic.treeName}</strong> · สัญลักษณ์: <strong>${c.celtic.symbol||'—'}</strong><br>ดาวปกครอง: <strong>${c.celtic.planet||'—'}</strong> — เชื่อมจิตวิญญาณกับจังหวะธรรมชาติ`
      : `Birth tree: <strong>${c.celtic.treeNameTh||c.celtic.treeName}</strong> · Symbol: <strong>${c.celtic.symbol||'—'}</strong><br>Ruling planet: <strong>${c.celtic.planet||'—'}</strong> — connects your spirit to natural rhythms`,
    reading: c.celtic.reading||'',
    stats:[
      [LANG==='th'?'ต้นไม้':'Tree', c.celtic.treeNameTh||c.celtic.treeName],
      [LANG==='th'?'สัญลักษณ์':'Symbol', c.celtic.symbol||'-'],
      [LANG==='th'?'ดาว':'Planet', c.celtic.planet||'-'],
    ]
  })],
  ['thai','ds_thai','🙏',(c)=>({
    title:`${c.thai.dayName} · ${c.thai.dayColor}`,
    origin: LANG==='th' ? 'ไทยพราหมณ์ · ~800 ปี' : 'Thai Brahmin · 800 yrs',
    insight: LANG==='th'
      ? `วันเกิด: <strong>${c.thai.dayName}</strong> · สี: <strong>${c.thai.dayColor}</strong> · เทพประจำวัน: <strong>${c.thai.deity||'—'}</strong><br>โหราศาสตร์ไทยผสมพราหมณ์-พุทธ เน้นพิธีกรรมและฤกษ์มงคล`
      : `Birth day: <strong>${c.thai.dayName}</strong> · Color: <strong>${c.thai.dayColor}</strong> · Day deity: <strong>${c.thai.deity||'—'}</strong><br>Thai Brahmin blends Hindu and Buddhist astrology for auspicious timing`,
    reading: c.thai.reading||'',
    stats:[
      [LANG==='th'?'วัน':'Day', c.thai.dayName],
      [LANG==='th'?'สีมงคล':'Color', c.thai.dayColor],
      [LANG==='th'?'เทพ':'Deity', c.thai.deity||'-'],
    ]
  })],
  ['saju','ds_saju','🌸',(c)=>({
    title:`Saju (사주) — ${c.saju.dayPillar}`,
    origin: LANG==='th' ? 'เกาหลี · ~700 ปี' : 'Korea · 700 yrs',
    insight: LANG==='th'
      ? `เสาปี: <strong>${c.saju.yearPillar}</strong> · เสาเดือน: <strong>${c.saju.monthPillar}</strong> · เสาวัน: <strong>${c.saju.dayPillar}</strong><br>Saju คล้าย BaZi แต่เน้นความสัมพันธ์และวิถีชีวิตแบบเกาหลี`
      : `Year: <strong>${c.saju.yearPillar}</strong> · Month: <strong>${c.saju.monthPillar}</strong> · Day: <strong>${c.saju.dayPillar}</strong><br>Saju mirrors BaZi with a Korean focus on relationships and social harmony`,
    reading: c.saju.reading||'',
    stats:[
      [LANG==='th'?'เสาปี':'Year', c.saju.yearPillar],
      [LANG==='th'?'เสาเดือน':'Month', c.saju.monthPillar],
      [LANG==='th'?'เสาวัน':'Day', c.saju.dayPillar],
    ]
  })],
  ['tibetan','ds_tibetan','🏔️',(c)=>({
    title:`Mewa ${c.tibetan.mewa} ${c.tibetan.mewaName}`,
    origin: LANG==='th' ? 'ทิเบต · ~1,300 ปี' : 'Tibet · 1,300 yrs',
    insight: LANG==='th'
      ? `Mewa <strong>${c.tibetan.mewa} ${c.tibetan.mewaName}</strong> · ธาตุ: <strong>${c.tibetan.mewaElement}</strong><br>ผสมผสานดาราศาสตร์จีนกับคัมภีร์พุทธทิเบต เน้นพลังชีวิต (Srog) และโชควาสนา`
      : `Mewa <strong>${c.tibetan.mewa} ${c.tibetan.mewaName}</strong> · Element: <strong>${c.tibetan.mewaElement}</strong><br>Blends Chinese astronomy with Tibetan Buddhist texts, centred on life-force (Srog)`,
    reading: c.tibetan.reading||'',
    stats:[
      ['Mewa', c.tibetan.mewa],
      [LANG==='th'?'ชื่อ':'Name', c.tibetan.mewaName],
      [LANG==='th'?'ธาตุ':'Element', c.tibetan.mewaElement],
    ]
  })],
  ['ziwei','ds_ziwei','👑',(c)=>({
    title:`紫微斗數 — ${c.ziwei.lifePalaceName||c.ziwei.lifepalace}`,
    origin: LANG==='th' ? 'จีน (จักรพรรดิ) · ~1,000 ปี' : 'China (imperial) · 1,000 yrs',
    insight: LANG==='th'
      ? `วังชีวิต: <strong>${c.ziwei.lifePalaceName||c.ziwei.lifepalace}</strong> · ดาวหลัก: <strong>${c.ziwei.mainStar||'—'}</strong><br>ระบบดาราศาสตร์จักรพรรดิจีน — ซับซ้อนที่สุดในศาสตร์จีน`
      : `Life Palace: <strong>${c.ziwei.lifePalaceName||c.ziwei.lifepalace}</strong> · Main Star: <strong>${c.ziwei.mainStar||'—'}</strong><br>China's imperial astrology — the most complex Chinese divination system`,
    reading: c.ziwei.reading||'',
    stats:[
      [LANG==='th'?'วังชีวิต':'Life Palace', c.ziwei.lifePalaceName||c.ziwei.lifepalace],
      [LANG==='th'?'ดาวหลัก':'Main Star', c.ziwei.mainStar||'-'],
    ]
  })],
  ['onmyodo','ds_onmyodo','⛩️',(c)=>({
    title:`陰陽道 — ${c.onmyodo.rokuyoTh||c.onmyodo.rokuyo}`,
    origin: LANG==='th' ? 'ญี่ปุ่น · ~1,200 ปี' : 'Japan · 1,200 yrs',
    insight: LANG==='th'
      ? `Rokuyo: <strong>${c.onmyodo.rokuyoTh||c.onmyodo.rokuyo}</strong><br>Onmyōdō ผสมหยิน-หยาง ธาตุ 5 และดาว 7 — รหัสจักรวาลญี่ปุ่นสำหรับฤกษ์งามยามดี`
      : `Rokuyo: <strong>${c.onmyodo.rokuyoTh||c.onmyodo.rokuyo}</strong><br>Onmyōdō blends yin-yang, five elements and seven stars — the ancient Japanese code for auspicious timing`,
    reading: c.onmyodo.reading||'',
    stats:[
      ['Rokuyo', c.onmyodo.rokuyoTh||c.onmyodo.rokuyo],
    ]
  })],
  ['hellenistic','ds_hellenistic','🌿',(c)=>({
    title:`Hellenistic — ${c.hellenistic.sectTh||c.hellenistic.sect}`,
    origin: LANG==='th' ? 'กรีก/โรมัน · ~2,200 ปี' : 'Greece / Rome · 2,200 yrs',
    insight: LANG==='th'
      ? `Sect: <strong>${c.hellenistic.sectTh||c.hellenistic.sect}</strong> · Trigon Lord: <strong>${c.hellenistic.trigonLord||'—'}</strong><br>Hellenistic คือต้นรากของโหราศาสตร์ตะวันตก เน้น Lot, Sect และ Time-Lord`
      : `Sect: <strong>${c.hellenistic.sectTh||c.hellenistic.sect}</strong> · Trigon Lord: <strong>${c.hellenistic.trigonLord||'—'}</strong><br>Hellenistic is the root of Western astrology — emphasising Lots, Sect and Time-Lords`,
    reading: c.hellenistic.reading||'',
    stats:[
      ['Sect', c.hellenistic.sectTh||c.hellenistic.sect],
      ['Trigon Lord', c.hellenistic.trigonLord||'-'],
    ]
  })],
  ['norseRune','ds_rune','ᚦ',(c)=>({
    title:`Rune ${c.norseRune.rune} ${c.norseRune.runeName}`,
    origin: LANG==='th' ? 'สแกนดิเนเวีย · ~1,800 ปี' : 'Scandinavia · 1,800 yrs',
    insight: LANG==='th'
      ? `Rune: <strong>${c.norseRune.rune} ${c.norseRune.runeName}</strong><br>รูนไวกิ้งไม่ใช่เพียงตัวอักษร — แต่ละตัวคือพลังงานจักรวาลนอร์สที่สะท้อนธรรมชาติภายใน`
      : `Rune: <strong>${c.norseRune.rune} ${c.norseRune.runeName}</strong><br>Viking runes are not just letters — each one is a Norse cosmic force reflecting your inner nature`,
    reading: c.norseRune.reading||'',
    stats:[
      ['Rune', c.norseRune.rune],
      [LANG==='th'?'ชื่อ':'Name', c.norseRune.runeName],
    ]
  })],
  ['ogham','ds_ogham','ᚂ',(c)=>({
    title:`Ogham ${c.ogham.ogham} ${c.ogham.treeName}`,
    origin: LANG==='th' ? 'ไอร์แลนด์ (ดรูอิด) · ~1,500 ปี' : 'Ireland (Druid) · 1,500 yrs',
    insight: LANG==='th'
      ? `Ogham: <strong>${c.ogham.ogham}</strong> · ต้นไม้: <strong>${c.ogham.treeName}</strong><br>ตัวอักษรศักดิ์สิทธิ์ของดรูอิดไอริช — แต่ละตัวผูกกับต้นไม้และพลังธรรมชาติ`
      : `Ogham: <strong>${c.ogham.ogham}</strong> · Tree: <strong>${c.ogham.treeName}</strong><br>Sacred alphabet of the Irish Druids — each symbol bound to a tree and a natural force`,
    reading: c.ogham.reading||'',
    stats:[
      ['Ogham', c.ogham.ogham],
      [LANG==='th'?'ต้นไม้':'Tree', c.ogham.treeName],
    ]
  })],
  ['arabicParts','ds_arabic','🔮',(c)=>({
    title:`Part of Fortune — ${c.arabicParts.fortuneSignTh||c.arabicParts.fortuneSign}`,
    origin: LANG==='th' ? 'อาหรับ / เปอร์เซีย · ~1,300 ปี' : 'Arabic / Persian · 1,300 yrs',
    insight: LANG==='th'
      ? `Part of Fortune ใน <strong>${c.arabicParts.fortuneSignTh||c.arabicParts.fortuneSign}</strong><br>Arabic Parts คำนวณจากมุมระหว่างดาว หา "จุดพิเศษ" ของชีวิต — Fortune บอกว่าโชคจะรออยู่ที่ไหน`
      : `Part of Fortune in <strong>${c.arabicParts.fortuneSignTh||c.arabicParts.fortuneSign}</strong><br>Arabic Parts are calculated angles that reveal life's "sensitive points" — Fortune marks where luck awaits`,
    reading: c.arabicParts.reading||'',
    stats:[
      [LANG==='th'?'ราศีแห่งโชค':'Fortune Sign', c.arabicParts.fortuneSignTh||c.arabicParts.fortuneSign],
    ]
  })],
  ['kabbalistic','ds_kabbalah','✡️',(c)=>({
    title:`Sephira ${c.kabbalistic.sephira}`,
    origin: LANG==='th' ? 'ยิว (Kabbalah) · ~800 ปี' : 'Jewish mysticism · 800 yrs',
    insight: LANG==='th'
      ? `Sephira: <strong>${c.kabbalistic.sephira}</strong> · อักษรฮีบรู: <strong>${c.kabbalistic.sephiraHebrew||'—'}</strong> · เทพทูต: <strong>${c.kabbalistic.archangel||'—'}</strong><br>Kabbalah มองดวงผ่าน Tree of Life — Sephira บ่งบอกคุณสมบัติจิตวิญญาณและเส้นทางทิพย์`
      : `Sephira: <strong>${c.kabbalistic.sephira}</strong> · Hebrew: <strong>${c.kabbalistic.sephiraHebrew||'—'}</strong> · Archangel: <strong>${c.kabbalistic.archangel||'—'}</strong><br>Kabbalah reads fate through the Tree of Life — your Sephira reveals spiritual qualities and the divine path`,
    reading: c.kabbalistic.reading||'',
    stats:[
      ['Sephira', c.kabbalistic.sephira],
      ['Hebrew', c.kabbalistic.sephiraHebrew||'-'],
      ['Archangel', c.kabbalistic.archangel||'-'],
    ]
  })],
  ['zoroastrian','ds_zoro','🔥',(c)=>({
    title:`Yazata — ${c.zoroastrian.dayYazataTh||c.zoroastrian.dayYazata}`,
    origin: LANG==='th' ? 'เปอร์เซีย (โซโรอัสเตอร์) · ~3,500 ปี' : 'Persia (Zoroastrian) · 3,500 yrs',
    insight: LANG==='th'
      ? `Yazata ประจำวัน: <strong>${c.zoroastrian.dayYazataTh||c.zoroastrian.dayYazata}</strong><br>โซโรอัสเตอร์เป็นหนึ่งในศาสนาเทวนิยมที่เก่าแก่ที่สุด — Yazata คือเทพผู้พิทักษ์ตามวันเกิด`
      : `Day Yazata: <strong>${c.zoroastrian.dayYazataTh||c.zoroastrian.dayYazata}</strong><br>Zoroastrianism is one of the world's oldest monotheisms — the Yazata is your guardian deity by birth date`,
    reading: c.zoroastrian.reading||'',
    stats:[
      [LANG==='th'?'เทพประจำวัน':'Day Yazata', c.zoroastrian.dayYazataTh||c.zoroastrian.dayYazata],
    ]
  })],
  ['aztec','ds_aztec','🪶',(c)=>({
    title:`Tonalpohualli — ${c.aztec.daySignTh||c.aztec.daySign}`,
    origin: LANG==='th' ? 'แอซเทก (เม็กซิโก) · ~1,500 ปี' : 'Aztec (Mexico) · 1,500 yrs',
    insight: LANG==='th'
      ? `Day Sign: <strong>${c.aztec.daySignTh||c.aztec.daySign}</strong> · Tone: <strong>${c.aztec.toneNumber||'—'}</strong><br>Tonalpohualli คือปฏิทิน 260 วันศักดิ์สิทธิ์ของแอซเทก — แต่ละวันมีพลังงานและเทพเฉพาะ`
      : `Day Sign: <strong>${c.aztec.daySignTh||c.aztec.daySign}</strong> · Tone: <strong>${c.aztec.toneNumber||'—'}</strong><br>Tonalpohualli is the Aztec 260-day sacred calendar — each day carries unique cosmic energy and deity`,
    reading: c.aztec.reading||'',
    stats:[
      [LANG==='th'?'Day Sign':'Day Sign', c.aztec.daySignTh||c.aztec.daySign],
      [LANG==='th'?'เสียง':'Tone', c.aztec.toneNumber||'-'],
    ]
  })],
  ['nativeAmerican','ds_native','🦅',(c)=>({
    title:`Birth Totem — ${c.nativeAmerican.birthTotemTh||c.nativeAmerican.birthTotem}`,
    origin: LANG==='th' ? 'อเมริกาเหนือ (พื้นเมือง) · ~1,000 ปี' : 'North America (Native) · 1,000 yrs',
    insight: LANG==='th'
      ? `Totem: <strong>${c.nativeAmerican.birthTotemTh||c.nativeAmerican.birthTotem}</strong> · วงจรดวงจันทร์: <strong>${c.nativeAmerican.moonCycle||'—'}</strong><br>Medicine Wheel เชื่อมคุณกับสัตว์ศักดิ์สิทธิ์ที่มีจิตวิญญาณเดียวกัน`
      : `Totem: <strong>${c.nativeAmerican.birthTotemTh||c.nativeAmerican.birthTotem}</strong> · Moon Cycle: <strong>${c.nativeAmerican.moonCycle||'—'}</strong><br>The Medicine Wheel links you to the sacred animal that shares your spirit`,
    reading: c.nativeAmerican.reading||'',
    stats:[
      [LANG==='th'?'สัตว์โทเทม':'Totem', c.nativeAmerican.birthTotemTh||c.nativeAmerican.birthTotem],
      [LANG==='th'?'วงจรดวงจันทร์':'Moon Cycle', c.nativeAmerican.moonCycle||'-'],
    ]
  })],
  ['ifaYoruba','ds_ifa','🌴',(c)=>({
    title:`Odù — ${c.ifaYoruba.oduTh||c.ifaYoruba.odu}`,
    origin: LANG==='th' ? 'แอฟริกาตะวันตก (โยรูบา) · ~2,000 ปี' : 'West Africa (Yoruba) · 2,000 yrs',
    insight: LANG==='th'
      ? `Odù: <strong>${c.ifaYoruba.oduTh||c.ifaYoruba.odu}</strong><br>Ifá คือระบบทำนายศักดิ์สิทธิ์ที่ UNESCO รับรอง — Odù เป็นบทกวีจักรวาลที่แผนที่เส้นทางชีวิต`
      : `Odù: <strong>${c.ifaYoruba.oduTh||c.ifaYoruba.odu}</strong><br>Ifá is a UNESCO-recognised sacred divination system — Odù are cosmic verses that map your life path`,
    reading: c.ifaYoruba.reading||'',
    stats:[
      ['Odù', c.ifaYoruba.oduTh||c.ifaYoruba.odu],
    ]
  })],
  ['aboriginal','ds_aboriginal','🦘',(c)=>({
    title:`Dreaming — ${c.aboriginal.dreamingTh||c.aboriginal.dreamingAncestor}`,
    origin: LANG==='th' ? 'ออสเตรเลีย (อะบอริจิน) · ~65,000 ปี' : 'Australia (Aboriginal) · 65,000 yrs',
    insight: LANG==='th'
      ? `Dreaming Ancestor: <strong>${c.aboriginal.dreamingTh||c.aboriginal.dreamingAncestor}</strong> · ฤดู: <strong>${c.aboriginal.season||'—'}</strong><br>ความรู้ดั้งเดิมที่เก่าแก่ที่สุดในโลก — Dreaming เชื่อมปัจเจกกับแผ่นดินและบรรพบุรุษ`
      : `Dreaming Ancestor: <strong>${c.aboriginal.dreamingTh||c.aboriginal.dreamingAncestor}</strong> · Season: <strong>${c.aboriginal.season||'—'}</strong><br>The world's oldest continuous knowledge — Dreaming connects you to land and ancestors`,
    reading: c.aboriginal.reading||'',
    stats:[
      [LANG==='th'?'บรรพบุรุษ':'Ancestor', c.aboriginal.dreamingTh||c.aboriginal.dreamingAncestor],
      [LANG==='th'?'ฤดู':'Season', c.aboriginal.season||'-'],
    ]
  })],
  ['biorhythm','ds_bio','📈',(c)=>({
    title:`Biorhythm — ${new Date().toISOString().slice(0,10)}`,
    origin: LANG==='th' ? 'สมัยใหม่ (เวียนนา) · ~120 ปี' : 'Modern (Vienna) · 120 yrs',
    // Engine already returns biorhythm values as percent-int (-100..+100),
    // see build/calc.js: `physical: Math.round(physical * 100)`. Do NOT
    // multiply again — previous bug gave -7300% style output.
    insight: LANG==='th'
      ? `กาย <strong>${c.biorhythm.physical}%</strong> · อารมณ์ <strong>${c.biorhythm.emotional}%</strong> · สติปัญญา <strong>${c.biorhythm.intellectual}%</strong><br>วันนี้${c.biorhythm.physical>50?'พลังกายสูง — เหมาะลงมือ':'พลังกายต่ำ — เหมาะพักฟื้น'}${c.biorhythm.intellectual>50?' · สมองแล่น เหมาะวางแผน':' · ให้เวลาสมองประมวลผล'}`
      : `Physical <strong>${c.biorhythm.physical}%</strong> · Emotional <strong>${c.biorhythm.emotional}%</strong> · Intellectual <strong>${c.biorhythm.intellectual}%</strong><br>${c.biorhythm.physical>50?'High physical energy — great day to act':'Low physical day — prioritise rest'}`,
    reading: c.biorhythm.reading||'',
    stats:[
      [LANG==='th'?'กาย':'Physical', c.biorhythm.physical+'%'],
      [LANG==='th'?'อารมณ์':'Emotional', c.biorhythm.emotional+'%'],
      [LANG==='th'?'สติปัญญา':'Intellectual', c.biorhythm.intellectual+'%'],
    ]
  })],
  ['vedicMahadasha','ds_mahadasha','⏳',(c)=>({
    title:`Mahadasha ${c.vedicMahadasha.currentDasha} (ถึงปี ${c.vedicMahadasha.currentDashaEnd})`,
    origin: LANG==='th' ? 'อินเดีย (Vedic) · ~3,000 ปี' : 'Vedic India · 3,000 yrs',
    insight: LANG==='th'
      ? `Mahadasha ปัจจุบัน: <strong>${c.vedicMahadasha.currentDasha}</strong> (สิ้นสุดปี ${c.vedicMahadasha.currentDashaEnd})<br>Antardasha: <strong>${c.vedicMahadasha.antardasha||'—'}</strong> — Mahadasha กำหนดธีมหลักของบทชีวิตนี้`
      : `Current Mahadasha: <strong>${c.vedicMahadasha.currentDasha}</strong> (ends ${c.vedicMahadasha.currentDashaEnd})<br>Antardasha: <strong>${c.vedicMahadasha.antardasha||'—'}</strong> — Mahadasha defines the master theme of this life chapter`,
    reading: c.vedicMahadasha.reading||'',
    stats:[
      [LANG==='th'?'Mahadasha':'Current Dasha', c.vedicMahadasha.currentDasha],
      [LANG==='th'?'สิ้นสุด':'Ends', c.vedicMahadasha.currentDashaEnd],
      ['Antardasha', c.vedicMahadasha.antardasha||'-'],
    ]
  })],
];

// ── Primary 10 / Secondary 16 split ───────────────────────
// PRIMARY → full deep-reading card (insight + stats + full reading)
// SECONDARY → compact grid tile (title + 1-liner) with CTA to Premium report.
// Logic per user direction (focus core 10, summarise the rest).
const PRIMARY_KEYS = new Set([
  'western','bazi','vedic','ninestar','numerology',
  'humandesign','mayan','thai','saju','celtic'
]);

let _deepActive = 'western';
function renderDeepReadings(){
  const chart = _getMS26ChartFromProfile();
  const nav = document.getElementById('deepSysNav');
  const panel = document.getElementById('deepSysPanel');
  if (!chart) { nav.innerHTML=''; _emptyDeepHint('deepSysPanel'); return; }
  // Primary nav only — secondary systems show as a compact grid below.
  const primary = DEEP_SYSTEMS.filter(([k]) => PRIMARY_KEYS.has(k));
  nav.innerHTML = primary.map(([k,txKey,emoji])=>
    `<button class="deep-sys-btn${k===_deepActive?' active':''}" data-k="${k}" ` +
    `onclick="_showDeep('${k}')" data-t="${txKey}">${emoji} ${t(txKey)}</button>`
  ).join('');
  // Guard: if previously selected key was a secondary system, snap to first primary.
  if (!PRIMARY_KEYS.has(_deepActive)) _deepActive = 'western';
  _showDeep(_deepActive);
}
function _showDeep(k){
  _deepActive = k;
  document.querySelectorAll('.deep-sys-btn').forEach(b=>b.classList.toggle('active', b.getAttribute('data-k')===k));
  const chart = _getMS26ChartFromProfile();
  if (!chart) return;
  const entry = DEEP_SYSTEMS.find(x=>x[0]===k);
  if (!entry) return;
  const [,,,getter] = entry;
  let data;
  try { data = getter(chart); }
  catch(e){ data = {title:'—', origin:'', insight:'', reading:String(e), stats:[]}; }

  const isTh = LANG === 'th';
  const hasReading = data.reading && data.reading.trim().length > 20;

  // Build the secondary-systems compact grid (16 tiles, each with 1-liner insight).
  const secondary = DEEP_SYSTEMS.filter(([sk]) => !PRIMARY_KEYS.has(sk));
  const secondaryHTML = secondary.map(([sk, txKey, emoji, sgetter]) => {
    let s;
    try { s = sgetter(chart); }
    catch(e){ s = {title:'—', origin:'', insight:'—', stats:[]}; }
    // Strip HTML from insight, keep first ~110 chars for compact view.
    const flat = String(s.insight||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
    const oneLine = flat.length > 110 ? flat.slice(0,107)+'…' : flat;
    return `
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:13px 14px;display:flex;flex-direction:column;gap:5px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px;flex-shrink:0">${emoji}</span>
          <div style="font-family:'Josefin Sans',sans-serif;font-size:10px;letter-spacing:1.5px;color:var(--gold);text-transform:uppercase">${t(txKey)}</div>
        </div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:13.5px;color:var(--gold2);line-height:1.35">${s.title||'—'}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:12.5px;color:var(--muted);line-height:1.45">${oneLine||'—'}</div>
        <div style="font-family:'Josefin Sans',sans-serif;font-size:8.5px;letter-spacing:1px;color:var(--gold3);margin-top:2px">${s.origin||''}</div>
      </div>`;
  }).join('');

  document.getElementById('deepSysPanel').innerHTML =
    `<div class="deep-sys-card">
       <!-- Header row: title + PRIMARY badge -->
       <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:10px">
         <div>
           <div class="deep-sys-title">${data.title}</div>
           <div class="deep-sys-origin">${data.origin}</div>
         </div>
         <span style="font-family:'Josefin Sans',sans-serif;font-size:8px;letter-spacing:1.5px;color:var(--gold);background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.4);padding:3px 8px;border-radius:12px;white-space:nowrap;flex-shrink:0">${isTh?'ศาสตร์หลัก':'PRIMARY'}</span>
       </div>

       <!-- Stats grid -->
       <div class="deep-sys-stats">
         ${(data.stats||[]).map(([l,v])=>
            `<div class="deep-sys-stat"><div class="deep-sys-stat-lbl">${l}</div><div class="deep-sys-stat-val">${v||'—'}</div></div>`
         ).join('')}
       </div>

       <!-- Key insight (1-2 line personalised summary) -->
       <div style="margin-top:14px;padding:12px 14px;background:rgba(212,175,55,0.05);border-left:3px solid var(--gold);border-radius:0 6px 6px 0;font-family:'Cormorant Garamond',serif;font-size:14px;line-height:1.65;color:var(--text)">
         ${data.insight || '—'}
       </div>

       <!-- Full analysis — shown in full for depth/value -->
       ${hasReading ? `<div class="deep-sys-reading" style="margin-top:14px">${data.reading}</div>` : ''}
     </div>

     <!-- Secondary 16 systems — compact grid -->
     <div style="margin-top:28px">
       <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
         <div style="flex:1;height:1px;background:var(--border)"></div>
         <div style="font-family:'Cinzel Decorative',serif;font-size:11px;letter-spacing:3px;color:var(--gold3);text-transform:uppercase;white-space:nowrap">${isTh?'ศาสตร์รอง · ฉบับย่อ':'Secondary Systems · Brief'}</div>
         <div style="flex:1;height:1px;background:var(--border)"></div>
       </div>
       <div style="font-family:'Cormorant Garamond',serif;font-size:12.5px;color:var(--muted);text-align:center;margin-bottom:16px;font-style:italic;line-height:1.6">
         ${isTh
           ? '15 ศาสตร์เพิ่มเติมจากทั่วโลก — สรุปสั้นต่อระบบ ดูฉบับเต็มได้ในรายงาน Cosmic Blueprint'
           : '15 additional world traditions — brief summaries here, full readings in your Cosmic Blueprint report'}
       </div>
       <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
         ${secondaryHTML}
       </div>
       <div style="text-align:center;margin-top:18px">
         <button class="ghost-btn" onclick="setGroup('premium');showSubTab('blueprint')">
           ${isTh?'✦ ดูรายงานเต็ม Cosmic Blueprint':'✦ View Full Cosmic Blueprint'}
         </button>
       </div>
     </div>`;
}

// ── Life Path Resonance (location / career fit) ────────────
function renderResonance(){
  const panel = document.getElementById('resonancePanel');
  const chart = _getMS26ChartFromProfile();
  if (!chart) { _emptyDeepHint('resonancePanel'); return; }
  const isTh = LANG === 'th';
  const dmEl = chart.bazi.dayMasterElement || '-';
  const nskDir = chart.ninestar.starDirection || '-';
  const lpNum = chart.numerology.lifePath;
  const country  = localStorage.getItem('mth_country')  || '';
  const career   = localStorage.getItem('mth_career')   || '';
  const industry = localStorage.getItem('mth_industry') || '';

  // Engine-computed scores (available because _getMS26ChartFromProfile passes
  // workCountry/domain/industry through to MS26.calculate).
  const sc = chart.score || {};
  const soulFreq     = sc.soulFrequency || sc.total || 700;
  const ltScore      = sc.lifeTerrainScore   || 0;
  const prScore      = sc.pathResonanceScore || 0;
  const cosmicFinal  = sc.cosmicFinal        || soulFreq;
  const ltDetail     = sc.lifeTerrainDetail   || '';
  const prDetail     = sc.pathResonanceDetail || '';
  const hasContext   = !!(country || career || industry);
  const delta        = Math.round(cosmicFinal - soulFreq);

  // Element-language pairs for country reasoning
  const EL_COUNTRIES = {
    'ไม้':   { examples:'Thailand · Japan · Germany · New Zealand', why:'ประเทศที่พลังงาน "สีเขียว" เด่น — ภูเขา ป่า การศึกษา · เสริมความเติบโตของธาตุไม้' },
    'ไฟ':   { examples:'Thailand · Singapore · UAE · Brazil · USA', why:'ประเทศที่ "แสง-ความร้อน-การแสดงออก" เด่น — ให้เวทีสำหรับธาตุไฟ' },
    'ดิน':  { examples:'Thailand · India · China · Mexico',         why:'ประเทศที่ "วัฒนธรรมรากหยั่งลึก" · หล่อเลี้ยงธาตุดินที่ต้องการความมั่นคง' },
    'โลหะ': { examples:'Japan · Korea · Switzerland · UK',          why:'ประเทศที่ "ความแม่นยำ-ระเบียบ" เด่น — เข้ากันกับธาตุโลหะที่รักความสมบูรณ์แบบ' },
    'น้ำ':  { examples:'Japan · Netherlands · Norway · Canada',     why:'ประเทศที่ "น้ำล้อมรอบหรือวัฒนธรรมการไหลเด่น" — ธาตุน้ำหายใจสะดวก' },
  };
  const elFit = EL_COUNTRIES[dmEl] || EL_COUNTRIES['ดิน'];

  // Life Path → career archetype with detailed reasoning
  const LP_CAREER = {
    1:{archetype:'ผู้นำ · ผู้ก่อตั้ง · นักประดิษฐ์', why:'LP 1 = ตัวเลขแห่งการเริ่มต้น — ถูกออกแบบให้จุดประกาย ไม่ใช่ตาม'},
    2:{archetype:'นักประสานงาน · ที่ปรึกษา · mediator', why:'LP 2 = ตัวเลขคู่-ความสัมพันธ์ — เปล่งประกายเมื่ออยู่เป็นส่วนหนึ่งของทีม'},
    3:{archetype:'ครีเอทีฟ · content creator · นักแสดง · นักเขียน', why:'LP 3 = ตัวเลขของการแสดงออก — ต้องการเวทีและผู้ชมเพื่อพลังเต็ม'},
    4:{archetype:'วิศวกร · architect · builder · นักวิเคราะห์ระบบ', why:'LP 4 = ตัวเลขของโครงสร้าง — สร้างสิ่งที่อยู่ถาวร เน้น method มากกว่า flash'},
    5:{archetype:'นักเดินทาง · นักขาย · marketing · investigative journalist', why:'LP 5 = ตัวเลขของการเปลี่ยนแปลง — ตายถ้าอยู่ในกรอบเดิมนานเกิน'},
    6:{archetype:'ครู · healer · hospitality · counsellor', why:'LP 6 = ตัวเลขของการดูแล — รู้สึกเติมเต็มเมื่อทำให้คนอื่นดีขึ้น'},
    7:{archetype:'นักวิจัย · scientist · philosopher · data analyst', why:'LP 7 = ตัวเลขของปัญญาลึก — ต้องการเวลาเงียบเพื่อขุดความจริง'},
    8:{archetype:'CEO · นักลงทุน · developer · power broker', why:'LP 8 = ตัวเลขของอำนาจ-ทุน — ถูกดึงดูดสู่ตำแหน่งผู้ตัดสินใจขนาดใหญ่'},
    9:{archetype:'มนุษยธรรม · artist-activist · ผู้กำกับ · ผู้อุทิศชีวิตเพื่อคน', why:'LP 9 = ตัวเลขปิดรอบ — เห็นภาพใหญ่ของมนุษยชาติและอยากเปลี่ยนมัน'},
    11:{archetype:'spiritual guide · visionary · ประภาคาร', why:'Master 11 = ช่องว่างระหว่างโลกกับจิต — นำสิ่งที่คนอื่นมองไม่เห็นมาแบ่งปัน'},
    22:{archetype:'master builder · architect ของระบบใหญ่', why:'Master 22 = นักสร้างระดับมรดก — ต่อ visions ให้กลายเป็นโครงสร้างจริง'},
    33:{archetype:'master healer · ครูแห่งครู', why:'Master 33 = การรักษาในระดับ collective — หาได้ยากที่สุดใน numerology'},
  };
  const lpData = LP_CAREER[lpNum] || {archetype:'—', why:''};

  // Human Design overlay
  const hdType = chart.humandesign?.typeTh || chart.humandesign?.type || '—';
  const hdStrategy = chart.humandesign?.strategy || '—';

  // Score color helper
  const scColor = (v) => v >= 780 ? '#60c060' : v >= 700 ? '#c8a840' : v >= 600 ? '#c08060' : '#c06060';

  panel.innerHTML = `
    <!-- Intro: explain what Life Path Resonance IS -->
    <div style="background:rgba(212,175,55,0.04);border:1px solid var(--gold3);border-radius:8px;padding:14px 16px;margin-bottom:14px">
      <div style="font-family:'Josefin Sans',sans-serif;font-size:10px;letter-spacing:2px;color:var(--gold);margin-bottom:6px">✦ ${isTh?'LIFE PATH RESONANCE คืออะไร':'WHAT LIFE PATH RESONANCE MEANS'}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:14px;color:var(--text);line-height:1.7">
        ${isTh
          ? `ดวงของคุณ <strong>ไม่เปลี่ยน</strong> ตลอดชีวิต — แต่ <strong>สิ่งแวดล้อมที่คุณเลือก</strong> (ประเทศ · อาชีพ · อุตสาหกรรม) สามารถทำให้ดวงเดียวกันเปล่งแสงได้มาก-น้อยต่างกัน · หน้านี้วัดว่าคุณกำลังใช้ดวงใน "ภูมิประเทศที่เข้ากัน" หรือไม่ และแปลงเป็น 2 คะแนน:<br>
            <strong style="color:#c8a040">Life Terrain</strong> (ประเทศ × ธาตุ) + <strong style="color:#40c0a0">Path Resonance</strong> (สายงาน × ธาตุ)<br>
            2 คะแนนนี้รวมกับ <strong>Soul Frequency</strong> (คะแนนจากวันเกิด) → <strong style="color:var(--gold)">Cosmic Final Score</strong> ที่แสดงในรายงาน`
          : `Your chart <strong>doesn't change</strong> over your lifetime — but <strong>the environment you choose</strong> (country · domain · industry) can either let the same chart shine or dim it. This page measures whether you're running your chart in "aligned terrain" and converts it to two numbers:<br>
            <strong style="color:#c8a040">Life Terrain</strong> (country × element) + <strong style="color:#40c0a0">Path Resonance</strong> (career × element)<br>
            Together with your <strong>Soul Frequency</strong> (birth-only score) → this becomes the <strong style="color:var(--gold)">Cosmic Final Score</strong> in the report`}
      </div>
    </div>

    <!-- Chart fingerprints summary -->
    <div class="deep-sys-card">
      <div class="deep-sys-title">${isTh?'3 จุดยึดจากดวงคุณ':'3 anchors from your chart'}</div>
      <div class="deep-sys-origin">${isTh?'ใช้สำหรับคำนวณ resonance ทั้งหมด':'these 3 values drive the resonance math'}</div>
      <div class="deep-sys-stats" style="margin-top:8px">
        <div class="deep-sys-stat"><div class="deep-sys-stat-lbl">${isTh?'ธาตุ':'Element'}</div><div class="deep-sys-stat-val">${dmEl}</div></div>
        <div class="deep-sys-stat"><div class="deep-sys-stat-lbl">${isTh?'ทิศนำโชค':'Lucky Dir'}</div><div class="deep-sys-stat-val">${nskDir}</div></div>
        <div class="deep-sys-stat"><div class="deep-sys-stat-lbl">Life Path</div><div class="deep-sys-stat-val">${lpNum}</div></div>
        <div class="deep-sys-stat"><div class="deep-sys-stat-lbl">${isTh?'Energy Type':'Energy Type'}</div><div class="deep-sys-stat-val" style="font-size:12px">${hdType}</div></div>
      </div>
    </div>

    <!-- Inputs -->
    <div class="deep-sys-card" style="margin-top:14px">
      <div class="deep-sys-title">${isTh?'บริบทชีวิตปัจจุบัน':'Your current life context'}</div>
      <div class="deep-sys-origin">${isTh?'เปลี่ยนได้ทุกเมื่อ · ผลลัพธ์อัพเดททันที':'edit anytime · scores recompute instantly'}</div>
      <div style="display:grid;grid-template-columns:1fr;gap:10px;margin-top:10px">
        <div class="form-group">
          <label style="display:block;font-family:'Josefin Sans',sans-serif;font-size:10px;letter-spacing:1.5px;color:var(--muted);margin-bottom:4px">${isTh?'ประเทศที่คุณอยู่/ทำงาน':'Country you live / work in'}</label>
          <input id="res_country" value="${country}" placeholder="Thailand, Japan, USA..." style="width:100%;padding:8px 10px;background:var(--bg3);border:1px solid var(--border);color:var(--text);border-radius:4px;font-family:inherit" onchange="localStorage.setItem('mth_country',this.value);renderResonance();_showResRegenHint()">
        </div>
        <div class="form-group">
          <label style="display:block;font-family:'Josefin Sans',sans-serif;font-size:10px;letter-spacing:1.5px;color:var(--muted);margin-bottom:4px">${isTh?'สายอาชีพ / บทบาท':'Career / role'}</label>
          <input id="res_career" value="${career}" placeholder="${isTh?'เช่น Engineer, Designer, Teacher':'e.g. Engineer, Designer, Teacher'}" style="width:100%;padding:8px 10px;background:var(--bg3);border:1px solid var(--border);color:var(--text);border-radius:4px;font-family:inherit" onchange="localStorage.setItem('mth_career',this.value);renderResonance();_showResRegenHint()">
        </div>
        <div class="form-group">
          <label style="display:block;font-family:'Josefin Sans',sans-serif;font-size:10px;letter-spacing:1.5px;color:var(--muted);margin-bottom:4px">${isTh?'อุตสาหกรรม':'Industry'}</label>
          <input id="res_industry" value="${industry}" placeholder="${isTh?'เช่น Tech, Finance, Hospitality':'e.g. Tech, Finance, Hospitality'}" style="width:100%;padding:8px 10px;background:var(--bg3);border:1px solid var(--border);color:var(--text);border-radius:4px;font-family:inherit" onchange="localStorage.setItem('mth_industry',this.value);renderResonance();_showResRegenHint()">
        </div>
      </div>
      ${!hasContext ? `<div style="margin-top:10px;padding:8px 12px;background:rgba(212,175,55,0.06);border-left:3px solid var(--gold3);border-radius:0 6px 6px 0;font-size:12px;color:var(--muted);line-height:1.55">💡 ${isTh?'ถ้ายังไม่กรอก Life Terrain + Path Resonance จะเป็น 0 และ Cosmic Score จะใช้เฉพาะ Soul Frequency — กรอกเพื่อปลดล็อกคะแนนเพิ่ม':'If left blank, Life Terrain + Path Resonance = 0 and Cosmic Score uses Soul Frequency only — fill these to unlock the extra scoring layers'}</div>` : ''}
    </div>

    <!-- Live scores (engine-computed) -->
    <div class="deep-sys-card" style="margin-top:14px;border-color:var(--gold3)">
      <div class="deep-sys-title">${isTh?'คะแนนปัจจุบัน (อัพเดททันทีตามที่กรอก)':'Live scores (updates as you edit)'}</div>
      <div class="deep-sys-origin">${isTh?'คำนวณจาก engine เดียวกับรายงาน Cosmic Blueprint':'computed by the same engine as your Cosmic Blueprint'}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:12px">
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center">
          <div style="font-family:'Josefin Sans',sans-serif;font-size:8.5px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:4px">Soul Frequency</div>
          <div style="font-family:'Cinzel Decorative',serif;font-size:24px;color:${scColor(soulFreq)};font-weight:700">${soulFreq}</div>
          <div style="font-size:9.5px;color:var(--muted);margin-top:2px">${isTh?'จากวันเกิด · เปลี่ยนไม่ได้':'birth-only · fixed'}</div>
        </div>
        <div style="background:var(--bg3);border:1px solid ${ltScore?'#8a6030':'var(--border)'};border-radius:8px;padding:12px;text-align:center">
          <div style="font-family:'Josefin Sans',sans-serif;font-size:8.5px;letter-spacing:1.5px;color:#c8a040;text-transform:uppercase;margin-bottom:4px">Life Terrain</div>
          <div style="font-family:'Cinzel Decorative',serif;font-size:24px;color:${ltScore?scColor(ltScore):'#6a5a42'};font-weight:700">${ltScore||'—'}</div>
          <div style="font-size:9.5px;color:#8a6030;margin-top:2px">${isTh?'ประเทศ × ธาตุ':'country × element'}</div>
        </div>
        <div style="background:var(--bg3);border:1px solid ${prScore?'#205a5a':'var(--border)'};border-radius:8px;padding:12px;text-align:center">
          <div style="font-family:'Josefin Sans',sans-serif;font-size:8.5px;letter-spacing:1.5px;color:#40c0a0;text-transform:uppercase;margin-bottom:4px">Path Resonance</div>
          <div style="font-family:'Cinzel Decorative',serif;font-size:24px;color:${prScore?scColor(prScore):'#206050'};font-weight:700">${prScore||'—'}</div>
          <div style="font-size:9.5px;color:#408080;margin-top:2px">${isTh?'สายงาน × ธาตุ':'career × element'}</div>
        </div>
        <div style="background:var(--bg2);border:2px solid var(--gold);border-radius:8px;padding:12px;text-align:center">
          <div style="font-family:'Josefin Sans',sans-serif;font-size:8.5px;letter-spacing:1.5px;color:var(--gold);text-transform:uppercase;margin-bottom:4px">Cosmic Final</div>
          <div style="font-family:'Cinzel Decorative',serif;font-size:26px;color:var(--gold);font-weight:700">${cosmicFinal}</div>
          <div style="font-size:9.5px;color:${delta>0?'#60c060':delta<0?'#c06060':'var(--muted)'};margin-top:2px">${delta>0?'+':''}${delta} ${isTh?'vs Soul Freq':'vs Soul Freq'}</div>
        </div>
      </div>

      ${ltDetail || prDetail ? `
        <div style="margin-top:12px;padding:10px 12px;background:rgba(0,0,0,.15);border-left:3px solid var(--gold3);border-radius:0 6px 6px 0;font-size:11.5px;color:var(--muted);line-height:1.65">
          ${ltDetail ? `<div><strong style="color:#c8a040">Life Terrain detail:</strong> ${ltDetail.split('|').map(s=>s.trim()).join(' · ')}</div>` : ''}
          ${prDetail ? `<div style="margin-top:6px"><strong style="color:#40c0a0">Path Resonance detail:</strong> ${prDetail.split('|').map(s=>s.trim()).join(' · ')}</div>` : ''}
        </div>
      ` : ''}
    </div>

    <!-- Reasoning: what your chart says about country/career -->
    <div class="deep-sys-card" style="margin-top:14px">
      <div class="deep-sys-title">${isTh?'ทำไมธาตุคุณเหมาะกับประเทศนี้':'Why your element fits these countries'}</div>
      <div class="deep-sys-origin">${isTh?'อิงจาก BaZi 5-element + geography tradition':'from BaZi 5-element + geography tradition'}</div>
      <div style="margin-top:10px;font-family:'Cormorant Garamond',serif;font-size:13.5px;color:var(--text);line-height:1.7">
        <div style="margin-bottom:8px"><strong style="color:var(--gold)">${isTh?'ประเทศที่ธาตุ':'Countries that match your'} ${dmEl} ${isTh?'เข้ากัน':'element'}:</strong> ${elFit.examples}</div>
        <div style="color:var(--muted);font-style:italic">${elFit.why}</div>
        ${country ? `
          <div style="margin-top:10px;padding:8px 12px;background:${elFit.examples.includes(country)?'rgba(40,100,40,0.08)':'rgba(160,100,40,0.08)'};border-left:3px solid ${elFit.examples.includes(country)?'#60a060':'#c0a060'};border-radius:0 6px 6px 0">
            <strong style="color:${elFit.examples.includes(country)?'#60c060':'#c8a840'}">${country}</strong> — ${elFit.examples.includes(country) ? (isTh?'อยู่ในรายชื่อประเทศที่เสริมธาตุ'+dmEl+'ของคุณ 👍':'is on the '+dmEl+'-friendly list for your chart 👍') : (isTh?'ไม่อยู่ในรายชื่อโดยตรง แต่ไม่ใช่ปัญหา — Life Terrain ยังคำนวณจาก country quality + career level ให้อยู่ดี':'not on the direct-match list, but not a problem — Life Terrain still computes from country quality + career level')}
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Career archetype -->
    <div class="deep-sys-card" style="margin-top:14px">
      <div class="deep-sys-title">${isTh?'อาชีพที่ Life Path ชี้ไว้':'Career archetype from your Life Path'}</div>
      <div class="deep-sys-origin">${isTh?'Pythagorean Numerology · Life Path '+lpNum:'Pythagorean Numerology · Life Path '+lpNum}</div>
      <div style="margin-top:10px;font-family:'Cormorant Garamond',serif;font-size:13.5px;color:var(--text);line-height:1.7">
        <div style="margin-bottom:8px"><strong style="color:var(--gold)">${isTh?'ต้นแบบ':'Archetype'}:</strong> ${lpData.archetype}</div>
        <div style="color:var(--muted);font-style:italic">${lpData.why}</div>
        ${career ? `
          <div style="margin-top:10px;padding:8px 12px;background:rgba(64,192,160,0.06);border-left:3px solid #40c0a0;border-radius:0 6px 6px 0">
            <strong style="color:#60d0a0">${isTh?'อาชีพปัจจุบัน':'Current career'}:</strong> ${career}${industry?' · '+industry:''}<br>
            <span style="font-size:11.5px;color:var(--muted);font-style:italic">${isTh?'Path Resonance ด้านบนบอกว่าสายนี้เข้ากับธาตุ'+dmEl+'แค่ไหน':'The Path Resonance score above tells you how well this fits your '+dmEl+' element'}</span>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- How this connects to Cosmic Blueprint -->
    <div class="deep-sys-card" style="margin-top:14px;background:rgba(212,175,55,0.04);border-color:var(--gold3)">
      <div class="deep-sys-title">🔗 ${isTh?'เชื่อมกับ Cosmic Blueprint':'Connection to Cosmic Blueprint'}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:13px;color:var(--text);line-height:1.7;margin-top:8px">
        ${isTh
          ? `คะแนนด้านบนคือ <strong>คะแนนเดียวกัน</strong> ที่จะปรากฏในรายงาน Cosmic Blueprint ที่สร้างไป · ถ้าเพิ่งแก้ข้อมูลที่นี่ ให้ <strong>ไปที่ Premium → Generate แล้วกดสร้างรายงานใหม่อีกครั้ง</strong> เพื่อ re-render รายงานด้วยคะแนนล่าสุด`
          : `The scores above are <strong>the same scores</strong> that appear in your Cosmic Blueprint report · if you just edited data here, <strong>go to Premium → Generate and tap the Generate button again</strong> to re-render the report with the updated scores`}
        <div style="margin-top:10px;text-align:center">
          <button onclick="setGroup('premium');showSubTab('blueprint');" style="font-family:'Josefin Sans',sans-serif;font-size:10.5px;letter-spacing:2px;padding:9px 20px;background:linear-gradient(135deg,var(--gold3),var(--gold));border:none;border-radius:6px;color:var(--bg);font-weight:700;cursor:pointer">
            ✦ ${isTh?'ไปที่ Cosmic Blueprint':'Go to Cosmic Blueprint'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── Resonance re-generate hint ─────────────────────────────
// Shows a brief toast/banner telling the user to regenerate their Cosmic Blueprint
// to incorporate the updated Life Resonance context into the report.
let _resRegenTimer = null;
function _showResRegenHint(){
  // Remove any existing hint first
  const old = document.getElementById('resRegenHint');
  if (old) old.remove();
  if (_resRegenTimer) clearTimeout(_resRegenTimer);

  const banner = document.createElement('div');
  banner.id = 'resRegenHint';
  banner.style.cssText = [
    'position:fixed','bottom:72px','left:50%','transform:translateX(-50%)',
    'background:rgba(20,15,8,0.95)','border:1px solid var(--gold)',
    'color:var(--text)','font-family:\'Josefin Sans\',sans-serif',
    'font-size:11px','letter-spacing:0.5px','padding:10px 18px',
    'border-radius:6px','z-index:9999','max-width:340px','text-align:center',
    'box-shadow:0 4px 20px rgba(0,0,0,0.5)',
  ].join(';');
  banner.innerHTML = LANG==='th'
    ? '💡 บันทึกแล้ว — ไปที่ <strong>Premium → Generate</strong> เพื่ออัพเดทรายงาน'
    : '💡 Saved — visit <strong>Premium → Generate</strong> to update your report';
  document.body.appendChild(banner);

  _resRegenTimer = setTimeout(() => {
    if (banner.parentNode) banner.remove();
  }, 4000);
}

// ── Monthly Brief — compact snapshot, one line per system ──
function renderMonthlyBrief(){
  const panel = document.getElementById('briefPanel');
  const chart = _getMS26ChartFromProfile();
  if (!chart) { _emptyDeepHint('briefPanel'); return; }
  const isTh = LANG === 'th';
  const now = new Date();
  const thisMonth  = now.getMonth();  // 0-11
  const nextMonthIdx = (thisMonth + 1) % 12;
  const monthLabel = now.toLocaleDateString(isTh?'th-TH':'en-US',{month:'long',year:'numeric'});

  // ═══ Compute this-month and next-month trend signals from 26 systems ═══
  // Signals we can time-phase at monthly resolution:
  //   • Nine Star Ki — monthly star (12-month cycle around natal)
  //   • Biorhythm — sample 3 cycles at mid-month
  //   • Numerology Personal Month (PY + month)
  //   • Vedic Mahadasha — stable over the year but cite the current phase
  //   • BaZi — lucky/avoid element interaction with month's element

  const monthStars = [2,8,7,6,5,4,3,2,1,9,8,7];  // Jan..Dec natal-relative star pattern
  const STAR_EL = {1:'น้ำ',2:'ดิน',3:'ไม้',4:'ไม้',5:'ดิน',6:'โลหะ',7:'โลหะ',8:'ดิน',9:'ไฟ'};
  const starNamesTh = {1:'ขาว น้ำ',2:'ดำ ดิน',3:'เขียว ไม้',4:'เขียว ไม้',5:'เหลือง ดิน',6:'ขาว โลหะ',7:'แดง โลหะ',8:'ขาว ดิน',9:'ม่วง ไฟ'};
  const natal = chart.ninestar.star;

  // Biorhythm mid-month
  const daysElapsed = (mi) => Math.round((now.getFullYear() - chart.input.year) * 365.25) + (mi * 30) + 15;
  function bioAt(mi){
    const d = daysElapsed(mi);
    const phy = Math.round(Math.sin(2*Math.PI*d/23)*100);
    const emo = Math.round(Math.sin(2*Math.PI*d/28)*100);
    const intel = Math.round(Math.sin(2*Math.PI*d/33)*100);
    return { phy, emo, intel, avg: Math.round((phy+emo+intel)/3) };
  }

  // Personal Month = reduce(PY + month)
  const digitSum = n => String(n).split('').reduce((a,b)=>a+(+b),0);
  const reduce = n => { while (n>9 && n!==11 && n!==22) n = digitSum(n); return n; };
  const py = chart.numerology.personalYear2026;
  function pmAt(mi){ return reduce(py + (mi+1)); }
  const PM_THEME = {
    1:isTh?'เริ่มต้นใหม่':'New beginnings',
    2:isTh?'ความสัมพันธ์':'Partnership',
    3:isTh?'สื่อสาร-สร้างสรรค์':'Communication',
    4:isTh?'ทำงานหนัก-ระเบียบ':'Hard work',
    5:isTh?'เปลี่ยนแปลง':'Change',
    6:isTh?'ครอบครัว-ความรับผิดชอบ':'Family',
    7:isTh?'ปัญญา-ถอย':'Introspection',
    8:isTh?'อำนาจ-เก็บเกี่ยว':'Harvest',
    9:isTh?'ปิดวัฏจักร':'Completion',
    11:isTh?'วิสัยทัศน์':'Vision',
    22:isTh?'สร้างระบบใหญ่':'Master builder',
  };

  // Compute consensus verdict for a month
  function monthVerdict(mi){
    const ms = monthStars[mi];
    const bio = bioAt(mi);
    const pmNum = pmAt(mi);
    const starEl = STAR_EL[ms];
    // 5-element sheng/ke vs BaZi lucky
    const lucky = chart.bazi.luckyElement;
    const SHENG = {'ไม้':'ไฟ','ไฟ':'ดิน','ดิน':'โลหะ','โลหะ':'น้ำ','น้ำ':'ไม้'};
    const KE    = {'ไม้':'ดิน','ไฟ':'โลหะ','ดิน':'น้ำ','โลหะ':'ไม้','น้ำ':'ไฟ'};

    let score = 0;
    const reasons = [];
    // NSK
    if (ms === natal) { score += 3; reasons.push({sys:'Nine Star Ki', note:isTh?`Honmei — ดาวเดือนตรงดาวเกิด ${natal}`:`Honmei — month star matches natal ${natal}`}); }
    else if (starEl === lucky) { score += 2; reasons.push({sys:'Nine Star Ki', note:isTh?`ดาวเดือน ${ms} ธาตุ${starEl} = ธาตุมงคลคุณ`:`Month star ${ms} element ${starEl} = your lucky element`}); }
    else if (SHENG[starEl] === lucky) { score += 1; reasons.push({sys:'Nine Star Ki', note:isTh?`ดาวเดือน ${ms} สร้างธาตุมงคล ${lucky}`:`Month star ${ms} generates your lucky ${lucky}`}); }
    else if (KE[starEl] === lucky || KE[lucky] === starEl) { score -= 2; reasons.push({sys:'Nine Star Ki', note:isTh?`ดาวเดือน ${ms} ขัดธาตุมงคล`:`Month star ${ms} clashes with lucky element`}); }
    // Biorhythm
    if (bio.avg > 40) { score += 2; reasons.push({sys:'Biorhythm', note:isTh?`เฉลี่ย +${bio.avg}% · พลังกาย-ใจ-สมองสูง`:`avg +${bio.avg}% · 3 cycles high`}); }
    else if (bio.avg < -40) { score -= 2; reasons.push({sys:'Biorhythm', note:isTh?`เฉลี่ย ${bio.avg}% · รอบพักฟื้น`:`avg ${bio.avg}% · recovery window`}); }
    else if (Math.abs(bio.avg) <= 15) reasons.push({sys:'Biorhythm', note:isTh?`เฉลี่ย ${bio.avg>=0?'+':''}${bio.avg}% · เสถียร`:`avg ${bio.avg>=0?'+':''}${bio.avg}% · stable`});
    // Personal Month
    if ([1,3,6,8,9].includes(pmNum)) { score += 1; reasons.push({sys:'Numerology PM', note:`PM ${pmNum} — ${PM_THEME[pmNum]}`}); }
    else if ([4,7].includes(pmNum)) { score -= 1; reasons.push({sys:'Numerology PM', note:`PM ${pmNum} — ${PM_THEME[pmNum]}`}); }
    else reasons.push({sys:'Numerology PM', note:`PM ${pmNum} — ${PM_THEME[pmNum]}`});
    // Vedic Mahadasha — constant across months but cite
    reasons.push({sys:'Vedic Mahadasha', note:isTh?`Dasha ${chart.vedicMahadasha.currentDasha} ต่อเนื่อง`:`${chart.vedicMahadasha.currentDasha} dasha ongoing`});

    const verdict = score >= 4 ? (isTh?'🌟 เดือนทอง':'🌟 Peak month')
                 : score >= 2 ? (isTh?'🟢 หนุน':'🟢 Supportive')
                 : score >= 0 ? (isTh?'🟡 กลาง':'🟡 Neutral')
                 : score >= -2 ? (isTh?'🟠 สังเกต':'🟠 Observe')
                 : (isTh?'🔴 พักฟื้น':'🔴 Rest-recovery');
    return { verdict, score, bio, ms, starEl, pmNum, reasons };
  }

  const thisV = monthVerdict(thisMonth);
  const nextV = monthVerdict(nextMonthIdx);
  const monthNames = isTh
    ? ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
    : ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Helper to render one month's block
  const monthBlock = (label, V) => `
    <div class="deep-sys-card" style="margin-top:12px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div>
          <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:2.5px;color:var(--muted);text-transform:uppercase;margin-bottom:3px">${label}</div>
          <div style="font-family:'Cinzel Decorative',serif;font-size:16px;color:var(--gold)">${V.verdict}</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:2px;color:var(--muted)">${isTh?'คะแนน':'Score'}</div>
          <div style="font-family:'Cinzel Decorative',serif;font-size:22px;color:${V.score>=2?'#4a9a40':V.score>=0?'#c8a840':'#c06060'}">${V.score>0?'+':''}${V.score}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${V.reasons.map(r => `
          <div style="display:flex;gap:8px;padding:7px 10px;background:rgba(0,0,0,.15);border-radius:6px;font-size:11.5px">
            <span style="min-width:110px;font-family:'Josefin Sans',sans-serif;font-size:9.5px;letter-spacing:1.5px;color:var(--gold3)">${r.sys}</span>
            <span style="flex:1;color:var(--text);line-height:1.55">${r.note}</span>
          </div>`).join('')}
      </div>
    </div>`;

  panel.innerHTML = `
    <!-- Intro block -->
    <div style="background:rgba(212,175,55,0.04);border:1px solid var(--gold3);border-radius:8px;padding:14px 16px;margin-bottom:14px">
      <div style="font-family:'Josefin Sans',sans-serif;font-size:10px;letter-spacing:2px;color:var(--gold);margin-bottom:6px">✦ ${isTh?'MONTHLY COSMIC BRIEF คืออะไร':'WHAT THIS BRIEF IS'}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:13.5px;color:var(--text);line-height:1.7">
        ${isTh
          ? `สรุปแนวโน้มของ <strong>เดือนนี้</strong> และ <strong>เดือนหน้า</strong> โดย <strong>ใช้ศาสตร์ที่เปลี่ยนตามเวลา</strong> ในรายงาน 26 ศาสตร์ — คือ Nine Star Ki (ดาวเดือน) · Biorhythm (3 วงจรชีวภาพ) · Numerology Personal Month · Vedic Mahadasha · BaZi ธาตุ · แต่ละศาสตร์โหวตในทิศทางของมันเอง · รวมกันเป็น "trend verdict" ที่ช่วยตัดสินใจ timing ใหญ่ในแต่ละเดือน`
          : `Summarises the <strong>current</strong> and <strong>next</strong> month by combining the <strong>time-phased</strong> systems from your 26: Nine Star Ki (monthly star) · Biorhythm · Numerology Personal Month · Vedic Mahadasha · BaZi element interaction. Each votes; the consensus becomes your "trend verdict" for timing big decisions.`}
      </div>
    </div>

    ${monthBlock((isTh?'เดือนนี้ · ':'This month · ')+monthNames[thisMonth]+' '+now.getFullYear(), thisV)}
    ${monthBlock((isTh?'เดือนหน้า · ':'Next month · ')+monthNames[nextMonthIdx]+' '+(nextMonthIdx===0?now.getFullYear()+1:now.getFullYear()), nextV)}

    <!-- Stable chart fingerprints (unchanging) -->
    <div class="deep-sys-card" style="margin-top:12px;background:rgba(0,0,0,.15)">
      <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:2px;color:var(--muted);margin-bottom:8px">${isTh?'พื้นฐานดวงของคุณ (ไม่เปลี่ยนในเดือนไหน)':'Your chart fingerprints (stable)'}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px">
        <div style="background:var(--bg3);border-radius:5px;padding:7px 10px"><div style="font-size:8.5px;color:var(--muted);letter-spacing:1.5px">Western</div><div style="font-family:'Cormorant Garamond',serif;font-size:12.5px;color:var(--gold2)">${chart.western.sunSignTh} · Moon ${chart.western.moonSignTh}</div></div>
        <div style="background:var(--bg3);border-radius:5px;padding:7px 10px"><div style="font-size:8.5px;color:var(--muted);letter-spacing:1.5px">BaZi</div><div style="font-family:'Cormorant Garamond',serif;font-size:12.5px;color:var(--gold2)">${chart.bazi.dayMasterTh} · ${isTh?'เสริม':'boost'} ${chart.bazi.luckyElement}</div></div>
        <div style="background:var(--bg3);border-radius:5px;padding:7px 10px"><div style="font-size:8.5px;color:var(--muted);letter-spacing:1.5px">Numerology</div><div style="font-family:'Cormorant Garamond',serif;font-size:12.5px;color:var(--gold2)">LP ${chart.numerology.lifePath} · PY ${py}</div></div>
        <div style="background:var(--bg3);border-radius:5px;padding:7px 10px"><div style="font-size:8.5px;color:var(--muted);letter-spacing:1.5px">Human Design</div><div style="font-family:'Cormorant Garamond',serif;font-size:12.5px;color:var(--gold2)">${chart.humandesign.typeTh||chart.humandesign.type}</div></div>
      </div>
    </div>
  `;
}

// ── Frequency Alert history (stub: reads history log) ──────
function renderFreqHistory(){
  const panel = document.getElementById('freqPanel');
  const hist = getFullHistory ? getFullHistory() : [];
  if (!hist.length) {
    panel.innerHTML = `<div class="tier-lock" style="border-color:var(--border)">
      <div class="tier-lock-icon">📡</div>
      <div class="tier-lock-title">${t('freq_empty_title')}</div>
      <div class="tier-lock-desc">${t('freq_empty_desc')}</div>
    </div>`;
    return;
  }
  // History uses the FLAT shape {type, godName, ...}; support legacy nested too.
  const byKey = {};
  for (const h of hist) {
    const k = (h.god && h.god.name) || h.godName || h.type || 'event';
    byKey[k] = (byKey[k]||0) + 1;
  }
  const entries = Object.entries(byKey).sort((a,b)=>b[1]-a[1]).slice(0,12);
  panel.innerHTML = `
    <div class="deep-sys-card">
      <div class="deep-sys-title">${t('freq_top_title')}</div>
      <div class="deep-sys-origin">${t('freq_top_sub')}</div>
      <div class="deep-sys-stats">
        ${entries.map(([k,n])=>
          `<div class="deep-sys-stat"><div class="deep-sys-stat-lbl">${k}</div><div class="deep-sys-stat-val">${n}×</div></div>`).join('')}
      </div>
    </div>`;
}

// ── God Collection grid (from history) ─────────────────────
function renderCollection(){
  const grid = document.getElementById('collectionGrid');
  const hist = getFullHistory ? getFullHistory() : [];
  const isTh = LANG === 'th';

  // Interpolate {{total}} in the section hint with the live god count so the
  // copy always matches the actual dataset (200 → 1069 after inject-gods).
  const hintEl = document.getElementById('collHint');
  if (hintEl) {
    const totalGods = (typeof GODS_FULL !== 'undefined' && Array.isArray(GODS_FULL))
      ? GODS_FULL.length
      : (Array.isArray(GODS) ? GODS.length : 0);
    const totalStr = totalGods.toLocaleString(isTh?'th-TH':'en-US');
    const tpl = (typeof t === 'function') ? t('coll_hint') : hintEl.textContent;
    hintEl.textContent = tpl.replace('{{total}}', totalStr);
  }

  // History entries use the FLAT shape {type, godName, godSymbol, godOrigin,
  // tierName, tierColor}. Previously this function read the OLD nested shape
  // {god:{name,symbol}, tier} which never matched — that's why the grid
  // appeared empty after every draw. Below we support both shapes so any
  // legacy entries survive.
  const seen = {};
  for (const h of hist) {
    if (h.type && h.type !== 'blessing') continue;   // only blessings have gods
    const name  = (h.god && h.god.name)   || h.godName;
    if (!name) continue;
    const symbol = (h.god && h.god.symbol) || h.godSymbol || '✦';
    const tier   = (h.tier && h.tier.name) || h.tierName || 'Common';
    // Keep first-seen entry (oldest symbol/tier).
    if (!seen[name]) seen[name] = { symbol, tier };
  }

  // Tier-by-tier stats: collected / total gods of that tier.
  const totalByTier = {};
  if (Array.isArray(GODS)) {
    for (const g of GODS) totalByTier[g.tier] = (totalByTier[g.tier]||0) + 1;
  }
  const collectedByTier = {};
  for (const info of Object.values(seen)) {
    collectedByTier[info.tier] = (collectedByTier[info.tier]||0) + 1;
  }

  const stats = TIERS.map(T => {
    const got   = collectedByTier[T.name] || 0;
    const total = totalByTier[T.name] || 0;
    const pct   = total > 0 ? Math.round((got/total)*100) : 0;
    const label = isTh ? T.nameTH : T.nameEN;
    return `
      <div style="background:var(--bg2);border:1px solid var(--border);border-left:3px solid ${T.color};border-radius:6px;padding:10px 12px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px">
          <span style="font-family:'Cinzel Decorative',serif;font-size:12px;color:${T.color};letter-spacing:1.5px">${label}</span>
          <span style="font-family:'Josefin Sans',sans-serif;font-size:11px;color:var(--text)">${got} / ${total}</span>
        </div>
        <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${T.color};transition:width .4s"></div>
        </div>
      </div>`;
  }).join('');

  const totalGods       = Array.isArray(GODS) ? GODS.length : 0;
  const totalCollected  = Object.keys(seen).length;
  const totalPct        = totalGods > 0 ? Math.round((totalCollected/totalGods)*100) : 0;

  const statsBlock = `
    <div style="max-width:820px;margin:0 auto 22px;padding:0 4px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">
        <div>
          <div style="font-family:'Cinzel Decorative',serif;font-size:13px;color:var(--gold);letter-spacing:2.5px">${isTh?'สะสมทั้งหมด':'TOTAL COLLECTED'}</div>
          <div style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:12.5px;color:var(--muted);margin-top:2px">${isTh?'รวบรวมให้ครบทุกระดับ':'Collect every tier'}</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:'Cinzel Decorative',serif;font-size:22px;color:var(--gold)">${totalCollected} <span style="font-size:14px;color:var(--muted)">/ ${totalGods}</span></div>
          <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;color:var(--muted);letter-spacing:2px">${totalPct}% COMPLETE</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">
        ${stats}
      </div>
    </div>
  `;

  const entries = Object.entries(seen);
  const gridHTML = entries.length
    ? entries.map(([name,info])=>{
        const T = TIERS.find(x => x.name === info.tier) || {color:'var(--gold)'};
        return `<div style="background:var(--bg2);border:1px solid var(--border);border-top:2px solid ${T.color};border-radius:6px;padding:14px 10px;text-align:center">
          <div style="font-size:34px;margin-bottom:6px">${info.symbol}</div>
          <div style="font-family:'Cinzel Decorative',serif;font-size:12px;color:var(--gold);line-height:1.3">${name}</div>
          <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;color:${T.color};letter-spacing:1px;margin-top:3px">${info.tier}</div>
        </div>`;
      }).join('')
    : `<div style="grid-column:1/-1;text-align:center;padding:24px;color:var(--muted);font-style:italic">${t('coll_empty')}</div>`;

  // Rewrite the full collection area: stats block, then grid.
  grid.innerHTML = `${statsBlock}<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px">${gridHTML}</div>`;
  // Neutralise the host grid's own grid style so our nested layout renders clean.
  grid.style.display = 'block';
  grid.style.gridTemplateColumns = '';
  grid.style.gap = '';
}

// ── Streak & current Frequency Alerts (current only, free) ─
function renderStreak(){
  const el = document.getElementById('streakContent');
  const hist = getFullHistory ? getFullHistory() : [];
  const days = new Set(hist.map(h=>(h.at||h.timestamp||'').slice(0,10)).filter(Boolean));
  const streak = days.size;
  el.innerHTML = `
    <div class="deep-sys-card" style="text-align:center">
      <div class="deep-sys-title">${streak} ${t('streak_days')}</div>
      <div class="deep-sys-origin">${t('streak_sub')}</div>
      <div class="deep-sys-reading" style="font-size:13px">${t('streak_desc')}</div>
    </div>`;
}

// ── Saved Premium reports (list) ───────────────────────────
function renderSavedReports(){
  const el = document.getElementById('reportsList');
  const raw = localStorage.getItem('ms_saved_reports');
  const reports = raw ? (JSON.parse(raw)||[]) : [];
  if (!reports.length) {
    el.innerHTML = `<div class="tier-lock" style="border-color:var(--border)">
      <div class="tier-lock-icon">📂</div>
      <div class="tier-lock-title">${t('reports_empty_title')}</div>
      <div class="tier-lock-desc">${t('reports_empty_desc')}</div>
      <button class="ghost-btn" onclick="showSubTab('blueprint')">${t('reports_empty_cta')}</button>
    </div>`;
    return;
  }
  el.innerHTML = reports.map((r,i)=>
    `<div class="hist-item" style="margin-bottom:8px">
       <div class="hist-item-header">
         <div class="hist-title">${r.name||'Profile'}</div>
         <div class="hist-date">${r.date||''}</div>
       </div>
       <div class="hist-sub">Score ${r.score||'—'} · ${r.tier||'—'}</div>
     </div>`).join('');
}

// ══════════════════════════════════════════════════════════
// ── ADD-ON RENDER FUNCTIONS (unlocked for offline testing)
// ══════════════════════════════════════════════════════════

// ── Shared reasoning helper ────────────────────────────────
// Every add-on now opens with a "how we got here" block: the chart factors
// driving this reading, why the recommendation fits, and why the shadow
// side drains you. User complaint: "มีคำตอบ แต่ไม่มีวิธีคิด" → this is
// the 'วิธีคิด' layer, generic across all 7 add-ons.
//   config = {
//     basedOn: [[label, value], ...],   // chart factors used
//     whyFits: [str, str, ...],         // causal bullets (green)
//     whyAvoid: [str, str, ...],        // anti-bullets (red)
//   }
function _addonReasoning(chart, config){
  const isTh = LANG === 'th';
  const basedOn  = config.basedOn  || [];
  const whyFits  = config.whyFits  || [];
  const whyAvoid = config.whyAvoid || [];
  return `
    <div class="deep-sys-card" style="background:rgba(212,175,55,0.04);border-color:rgba(212,175,55,0.3);margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <span style="font-size:16px">🧭</span>
        <div style="font-family:'Josefin Sans',sans-serif;font-size:9.5px;letter-spacing:2px;color:var(--gold);text-transform:uppercase">
          ${isTh?'วิธีคิด · อ้างอิงจากดวงของคุณ':'Reasoning · From your chart'}
        </div>
      </div>

      <!-- The chart factors that drove this reading -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px;margin-bottom:12px">
        ${basedOn.map(([lbl, val]) => `
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:5px;padding:7px 10px">
            <div style="font-family:'Josefin Sans',sans-serif;font-size:8.5px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:2px">${lbl}</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:13px;color:var(--gold2);font-weight:600">${val}</div>
          </div>
        `).join('')}
      </div>

      <!-- Why the recommendation fits -->
      ${whyFits.length ? `
      <div style="margin-bottom:${whyAvoid.length?'10px':'0'}">
        <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:1.5px;color:#4a9a40;margin-bottom:5px">
          ✓ ${isTh?'ทำไมถึงเหมาะ':'Why this fits'}
        </div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:13.5px;color:var(--text);line-height:1.65">
          ${whyFits.map(b => `<div style="padding:4px 0 4px 14px;position:relative"><span style="position:absolute;left:0;color:#4a9a40">›</span>${b}</div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Why the shadow/avoid side drains you -->
      ${whyAvoid.length ? `
      <div>
        <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:1.5px;color:#c06060;margin-bottom:5px">
          ⚠ ${isTh?'ทำไมอีกฝั่งถึงไม่เหมาะ':'Why the opposite drains you'}
        </div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:13.5px;color:var(--muted);line-height:1.65">
          ${whyAvoid.map(b => `<div style="padding:4px 0 4px 14px;position:relative"><span style="position:absolute;left:0;color:#c06060">›</span>${b}</div>`).join('')}
        </div>
      </div>` : ''}
    </div>`;
}

// Element-specific reasoning fragments used by multiple add-ons. Kept as
// data so tweaking the logic of "why ไม้ is like this" happens in one spot.
const _ELEMENT_TRAITS_TH = {
  'ไม้':  { core:'การเติบโต · ยืดหยุ่น · สื่อสาร', drains:'ความนิ่งเกินไป · การบีบคั้น · โลหะส่วนเกิน' },
  'ไฟ':  { core:'พลังงาน · สร้างสรรค์ · ผู้นำ',    drains:'ความเย็นชา · การห้ามปราม · น้ำมากเกินไป' },
  'ดิน': { core:'ความมั่นคง · บำรุง · สมดุล',      drains:'ความโกลาหล · ไม้มากเกินไป · การปราศจากราก' },
  'โลหะ':{ core:'ความชัดเจน · ระเบียบ · ตัดสินใจ', drains:'ความฟุ้งเฟ้อ · ไฟมากเกินไป · ความยุ่งเหยิง' },
  'น้ำ': { core:'ปัญญา · สัญชาตญาณ · ปรับตัว',    drains:'ดินทึบ · ความซ้ำซาก · การปิดกั้นการไหล' },
};
const _ELEMENT_TRAITS_EN = {
  'ไม้':  { core:'growth · flexibility · communication', drains:'stagnation · over-restriction · excess metal' },
  'ไฟ':  { core:'energy · creativity · leadership',     drains:'coldness · suppression · excess water' },
  'ดิน': { core:'stability · nourishment · balance',    drains:'chaos · excess wood · rootlessness' },
  'โลหะ':{ core:'clarity · order · decisiveness',       drains:'excess · excess fire · disarray' },
  'น้ำ': { core:'wisdom · intuition · adaptability',    drains:'heaviness · monotony · blocked flow' },
};

// ── Divine Mirror ──────────────────────────────────────────
// Content now comes from chart.addons.mirror (produced by calc.ts :: calcAddons).
// The inline GODS dict was removed to make the engine the single source of
// truth. If chart.addons.mirror is missing (older bundle), we still render
// a graceful empty state instead of throwing.
function renderMirror(){
  const el = document.getElementById('mirrorContent');
  const chart = _getMS26ChartFromProfile();
  if (!chart) { _emptyDeepHint('mirrorContent'); return; }
  const isTh = LANG==='th';
  const dmEl = chart.bazi.dayMasterElement||'ไม้';
  const score = chart.score.total;
  const lp = chart.numerology.lifePath;
  const nakshatra = chart.vedic.moonNakshatra;
  const tier = chart.score.tier||'Resonant';

  const gods = (chart.addons && chart.addons.mirror) || null;
  if (!gods) {
    el.innerHTML = `<div class="tier-lock" style="border-color:var(--border)">
      <div class="tier-lock-icon">✦</div>
      <div class="tier-lock-title">${isTh?'กำลังอัพเดทเนื้อหา':'Content update in progress'}</div>
      <div class="tier-lock-desc">${isTh?'รีเจนรายงานของคุณในแท็บ Premium เพื่ออัพโหลด content ล่าสุด':'Re-generate your Premium report to load the latest content'}</div>
    </div>`;
    return;
  }
  const cosmic = gods.cosmic || {name:'—', desc:'—'};
  const tr = (isTh?_ELEMENT_TRAITS_TH:_ELEMENT_TRAITS_EN)[dmEl] || {core:'—',drains:'—'};

  const reasoning = _addonReasoning(chart, {
    basedOn: [
      [isTh?'BaZi Day Master':'BaZi Day Master', chart.bazi.dayMasterTh],
      [isTh?'Cosmic Score':'Cosmic Score', score+' / 999'],
      [isTh?'Life Path':'Life Path', 'LP '+lp],
      [isTh?'Nakshatra':'Nakshatra', nakshatra],
    ],
    whyFits: [
      isTh
        ? `ธาตุ <strong>${dmEl}</strong> ของคุณเน้นพลังงาน <strong>${tr.core}</strong> — เทพที่เลือกจึงสะท้อนคุณสมบัติเหล่านี้ในรูปแบบที่สูงสุด`
        : `Your <strong>${dmEl}</strong> Day Master accents <strong>${tr.core}</strong> — the chosen deities mirror these qualities at their peak expression`,
      isTh
        ? `Cosmic Score <strong>${score}</strong> (tier <strong>${tier}</strong>) ระบุว่า 26 ศาสตร์เห็นตรงกันระดับไหน — จึงเลือก Cosmic Entity ที่เทียบเท่าระดับจิตวิญญาณคุณ`
        : `Your Cosmic Score <strong>${score}</strong> (tier <strong>${tier}</strong>) indicates cross-system consensus — the Cosmic Entity chosen matches this spiritual level`,
      isTh
        ? `Life Path <strong>${lp}</strong> กับ Nakshatra <strong>${nakshatra}</strong> ให้เส้นทางและแรงจูงใจลึก — Secondary/Tertiary god สะท้อนเส้นทางนั้น`
        : `Life Path <strong>${lp}</strong> with Nakshatra <strong>${nakshatra}</strong> shapes your path and deep motivation — Secondary/Tertiary gods reflect that trajectory`,
    ],
    whyAvoid: [
      isTh
        ? `Shadow archetype คือพลังงานเดียวกันของคุณเมื่อ "ไม่สมดุล" — ถ้าคุณถูกบีบด้วย <strong>${tr.drains}</strong>, ธาตุ ${dmEl} จะพลิกเป็นด้านมืด`
        : `The Shadow archetype is your same energy gone imbalanced — when pressed by <strong>${tr.drains}</strong>, your ${dmEl} flips into its darker expression`,
    ],
  });

  el.innerHTML = `
    ${reasoning}
    <!-- Primary Archetype -->
    <div class="deep-sys-card" style="text-align:center;padding:24px 20px">
      <div style="font-size:52px;margin-bottom:10px">${gods.icon}</div>
      <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:2px;color:var(--muted);margin-bottom:6px">PRIMARY ARCHETYPE · ธาตุ ${dmEl}</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:17px;color:var(--gold);letter-spacing:1px;margin-bottom:10px">${gods.primary}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:14px;color:var(--text);line-height:1.7;max-width:480px;margin:0 auto">${gods.primaryDesc}</div>
      ${gods.primaryStory ? `<div style="margin-top:14px;padding:12px 14px;background:rgba(0,0,0,.2);border-left:3px solid var(--gold);border-radius:0 8px 8px 0;text-align:left;font-family:'Cormorant Garamond',serif;font-size:13px;color:var(--muted);line-height:1.75"><div style="font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:2px;color:var(--gold3);margin-bottom:6px">📜 ตำนาน · MYTH</div>${gods.primaryStory}</div>` : ''}
      <div style="margin-top:14px;font-family:'Sarabun',sans-serif;font-size:12px;color:var(--muted);font-style:italic">${gods.mantra}</div>
    </div>

    <!-- Secondary & Tertiary -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div class="deep-sys-card">
        <div style="font-family:'Josefin Sans',sans-serif;font-size:8px;letter-spacing:1.5px;color:var(--muted)">SECONDARY</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--gold);margin:8px 0">${gods.secondary}</div>
        <div style="font-size:12px;color:var(--text);line-height:1.6">${gods.secondaryDesc}</div>
        ${gods.secondaryStory ? `<div style="margin-top:10px;padding:8px 10px;background:rgba(0,0,0,.2);border-radius:6px;font-size:11.5px;color:var(--muted);line-height:1.65">${gods.secondaryStory}</div>` : ''}
      </div>
      <div class="deep-sys-card">
        <div style="font-family:'Josefin Sans',sans-serif;font-size:8px;letter-spacing:1.5px;color:var(--muted)">TERTIARY</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--gold);margin:8px 0">${gods.tertiary}</div>
        <div style="font-size:12px;color:var(--text);line-height:1.6">${gods.tertiaryDesc}</div>
        ${gods.tertiaryStory ? `<div style="margin-top:10px;padding:8px 10px;background:rgba(0,0,0,.2);border-radius:6px;font-size:11.5px;color:var(--muted);line-height:1.65">${gods.tertiaryStory}</div>` : ''}
      </div>
    </div>

    <!-- Cosmic Entity -->
    <div class="deep-sys-card" style="margin-top:12px;border-color:rgba(212,175,55,0.5);background:rgba(212,175,55,0.05);text-align:center;padding:20px">
      <div style="font-family:'Josefin Sans',sans-serif;font-size:8px;letter-spacing:2px;color:var(--gold)">✦ COSMIC ENTITY — 26-SYSTEM CONSENSUS</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:16px;color:var(--gold);margin:10px 0">${cosmic.name}</div>
      <div style="font-size:13px;color:var(--text);line-height:1.6">${cosmic.desc}</div>
      <div style="margin-top:8px;font-size:11px;color:var(--muted)">Score ${score}/999 · LP ${lp} · ${nakshatra}</div>
    </div>

    <!-- Shadow Warning -->
    <div class="deep-sys-card" style="margin-top:12px;border-color:rgba(160,40,40,0.5);background:rgba(160,40,40,0.04)">
      <div style="font-family:'Josefin Sans',sans-serif;font-size:8px;letter-spacing:1.5px;color:#c06060">⚠️ SHADOW ARCHETYPE — ด้านมืดที่ต้องระวัง</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:16px;color:#c08080;margin:8px 0">${gods.shadow}</div>
      <div style="font-size:12px;color:var(--muted);line-height:1.6">${gods.shadowDesc}</div>
      ${gods.shadowStory ? `<div style="margin-top:10px;padding:8px 12px;background:rgba(160,40,40,0.08);border-radius:6px;font-size:11.5px;color:#c09088;line-height:1.7"><div style="font-size:9px;letter-spacing:1.5px;color:#c06060;margin-bottom:4px">📜 ตำนานด้านมืด</div>${gods.shadowStory}</div>` : ''}
    </div>`;
}

// ── Compatible Pet ──────────────────────────────────────────
function renderPet(){
  const el = document.getElementById('petContent');
  const chart = _getMS26ChartFromProfile();
  if (!chart) { _emptyDeepHint('petContent'); return; }
  const isTh = LANG==='th';
  const dmEl = chart.bazi.dayMasterElement||'ไม้';
  const nskDir = chart.ninestar.starDirection||'—';
  // Engine returns biorhythm already as percent-int (-100..+100).
  const physical = chart.biorhythm.physical|0;

  // Pet content sourced from chart.addons.pet (engine-side calcAddons).
  // Fallback minimal stub kept so older bundles don't crash the renderer.
  const p = (chart.addons && chart.addons.pet) || {
    main:'🐱 แมว Ragdoll / Siamese', why:'—',
    colors:'—', timing:'—', avoid:'—',
    secondary:'—', secWhy:'—', care:'—'
  };
  const tr = (isTh?_ELEMENT_TRAITS_TH:_ELEMENT_TRAITS_EN)[dmEl] || {core:'—',drains:'—'};
  const physDay = physical >= 0
    ? (isTh?`พลังกายบวก ${physical}% — วันเหมาะเริ่มเลี้ยง`
           :`Physical +${physical}% — good day to start pet ownership`)
    : (isTh?`พลังกายลบ ${Math.abs(physical)}% — เริ่มเลี้ยงช่วง peak ดีกว่า`
           :`Physical ${physical}% — wait for a peak day to start`);

  // Multi-system citation (was BaZi-only before v4.0).
  const nakshatra = chart.vedic?.moonNakshatra || '—';
  const lp        = chart.numerology?.lifePath || '—';
  const hdType    = chart.humandesign?.typeTh || chart.humandesign?.type || '—';
  const reasoning = _addonReasoning(chart, {
    basedOn: [
      [isTh?'BaZi ธาตุ':'BaZi Element',   chart.bazi.dayMasterTh],
      [isTh?'NSK ทิศ':'NSK Direction',    nskDir],
      [isTh?'Vedic Nakshatra':'Nakshatra', nakshatra],
      [isTh?'Life Path':'Life Path',      'LP '+lp],
      [isTh?'Energy Type':'HD Type',      hdType],
    ],
    whyFits: [
      isTh
        ? `<strong>BaZi:</strong> ธาตุ ${dmEl} เน้น ${tr.core} — สัตว์ที่เลือกเสริมพลังงานนี้ในวงจร 5 ธาตุ`
        : `<strong>BaZi:</strong> your ${dmEl} accents ${tr.core} — the chosen animal amplifies this within the 5-element cycle`,
      isTh
        ? `<strong>Nine Star Ki:</strong> ทิศ ${nskDir} กำหนดที่วางที่นอนสัตว์ + ช่วงเวลารับมาเลี้ยงเพื่อให้ chi ไหลถูก`
        : `<strong>Nine Star Ki:</strong> direction ${nskDir} sets the bed location + adoption window for chi flow`,
      isTh
        ? `<strong>Vedic Nakshatra ${nakshatra}:</strong> สัตว์เลี้ยงแต่ละตัวมี "คุณภาพดวงจันทร์" ที่สัมพันธ์กับ Nakshatra — ตรงกับของคุณจะทำให้ bond ลึกกว่าสัตว์อื่น`
        : `<strong>Vedic Nakshatra ${nakshatra}:</strong> pets carry "moon qualities" that resonate with specific Nakshatras — the chosen one matches yours for deeper bonding`,
      isTh
        ? `<strong>Human Design ${hdType}:</strong> พลังงานของสัตว์นี้ไม่ขัดกับ aura ของคุณ — ${hdType==='Generator'?'ให้ sacral response ชัด':hdType==='Projector'?'เคารพพื้นที่ส่วนตัว':hdType==='Manifestor'?'ไม่เกาะติดจนอึดอัด':'พักได้ระยะยาว'}`
        : `<strong>Human Design ${hdType}:</strong> this animal's energy doesn't clash with your aura — it respects your type's natural rhythm`,
      physDay,
    ],
    whyAvoid: [
      isTh
        ? `สัตว์ใน "ควรเลี่ยง" มีพลังงานที่ดูดธาตุ ${dmEl} ตาม 5-element destroy cycle + ขัดทิศ NSK ${nskDir} ของคุณ — ${tr.drains} จะตามมา`
        : `Animals in "avoid" drain your ${dmEl} via the 5-element destroy cycle AND clash with your NSK direction ${nskDir} — ${tr.drains} follows`,
    ],
  });

  el.innerHTML = `
    ${reasoning}
    <div class="deep-sys-card">
      <div class="deep-sys-title">🐾 ${isTh?'สัตว์เลี้ยงหลัก':'Primary pet'} — ${isTh?'ธาตุ':'Element'} ${dmEl}</div>
      <div class="deep-sys-origin">${isTh?'คำนวณจาก Day Master · Nine Star Ki · Biorhythm':'Based on Day Master · Nine Star Ki · Biorhythm'}</div>
      <div style="text-align:center;font-size:48px;margin:16px 0">${p.main.split(' ')[0]}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:18px;color:var(--gold);text-align:center;margin-bottom:12px">${p.main.slice(2)}</div>
      <div style="font-size:13px;color:var(--text);line-height:1.7;margin-bottom:14px">${p.why}</div>
      ${p.story ? `<div style="padding:12px 14px;background:rgba(0,0,0,.2);border-left:3px solid var(--gold);border-radius:0 8px 8px 0;margin-bottom:14px">
        <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:2px;color:var(--gold3);margin-bottom:6px">📜 ${isTh?'เรื่องราว · ทำไมสัตว์นี้เข้ากับคุณ':'Story · why this fits'}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:12.5px;color:var(--muted);line-height:1.75">${p.story}</div>
      </div>` : ''}
      <div class="deep-sys-stats">
        <div class="deep-sys-stat"><div class="deep-sys-stat-lbl">${isTh?'สีมงคล':'Lucky color'}</div><div class="deep-sys-stat-val">${p.colors}</div></div>
        <div class="deep-sys-stat"><div class="deep-sys-stat-lbl">${isTh?'ช่วงรับมาเลี้ยง':'Adoption window'}</div><div class="deep-sys-stat-val">${p.timing}</div></div>
        <div class="deep-sys-stat"><div class="deep-sys-stat-lbl">${isTh?'พลังกาย':'Physical'}</div><div class="deep-sys-stat-val">${physical>0?'+'+physical+'%':physical+'%'}</div></div>
      </div>
    </div>

    <div class="deep-sys-card" style="margin-top:12px">
      <div class="deep-sys-title">🌟 ${isTh?'ทางเลือกรอง':'Secondary option'}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--gold);margin:8px 0">${p.secondary}</div>
      <div style="font-size:13px;color:var(--text);line-height:1.6">${p.secWhy}</div>
      ${p.secStory ? `<div style="margin-top:10px;padding:8px 12px;background:rgba(0,0,0,.2);border-radius:6px;font-size:11.5px;color:var(--muted);line-height:1.7">${p.secStory}</div>` : ''}
    </div>

    <div class="deep-sys-card" style="margin-top:12px;border-left:3px solid #c06060;background:rgba(180,40,40,0.04)">
      <div style="font-size:10px;letter-spacing:1px;color:#c06060;margin-bottom:6px">⚠️ ${isTh?'ควรเลี่ยง':'Avoid'}</div>
      <div style="font-size:13px;color:var(--text)">${p.avoid}</div>
    </div>

    <div class="deep-sys-card" style="margin-top:12px;border-left:3px solid var(--gold)">
      <div style="font-size:10px;letter-spacing:1px;color:var(--muted);margin-bottom:6px">💡 ${isTh?'เคล็ดลับการดูแลตามธาตุ':'Elemental care tip'}</div>
      <div style="font-size:13px;color:var(--text);line-height:1.6">${p.care}</div>
    </div>`;
}

// ── Cosmic Companions ───────────────────────────────────────
function renderCompanions(){
  const el = document.getElementById('companionsContent');
  const chart = _getMS26ChartFromProfile();
  if (!chart) { _emptyDeepHint('companionsContent'); return; }
  const isTh = LANG==='th';
  const dmEl = chart.bazi.dayMasterElement||'ไม้';
  const score = chart.score.total;
  const lp = chart.numerology.lifePath;
  const rune = chart.norseRune.runeName||'Fehu';
  const kin = chart.mayan.kin||1;

  // Companions content sourced from chart.addons.companions (engine-side).
  const comp = (chart.addons && chart.addons.companions) || {
    creature:'—', creatureDesc:'—', mantra:'—',
    places:'—', music:'—', crystal:'—', color:''
  };
  const tr = (isTh?_ELEMENT_TRAITS_TH:_ELEMENT_TRAITS_EN)[dmEl] || {core:'—',drains:'—'};

  const mahadasha = chart.vedicMahadasha?.currentDasha || '—';
  const reasoning = _addonReasoning(chart, {
    basedOn: [
      [isTh?'BaZi ธาตุ':'BaZi Element',   chart.bazi.dayMasterTh],
      [isTh?'Life Path':'Life Path',     'LP '+lp],
      [isTh?'Vedic Mahadasha':'Mahadasha', mahadasha],
      [isTh?'Norse Rune':'Norse Rune',    rune],
      [isTh?'Mayan Kin':'Mayan Kin',      kin],
    ],
    whyFits: [
      isTh
        ? `<strong>BaZi:</strong> Spirit Companion คัดจากวัฒนธรรมโบราณที่จับคู่ธาตุ ${dmEl} กับสัตว์/สัญลักษณ์เฉพาะ — สะท้อน ${tr.core} ในรูป archetype`
        : `<strong>BaZi:</strong> spirit companion drawn from cultures that paired ${dmEl} with specific creatures — reflects ${tr.core} as archetype`,
      isTh
        ? `<strong>Mahadasha ${mahadasha}:</strong> เทพ/ดาวครองช่วงชีวิตของคุณตอนนี้ — สถานที่ศักดิ์สิทธิ์และดนตรีเลือกจากสิ่งที่ ${mahadasha} resonates`
        : `<strong>Mahadasha ${mahadasha}:</strong> the planet ruling your current life chapter — sacred places + music chosen to resonate with ${mahadasha}'s frequency`,
      isTh
        ? `<strong>Norse Rune ${rune}:</strong> รูนยืนยันเส้นทาง · <strong>Mayan Kin ${kin}:</strong> Kin ยืนยันจังหวะจักรวาล — คริสตัลถูกคัดจากแร่ที่ match ทั้ง 3 พิกัด`
        : `<strong>Rune ${rune}:</strong> confirms the path · <strong>Kin ${kin}:</strong> confirms cosmic timing — crystals filtered to minerals matching all 3 axes`,
      isTh
        ? `<strong>Life Path ${lp}:</strong> มนตราประจำธาตุ${dmEl} ถูกเลือกจากเสียงที่ LP ${lp} ตอบสนองดี — แต่ละ LP มีความถี่ vocal ที่ต่างกัน`
        : `<strong>Life Path ${lp}:</strong> mantra for ${dmEl} chosen by what LP ${lp} responds to — each LP has its own vocal frequency`,
    ],
    whyAvoid: [
      isTh
        ? `การฝืน archetype อื่น (symbol ของธาตุตรงข้าม · mantra ของ LP ต่าง · สถานที่ของ Mahadasha คู่ตรงข้าม) สร้าง ${tr.drains} — พลังไหลผิดทิศ`
        : `Forcing a mismatched archetype (opposite element's symbol · wrong LP's mantra · antagonist Mahadasha's place) creates ${tr.drains}`,
    ],
  });

  el.innerHTML = `
    ${reasoning}
    <!-- Spirit Companion -->
    <div class="deep-sys-card" style="text-align:center;padding:24px 20px">
      <div style="font-size:52px;margin-bottom:10px">${comp.creature.split(' ')[0]}</div>
      <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:2px;color:var(--muted);margin-bottom:6px">COSMIC COMPANION · ${isTh?'ธาตุ':'Element'} ${dmEl}</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:16px;color:var(--gold);margin-bottom:10px">${comp.creature.slice(2)}</div>
      <div style="font-size:13px;color:var(--text);line-height:1.7">${comp.creatureDesc}</div>
      ${comp.creatureStory ? `<div style="margin-top:14px;padding:12px 14px;background:rgba(0,0,0,.2);border-left:3px solid var(--gold);border-radius:0 8px 8px 0;text-align:left">
        <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:2px;color:var(--gold3);margin-bottom:6px">📜 ${isTh?'ตำนานและเหตุผลที่เข้ากับคุณ':'Myth & why it fits you'}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:12.5px;color:var(--muted);line-height:1.75">${comp.creatureStory}</div>
      </div>` : ''}
    </div>

    <!-- Mantra -->
    <div class="deep-sys-card" style="margin-top:12px;border-left:3px solid var(--gold)">
      <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">🔔 ${isTh?'มนตราประจำธาตุ':'Mantra for your element'}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:15px;color:var(--gold);line-height:1.7">${comp.mantra}</div>
    </div>

    <!-- Sacred Places + Music + Crystal -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div class="deep-sys-card">
        <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">🏛️ ${isTh?'สถานที่ศักดิ์สิทธิ์':'Sacred places'}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.7">${comp.places}</div>
      </div>
      <div class="deep-sys-card">
        <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">🎵 ${isTh?'ดนตรีที่เสริมพลัง':'Empowering music'}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.7">${comp.music}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div class="deep-sys-card">
        <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">💎 ${isTh?'คริสตัลประจำธาตุ':'Crystal for your element'}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.7">${comp.crystal}</div>
      </div>
      <div class="deep-sys-card">
        <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">🎨 ${isTh?'สีพลังงาน':'Power colors'}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.7">${comp.color}</div>
        <div style="margin-top:8px;display:flex;gap:6px">
          ${comp.color.split('·').map(c=>{const hex=c.match(/#[0-9a-f]{6}/i);return hex?`<div style="width:24px;height:24px;border-radius:50%;background:${hex[0]};border:1px solid var(--border)"></div>`:''}).join('')}
        </div>
      </div>
    </div>

    <!-- Rune + Kin bonus insight -->
    <div class="deep-sys-card" style="margin-top:12px;border-left:3px solid rgba(212,175,55,0.4)">
      <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:6px">✦ COSMIC KEYS (Rune · Kin)</div>
      <div style="font-size:13px;color:var(--text)">Norse Rune <strong>${rune}</strong> · Mayan Kin <strong>${kin}</strong> — ${isTh?`รูนและ Kin ของคุณยืนยันพลังงาน ${dmEl}`:`your Rune and Kin both confirm your ${dmEl} energy`}</div>
    </div>`;
}

// ── Exercise Plan ───────────────────────────────────────────
function renderExercise(){
  const el = document.getElementById('exerciseContent');
  const chart = _getMS26ChartFromProfile();
  if (!chart) { _emptyDeepHint('exerciseContent'); return; }
  const isTh = LANG==='th';
  const dmEl = chart.bazi.dayMasterElement||'ไม้';
  // Engine returns biorhythm already as percent-int (-100..+100). Do NOT
  // multiply by 100 again — previous code produced -7300% results.
  const physical     = chart.biorhythm.physical|0;
  const emotional    = chart.biorhythm.emotional|0;
  const intellectual = chart.biorhythm.intellectual|0;
  const nskDir       = chart.ninestar.starDirection||'—';

  // Exercise content sourced from chart.addons.exercise (engine-side).
  const ex = (chart.addons && chart.addons.exercise) || {
    sports:[], bestTime:'—', avoid:'—', note:'—'
  };
  const tr = (isTh?_ELEMENT_TRAITS_TH:_ELEMENT_TRAITS_EN)[dmEl] || {core:'—',drains:'—'};
  const todayAdvice = physical > 30
    ? (isTh?'⚡ Biorhythm กายดีวันนี้ — เหมาะออกกำลังเต็มที่':'⚡ High physical day — go full intensity')
    : physical > -10
    ? (isTh?'⚡ Biorhythm กายปานกลาง — ออกกำลังเบา-กลาง':'⚡ Moderate physical day — light-medium intensity')
    : (isTh?'⚡ Biorhythm กายต่ำ — เน้น stretching หรือพัก':'⚡ Low physical day — stretch or rest');

  const hdAuthority = chart.humandesign?.authority || '—';
  const hdType      = chart.humandesign?.typeTh || chart.humandesign?.type || '—';
  const lp          = chart.numerology?.lifePath || '—';
  const reasoning = _addonReasoning(chart, {
    basedOn: [
      [isTh?'BaZi ธาตุ':'BaZi Element',    chart.bazi.dayMasterTh],
      [isTh?'NSK ทิศ':'NSK Direction',     nskDir],
      [isTh?'HD Authority':'HD Authority', hdAuthority],
      [isTh?'Life Path':'Life Path',       'LP '+lp],
      [isTh?'Biorhythm':'Biorhythm',       (physical>=0?'+':'')+physical+'%'],
    ],
    whyFits: [
      isTh
        ? `<strong>BaZi:</strong> ธาตุ ${dmEl} เน้น ${tr.core} — กีฬาที่เลือกจึงใช้ <em>pattern การเคลื่อนไหว</em> ที่สอดคล้อง (ไหลลื่น-ไม้ · intensity สูง-ไฟ · stability-ดิน · precision-โลหะ · fluid-น้ำ)`
        : `<strong>BaZi:</strong> your ${dmEl} accents ${tr.core} — chosen sports use <em>movement patterns</em> aligned with it`,
      isTh
        ? `<strong>Nine Star Ki ทิศ ${nskDir}:</strong> ทิศที่คุณควรหันหน้าขณะออกกำลัง (yoga facing · วิ่งไปทางนั้น) เพื่อให้ chi ไหลเต็มที่`
        : `<strong>Nine Star Ki ${nskDir}:</strong> the direction to face during exercise so chi flows fully`,
      isTh
        ? `<strong>Human Design ${hdType} (${hdAuthority}):</strong> ${hdType==='Generator'?'ต้อง sacral response (ร่างกายอยากออก) ไม่ใช่ mind push':hdType==='Projector'?'พักนานกว่าเฉลี่ย · แนะนำ low-impact + recovery mandatory':hdType==='Manifestor'?'ลุยสั้นๆ + restrecovery · ไม่ใช่ endurance':hdType==='Reflector'?'ตามจันทรคติ · เปลี่ยนกีฬาตามรอบ 28 วัน':'ตาม inner authority ไม่ใช่ schedule'}`
        : `<strong>Human Design ${hdType}:</strong> tailored to your type's authority — respect the rhythm your body is designed for`,
      isTh
        ? `<strong>Life Path ${lp}:</strong> LP นี้ต้องการการเคลื่อนไหวแบบ ${lp===1||lp===8?'แข่งขัน-ตัวคนเดียว':lp===2||lp===6?'กลุ่ม-คู่':lp===3||lp===5?'สนุก-หลากหลาย':lp===4?'มีโครงสร้าง-ซ้ำ':lp===7||lp===9?'meditative-solo':'flexible'} — กีฬาในลิสต์ตอบโจทย์นี้`
        : `<strong>Life Path ${lp}:</strong> LP needs ${lp===1||lp===8?'competitive-solo':lp===2||lp===6?'team-dual':'flexible'} movement — list matches`,
      isTh
        ? `<strong>Biorhythm:</strong> 3 วงจรชีวภาพวันนี้ — ถ้ากาย+ full intensity; ถ้ากาย- → stretching/technique (ไม่ฝืน)`
        : `<strong>Biorhythm:</strong> 3 cycles map today — positive physical = full; negative = stretch/technique`,
    ],
    whyAvoid: [
      isTh
        ? `กีฬาที่ "ควรเลี่ยง" สร้าง ${tr.drains} + ขัดทิศ NSK + ฝืน HD Authority — ฝืนเล่น = บาดเจ็บเร็ว · recovery ช้า · burn-out ไว`
        : `Sports in "avoid" generate ${tr.drains} + clash with NSK direction + force HD authority — injury, slow recovery, burn-out follow`,
    ],
  });

  el.innerHTML = `
    ${reasoning}
    <div class="deep-sys-card">
      <div class="deep-sys-title">🏃 ${isTh?'แผนออกกำลังกาย':'Exercise plan'} — ${isTh?'ธาตุ':'Element'} ${dmEl}</div>
      <div class="deep-sys-stats" style="margin-top:10px">
        <div class="deep-sys-stat"><div class="deep-sys-stat-lbl">${isTh?'กายวันนี้':'Physical today'}</div><div class="deep-sys-stat-val" style="color:${physical>0?'#5a9a40':'#c05050'}">${physical>0?'+':''}${physical}%</div></div>
        <div class="deep-sys-stat"><div class="deep-sys-stat-lbl">${isTh?'อารมณ์':'Emotional'}</div><div class="deep-sys-stat-val">${emotional>0?'+':''}${emotional}%</div></div>
        <div class="deep-sys-stat"><div class="deep-sys-stat-lbl">${isTh?'ทิศออกกำลัง':'Exercise dir'}</div><div class="deep-sys-stat-val">${nskDir}</div></div>
      </div>
      <div style="margin-top:12px;padding:10px 12px;background:rgba(212,175,55,0.06);border-left:3px solid var(--gold);border-radius:0 6px 6px 0;font-size:13px;color:var(--text)">${todayAdvice}</div>
    </div>

    <div class="deep-sys-card" style="margin-top:12px">
      <div class="deep-sys-title">✅ ${isTh?'กีฬาที่แนะนำสำหรับธาตุ':'Recommended sports for element'} ${dmEl}</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
        ${ex.sports.map((s,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg2);border-radius:6px">
          <span style="font-family:'Josefin Sans',sans-serif;font-size:10px;color:var(--gold);width:20px">${i+1}</span>
          <span style="font-size:13px;color:var(--text)">${s}</span>
        </div>`).join('')}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div class="deep-sys-card">
        <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">⏰ ${isTh?'เวลาที่เหมาะสุด':'Best time'}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.6">${ex.bestTime}</div>
      </div>
      <div class="deep-sys-card" style="border-left:3px solid #c06060">
        <div style="font-size:9px;letter-spacing:1.5px;color:#c06060;margin-bottom:8px">⚠️ ${isTh?'ควรเลี่ยง':'Avoid'}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.6">${ex.avoid}</div>
      </div>
    </div>

    <div class="deep-sys-card" style="margin-top:12px;border-left:3px solid var(--gold)">
      <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:6px">💡 ${isTh?'ภูมิปัญญาธาตุ':'Elemental wisdom'}</div>
      <div style="font-size:13px;color:var(--text);line-height:1.7">${ex.note}</div>
    </div>`;
}

// ── Food & Diet ─────────────────────────────────────────────
function renderFood(){
  const el = document.getElementById('foodContent');
  const chart = _getMS26ChartFromProfile();
  if (!chart) { _emptyDeepHint('foodContent'); return; }
  const isTh = LANG==='th';
  const dmEl = chart.bazi.dayMasterElement||'ไม้';
  const dasha = chart.vedicMahadasha.currentDasha||'Jupiter';
  const lp = chart.numerology.lifePath;

  // Food content sourced from chart.addons.food (engine-side, includes
  // dashaAdjust pre-resolved using vedicMahadasha.currentDasha).
  const food = (chart.addons && chart.addons.food) || {
    eat:[], avoid:[], flavor:'—', timing:'—',
    supplement:'—', dashaAdjust:'สมดุลตามธาตุหลัก'
  };
  const dashaNote = food.dashaAdjust || 'สมดุลตามธาตุหลัก';
  const tr = (isTh?_ELEMENT_TRAITS_TH:_ELEMENT_TRAITS_EN)[dmEl] || {core:'—',drains:'—'};

  // Each element has a TCM-style "paired organ" — shown as the medical
  // reasoning bridge between chart and diet.
  const ORGAN_MAP_TH = {'ไม้':'ตับ','ไฟ':'หัวใจ','ดิน':'ม้าม+กระเพาะ','โลหะ':'ปอด','น้ำ':'ไต'};
  const ORGAN_MAP_EN = {'ไม้':'Liver','ไฟ':'Heart','ดิน':'Spleen/Stomach','โลหะ':'Lungs','น้ำ':'Kidneys'};
  const organ = (isTh?ORGAN_MAP_TH:ORGAN_MAP_EN)[dmEl]||'—';

  const nakshatra = chart.vedic?.moonNakshatra || '—';
  const reasoning = _addonReasoning(chart, {
    basedOn: [
      [isTh?'BaZi ธาตุ':'BaZi Element',        chart.bazi.dayMasterTh],
      [isTh?'TCM อวัยวะคู่':'TCM Organ',      organ],
      [isTh?'Vedic Nakshatra':'Nakshatra',     nakshatra],
      [isTh?'Mahadasha':'Mahadasha',          dasha],
      [isTh?'Life Path':'Life Path',          'LP '+lp],
    ],
    whyFits: [
      isTh
        ? `<strong>TCM · BaZi:</strong> จับคู่ธาตุ ${dmEl} กับอวัยวะ ${organ} — อาหารที่เลือกมีรสและธรรมชาติที่ <em>บำรุงอวัยวะ</em> โดยตรง (ไม่ใช่แค่ "คนธาตุไฟกินเผ็ดได้")`
        : `<strong>TCM · BaZi:</strong> pairs ${dmEl} with ${organ} — foods' flavours tonify this organ directly (not just "fire types like spicy")`,
      isTh
        ? `<strong>Vedic Nakshatra ${nakshatra}:</strong> Ayurveda จับคู่ Nakshatra กับ dosha (Vata/Pitta/Kapha) — ส่งผลต่อการย่อยของคุณ · อาหารในลิสต์คัดให้ balance dosha ที่ ${nakshatra} มักมี`
        : `<strong>Vedic Nakshatra ${nakshatra}:</strong> Ayurveda pairs Nakshatras with doshas — affects your digestion · list balances the dosha signature`,
      isTh
        ? `<strong>Mahadasha ${dasha}:</strong> ช่วงชีวิตของคุณต้องการปรับ: <em>${dashaNote}</em> — ธาตุเดิมแต่ Mahadasha ต่าง = กินต่าง`
        : `<strong>Mahadasha ${dasha}:</strong> this chapter needs: <em>${dashaNote}</em>`,
      isTh
        ? `<strong>Life Path ${lp}:</strong> LP นี้มีจังหวะกินเฉพาะ — ${lp===1||lp===8?'มื้อหนัก-ห่าง':lp===5?'มื้อเล็ก-บ่อย-varied':lp===6?'ครอบครัวมื้อ-ตรงเวลา':lp===7||lp===9?'หิวแล้วกิน-intuitive':'สม่ำเสมอ'}`
        : `<strong>Life Path ${lp}:</strong> rhythm fits ${lp===1||lp===8?'heavy-spaced':lp===5?'small-varied':'consistent'} meals`,
      isTh
        ? `รส <strong>${food.flavor.split('(')[0].trim()}</strong> จาก TCM + BaZi — เลือกตามชีววิทยาคุณ ไม่ใช่รสโปรด`
        : `<strong>${food.flavor.split('(')[0].trim()}</strong> flavours via TCM+BaZi — selected by your biology, not preference`,
    ],
    whyAvoid: [
      isTh
        ? `อาหาร "ควรเลี่ยง" ทำร้าย ${organ} + ขัด Nakshatra dosha + ขัด Mahadasha — กินบ่อยสร้าง ${tr.drains} (ปัญหาทางกายไม่ใช่แค่จิตใจ)`
        : `"Avoid" foods burden ${organ} + clash with your Nakshatra dosha + antagonist to Mahadasha — build up ${tr.drains}`,
    ],
  });

  el.innerHTML = `
    ${reasoning}
    <div class="deep-sys-card">
      <div class="deep-sys-title">🍽️ ${isTh?'อาหารตามธาตุ':'Diet by element'} — ${dmEl}</div>
      <div class="deep-sys-origin">Mahadasha: ${dasha} · Life Path: ${lp}</div>

      <div style="margin-top:14px">
        <div style="font-size:10px;letter-spacing:1px;color:var(--muted);margin-bottom:8px">✅ ${isTh?'อาหารที่ควรกินประจำ':'Foods to eat regularly'}</div>
        ${food.eat.map(f=>`<div style="padding:8px 12px;background:rgba(40,100,40,0.08);border-left:3px solid #4a9a40;border-radius:0 6px 6px 0;margin-bottom:6px;font-size:13px;color:var(--text)">${f}</div>`).join('')}
      </div>

      <div style="margin-top:14px">
        <div style="font-size:10px;letter-spacing:1px;color:#c06060;margin-bottom:8px">⚠️ ${isTh?'ควรลดหรือเลี่ยง':'Reduce or avoid'}</div>
        ${food.avoid.map(f=>`<div style="padding:8px 12px;background:rgba(160,40,40,0.06);border-left:3px solid #c06060;border-radius:0 6px 6px 0;margin-bottom:6px;font-size:13px;color:var(--text)">${f}</div>`).join('')}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div class="deep-sys-card">
        <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">👅 ${isTh?'รสชาติที่เสริมธาตุ':'Flavours that nourish'}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.6">${food.flavor}</div>
      </div>
      <div class="deep-sys-card">
        <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">⏰ ${isTh?'เวลากิน':'Meal timing'}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.6">${food.timing}</div>
      </div>
    </div>

    <div class="deep-sys-card" style="margin-top:12px;border-left:3px solid var(--gold)">
      <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:6px">💊 ${isTh?'Supplement แนะนำ':'Recommended supplements'}</div>
      <div style="font-size:13px;color:var(--text)">${food.supplement}</div>
    </div>

    <div class="deep-sys-card" style="margin-top:12px;border-left:3px solid rgba(212,175,55,0.4)">
      <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:6px">🕉️ ${isTh?'ปรับตาม Mahadasha':'Adjust for Mahadasha'} ${dasha}</div>
      <div style="font-size:13px;color:var(--text);line-height:1.6">${dashaNote}</div>
    </div>`;
}

// ── Product Personality ─────────────────────────────────────
function renderProduct(){
  const el = document.getElementById('productContent');
  const chart = _getMS26ChartFromProfile();
  if (!chart) { _emptyDeepHint('productContent'); return; }
  const isTh = LANG==='th';
  const dmEl = chart.bazi.dayMasterElement||'ไม้';
  const starColor = chart.ninestar.starColor||'—';
  const score = chart.score.total;

  const p = (chart.addons && chart.addons.product) || {
    archetype:'—', youAreLike:'', archetypeWhy:'',
    colors:'—', materials:'—', style:'—', boost:[], avoid:[],
    aesthetic:'—', brands:'—'
  };
  const tr = (isTh?_ELEMENT_TRAITS_TH:_ELEMENT_TRAITS_EN)[dmEl] || {core:'—',drains:'—'};

  // Cosmic Blueprint alignment: pull the SAME color sources as the report's
  // p20_colors page so users see consistency between the add-on and the PDF.
  // Sources: NSK starColor + BaZi lucky-element color + Thai dayColor + Celtic
  // element-derived color.
  const bzLuckyColor = chart.bazi.luckyElement === 'ไฟ' ? 'แดง/ส้ม'
    : chart.bazi.luckyElement === 'ไม้' ? 'เขียว'
    : chart.bazi.luckyElement === 'น้ำ' ? 'ดำ/น้ำเงิน'
    : chart.bazi.luckyElement === 'โลหะ' ? 'ขาว/เงิน'
    : 'เหลือง/น้ำตาล';
  const thaiDayColor = chart.thai?.dayColor || '—';
  const CELTIC_EL_COLOR = { 'ไม้':'เขียวมรกต', 'ไฟ':'ส้มทอง', 'ดิน':'น้ำตาลอบอุ่น', 'โลหะ':'เงินมุก', 'น้ำ':'ฟ้าคราม' };
  const celticColor = CELTIC_EL_COLOR[chart.celtic?.element] || '';
  const blueprintSources = [
    { label:'Nine Star Ki', value:starColor },
    { label:'BaZi · ธาตุมงคล '+chart.bazi.luckyElement, value:bzLuckyColor },
    { label:'ไทยพราหมณ์ · วัน'+(chart.thai?.dayName||'—'), value:thaiDayColor },
    { label:'Celtic · '+(chart.celtic?.treeNameTh||chart.celtic?.treeName||'—'), value:celticColor },
  ].filter(s => s.value && s.value !== '—');

  const reasoning = _addonReasoning(chart, {
    basedOn: [
      [isTh?'ธาตุหลัก':'Element',        chart.bazi.dayMasterTh],
      [isTh?'Nine Star Ki สี':'NSK Color', starColor],
      [isTh?'วันเกิด':'Birth day',       chart.thai?.dayName||'—'],
      [isTh?'ต้นไม้เซลติก':'Celtic Tree', chart.celtic?.treeNameTh||chart.celtic?.treeName||'—'],
    ],
    whyFits: [
      isTh
        ? `Archetype ด้านล่างคัดจาก <strong>4 ศาสตร์</strong> — BaZi Day Master (${chart.bazi.dayMasterTh}) + Nine Star Ki (สี${starColor}) + ไทยพราหมณ์ (วัน${chart.thai?.dayName}) + Celtic (${chart.celtic?.treeNameTh||chart.celtic?.treeName}) — เห็นตรงกันว่าคุณ resonate กับ aesthetic แบบนี้`
        : `The archetype below is filtered through <strong>4 systems</strong> — BaZi + NSK + Thai Brahmin + Celtic — converging on the same aesthetic`,
      isTh
        ? `สี/วัสดุ/แบรนด์แต่ละชิ้น map กับ <strong>หน้าสีมงคลใน Cosmic Blueprint</strong> — ไม่ใช่คำแนะนำใหม่ แต่เป็น concrete products ของเฉพาะแต่ละสี`
        : `Every color/material/brand maps back to the <strong>Lucky Colors page in your Cosmic Blueprint</strong> — same recommendations, just made concrete as products`,
      isTh
        ? `NSK star color <strong>${starColor}</strong> ใช้เป็น accent — วางเล็กๆ 1 ชิ้น/วัน กระตุ้นพลังส่วนตัว`
        : `NSK star color <strong>${starColor}</strong> works as accent — 1 piece per day triggers personal power`,
    ],
    whyAvoid: [
      isTh
        ? `สี/วัสดุใน "ควรเลี่ยง" เป็นธาตุที่ <em>ทำลาย</em> ${dmEl} ใน 5-element cycle — สร้าง ${tr.drains} เมื่ออยู่รอบตัวนานๆ`
        : `Colours/materials in "avoid" belong to the element that <em>destroys</em> ${dmEl} in the 5-element cycle — prolonged exposure creates ${tr.drains}`,
    ],
  });

  el.innerHTML = `
    ${reasoning}

    <!-- YOU ARE LIKE archetype block -->
    <div class="deep-sys-card" style="border:2px solid var(--gold3);background:linear-gradient(135deg,rgba(212,175,55,0.08),rgba(212,175,55,0.02));text-align:center;padding:22px 20px">
      <div style="font-family:'Josefin Sans',sans-serif;font-size:10px;letter-spacing:2.5px;color:var(--gold);margin-bottom:8px">${isTh?'คุณคือ · YOU ARE LIKE':'YOU ARE LIKE'}</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:18px;color:var(--gold);letter-spacing:1.5px;margin-bottom:14px">${p.archetype || '—'}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:14px;color:var(--text);line-height:1.75;max-width:540px;margin:0 auto 12px">
        ${p.youAreLike || ''}
      </div>
      ${p.archetypeWhy ? `<div style="font-family:'Cormorant Garamond',serif;font-size:12.5px;color:var(--muted);font-style:italic;line-height:1.7;border-top:1px solid var(--border);padding-top:12px;max-width:540px;margin:0 auto">${p.archetypeWhy}</div>` : ''}
    </div>

    <!-- Cosmic Blueprint color alignment -->
    ${blueprintSources.length ? `
    <div class="deep-sys-card" style="margin-top:12px">
      <div style="font-size:9.5px;letter-spacing:2px;color:var(--gold3);margin-bottom:8px">🔗 ${isTh?'สีตรงกันกับ COSMIC BLUEPRINT':'COLORS ALIGNED WITH BLUEPRINT'}</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${blueprintSources.map(s => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--bg3);border-radius:6px;font-family:'Cormorant Garamond',serif;font-size:12.5px">
            <span style="color:var(--muted)">${s.label}</span>
            <span style="color:var(--gold);font-weight:600">${s.value}</span>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <div class="deep-sys-card" style="margin-top:12px">
      <div class="deep-sys-title">🎨 ${isTh?'บุคลิกผลิตภัณฑ์':'Product personality'} — ${isTh?'ธาตุ':'Element'} ${dmEl}</div>
      <div class="deep-sys-origin">NSK Star Color: ${starColor} · Cosmic Score: ${score}</div>

      <div style="margin-top:14px">
        <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">🎨 ${isTh?'พาเลตต์ที่เสริมพลัง':'Empowering palette'}</div>
        <div style="font-size:13px;color:var(--text);margin-bottom:10px">${p.colors}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${p.colors.split('·').map(c=>{const hex=c.match(/#[0-9a-f]{6}/i);return hex?`<div style="width:32px;height:32px;border-radius:6px;background:${hex[0]};border:1px solid var(--border)" title="${hex[0]}"></div>`:''}).join('')}
        </div>
      </div>

      <div style="margin-top:14px">
        <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">✨ ${isTh?'สินค้าที่เสริมพลังธาตุ':'Items that boost your element'}</div>
        ${p.boost.map(b=>`<div style="padding:8px 12px;background:rgba(212,175,55,0.06);border-left:3px solid var(--gold);border-radius:0 6px 6px 0;margin-bottom:6px;font-size:13px;color:var(--text)">${b}</div>`).join('')}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div class="deep-sys-card">
        <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">🪡 ${isTh?'วัสดุที่ใช่':'Materials that fit'}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.7">${p.materials}</div>
      </div>
      <div class="deep-sys-card">
        <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">🏛️ ${isTh?'สไตล์':'Style'}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.7">${p.style}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
      <div class="deep-sys-card">
        <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:8px">🌟 ${isTh?'แบรนด์ที่สอดคล้อง':'Aligned brands'}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.7">${p.brands}</div>
      </div>
      <div class="deep-sys-card" style="border-left:3px solid #c06060">
        <div style="font-size:9px;letter-spacing:1.5px;color:#c06060;margin-bottom:8px">⚠️ ${isTh?'ควรเลี่ยง':'Avoid'}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.7">${p.avoid}</div>
      </div>
    </div>`;
}

