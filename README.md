# PHANTOM: The Last Ritual 

**A 3D horror game where your smartphone becomes your controller.**

PHANTOM: The Last Ritual is a first-person horror game set inside a haunted mansion. Players must explore the house, uncover clues, collect a mysterious artifact, and complete a ritual to banish the ghost before running out of lives.

What makes PHANTOM different is its smartphone controller. Instead of relying entirely on a keyboard and mouse, players can connect their phone by scanning a QR code and use it to move, look around, interact with objects, and defend themselves.

**Built for MarinaHacks 6.0 | Entertainment Track | Solo Project**

## Features

- **3D Haunted Mansion:** Explore the parlor, cellar, hallways, ritual chamber, and forgotten bedroom.
- **Smartphone Controller:** Connect your phone and laptop using a QR code.
- **Gyroscope & Touch Controls:** Look around by physically pointing your phone or dragging your finger across the screen.
- **Ghost AI:** A ghost wanders through the mansion, stalks the player, and attacks.
- **Interactive Story:** Discover a journal, collect the Crimson Shard, and complete the ritual.
- **Banishment Mechanic:** Unlock the ability to defend yourself against the ghost.
- **Horror Atmosphere:** Candlelight, fog, creepy sound effects, and jumpscares.
- **Three-Life System:** Survive long enough to complete the final ritual.

## How to Play

### 1. Start the Game

Open the deployed game on your laptop.

**Live Demo:** Add your Vercel project URL here.

You can play using your keyboard and mouse or connect your smartphone for a more interactive experience.

### 2. Connect Your Smartphone

1. Open PHANTOM on your laptop.
2. Scan the QR code displayed on the start screen using your phone.
3. Open the link in your phone's browser.
4. Tap **Connect** and grant motion permission if prompted.
5. Use the phone as your controller while viewing the game on your laptop.

A stable internet connection is recommended for phone controls.

### 3. Controls

**Laptop Controls**

| Control | Action |
|---|---|
| W / A / S / D | Move |
| Mouse | Look around |
| Shift | Run |
| E | Interact |
| B | Banish |
| Esc | Release mouse |

**Smartphone Controls**

| Control | Action |
|---|---|
| Virtual joystick | Move |
| Finger drag | Look around |
| Gyroscope | Look around by moving your phone |
| INTERACT | Interact with objects |
| BANISH (hold) | Attempt to banish the ghost |
| Sensitivity controls | Adjust touch camera sensitivity |
| Invert Y | Reverse vertical finger-look direction |

Gyroscope and finger-look can be used together.

## Your Objective

You have three lives to complete the ritual and survive.

1. Explore the mansion and search for clues.
2. Find the mysterious **Crimson Shard**.
3. Discover the forgotten bedroom and read the journal.
4. Bring the artifact to the ritual chamber to unlock banishment.
5. Survive the ghost and complete your final confrontation.

Be careful. The ghost isn't going to wait for you to finish exploring.

## Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Game and controller logic |
| Three.js | 3D graphics |
| React Three Fiber | 3D scene rendering |
| React Three Drei | Three.js helpers and camera controls |
| Vite | Development and frontend builds |
| Node.js | Relay server |
| Socket.IO | Real-time communication between phone and laptop |
| Vercel | Game hosting |
| Render | Relay server hosting |

## How It Works

The game and smartphone controller communicate through a Socket.IO relay server.

**Connection flow:**

1. The laptop opens a game session and generates a room code.
2. A QR code gives the phone a link containing that room code.
3. The phone connects to the same relay server and joins the laptop's room.
4. Joystick, gyroscope, touch, and button inputs are sent to the relay.
5. The relay forwards those inputs to the laptop.
6. The game uses the received input to update player movement, camera direction, and interactions.

This allows the phone to act as a wireless controller while the game runs in the laptop browser.

## Running Locally

### Prerequisites

- Node.js and npm
- A modern web browser
- A smartphone for testing the remote controller

### Installation

Clone the repository:

```bash
git clone https://github.com/warissah/marinahacks-6.0.git
cd marinahacks-6.0
```

Install dependencies:

```bash
npm install
```

### Start the Relay Server

In one terminal:

```bash
node relay/server.cjs
```

The relay uses port `3001` during local development.

### Start the Game

In another terminal:

```bash
npm run dev
```

Open the localhost URL displayed by Vite.

### Environment Variables

For a deployed or remotely accessible relay, configure:

```env
VITE_RELAY_URL=https://your-relay-server.onrender.com
```

For local development, the controller uses `http://localhost:3001` by default when this variable is not set.

**Important:** If you test the controller using a physical phone, the phone needs to access the game through a reachable HTTPS URL. A localhost URL on your laptop cannot be opened directly from another device.

## Challenges

One of the biggest challenges was making the smartphone controller feel responsive. Although sending inputs between the phone and laptop worked early on, camera movement initially felt jittery. I experimented with camera smoothing, gyroscope input, and sensitivity adjustments to make movement feel more natural.

Another challenge was creating the right horror atmosphere. The mansion needed to feel dark and unsettling without making it impossible for players to navigate.

I also had to troubleshoot hosting the game and relay separately and making sure both devices could communicate through the deployed version.

## What I Learned

Building PHANTOM helped me learn more about:

- Creating interactive 3D environments using React Three Fiber.
- Handling player movement, collision detection, and game state.
- Implementing basic enemy AI and game interactions.
- Working with device orientation sensors.
- Using Socket.IO for real-time communication between devices.
- Deploying a frontend and backend separately.

Most importantly, I learned that making a feature work technically is different from making it feel good to use.

## Future Improvements

- More rooms, clues, and puzzles.
- Additional ghost behaviors and unpredictable encounters.
- Improved gyroscope calibration and aiming.
- More story elements and multiple endings.
- Expanded gameplay and additional challenges.

## About

Created as a solo project for **MarinaHacks 6.0**, in the **Entertainment** category.

**Developer:** Warissa Hossain

**GitHub:** https://github.com/warissah/marinahacks-6.0
