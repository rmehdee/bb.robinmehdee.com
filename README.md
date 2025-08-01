# Basketball Shooting Mini‑Game

This repository contains a simple yet polished basketball shooting game built with **React** and **Vite**.  The interface is styled to resemble [shadcn/ui](https://ui.shadcn.com) components – dark panels, clean buttons and subtle shadows – without bringing in any heavy dependencies.  You can play the game locally or deploy it to Netlify or any static hosting provider.

## Features

* **Smooth shooting mechanics** – click/tap and drag the ball downward to set the shot power, then release to shoot the ball towards the hoop.  In the latest version the guide line has been removed for a cleaner experience.
* **Realistic physics** – the ball is affected by gravity and will bounce off the rim and backboard.  Shots must enter the hoop cleanly from above to score.
* **Lives and scoring** – you have five lives (misses) per session.  Each miss costs one life; the game ends when lives reach zero.  The current score and high score are displayed and persisted in `localStorage`.
* **Responsive design** – the canvas automatically scales to fill the browser window, making the game playable on both desktop and mobile devices.
* **Modals for start and game over** – a welcoming start screen introduces the game, and a game over screen shows your final and high scores with a single tap/click to play again.

The game architecture separates concerns cleanly: physics and rendering run inside a canvas while React manages the UI overlays and game state.  The code is thoroughly commented to make it approachable to beginners.

## Getting Started

To run the game locally you need [Node.js](https://nodejs.org/) installed.  Clone this repository, install dependencies and start the development server:

```bash
git clone https://github.com/your‑username/basketball-mini-game.git
cd basketball-mini-game
npm install
npm run dev
```

This will launch Vite’s dev server.  Open the printed local URL (typically `http://localhost:5173`) in your browser to play the game.  The server supports hot module replacement – saving a file will automatically reload the page.

### Building for Production

To create an optimised production build run:

```bash
npm run build
```

The compiled assets will be placed in the `dist` directory.  You can preview the production build locally with:

```bash
npm run preview
```

## Deployment

### Netlify

1. Push your repository to GitHub or any git provider.
2. Create a new site on [Netlify](https://www.netlify.com/) and link it to your repository.
3. Configure the build settings:
   * **Build command:** `npm run build`
   * **Publish directory:** `dist`
4. Deploy the site – Netlify will automatically install dependencies, build the project and host it under a public URL.

### GitHub Pages (optional)

Vite generates relative asset paths by default, so you can also host the contents of the `dist` folder on GitHub Pages or any static server.  After building, commit and push the `dist` folder to the `gh-pages` branch, or use a helper like [`vite-plugin-gh-pages`](https://github.com/gnipbao/vite-plugin-gh-pages) to automate the process.

## How to Play

1. **Start the game**: click the “Start Game” button.
2. **Aim your shot**: press and hold the basketball near the bottom centre of the screen.  Drag it upward – the further you drag the stronger the shot.  No guide line is shown.
3. **Shoot**: release your finger or mouse button to launch the ball.  The ball arcs upward toward the hoop and is subject to gravity.
4. **Score points**: a shot counts as a score only if the ball falls cleanly through the hoop from above without touching the rim.  The score increments and a subtle colour change highlights the ball’s motion.
5. **Lives**: each miss reduces your lives by one.  When you run out of lives, the game ends and your final score is shown.  The high score is stored between sessions.
6. **Restart**: from the game over screen, click “Play Again” to reset your lives and score.

## Customising

This project deliberately avoids unnecessary dependencies to keep the code easy to understand and extend.  Feel free to modify styles, tweak physics parameters (gravity, bounce coefficient, hoop placement) or add new features like sound effects or additional obstacles.  For more authentic shadcn/ui components you can install the library following the official [Vite installation guide](https://ui.shadcn.com/docs/installation/vite)【241221169316958†L114-L131】 and then replace the custom modal and button with imported components.

## License

This mini‑game is released under the MIT License.  See [LICENSE](LICENSE) for details.