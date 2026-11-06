# 🪦 Idea Graveyard

A spooky little website where ideas go to rest. Pan around a moonlit graveyard, click a tombstone to read its cause of death and epitaph, light a candle, and bury your own dead ideas. Fake billboards along the way prove that everything can be monetized, even here.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

To put it online, turn on GitHub Pages for this repo (Settings → Pages → deploy from branch, root folder).

## Add graves

Edit `graves.js`. Each grave has:

```js
{ name: "Todo App #7", born: 2023, died: 2023, cause: "...", epitaph: "...", link: "https://...", type: "round" }
```

`link` and `type` are optional. Types: `round`, `gothic`, `cross`, `obelisk`, `slab`. The fake ads live in the same file.

## Controls

Drag, scroll, or use the arrow keys to wander. Click or tap stones and billboards. Graves you bury and candles you light are saved in your browser only.
