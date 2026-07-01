// mythology (raw string from gods.json) -> { culture adjective, visual cues }.
// Shared by the enrich + generate stages. Variants normalized; unknowns fall
// back to a generic "traditional <X> regalia" cue.
const M = (culture, cues) => ({ culture, cues });
export const MAP = {
  'Hinduism': M('Hindu','ornate gold Indian jewelry and headdress, a Hindu temple, saffron-gold-and-teal'),
  'Hindu Philosophy': M('Hindu','ornate gold Indian jewelry, mandala, lotus, Hindu temple'),
  'Vedic Cosmogony': M('Vedic Hindu','ornate gold Indian regalia, sacred fire, Vedic altar'),
  'Hindu-Buddhist': M('Hindu-Buddhist','ornate gold jewelry, lotus throne, mandala halo, temple'),
  'Chinese Mythology': M('Chinese','flowing silk robes, dragon and cloud motifs, jade, a Chinese palace or pagoda, imperial gold-and-red'),
  'Chinese Buddhism': M('Chinese Buddhist','silk robes, lotus, a Chinese temple, gold-and-jade'),
  'Greek Mythology': M('Greek','laurel wreath, draped chiton, Greek key meander patterns, white marble columns'),
  'Greek Cosmogony': M('Greek','primordial Greek forms, marble, meander patterns, starlight'),
  'Orphic Cosmogony': M('Orphic Greek','cosmic Orphic egg motifs, marble, serpentine forms'),
  'Greco-Roman Cosmogony': M('Greco-Roman','classical marble, laurel, meander patterns'),
  'Norse Mythology': M('Norse','runic engravings, fur-trimmed cloak, a horned or winged helm, frost and pine, a Viking hall'),
  'Shinto': M('Japanese Shinto','a kimono or hakama, a torii gate, sakura petals, sacred shimenawa rope, refined Japanese patterns'),
  'Shinto/Buddhism': M('Japanese','kimono, torii gate, lotus, Japanese temple'),
  'Buddhism/Shinto': M('Japanese','kimono, torii gate, lotus, Japanese temple'),
  'Egyptian Mythology': M('Egyptian','a striped nemes headdress, hieroglyphs, pyramids or a tomb, gold-and-lapis-blue'),
  'Egyptian Cosmogony': M('Egyptian','nemes headdress, hieroglyphs, primordial waters, gold-and-lapis'),
  'Roman Mythology': M('Roman','a crested galea helmet, an SPQR eagle standard, lorica armor, a Colosseum or marble colonnade, red-and-gold'),
  'Mayan Mythology': M('Maya','a jade and feathered headdress, Maya glyphs, a step-pyramid, jade-green-and-gold'),
  'Celtic Mythology': M('Celtic','Celtic knotwork, a torc, woad markings, oak and antlers, a misty forest, green-and-bronze'),
  'Slavic Mythology': M('Slavic','embroidered folk patterns, a firebird motif, a birch forest, red-gold folk regalia'),
  'Aztec Mythology': M('Aztec','a feathered headdress, obsidian, Aztec glyphs, a step-pyramid, turquoise-and-gold'),
  'Aztec Cosmogony': M('Aztec','feathered regalia, obsidian, glyphs, step-pyramid'),
  'Aztec Philosophy': M('Aztec','feathered regalia, obsidian mirror, glyphs'),
  'Sumerian Mythology': M('Sumerian','a horned crown, a lamassu motif, cuneiform, a ziggurat, gold-and-lapis'),
  'Babylonian Mythology': M('Babylonian','a horned crown, cuneiform, a ziggurat, dragon motifs, gold-and-lapis'),
  'Babylonian Cosmogony': M('Babylonian','primordial waters, cuneiform, ziggurat'),
  'Assyrian Mythology': M('Assyrian','a winged lamassu, a horned crown, cuneiform'),
  'Mesopotamian Mythology': M('Mesopotamian','a horned crown, cuneiform, a ziggurat'),
  'Ainu': M('Ainu','bark-cloth robes with Ainu spiral moreu patterns, bear and owl motifs, a northern wilderness'),
  'Ainu Cosmogony': M('Ainu','Ainu spiral patterns, northern wilderness, bear motifs'),
  'Thai Buddhism': M('Thai','a pointed golden Thai chada crown, kranok flame patterns, a temple prang, gold-and-teal'),
  'Thai Mythology': M('Thai','a golden Thai chada crown, kranok patterns, a Thai temple, gold-and-teal'),
  'Thai Folk': M('Thai','Thai folk regalia, kranok patterns, a rural Thai shrine'),
  'Thai Cosmology': M('Thai','a Thai chada crown, cosmic Thai motifs, Mount Meru'),
  'Thai Astrology': M('Thai','Thai astrological regalia, zodiac motifs, a Thai temple'),
  'Polynesian Mythology': M('Polynesian','tapa-cloth patterns, a tiki motif, a feather cloak, ocean and volcano, tribal tattoos'),
  'Polynesian Cosmogony': M('Polynesian','tapa patterns, ocean and sky, tribal tattoos'),
  'Hawaiian Mythology': M('Hawaiian','a feather cloak and helmet, volcanic fire, ocean, tropical flowers'),
  'Yoruba Mythology': M('Yoruba','beaded regalia and a beaded crown, cowrie shells, a shrine, indigo-and-gold'),
  'Fon Mythology': M('Fon (West African)','West African beadwork, cowrie shells, bold patterns, a shrine'),
  'Akan Mythology': M('Akan (West African)','Adinkra symbols, kente cloth patterns, gold, a shrine'),
  'Zulu Mythology': M('Zulu','Zulu beadwork, a shield and spear, savanna, ochre-and-gold'),
  'Buganda Mythology': M('Buganda (East African)','bark-cloth robes, East African patterns, a shrine'),
  'Dogon Mythology': M('Dogon','Dogon mask motifs, geometric patterns, cliff dwellings, ochre'),
  'Kuba Mythology': M('Kuba','Kuba geometric textile patterns, a royal mask, raffia'),
  'Kuba Cosmogony': M('Kuba','Kuba geometric patterns, royal regalia'),
  'Shona Mythology': M('Shona','soapstone bird motifs, Great Zimbabwe stonework, earthy tones'),
  'Korea': M('Korean','a hanbok, dancheong palace patterns, a tiger or crane motif, a Korean palace, jade-and-red'),
  'Judaism / Kabbalah': M('Kabbalistic','the Tree of Life, Hebrew letters, a menorah, sacred geometry, deep blue-and-gold'),
  'Persia / Zoroastrian': M('Persian Zoroastrian','a faravahar winged disc, sacred fire, arabesque patterns, a domed temple, gold-and-turquoise'),
  'Islam': M('Islamic','geometric arabesque patterns, a domed mosque and minaret, gold-and-turquoise'),
  'Islam / Sufi': M('Sufi','whirling robes, arabesque patterns, calligraphy'),
  'Arabia': M('Arabian','desert regalia, arabesque patterns'),
  'Babylon / Islam': M('Mesopotamian-Islamic','cuneiform and arabesque motifs, a ziggurat'),
  'Middle East': M('Middle Eastern','ancient Near-Eastern regalia, arabesque motifs'),
  'Tibet': M('Tibetan','thangka-style ornamentation, a mandala halo, prayer flags, the Himalayas, crimson-and-gold'),
  'Tibet / India': M('Tibetan-Indian','thangka ornaments, mandala, lotus, crimson-and-gold'),
  'Persia': M('Persian','arabesque patterns, sacred fire, a domed palace, gold-and-turquoise'),
};
for (const k of ['Australia - Broad','Australia - Arnhem Land','Australia - Wiradjuri','Australia - Kulin','Australia - Kimberley','Australia - Yolŋu','Australia - Aranda'])
  MAP[k] = M('Aboriginal Australian','Aboriginal dot-painting patterns, ochre body art, Dreamtime motifs, a red-earth landscape');
for (const k of ['Broad North America','Lakota / Sioux','Lakota','Lakota Cosmogony','Plains / Southwest','Northwest Coast','Hopi / Pueblo','Southwest / Anasazi','Inuit','Anishinaabe'])
  MAP[k] = M('Native American','a feathered headdress or totem motifs, turquoise, tribal patterns, a plains/pueblo/arctic landscape');

export function cuesFor(myth){
  return MAP[myth] || M(String(myth||'ancient').replace(/ (Mythology|Cosmogony|Philosophy)$/,''),
    `traditional ${String(myth||'ancient')} regalia, motifs and sacred architecture`);
}
