export interface Env {
  CRON_SECRET: string;
}

export default {
  // This function runs automatically on the schedule defined in wrangler.toml
  async scheduled(event: any, env: Env, ctx: any) {
    const siteUrl = "https://sayyesapp.com";
    
    // Check if it's Tuesday or Sunday
    // event.cron might contain the cron string that triggered this
    const isMidweek = event.cron === "0 9 * * 2" || event.cron === "0 9 * * TUE";
    const endpoint = `${siteUrl}/api/cron/reminders${isMidweek ? "?type=midweek" : ""}`;

    console.log(`[Cron] Triggering ${isMidweek ? "mid-week" : "Sunday"} reminders at ${endpoint}...`);

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${env.CRON_SECRET}`,
        },
      });

      const result = await response.text();
      console.log(`[Cron] Response: ${result}`);
    } catch (error) {
      console.error(`[Cron] Failed to trigger reminders: ${error}`);
    }
  },

  // Also allow manual triggering via URL for testing (optional)
  async fetch(request: Request, env: Env, ctx: any) {
    return new Response("SayYes Heartbeat is active. It runs every Sunday at 09:00 UTC.");
  }
};
