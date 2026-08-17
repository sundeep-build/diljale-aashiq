/**
 * Which rotation a song belongs to and how much it hurts (1–10).
 *
 * Keyed by YOUTUBE VIDEO ID, deliberately. An earlier version keyed this by
 * playlist position, which silently reassigned every song's mood the moment the
 * playlist was reordered or a song was added at the top. Keying by video id
 * means curation follows the song forever — reorder the playlist, add songs,
 * remove songs, nothing here has to change.
 *
 * Each entry is [rotation, dard, artist?, title?]. The last two are optional
 * overrides for the few songs a label channel uploaded with marketing copy in
 * the title instead of the artist's own clean upload.
 *
 * A song that isn't listed still works; it gets `guess()` below, and
 * `npm run sync` prints it so you know what is waiting to be curated.
 *
 * Rotations: judaai · raat · lofi · vichoda · sufi · zakhm
 * (defined in src/data/rotations.ts)
 */
export const CURATION = {
  "t4J4-K-90Ok": ["sufi", 9],              // Zaroori Tha — The Folk & Soul Studio
  "GtPvCa3vvxA": ["judaai", 8, "Arijit Singh, Palak Muchhal", "Milne Hai Mujhse Aayi"],            // "Milne Hai Mujhse Aayi Aashiqui 2" Full Video Song — T
  "NPC-9hYbkLE": ["judaai", 6],            // Chahun Main Ya Naa — Palak Muchhal
  "aVPwXQgY2QI": ["judaai", 5],            // Raabta (Kehte Hain Khuda Ne) — Pritam
  "xzqtxQc32Co": ["lofi", 3, "DJ Kedrock & SD Style"],              // Ilahi LoFi Mix — Ujwala
  "RazuWp5kSHk": ["judaai", 7, "Arijit Singh", "Kabhi Jo Badal Barse"],            // "Kabhi Jo Badal Barse" Song Video Jackpot — T-Series
  "Vj7jgKWnpsA": ["vichoda", 6],           // Do Gallan (Let's Talk) — Garry Sandhu
  "j3XkfqVwVpU": ["vichoda", 7],           // Fark — Gippy Grewal
  "KHwlmdv8NFM": ["vichoda", 7],           // Karha — Honey Sidhu
  "SbN6P-UQjcs": ["sufi", 4, "Kailash Kher"],              // Kailash Kher - Teri Deewani — SonyMusicIndiaVEVO
  "i-EXgX279wU": ["judaai", 8],            // Galliyan — Ankit Tiwari
  "LmMzgIvIJCE": ["judaai", 7],            // ISHQ MUBARAK — Arijit Singh
  "yyYpmJx8zuU": ["sufi", 6],              // O Re Piya — The Folk & Soul Studio
  "1b9poX5k7zo": ["sufi", 5],              // Bulleya (From "Sultan") — Vishal - Shekhar
  "xsLiUr8MOpw": ["vichoda", 7],           // Ishqan De Lekhe — S Adeeb Music
  "pqBKTLnowdM": ["sufi", 4],              // Saiyyan — Kailasa Records 
  "_eZnQzneuKs": ["raat", 9],              // Banjaara — Mohammed Irfan
  "WqHzTIjoooQ": ["vichoda", 8],           // Udaarian — Satinder Sartaaj
  "DRZHVrSmcWU": ["judaai", 8],            // Barbaad (Movie: Saiyaara) — Jubin Nautiyal
  "uT_HXrrmHX8": ["judaai", 6],            // Sitaare (From "Ikkis") — Arijit Singh
  "t6vm8h5BDxo": ["vichoda", 6],           // Sajjan Raazi — Satinder Sartaaj
  "yXjzqdnfkyo": ["vichoda", 5],           // Kite Kalli — Maninder Buttar
  "zgJPTTiCK2E": ["sufi", 3],              // Piya Ghar Aavenge — Kailasa Records 
  "Gplxsk25GtY": ["sufi", 6],              // Dillagi — The Folk & Soul Studio
  "tLaJFnc93Oc": ["judaai", 8],            // Tum Hi Aana (From "Marjaavaan") — Payal Dev
  "hmsebjbRb1k": ["judaai", 7],            // Uska Hi Banana — Arijit Singh
  "KKzpJ2UmCdY": ["zakhm", 5],             // Dost Banke — The Folk & Soul Studio
  "f419vqAt8PU": ["zakhm", 8],             // Ishq (From "Lost;Found") — Faheem Abdullah
  "o-9VdyXZKsQ": ["raat", 8],              // Tujhe Bhula Diya — Mohit Chauhan
  "ZVyA_8rd1Ko": ["judaai", 7],            // KAUN TUJHE — Palak Muchhal
  "F-6RyomnTZE": ["raat", 9],              // DARD DILO KE — Mohammed Irfan
  "5whLJPwIVxk": ["judaai", 7],            // Jitni Dafa — Yasser Desai
  "Fi3GovijpWA": ["sufi", 5],              // Tere Bina — A. R. Rahman
  "0uP0seKs5qA": ["judaai", 7],            // Baaton Ko Teri — Arijit Singh
  "IgITZfS7L_8": ["judaai", 7],            // Dil Ibaadat — Kay Kay
  "iyxByIhwrC0": ["sufi", 6],              // Mere Rashke Qamar (From "Baadshaho") — Nusrat Fateh Al
  "fsiPzT50ZiM": ["judaai", 9],            // Tum Hi Ho — Arijit Singh
  "q1uPPBJ2tcI": ["judaai", 8],            // Phir Bhi Tumko Chaahunga — Mithoon
  "7To7ajeQBE0": ["zakhm", 6],             // Sayar Dore — Zubeen Garg Music
  "LH9REAV5UzU": ["sufi", 8],              // Maula Mere Maula — Roopkumar Rathod (Official)
  "7BFHPc3r9QA": ["zakhm", 8],             // Ijazat — Falak Shabir
  "d0JpdfOLXI0": ["judaai", 5],            // Pal Pal Dil Ke Paas (from Blackmail) — Kishore Kumar
  "6fXfuiJu79Y": ["raat", 9],              // Ae Dil Hai Mushkil Title Track — Pritam
  "6SvmykHIa4M": ["judaai", 6],            // Bulleya — Pritam
  "UyEhWtpfIFc": ["raat", 10],             // Channa Mereya — Pritam
  "-NjjJfmkTh8": ["judaai", 3],            // The Breakup Song — Pritam
  "BaX-TUvuCNQ": ["judaai", 2],            // Cutiepie — Pritam
  "IkChiSZtrRQ": ["judaai", 6],            // Alizeh — Arijit Singh
  "zV7pfxeh5dY": ["raat", 8],              // Such Keh Raha Hai — Kay Kay
  "WT1qB8SKi2s": ["raat", 8],              // Teri Yaad…Yaad — Kay Kay
  "zRKvLzLVIKQ": ["zakhm", 7, "Darshan Raval"],             // Tera Zikr — DarshanRavalDZ
  "Zk_9vHhOcNg": ["judaai", 8],            // Khamoshiyan — JEET GANNGULI OFFICIAL 
  "pI2vTj8Au7Y": ["judaai", 8],            // Tu Har Lamha — Bobby-Imran
  "iKopExw_3Zg": ["raat", 8],              // Baatein Ye Kabhi Na (Male) — JEET GANNGULI OFFICIAL 
  "F3KaU2uchTY": ["zakhm", 7],             // Kya Khoya — Naved Zafar
  "JQgR9vZzeIg": ["judaai", 5],            // Bheegh Loon (Female) — Ankit Tiwari
  "MsVUBMmkGJ4": ["sufi", 4],              // Subhan Allah — Bobby-Imran
  "8Sy2VwQlMyo": ["judaai", 5],            // Bheegh Loon (Male) — Ankit Tiwari
  "oJzVtFX7OjY": ["raat", 8],              // Baatein Ye Kabhi Na (Female) — JEET GANNGULI OFFICIAL 
  "qbFpb4v68i4": ["lofi", 6],              // Khamoshiyan (Unplugged) — JEET GANNGULI OFFICIAL 
  "4oF7eCIH58U": ["lofi", 6],              // Tu Har Lamha (Remix by DJ Angel) — Bobby-Imran
  "p7yy0Ix9Hrc": ["lofi", 5],              // Bheegh Loon (Female - Remix by DJ Angel) — Ankit Tiwar
};

/** What a freshly added song gets until you give it a mood of its own. */
export const DEFAULTS = { rotation: "judaai", dard: 7 };

/**
 * A first guess for songs you have just added, so the Dard-o-Meter and the
 * rotations never behave oddly simply because nobody has curated them yet.
 * Intentionally conservative — it nudges, it does not pretend to know the song.
 */
export function guess(title, artists = "") {
  const t = `${title} ${artists}`.toLowerCase();
  if (/slowed|reverb|lo-?fi|remix/.test(t)) return { rotation: "lofi", dard: 6 };
  if (/b praak|jaani|gippy|garry sandhu|satinder|maninder|sidhu|punjabi/.test(t))
    return { rotation: "vichoda", dard: 7 };
  if (/kailash|rahat|nusrat|sufi|qawwali|kailasa/.test(t))
    return { rotation: "sufi", dard: 6 };
  return DEFAULTS;
}
