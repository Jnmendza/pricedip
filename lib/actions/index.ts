"use server";

import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectToDB } from "../mongoose";
import { scrapeAmazonProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";

export async function scrapeAndStoreProduct(productUrl: string) {
  // Guard clause to ensure a product URL is provided.
  if (!productUrl) return;

  try {
    // Establish a connection to the database.
    connectToDB();
    // Scrape product details from the provided Amazon product URL.
    const scrapedProduct = await scrapeAmazonProduct(productUrl);

    // If scraping fails or returns no data, exit the function.
    if (!scrapedProduct) return;

    // Initialize product with scraped data.
    let product = scrapedProduct;

    // Attempt to find an existing product in the database by its URL.
    const existingProduct = await Product.findOne({ url: scrapedProduct.url });

    // If the product already exists, update its price history, highest price, and average price.
    if (existingProduct) {
      // Combine existing price history with the new scraped price.
      const updatedPriceHistory: any = [
        ...existingProduct.priceHistory,
        { price: scrapedProduct.currentPrice },
      ];

      // Update product data including calculated highest and average prices based on updated price history.
      product = {
        ...scrapedProduct,
        priceHistory: updatedPriceHistory,
        lowestPrice: getLowestPrice(updatedPriceHistory),
        highestPrice: getHighestPrice(updatedPriceHistory),
        averagePrice: getAveragePrice(updatedPriceHistory),
      };
    }

    // Update an existing product or create a new one if it doesn't exist, based on the URL.
    // The operation returns the newly created or updated document.
    const newProduct = await Product.findOneAndUpdate(
      { url: scrapedProduct.url },
      product,
      { upsert: true, new: true } // Options to create a new document if none match and to return the updated document.
    );

    // Trigger a revalidation (re-render) of the product page in Next.js for the updated product,
    // ensuring the latest product information is displayed to users.
    revalidatePath(`/products/${newProduct._id}`);
  } catch (error: any) {
    // Propagate an error with a descriptive message if any operation fails.
    throw new Error(`Failed to create/update product: ${error.message}`);
  }
}

export async function getProductById(productId: string) {
  try {
    connectToDB();
    const existingProduct = await Product.findOne({ _id: productId });

    if (!existingProduct) return null;

    return existingProduct;
  } catch (error) {
    console.error(error);
  }
}

export async function getAllProducts() {
  try {
    connectToDB();

    const products = await Product.find();

    return products;
  } catch (error) {
    console.log(error);
  }
}

export async function getSimilarProducts(productId: string) {
  try {
    connectToDB();
    const currentProduct = await Product.findById(productId);

    if (!currentProduct) return null;

    const similarProducts = await Product.find({
      _id: { $ne: productId },
    }).limit(3);

    return similarProducts;
  } catch (error) {
    console.log(error);
  }
}
