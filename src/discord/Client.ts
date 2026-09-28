import { Client } from "@xhayper/discord-rpc";

const clientId = process.env.DISCORD_CLIENT_ID;

if (!clientId) {
    throw new Error(
        "DISCORD_CLIENT_ID is missing from .env"
    );
}

const DiscordRPC = new Client({
    clientId
});

export default DiscordRPC;