// The residents. Edit freely — this is the only file you need to touch to add graves.
// Fields: name, born, died, cause, epitaph, optional link, optional type
// (type: round | gothic | cross | obelisk | slab — random if left out)
window.GRAVES = [
  { name: "Uber for Houseplants", born: 2019, died: 2019, cause: "Plants refused to get in the car.", epitaph: "It never took root." },
  { name: "Blockchain Toaster", born: 2021, died: 2022, cause: "Took 11 minutes and 4 kWh to verify a single slice.", epitaph: "Here lies a toast to decentralization.", type: "obelisk" },
  { name: "My Novel (Chapter 1)", born: 2015, died: 2015, cause: "Rewrote the first sentence 212 times.", epitaph: "It was a dark and stormy… draft." },
  { name: "Todo App #7", born: 2023, died: 2023, cause: "Was never added to its own todo list.", epitaph: "Task: die. Status: done ✓", type: "slab" },
  { name: "Social Network for Dogs", born: 2017, died: 2018, cause: "Users kept eating the phones.", epitaph: "Good boy. Bad business model.", type: "cross" },
  { name: "Passive-Aggressive Smart Fridge", born: 2020, died: 2021, cause: "Told the owner 'it's fine' about the cheese one too many times.", epitaph: "It meant well. It said so. Repeatedly.", type: "gothic" },
  { name: "The Startup (Pivot #4)", born: 2018, died: 2022, cause: "Pivoted so many times it screwed itself into the ground.", epitaph: "Disrupted, at last." },
  { name: "Learn Japanese in 30 Days", born: 2020, died: 2020, cause: "Day 4. The streak broke. So did the spirit.", epitaph: "さようなら", type: "round" },
  { name: "Personal Website v3", born: 2022, died: 2022, cause: "Spent six weeks choosing a font.", epitaph: "Coming soon. Forever.", type: "slab" },
  { name: "AI Horoscope API", born: 2023, died: 2024, cause: "Predicted its own shutdown. Ignored it.", epitaph: "Saw it coming.", type: "obelisk" },
  { name: "Gym Membership", born: 2024, died: 2024, cause: "Located a full 9 minutes from the couch.", epitaph: "Gone, but still billing monthly.", type: "cross" },
  { name: "Metaverse Office", born: 2021, died: 2023, cause: "Nobody had legs.", epitaph: "Rest in polygons.", type: "gothic" },
  { name: "Flappy Clone #40,001", born: 2014, died: 2014, cause: "There were already 40,000 of them.", epitaph: "Flapped once. Hit pipe." },
  { name: "Podcast (2 Episodes)", born: 2019, died: 2019, cause: "Ran out of things to say to Kevin.", epitaph: "Thanks for listening, Mom.", type: "round" },
  { name: "Sourdough Starter", born: 2020, died: 2020, cause: "Forgot to feed it during a 3-day Zoom call.", epitaph: "It rose. Then it fell.", type: "slab" },
  { name: "Crypto Pet Rock", born: 2022, died: 2022, cause: "Even the rock lost value.", epitaph: "Hodl'd to the very end.", type: "obelisk" },
];

// Fake ads. Everything can be monetized. Even here.
window.ADS = [
  { title: "PREMIUM PLOTS™", tag: "Bury your side project next to a unicorn.", body: "Lakeside views. Moonlight included. 0% APR for all eternity.", fine: "*Eternity defined as 12 months. Unicorn not guaranteed to be dead yet. Moon subject to availability.", cta: "Reserve my plot", nope: "Sold out. A crypto bro bought all of them.", color: "#c9a227" },
  { title: "RESURRECT.IO", tag: "Revive any abandoned repo in 3 easy payments.", body: "Our certified necro-engineers will bring your project back from the dead.", fine: "*Resurrected projects may return slower, angrier, and rewritten in Rust.", cta: "Raise my dead", nope: "Error: your project doesn't want to come back.", color: "#7a2fd0" },
  { title: "GHOSTWRITER AI", tag: "Your dead ideas keep posting on LinkedIn. Forever.", body: "\"Thrilled to announce I'm still not shipping.\" Fully automated thought leadership from beyond the grave.", fine: "*Posts may contain the phrase 'humbled and honored'. We are neither.", cta: "Start haunting", nope: "Agreed! 👍 (auto-reply from the deceased)", color: "#2a8fd6" },
  { title: "NFTOMBSTONES", tag: "Own a verifiable token of someone else's failure.", body: "Each tombstone is unique, on-chain, and worth exactly what it's buried under.", fine: "*Gas fees may exceed the GDP of a small village. Value goes down. Then further down.", cta: "Mint now", nope: "Transaction failed. Coincidentally, so did the market.", color: "#1fa36b" },
  { title: "BIG SHOVEL", tag: "Dig deeper. Ship never.", body: "The official shovel of the Idea Graveyard. Ergonomic handle for long nights of not finishing things.", fine: "*Shovel not for use on actual graves. Or ideas still breathing. Please check for a pulse.", cta: "Buy a shovel", nope: "Out of stock. Everyone's burying something this quarter.", color: "#d2502a" },
  { title: "YOUR AD HERE", tag: "This space could be haunting you.", body: "Reach a highly engaged audience of the dead and the procrastinating. Ask about our afterlife-time value.", fine: "*Engagement metrics measured in séances.", cta: "Advertise", nope: "Our sales team has passed on. Literally.", color: "#9aa0a6" },
];
