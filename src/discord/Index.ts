import Tags from "../utils/Tags.js";
import DiscordRPC from "./Client.js";
import { DiscordService } from "./DiscordService.js";
import { startImageServer } from "./ImageServer.js";

console.log(
    `[${Tags.Discord}] Connecting to Discord RPC...`
);

/*
 * Start our local poster server.
 */
startImageServer();

/*
 * Connect to Discord.
 */
try {

    await DiscordRPC.login();

    console.log(
        `[${Tags.Discord}] RPC Ready`
    );

} catch (error) {

    console.error(
        `[${Tags.Discord}] Failed to connect to Discord:`,
        error
    );

    process.exit(1);
}

/*
 * Update every 15 seconds.
 */
const updateInterval = 15000;

setInterval(async () => {

    try {

        await DiscordService.UpdateRPC();

    } catch (error) {

        console.error(
            `[${Tags.Discord}] Update failed:`,
            error
        );
    }

}, updateInterval);

/*
 * Run immediately.
 */
await DiscordService.UpdateRPC();