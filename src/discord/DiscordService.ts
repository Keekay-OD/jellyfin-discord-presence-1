import { JellyfinService } from "../jellyfin/JellyfinService.js";
import DiscordRPC from "./Client.js";
import Tags from "../utils/Tags.js";
import { uploadToImgur } from "./AssetUploader.js";

export const DiscordService = {

    UpdateRPC: async () => {

        /*
         * -----------------------------------------------------
         * GET JELLYFIN SESSION
         * -----------------------------------------------------
         */

        const mySession =
            await JellyfinService.GetMySession();

        if (!mySession) {

            console.log(
                "[Jellyfin] No active session."
            );

            return;
        }

        const np =
            mySession.NowPlayingItem;

        const playState =
            mySession.PlayState;

        const isPaused =
            playState?.IsPaused ?? false;

        const username =
            mySession.UserName;

        const deviceName =
            mySession.DeviceName;

        /*
         * -----------------------------------------------------
         * DEFAULT PRESENCE
         * -----------------------------------------------------
         */

        let details =
            "On Homepage";

        let state =
            "Browsing...";

        let startTimestamp:
            number | undefined =
            undefined;

        let largeImageUrl:
            string | undefined =
            undefined;

        /*
         * -----------------------------------------------------
         * NOW PLAYING
         * -----------------------------------------------------
         */

        if (np) {

            /*
             * -------------------------------------------------
             * TV SHOW
             * -------------------------------------------------
             */

            if (np.SeriesName) {

                const seriesName =
                    np.SeriesName;

                const episodeName =
                    np.Name ||
                    "Unknown Episode";

                const seasonNumber =
                    np.ParentIndexNumber ??
                    0;

                const episodeNumber =
                    np.IndexNumber ??
                    0;

                details =
                    seriesName;

                state =
                    `S${seasonNumber}:E${episodeNumber} - ${episodeName}`;

            }

            /*
             * -------------------------------------------------
             * MOVIE
             * -------------------------------------------------
             */

            else {

                details =
                    np.Name ||
                    "Unknown Movie";

                state =
                    "Movie";
            }

            /*
             * -------------------------------------------------
             * PLAYBACK TIME
             * -------------------------------------------------
             */

            const positionTicks =
                playState?.PositionTicks ?? 0;

            const positionMilliseconds =
                Math.floor(
                    positionTicks / 10000
                );

            const playbackStart =
                Date.now() -
                positionMilliseconds;

            if (!isPaused) {

                startTimestamp =
                    playbackStart;
            }

            /*
             * -------------------------------------------------
             * JELLYFIN ARTWORK
             * -------------------------------------------------
             */

            const jellyfinUrl =
                process.env.JELLYFIN_URL;

            if (!jellyfinUrl) {

                throw new Error(
                    "JELLYFIN_URL is missing from .env"
                );
            }

            const cleanJellyfinUrl =
                jellyfinUrl.replace(
                    /\/+$/,
                    ""
                );

            /*
             * For TV:
             *
             * np.Id       = episode
             * np.SeriesId = series
             *
             * We want the SERIES poster.
             *
             * For movies:
             *
             * np.Id = movie
             */

            const imageItemId =
                np.SeriesId ??
                np.Id;

            /*
             * Don't use the episode ImageTag
             * when requesting the series artwork.
             */

            const posterTag =
                np.SeriesId
                    ? undefined
                    : np.ImageTags?.Primary;

            const posterUrl =
                posterTag
                    ? `${cleanJellyfinUrl}/Items/${imageItemId}/Images/Primary?tag=${encodeURIComponent(
                          posterTag
                      )}`
                    : `${cleanJellyfinUrl}/Items/${imageItemId}/Images/Primary`;

            console.log(
                `[Jellyfin] Artwork Item ID: ${imageItemId}`
            );

            console.log(
                `[Jellyfin] Poster: ${posterUrl}`
            );

            /*
             * Download/cache the poster.
             *
             * Despite the old function name, this no longer
             * uploads anything to Imgur.
             */

            largeImageUrl =
                await uploadToImgur(
                    posterUrl,
                    "large"
                ) ?? undefined;

            console.log(
                `[Discord] Large image: ${
                    largeImageUrl ??
                    "none"
                }`
            );
        }

        /*
         * -----------------------------------------------------
         * DISCORD PRESENCE
         * -----------------------------------------------------
         */

        const activity: any = {

            details,

            state,

            largeImageText:
                np
                    ? `Jellyfin on ${deviceName}`
                    : "Jellyfin",

            smallImageText:
                isPaused
                    ? "Paused"
                    : np
                        ? `Playing | ${username}`
                        : `Browsing | ${username}`,

            /*
             * IMPORTANT:
             *
             * Discord expects the external image URL in
             * largeImageKey.
             *
             * NOT largeImageUrl.
             */

            largeImageKey:
                largeImageUrl,

            /*
             * Only send the timestamp while playing.
             */

            ...(startTimestamp
                ? {
                    startTimestamp
                }
                : {}),

            /*
             * Playing activity.
             */

            type: 0
        };

        try {

            await DiscordRPC.user?.setActivity(
                activity
            );

            console.log(
                `[${Tags.Discord}] Updated Rich Presence: ${details}${np ? ` - ${state}` : ""}`
            );

        } catch (error) {

            console.error(
                `[${Tags.Discord}] Failed to update presence:`,
                error
            );
        }
    }
};