# 8-Ball Pool

<img width="835" alt="image" src="https://github.com/nimadastmalchi/8-ball-pool/assets/60092567/eeece2e7-0940-4289-9187-6dcfacb7618c">

## Launching the Game

First, download the latest version of [Python](https://www.python.org/downloads/) if it is not already installed. Then, execute the following command from the root directory of the unzipped ZIP file.

    python3 server.py

Finally, nagivate to [`localhost:8000`](http://localhost:8000) to begin playing.

## What to Expect

### Controls

The following controls are used to interact with the game.

| Key | Function |
| :----: | ------ |
| a | Rotate the cue stick clockwise about the ball, or move the cue ball left after a scratch. |
| d | Rotate the cue stick counter-clockwise about the ball, or move the cue ball right after a scratch. |
| s | Adjust the power of the cue stick, or move the cue ball down after a scratch. |
| w | Move the cue ball up after a scratch. |
| v | Change the viewing angle. |
| r | Restart the game. |

### Viewing Angles

The player is able to toggle between two different viewing angles. The first viewing angle is a bird's-eye view of the table, whereas the second viewing angle is from the perspective of the cue stick. Additionally, the camera is locked in the chosen viewing angle, preventing the player from moving freely about the scene.

### Game Status Indicator

The status of the game is displayed in the top-left corner of the screen. Specifically, the current player, target balls, and winner are displayed.

### Additional Comments

The cue stick and pool balls will lie solely within the plane of the surface of the pool table. The cue stick always points directly at the center of the cue ball.
