# MapMint

For users, MapMint provides a new way to earn just by being in the right place at the right time. For businesses, researchers, and DAOs, it's a powerful tool to crowdsource hyper-local, real-time data at scale—faster and cheaper than traditional methods. Over time, this data can be aggregated and sold via an open marketplace, creating new economic opportunities for both creators and contributors while supporting a transparent, user-owned data ecosystem.

## How it's Made

MapMint uses World ID for secure human verification and a wallet-based login to gate participation. Users interact with a mobile-first interface built with World App, featuring an interactive map to browse and submit geo-based tasks.

Submitted data (e.g., internet speed, background noise level, light intensity, etc) is collected through browser APIs and stored on IPFS for decentralized, tamper-proof availability. Key task and reward logic is designed to live on-chain, enabling verifiable pot funding, GPS-based task validation, and proportional reward distribution using $WORLD tokens.

This setup ensures the most important components—identity, location, reward, and data storage—are verifiable, censorship-resistant, and composable with other Web3 protocols.

## Setup

```bash
cp .env.example .env
pnpm i
pnpm dev

```

To run as a mini app choose a production app in the dev portal and use NGROK to tunnel. Set the `NEXTAUTH_URL` and the redirect url if using sign in with worldcoin to that ngrok url

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Requirements

To use the application, you'll need to:

1. **Get World ID Credentials**
   From the [World ID Developer Portal](https://developer.worldcoin.org/):

   - Create a new app to get your `APP_ID`
   - Get `DEV_PORTAL_API_KEY` from the API Keys section
   - Navigate to "Sign in with World ID" page to get:
     - `WLD_CLIENT_ID`
     - `WLD_CLIENT_SECRET`

2. **Configure Action**
   - In the Developer Portal, create an action in the "Incognito Actions" section
   - Use the same action name in `components/Verify/index.tsx`

## Resources

- [World ID Documentation](https://docs.world.org/)
- [World ID Developer Portal](https://developer.worldcoin.org/)
