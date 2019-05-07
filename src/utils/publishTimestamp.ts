import { writeToDataFeed } from "./writeToDataFeed";

/**
 * Publishes the current timestamp to the data_feed every time the method is
 * called. This should happen once a day via a cron-job
 */
export async function publishTimestamp() {
    writeToDataFeed({ timestamp: Date.now() });
}
