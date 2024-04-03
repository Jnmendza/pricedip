import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeAmazonProduct(url: string) {
  if (!url) return;

  //   curl --proxy brd.superproxy.io:22225 --proxy-user brd-customer-hl_245f0fe5-zone-pricedip:7ii77qgod603 -k https://lumtest.com/myip.json

  // BrightData proxy config
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 22225;
  const sessionId = (1000000 * Math.random()) | 0;

  const options = {
    auth: {
      username: `${username}-session-${sessionId}`,
      password,
    },
    host: "brd.superproxy.io",
    port,
    rejectUnauthrorized: false,
  };

  try {
    const response = await axios.get(url, options);
    console.log(response.data);
  } catch (error: any) {
    throw new Error(`Failed to scrape product: ${error.message}`);
  }
}
