"use server";

import axios from "axios";
import * as cheerio from "cheerio";
import {
  extractCurrency,
  extractDescription,
  extractPrice,
  extractStarRating,
} from "../utils";

export async function scrapeAmazonProduct(url: string) {
  if (!url) return;

  // BrightData proxy configuration
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 22225;
  const session_id = (1000000 * Math.random()) | 0;

  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: "brd.superproxy.io",
    port,
    rejectUnauthorized: false,
  };

  try {
    // Fetch the product page
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    // Extract the product title
    const title = $("#productTitle").text().trim();
    const currentPrice = extractPrice(
      $(".priceToPay span.a-price-whole"),
      $(".a.size.base.a-color-price"),
      $(".a-button-selected"),
      $(".a-color-base"),
      $(".a-offscreen")
    );

    const originalPrice = extractPrice(
      $("#priceblock_ourprice"),
      $(".a-price.a-text-price"),
      $("#listPrice"),
      $("span.a-offscreen"),
      $("#priceblock_dealprice"),
      $(".a-size-base.a-color-price")
    );

    const isOutOfStock =
      $("#availability span").text().trim().toLowerCase() ===
      "currently unavailable";

    const images =
      $("#imgBlkFront").attr("data-a-dynamic-image") ||
      $("#landingImage").attr("data-a-dynamic-image") ||
      "{}";

    const imageUrls = Object.keys(JSON.parse(images));

    const currency = extractCurrency($(".a-price-symbol"));
    const discountRate = $(".savingsPercentage").text().replace(/[-%]/g, "");

    const description = extractDescription($);

    // const starRating = extractStarRating(
    //   $('[data-hook="acr-average-stars-rating-text"]'),
    //   $('[data-hook="average-stars-rating-anywhere"]')
    // );
    const starRating = $('[data-hook="acr-average-stars-rating-text"]')
      .text()
      .trim();

    // console.log("DATA", response.data, {
    //   title,
    //   currentPrice,
    //   originalPrice,
    //   isOutOfStock,
    //   imageUrls,
    //   starRating,
    // });
    // Construct data object with scraped information
    const data = {
      url,
      currency: currency || "$",
      image: imageUrls[0],
      title,
      currentPrice: Number(currentPrice) || Number(originalPrice),
      originalPrice: Number(originalPrice) || Number(currentPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      category: "category",
      reviewsCount: 100,
      stars: 4.5,
      isOutOfStock: isOutOfStock,
      description,
      lowestPrice: Number(currentPrice) || Number(originalPrice),
      highestPrice: Number(originalPrice) || Number(currentPrice),
      averagePrice: Number(currentPrice) || Number(originalPrice),
    };
    // console.log("FINAL DATA::", data);
    return data;
  } catch (error: any) {
    console.log(error);
  }
}
