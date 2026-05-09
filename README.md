# 🎴 ເກມເປີດໄພ່ - Card Flip Party Game

A fun card-flipping party game built with pure HTML, CSS, and JavaScript.
Features 52 playing cards with per-rank reaction images and Lao party instructions.

## ✨ Features
- Beautiful fanned-out floating cards with circular orbital animation
- Smooth 3D flip animation when revealing cards
- 13 unique reaction images (one per rank, 2-A)
- Adjustable rotation speed
- Sound effects (Web Audio API, no external files)
- Reset/shuffle button
- Fully responsive (mobile + tablet)
- Lollipop gradient theme (pink-blue-purple)
- Lao language UI (Noto Sans Lao font)

## 🚀 Deploy to GitHub Pages

1. Create a new repository on GitHub
2. Upload all files (preserve `images/` folder)
3. Go to **Settings → Pages**
4. Under **Source**, select `main` branch and `/ (root)`
5. Click **Save**
6. Your game will be live at `https://<username>.github.io/<repo-name>/`

## 📁 Required Image Files

Place these 14 images in the `images/` folder:

```
images/
├── 001.jpeg          (card back / cover image)
├── card_2.jpeg       (rank 2 reaction)
├── card_3.jpeg       (rank 3 reaction)
├── card_4.jpeg       (rank 4 reaction)
├── card_5.jpeg       (rank 5 reaction)
├── card_6.jpeg       (rank 6 reaction)
├── card_7.jpeg       (rank 7 reaction)
├── card_8.jpeg       (rank 8 reaction)
├── card_9.jpeg       (rank 9 reaction)
├── card_10.jpeg      (rank 10 reaction)
├── card_J.jpeg       (Jack reaction)
├── card_Q.jpeg       (Queen reaction)
├── card_K.jpeg       (King reaction)
└── card_A.jpeg       (Ace reaction)
```

## 📁 Full File Structure
```
.
├── index.html
├── style.css
├── game.js
├── README.md
└── images/
    ├── 001.jpeg
    ├── card_2.jpeg
    └── ... (all 13 rank images)
```

## 🎮 How to Play
1. Click **ເລີ່ມເກມ** to start
2. Tap any floating card to flip it
3. Read the action and follow the rule!
4. Click **ຕົກລົງ** to continue
5. Use **ລ້າງໄພ່** to reset the deck

## 🛠️ Tech
- Pure HTML/CSS/JavaScript (no frameworks)
- No build step required
- No external dependencies (besides Google Fonts)
- 100% client-side
