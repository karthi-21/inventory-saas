/**
 * Ezvento Stress Test Seed Script
 *
 * Creates a complete superstore scenario for stress/performance testing:
 *   - 1 user, 3 stores, ~950+ products, full inventory across all counters
 *
 * Usage:
 *   npx tsx scripts/seed-stress-test.ts
 *
 * Prerequisites:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   - prisma generate must have been run
 */

import {
  PrismaClient,
  StoreType,
  LocationType,
  TenantPlan,
  PermissionModule,
  PermissionAction,
} from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { hash } from "bcrypt";
import { config } from "dotenv";

config({ path: ".env.local" });

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMAIL = "superstore@ezvento.in";
const PASSWORD = "Test@123456";
const SUBDOMAIN = "superstore";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

const CATEGORY_HIERARCHY: Record<string, string[]> = {
  Clothing: [
    "Men's Wear",
    "Women's Wear",
    "Kids' Wear",
    "Teens' Wear",
    "Infants",
    "Traditional Wear",
    "Winter Wear",
    "Footwear",
    "Accessories",
    "Innerwear",
    "Sports Wear",
    "Formal Wear",
  ],
  Electronics: [
    "Mobile Phones",
    "Chargers & Cables",
    "Cases & Screen Guards",
    "Laptops & Accessories",
    "Audio",
    "TVs & Entertainment",
    "Large Appliances",
    "Kitchen Appliances",
    "Home Electronics",
    "Gaming",
  ],
  Groceries: [
    "Fresh Vegetables",
    "Fresh Fruits",
    "Dairy & Eggs",
    "Rice/Grains/Flours",
    "Pulses & Dals",
    "Spices & Masalas",
    "Oils & Ghee",
    "Dry Fruits & Nuts",
    "Snacks & Biscuits",
    "Beverages",
    "Frozen Foods",
    "Bakery",
    "Personal Care",
    "Cleaning",
    "Ready-to-Eat",
  ],
};

// ---------------------------------------------------------------------------
// Clothing generation config
// ---------------------------------------------------------------------------

const CLOTHING_BRANDS = [
  "Levi's",
  "Allen Solly",
  "Puma",
  "Adidas",
  "Nike",
  "Fabindia",
  "Biba",
  "W",
  "Van Heusen",
  "Louis Philippe",
  "Jockey",
  "H&M",
  "Zara",
  "Raymond",
  "Mufti",
];

const ADULT_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const KIDS_SIZES = [
  "1-2Y",
  "3-4Y",
  "5-6Y",
  "7-8Y",
  "9-10Y",
  "11-12Y",
  "13-14Y",
];
const INFANT_SIZES = ["NB", "0-3M", "3-6M", "6-12M", "12-18M", "18-24M"];
const FOOTWEAR_SIZES = ["5", "6", "7", "8", "9", "10", "11"];

// Product item templates per clothing subcategory
const CLOTHING_ITEMS: Record<string, { name: string; brands: string[]; sizes: string[]; priceTiers: string[] }[]> = {
  "Men's Wear": [
    { name: "Regular Fit Shirt", brands: ["Allen Solly", "Van Heusen", "Louis Philippe", "Raymond", "H&M", "Zara", "Mufti"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Slim Fit Shirt", brands: ["Allen Solly", "Van Heusen", "Louis Philippe", "Raymond", "Zara", "H&M"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Polo T-Shirt", brands: ["Levi's", "Allen Solly", "Puma", "Nike", "Adidas", "H&M", "Zara"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Round Neck T-Shirt", brands: ["Levi's", "Puma", "Nike", "Adidas", "H&M", "Zara", "Mufti"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Slim Fit Jeans", brands: ["Levi's", "W", "H&M", "Zara", "Mufti", "Van Heusen"], sizes: ["28", "30", "32", "34", "36", "38"], priceTiers: ["standard", "premium"] },
    { name: "Regular Fit Jeans", brands: ["Levi's", "Mufti", "H&M", "W", "Zara"], sizes: ["28", "30", "32", "34", "36", "38"], priceTiers: ["standard", "premium"] },
    { name: "Cotton Chinos", brands: ["Allen Solly", "Van Heusen", "Louis Philippe", "Raymond", "H&M"], sizes: ["28", "30", "32", "34", "36"], priceTiers: ["standard", "premium"] },
  ],
  "Women's Wear": [
    { name: "Cotton Kurti", brands: ["Fabindia", "Biba", "W", "Allen Solly", "H&M", "Zara"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Printed Kurti", brands: ["Fabindia", "Biba", "W", "Zara", "H&M", "Allen Solly"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Floral Dress", brands: ["Zara", "H&M", "W", "Biba", "Fabindia"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Designer Saree", brands: ["Fabindia", "Biba", "W"], sizes: ["Free Size"], priceTiers: ["premium"] },
    { name: "Party Wear Gown", brands: ["Zara", "Biba", "W", "H&M"], sizes: ADULT_SIZES, priceTiers: ["premium"] },
    { name: "Women's Jeans", brands: ["Levi's", "W", "H&M", "Zara", "Mufti"], sizes: ["26", "28", "30", "32", "34"], priceTiers: ["standard", "premium"] },
    { name: "Leggings", brands: ["Jockey", "H&M", "Zara", "W", "Nike", "Adidas"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
  ],
  "Kids' Wear": [
    { name: "Kids T-Shirt", brands: ["Puma", "Nike", "Adidas", "H&M", "Zara", "Levi's"], sizes: KIDS_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Kids Shorts", brands: ["Puma", "Nike", "Adidas", "H&M", "Levi's"], sizes: KIDS_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Kids Frocks", brands: ["Fabindia", "Biba", "H&M", "Zara", "Allen Solly"], sizes: KIDS_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Kids Jeans", brands: ["Levi's", "H&M", "Zara", "Mufti", "Puma"], sizes: KIDS_SIZES, priceTiers: ["standard"] },
    { name: "Kids Ethnic Wear", brands: ["Fabindia", "Biba", "W"], sizes: KIDS_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Track Pants", brands: ["Puma", "Nike", "Adidas", "H&M"], sizes: KIDS_SIZES, priceTiers: ["budget", "standard"] },
    { name: "School Uniform", brands: ["Allen Solly", "Van Heusen", "Raymond"], sizes: KIDS_SIZES, priceTiers: ["budget"] },
  ],
  "Teens' Wear": [
    { name: "Teens T-Shirt", brands: ["Puma", "Nike", "Adidas", "H&M", "Zara", "Levi's", "Mufti"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Teens Jeans", brands: ["Levi's", "H&M", "Zara", "Mufti", "W"], sizes: ["26", "28", "30", "32", "34"], priceTiers: ["standard", "premium"] },
    { name: "Hoodies", brands: ["Puma", "Nike", "Adidas", "H&M", "Zara"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Teens Shorts", brands: ["Puma", "Nike", "Adidas", "H&M", "Levi's"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Teens Dresses", brands: ["Zara", "H&M", "W", "Biba"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Teens Shirts", brands: ["Allen Solly", "Van Heusen", "Raymond", "H&M", "Zara"], sizes: ADULT_SIZES, priceTiers: ["standard"] },
    { name: "Joggers", brands: ["Puma", "Nike", "Adidas", "H&M", "Zara"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
  ],
  Infants: [
    { name: "Baby Romper", brands: ["Fabindia", "H&M", "Zara", "Jockey"], sizes: INFANT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Onesie", brands: ["Fabindia", "H&M", "Zara", "Jockey", "Puma"], sizes: INFANT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Sleepsuit", brands: ["Fabindia", "H&M", "Zara", "Jockey"], sizes: INFANT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Baby Bibs Set", brands: ["Fabindia", "H&M", "Jockey"], sizes: ["One Size"], priceTiers: ["budget"] },
    { name: "Baby Booties", brands: ["Fabindia", "H&M", "Zara", "Puma", "Nike"], sizes: ["0-6M", "6-12M"], priceTiers: ["budget"] },
    { name: "Baby Blanket", brands: ["Fabindia", "H&M", "Zara"], sizes: ["One Size"], priceTiers: ["standard"] },
    { name: "Infant Sweater Set", brands: ["Fabindia", "H&M", "Zara", "Jockey"], sizes: INFANT_SIZES, priceTiers: ["standard", "premium"] },
  ],
  "Traditional Wear": [
    { name: "Silk Saree", brands: ["Fabindia", "Biba", "W"], sizes: ["Free Size"], priceTiers: ["premium"] },
    { name: "Cotton Saree", brands: ["Fabindia", "Biba", "W", "Allen Solly"], sizes: ["Free Size"], priceTiers: ["standard"] },
    { name: "Kurta Pyjama Set", brands: ["Fabindia", "Biba", "W", "Raymond", "Van Heusen"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Designer Lehenga", brands: ["Biba", "W", "Fabindia"], sizes: ADULT_SIZES, priceTiers: ["premium"] },
    { name: "Sherwani", brands: ["Raymond", "Van Heusen", "Louis Philippe", "Fabindia"], sizes: ADULT_SIZES, priceTiers: ["premium"] },
    { name: "Dhoti Kurta Set", brands: ["Fabindia", "Biba", "Raymond"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Ethnic Jacket", brands: ["Fabindia", "Raymond", "Van Heusen", "Louis Philippe"], sizes: ADULT_SIZES, priceTiers: ["premium"] },
  ],
  "Winter Wear": [
    { name: "Puffer Jacket", brands: ["Puma", "Nike", "Adidas", "Zara", "H&M"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Woolen Sweater", brands: ["Fabindia", "Allen Solly", "Van Heusen", "Raymond", "H&M", "Zara"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Cardigan", brands: ["Fabindia", "Allen Solly", "Van Heusen", "H&M", "Zara"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Thermal Top", brands: ["Jockey", "Van Heusen", "Adidas", "Nike"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Thermal Bottom", brands: ["Jockey", "Van Heusen", "Adidas", "Nike"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Woolen Shawl", brands: ["Fabindia", "Biba", "W"], sizes: ["One Size"], priceTiers: ["standard", "premium"] },
    { name: "Winter Hoodie", brands: ["Puma", "Nike", "Adidas", "H&M", "Zara", "Levi's"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
  ],
  Footwear: [
    { name: "Running Shoes", brands: ["Puma", "Nike", "Adidas"], sizes: FOOTWEAR_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Casual Sneakers", brands: ["Puma", "Nike", "Adidas", "H&M", "Zara", "Levi's"], sizes: FOOTWEAR_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Formal Shoes", brands: ["Allen Solly", "Van Heusen", "Louis Philippe", "Raymond"], sizes: FOOTWEAR_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Slippers", brands: ["Puma", "Nike", "Adidas", "H&M", "Fabindia"], sizes: ["6", "7", "8", "9", "10"], priceTiers: ["budget"] },
    { name: "Leather Loafers", brands: ["Allen Solly", "Van Heusen", "Louis Philippe", "Raymond"], sizes: FOOTWEAR_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Sandals", brands: ["Puma", "Nike", "Adidas", "H&M", "Fabindia", "Biba"], sizes: FOOTWEAR_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Sports Shoes", brands: ["Puma", "Nike", "Adidas"], sizes: FOOTWEAR_SIZES, priceTiers: ["standard", "premium"] },
  ],
  Accessories: [
    { name: "Leather Belt", brands: ["Allen Solly", "Van Heusen", "Louis Philippe", "Raymond", "Levi's"], sizes: ["32", "34", "36", "38", "40"], priceTiers: ["standard", "premium"] },
    { name: "Casual Belt", brands: ["Levi's", "Puma", "Nike", "Adidas", "H&M", "Zara", "Mufti"], sizes: ["32", "34", "36", "38", "40"], priceTiers: ["budget", "standard"] },
    { name: "Leather Wallet", brands: ["Allen Solly", "Van Heusen", "Louis Philippe", "Raymond", "Levi's", "H&M"], sizes: ["One Size"], priceTiers: ["standard", "premium"] },
    { name: "Sunglasses", brands: ["Raymond", "Zara", "H&M", "Puma", "Nike", "Adidas"], sizes: ["One Size"], priceTiers: ["budget", "standard"] },
    { name: "Baseball Cap", brands: ["Puma", "Nike", "Adidas", "Levi's", "H&M", "Zara"], sizes: ["One Size"], priceTiers: ["budget"] },
    { name: "Designer Scarf", brands: ["Fabindia", "Zara", "H&M", "W", "Biba"], sizes: ["One Size"], priceTiers: ["standard", "premium"] },
    { name: "Tote Bag", brands: ["Fabindia", "H&M", "Zara", "Biba", "W"], sizes: ["One Size"], priceTiers: ["standard", "premium"] },
  ],
  Innerwear: [
    { name: "Cotton Briefs (3Pk)", brands: ["Jockey", "Van Heusen", "Puma", "Nike", "Adidas", "H&M"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Boxer Shorts (3Pk)", brands: ["Jockey", "Van Heusen", "Puma", "Nike", "Adidas", "H&M", "Levi's"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Cotton Vest (3Pk)", brands: ["Jockey", "Van Heusen", "H&M"], sizes: ADULT_SIZES, priceTiers: ["budget"] },
    { name: "Women's Bra", brands: ["Jockey", "Zara", "H&M", "W", "Nike", "Adidas"], sizes: ["32B", "34B", "34C", "36B", "36C", "38C", "40C"], priceTiers: ["standard", "premium"] },
    { name: "Women's Panties (5Pk)", brands: ["Jockey", "Zara", "H&M", "W"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Camisole", brands: ["Jockey", "Zara", "H&M", "W"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Thermal Innerwear Set", brands: ["Jockey", "Van Heusen", "Adidas", "Nike"], sizes: ADULT_SIZES, priceTiers: ["standard"] },
  ],
  "Sports Wear": [
    { name: "Track Pants", brands: ["Puma", "Nike", "Adidas"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Dri-Fit T-Shirt", brands: ["Puma", "Nike", "Adidas"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Athletic Shorts", brands: ["Puma", "Nike", "Adidas"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Compression Tights", brands: ["Nike", "Adidas", "Puma", "Jockey"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Sports Bra", brands: ["Nike", "Adidas", "Puma", "Jockey"], sizes: ["32B", "34B", "34C", "36B", "36C"], priceTiers: ["standard", "premium"] },
    { name: "Gym Vest", brands: ["Puma", "Nike", "Adidas", "Jockey"], sizes: ADULT_SIZES, priceTiers: ["budget", "standard"] },
    { name: "Sweat Band Set", brands: ["Puma", "Nike", "Adidas"], sizes: ["One Size"], priceTiers: ["budget"] },
  ],
  "Formal Wear": [
    { name: "Two-Piece Suit", brands: ["Raymond", "Van Heusen", "Louis Philippe", "Allen Solly"], sizes: ADULT_SIZES, priceTiers: ["premium"] },
    { name: "Single Breasted Blazer", brands: ["Raymond", "Van Heusen", "Louis Philippe", "Allen Solly", "Zara"], sizes: ADULT_SIZES, priceTiers: ["premium"] },
    { name: "Formal Shirt", brands: ["Allen Solly", "Van Heusen", "Louis Philippe", "Raymond", "Zara"], sizes: ADULT_SIZES, priceTiers: ["standard", "premium"] },
    { name: "Formal Trousers", brands: ["Raymond", "Allen Solly", "Van Heusen", "Louis Philippe"], sizes: ["28", "30", "32", "34", "36", "38"], priceTiers: ["standard", "premium"] },
    { name: "Silk Tie", brands: ["Raymond", "Van Heusen", "Louis Philippe", "Allen Solly"], sizes: ["One Size"], priceTiers: ["standard", "premium"] },
    { name: "Cufflinks Set", brands: ["Raymond", "Louis Philippe", "Van Heusen", "Allen Solly"], sizes: ["One Size"], priceTiers: ["premium"] },
    { name: "Waistcoat", brands: ["Raymond", "Van Heusen", "Louis Philippe", "Allen Solly"], sizes: ADULT_SIZES, priceTiers: ["premium"] },
  ],
};

// ---------------------------------------------------------------------------
// Electronics generation config
// ---------------------------------------------------------------------------

interface ElecSubcatConfig {
  items: string[];
  brands: string[];
  gstRate: number;
  hasSerial: boolean;
  priceRange: [number, number];
  costRatio: number;
  sellRatio: number;
}

const ELECTRONICS_CONFIG: Record<string, ElecSubcatConfig> = {
  "Mobile Phones": {
    items: ["Smartphone 5G", "Smartphone 4G", "Flagship Phone", "Budget Phone", "Foldable Phone"],
    brands: ["Samsung", "Apple", "OnePlus", "Xiaomi", "OPPO", "Vivo", "Motorola"],
    gstRate: 18,
    hasSerial: true,
    priceRange: [8999, 149999],
    costRatio: 0.75,
    sellRatio: 0.95,
  },
  "Chargers & Cables": {
    items: ["Fast Charger 65W", "USB-C Cable 2M", "Wireless Charger", "Car Charger", "Multi-Port Adapter"],
    brands: ["Anker", "Samsung", "Apple", "OnePlus", "Belkin", "mi"],
    gstRate: 18,
    hasSerial: false,
    priceRange: [299, 4999],
    costRatio: 0.5,
    sellRatio: 0.88,
  },
  "Cases & Screen Guards": {
    items: ["Tempered Glass", "Silicone Back Cover", "Rugged Armor Case", "Clear Transparent Case", "Flip Leather Cover"],
    brands: ["Spigen", "Ringke", "Urban Armor Gear", "Mi", "DailyObjects"],
    gstRate: 18,
    hasSerial: false,
    priceRange: [199, 2499],
    costRatio: 0.4,
    sellRatio: 0.85,
  },
  "Laptops & Accessories": {
    items: ["Gaming Laptop 15\"", "Ultrabook 14\"", "Business Laptop 15\"", "Wireless Mouse", "Laptop Stand", "Webcam HD"],
    brands: ["Dell", "HP", "Apple", "Lenovo", "ASUS", "Acer"],
    gstRate: 18,
    hasSerial: true,
    priceRange: [79999, 189999],
    costRatio: 0.78,
    sellRatio: 0.94,
  },
  Audio: {
    items: ["Wireless ANC Headphones", "True Wireless Earbuds", "Bluetooth Speaker", "Wired Earphones", "Soundbar"],
    brands: ["Sony", "Bose", "JBL", "Sennheiser", "Samsung", "Apple"],
    gstRate: 18,
    hasSerial: false,
    priceRange: [1499, 39990],
    costRatio: 0.6,
    sellRatio: 0.9,
  },
  "TVs & Entertainment": {
    items: ["Smart TV 43\"", "Smart TV 55\"", "Smart TV 65\"", "Android TV Box", "Home Theater System", "Projector HD"],
    brands: ["Samsung", "LG", "Sony", "TCL", "OnePlus", "Mi"],
    gstRate: 18,
    hasSerial: true,
    priceRange: [24999, 249990],
    costRatio: 0.72,
    sellRatio: 0.92,
  },
  "Large Appliances": {
    items: ["Refrigerator 350L", "Washing Machine 8kg", "Air Conditioner 1.5T", "Water Purifier", "Geyser 25L"],
    brands: ["Samsung", "LG", "Whirlpool", "IFB", "Voltas", "AO Smith"],
    gstRate: 18,
    hasSerial: true,
    priceRange: [9999, 89999],
    costRatio: 0.68,
    sellRatio: 0.91,
  },
  "Kitchen Appliances": {
    items: ["Mixer Grinder 750W", "Induction Cooktop", "Electric Kettle 1.8L", "Toaster 2-Slice", "Microwave Oven 28L", "Rice Cooker 1.8L"],
    brands: ["Prestige", "Philips", "Bajaj", "Morphy Richards", "Havells"],
    gstRate: 18,
    hasSerial: false,
    priceRange: [999, 14999],
    costRatio: 0.55,
    sellRatio: 0.88,
  },
  "Home Electronics": {
    items: ["WiFi Router AX3000", "Smart Bulb", "CCTV Camera", "Video Doorbell", "Smart Plug", "Extension Board Spike"],
    brands: ["TP-Link", "Philips", "CP Plus", "Xiaomi", "D-Link", "Havells"],
    gstRate: 18,
    hasSerial: false,
    priceRange: [499, 9999],
    costRatio: 0.5,
    sellRatio: 0.87,
  },
  Gaming: {
    items: ["Gaming Console", "Wireless Controller", "Gaming Headset", "Gaming Mouse", "Mechanical Keyboard", "Gaming Chair"],
    brands: ["Sony", "Microsoft", "Logitech", "Razer", "Corsair", "HyperX"],
    gstRate: 18,
    hasSerial: true,
    priceRange: [2999, 59999],
    costRatio: 0.7,
    sellRatio: 0.92,
  },
};

// ---------------------------------------------------------------------------
// Groceries generation config
// ---------------------------------------------------------------------------

interface GroceryItemConfig {
  name: string;
  brands: string[];
  packSizes: string[];
  gstRate: number;
  hasExpiry: boolean;
  weightUnit: string;
  priceRange: [number, number];
  costRatio: number;
  sellRatio: number;
}

const GROCERY_ITEMS: Record<string, GroceryItemConfig[]> = {
  "Fresh Vegetables": [
    { name: "Fresh Tomato", brands: ["Generic"], packSizes: ["500g", "1kg"], gstRate: 0, hasExpiry: true, weightUnit: "kg", priceRange: [20, 60], costRatio: 0.6, sellRatio: 0.95 },
    { name: "Fresh Onion", brands: ["Generic"], packSizes: ["500g", "1kg", "5kg"], gstRate: 0, hasExpiry: true, weightUnit: "kg", priceRange: [25, 120], costRatio: 0.55, sellRatio: 0.95 },
    { name: "Fresh Potato", brands: ["Generic"], packSizes: ["1kg", "5kg"], gstRate: 0, hasExpiry: true, weightUnit: "kg", priceRange: [30, 100], costRatio: 0.55, sellRatio: 0.95 },
    { name: "Green Capsicum", brands: ["Generic"], packSizes: ["250g", "500g"], gstRate: 0, hasExpiry: true, weightUnit: "kg", priceRange: [30, 100], costRatio: 0.55, sellRatio: 0.92 },
    { name: "Fresh Spinach", brands: ["Generic"], packSizes: ["250g", "500g"], gstRate: 0, hasExpiry: true, weightUnit: "kg", priceRange: [15, 40], costRatio: 0.5, sellRatio: 0.9 },
    { name: "Fresh Carrot", brands: ["Generic"], packSizes: ["500g", "1kg"], gstRate: 0, hasExpiry: true, weightUnit: "kg", priceRange: [25, 70], costRatio: 0.55, sellRatio: 0.93 },
    { name: "Cauliflower", brands: ["Generic"], packSizes: ["1 piece"], gstRate: 0, hasExpiry: true, weightUnit: "pcs", priceRange: [20, 50], costRatio: 0.5, sellRatio: 0.9 },
  ],
  "Fresh Fruits": [
    { name: "Fresh Apple", brands: ["Generic"], packSizes: ["250g", "500g", "1kg"], gstRate: 0, hasExpiry: true, weightUnit: "kg", priceRange: [80, 250], costRatio: 0.6, sellRatio: 0.93 },
    { name: "Fresh Banana", brands: ["Generic"], packSizes: ["6 pcs", "12 pcs"], gstRate: 0, hasExpiry: true, weightUnit: "pcs", priceRange: [30, 60], costRatio: 0.5, sellRatio: 0.92 },
    { name: "Fresh Mango", brands: ["Generic"], packSizes: ["500g", "1kg", "2kg"], gstRate: 0, hasExpiry: true, weightUnit: "kg", priceRange: [100, 400], costRatio: 0.6, sellRatio: 0.9 },
    { name: "Fresh Orange", brands: ["Generic"], packSizes: ["500g", "1kg"], gstRate: 0, hasExpiry: true, weightUnit: "kg", priceRange: [60, 150], costRatio: 0.58, sellRatio: 0.92 },
    { name: "Fresh Grapes", brands: ["Generic"], packSizes: ["500g", "1kg"], gstRate: 0, hasExpiry: true, weightUnit: "kg", priceRange: [80, 180], costRatio: 0.6, sellRatio: 0.92 },
    { name: "Pomegranate", brands: ["Generic"], packSizes: ["2 pcs", "500g"], gstRate: 0, hasExpiry: true, weightUnit: "kg", priceRange: [100, 200], costRatio: 0.55, sellRatio: 0.9 },
    { name: "Fresh Papaya", brands: ["Generic"], packSizes: ["1 piece", "500g"], gstRate: 0, hasExpiry: true, weightUnit: "pcs", priceRange: [40, 90], costRatio: 0.5, sellRatio: 0.9 },
  ],
  "Dairy & Eggs": [
    { name: "Full Cream Milk", brands: ["Amul", "Mother Dairy", "Nestle"], packSizes: ["500ml", "1L"], gstRate: 0, hasExpiry: true, weightUnit: "l", priceRange: [28, 62], costRatio: 0.7, sellRatio: 0.95 },
    { name: "Toned Milk", brands: ["Amul", "Mother Dairy", "Nestle"], packSizes: ["500ml", "1L"], gstRate: 0, hasExpiry: true, weightUnit: "l", priceRange: [24, 50], costRatio: 0.7, sellRatio: 0.95 },
    { name: "Fresh Paneer", brands: ["Amul", "Mother Dairy"], packSizes: ["200g", "500g"], gstRate: 5, hasExpiry: true, weightUnit: "g", priceRange: [80, 200], costRatio: 0.6, sellRatio: 0.92 },
    { name: "Butter 500g", brands: ["Amul", "Mother Dairy", "Nestle"], packSizes: ["100g", "500g"], gstRate: 5, hasExpiry: true, weightUnit: "g", priceRange: [50, 270], costRatio: 0.7, sellRatio: 0.93 },
    { name: "Cheese Slices", brands: ["Amul", "Mother Dairy"], packSizes: ["100g", "200g"], gstRate: 5, hasExpiry: true, weightUnit: "g", priceRange: [60, 140], costRatio: 0.65, sellRatio: 0.92 },
    { name: "Curd/Yogurt", brands: ["Amul", "Mother Dairy", "Nestle"], packSizes: ["400g", "1kg"], gstRate: 0, hasExpiry: true, weightUnit: "g", priceRange: [35, 80], costRatio: 0.65, sellRatio: 0.93 },
    { name: "Egg Tray (6pcs)", brands: ["Generic"], packSizes: ["6 pcs", "12 pcs", "30 pcs"], gstRate: 0, hasExpiry: true, weightUnit: "pcs", priceRange: [42, 180], costRatio: 0.7, sellRatio: 0.94 },
  ],
  "Rice/Grains/Flours": [
    { name: "Basmati Rice", brands: ["India Gate", "Daawat", "Fortune", "Aashirvaad"], packSizes: ["1kg", "5kg"], gstRate: 5, hasExpiry: false, weightUnit: "kg", priceRange: [120, 850], costRatio: 0.65, sellRatio: 0.91 },
    { name: "Sona Masoori Rice", brands: ["Fortune", "BB Royal", "Tata Sampann"], packSizes: ["5kg", "10kg"], gstRate: 5, hasExpiry: false, weightUnit: "kg", priceRange: [280, 650], costRatio: 0.65, sellRatio: 0.9 },
    { name: "Whole Wheat Atta", brands: ["Aashirvaad", "Fortune", "Patanjali", "Nature Fresh"], packSizes: ["5kg", "10kg"], gstRate: 5, hasExpiry: false, weightUnit: "kg", priceRange: [260, 550], costRatio: 0.68, sellRatio: 0.92 },
    { name: "Maida (Refined Flour)", brands: ["Aashirvaad", "Fortune", "Pillsbury"], packSizes: ["500g", "1kg"], gstRate: 5, hasExpiry: false, weightUnit: "kg", priceRange: [40, 80], costRatio: 0.6, sellRatio: 0.9 },
    { name: "Sooji/Rava", brands: ["Aashirvaad", "Fortune", "BB Royal"], packSizes: ["500g", "1kg"], gstRate: 5, hasExpiry: false, weightUnit: "kg", priceRange: [40, 90], costRatio: 0.55, sellRatio: 0.88 },
    { name: "Basmati Broken Rice", brands: ["India Gate", "Daawat", "Fortune"], packSizes: ["5kg", "10kg"], gstRate: 5, hasExpiry: false, weightUnit: "kg", priceRange: [200, 500], costRatio: 0.6, sellRatio: 0.88 },
    { name: "Multigrain Atta", brands: ["Aashirvaad", "Fortune", "Nature Fresh"], packSizes: ["5kg"], gstRate: 5, hasExpiry: false, weightUnit: "kg", priceRange: [300, 400], costRatio: 0.65, sellRatio: 0.9 },
  ],
  "Pulses & Dals": [
    { name: "Toor Dal", brands: ["Tata Sampann", "Fortune", "BB Royal", "Patanjali"], packSizes: ["500g", "1kg", "5kg"], gstRate: 5, hasExpiry: false, weightUnit: "kg", priceRange: [80, 700], costRatio: 0.7, sellRatio: 0.92 },
    { name: "Moong Dal", brands: ["Tata Sampann", "Fortune", "BB Royal"], packSizes: ["500g", "1kg"], gstRate: 5, hasExpiry: false, weightUnit: "kg", priceRange: [70, 200], costRatio: 0.68, sellRatio: 0.9 },
    { name: "Chana Dal", brands: ["Tata Sampann", "Fortune", "BB Royal", "Patanjali"], packSizes: ["500g", "1kg"], gstRate: 5, hasExpiry: false, weightUnit: "kg", priceRange: [60, 160], costRatio: 0.7, sellRatio: 0.9 },
    { name: "Masoor Dal", brands: ["Tata Sampann", "Fortune", "BB Royal"], packSizes: ["500g", "1kg"], gstRate: 5, hasExpiry: false, weightUnit: "kg", priceRange: [65, 170], costRatio: 0.68, sellRatio: 0.9 },
    { name: "Urad Dal", brands: ["Tata Sampann", "Fortune", "BB Royal", "Patanjali"], packSizes: ["500g", "1kg"], gstRate: 5, hasExpiry: false, weightUnit: "kg", priceRange: [80, 200], costRatio: 0.7, sellRatio: 0.9 },
    { name: "Kabuli Chana", brands: ["Tata Sampann", "Fortune", "BB Royal"], packSizes: ["500g", "1kg"], gstRate: 5, hasExpiry: false, weightUnit: "kg", priceRange: [90, 220], costRatio: 0.68, sellRatio: 0.9 },
    { name: "Rajma", brands: ["Tata Sampann", "Fortune", "BB Royal", "Patanjali"], packSizes: ["500g", "1kg"], gstRate: 5, hasExpiry: false, weightUnit: "kg", priceRange: [100, 240], costRatio: 0.68, sellRatio: 0.9 },
  ],
  "Spices & Masalas": [
    { name: "Turmeric Powder", brands: ["Everest", "MDH", "Catch", "Tata Sampann"], packSizes: ["100g", "200g", "500g"], gstRate: 5, hasExpiry: false, weightUnit: "g", priceRange: [30, 200], costRatio: 0.55, sellRatio: 0.88 },
    { name: "Red Chilli Powder", brands: ["Everest", "MDH", "Catch", "Tata Sampann"], packSizes: ["100g", "200g", "500g"], gstRate: 5, hasExpiry: false, weightUnit: "g", priceRange: [40, 250], costRatio: 0.55, sellRatio: 0.88 },
    { name: "Garam Masala", brands: ["Everest", "MDH", "Catch", "Tata Sampann"], packSizes: ["50g", "100g"], gstRate: 5, hasExpiry: false, weightUnit: "g", priceRange: [50, 150], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Cumin Seeds", brands: ["Everest", "MDH", "Catch", "Tata Sampann", "Patanjali"], packSizes: ["100g", "200g"], gstRate: 5, hasExpiry: false, weightUnit: "g", priceRange: [45, 160], costRatio: 0.55, sellRatio: 0.88 },
    { name: "Coriander Powder", brands: ["Everest", "MDH", "Catch", "Tata Sampann"], packSizes: ["100g", "200g", "500g"], gstRate: 5, hasExpiry: false, weightUnit: "g", priceRange: [30, 180], costRatio: 0.55, sellRatio: 0.88 },
    { name: "Sambar Powder", brands: ["MTR", "Everest", "MDH", "Aachi"], packSizes: ["100g", "200g"], gstRate: 5, hasExpiry: false, weightUnit: "g", priceRange: [40, 140], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Black Pepper Whole", brands: ["Everest", "MDH", "Catch", "Tata Sampann"], packSizes: ["50g", "100g"], gstRate: 5, hasExpiry: false, weightUnit: "g", priceRange: [60, 200], costRatio: 0.55, sellRatio: 0.88 },
  ],
  "Oils & Ghee": [
    { name: "Refined Sunflower Oil", brands: ["Fortune", "Saffola", "Gemini", "Nature Fresh"], packSizes: ["1L", "5L"], gstRate: 5, hasExpiry: false, weightUnit: "l", priceRange: [140, 750], costRatio: 0.75, sellRatio: 0.92 },
    { name: "Mustard Oil", brands: ["Fortune", "Patanjali", "Nature Fresh"], packSizes: ["1L", "5L"], gstRate: 5, hasExpiry: false, weightUnit: "l", priceRange: [150, 800], costRatio: 0.72, sellRatio: 0.92 },
    { name: "Cow Ghee", brands: ["Amul", "Mother Dairy", "Patanjali", "Nestle"], packSizes: ["500ml", "1L"], gstRate: 5, hasExpiry: false, weightUnit: "l", priceRange: [280, 600], costRatio: 0.7, sellRatio: 0.92 },
    { name: "Groundnut Oil", brands: ["Fortune", "Saffola", "Nature Fresh"], packSizes: ["1L", "5L"], gstRate: 5, hasExpiry: false, weightUnit: "l", priceRange: [160, 850], costRatio: 0.72, sellRatio: 0.92 },
    { name: "Olive Oil", brands: ["Figaro", "Borges", "Fortune"], packSizes: ["250ml", "500ml"], gstRate: 12, hasExpiry: false, weightUnit: "l", priceRange: [300, 800], costRatio: 0.6, sellRatio: 0.9 },
    { name: "Desi Ghee", brands: ["Amul", "Patanjali", "Nestle", "Mother Dairy"], packSizes: ["1L"], gstRate: 5, hasExpiry: false, weightUnit: "l", priceRange: [500, 650], costRatio: 0.7, sellRatio: 0.92 },
    { name: "Rice Bran Oil", brands: ["Fortune", "Saffola", "Nature Fresh"], packSizes: ["1L", "5L"], gstRate: 5, hasExpiry: false, weightUnit: "l", priceRange: [145, 750], costRatio: 0.72, sellRatio: 0.92 },
  ],
  "Dry Fruits & Nuts": [
    { name: "Almonds California", brands: ["Happilo", "Tata Sampann", "Farmley", "Patanjali"], packSizes: ["200g", "500g", "1kg"], gstRate: 12, hasExpiry: false, weightUnit: "g", priceRange: [200, 1200], costRatio: 0.65, sellRatio: 0.88 },
    { name: "Cashew W240", brands: ["Happilo", "Tata Sampann", "Farmley"], packSizes: ["200g", "500g"], gstRate: 12, hasExpiry: false, weightUnit: "g", priceRange: [250, 650], costRatio: 0.7, sellRatio: 0.88 },
    { name: "Raisins", brands: ["Happilo", "Tata Sampann", "Farmley", "Patanjali"], packSizes: ["200g", "500g"], gstRate: 5, hasExpiry: false, weightUnit: "g", priceRange: [80, 250], costRatio: 0.6, sellRatio: 0.88 },
    { name: "Pistachios", brands: ["Happilo", "Tata Sampann", "Farmley"], packSizes: ["200g", "500g"], gstRate: 12, hasExpiry: false, weightUnit: "g", priceRange: [300, 800], costRatio: 0.68, sellRatio: 0.88 },
    { name: "Walnuts", brands: ["Happilo", "Tata Sampann", "Farmley"], packSizes: ["200g", "500g"], gstRate: 12, hasExpiry: false, weightUnit: "g", priceRange: [200, 550], costRatio: 0.65, sellRatio: 0.88 },
    { name: "Mixed Dry Fruits Gift Box", brands: ["Happilo", "Farmley", "Tata Sampann"], packSizes: ["250g", "500g"], gstRate: 12, hasExpiry: false, weightUnit: "g", priceRange: [350, 900], costRatio: 0.6, sellRatio: 0.85 },
    { name: "Dates Medjool", brands: ["Happilo", "Tata Sampann", "Farmley", "Patanjali"], packSizes: ["250g", "500g"], gstRate: 5, hasExpiry: false, weightUnit: "g", priceRange: [150, 400], costRatio: 0.6, sellRatio: 0.88 },
  ],
  "Snacks & Biscuits": [
    { name: "Potato Chips", brands: ["Lays", "Haldiram", "Balaji", "Uncle Chipps"], packSizes: ["52g", "90g"], gstRate: 12, hasExpiry: true, weightUnit: "g", priceRange: [20, 50], costRatio: 0.5, sellRatio: 0.9 },
    { name: "Namkeen Mix", brands: ["Haldiram", "Bikanervala", "Lehar"], packSizes: ["200g", "400g"], gstRate: 12, hasExpiry: true, weightUnit: "g", priceRange: [60, 150], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Biscuit Assorted", brands: ["Britannia", "Parle", "Sunfeast", "Unibic"], packSizes: ["100g", "250g"], gstRate: 12, hasExpiry: true, weightUnit: "g", priceRange: [20, 80], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Chocolate Bar", brands: ["Cadbury", "Nestle", "Amul", "Ferrero"], packSizes: ["40g", "80g", "150g"], gstRate: 18, hasExpiry: true, weightUnit: "g", priceRange: [20, 180], costRatio: 0.55, sellRatio: 0.92 },
    { name: "Chocolate Gift Box", brands: ["Cadbury", "Ferrero", "Nestle", "Lindt"], packSizes: ["200g", "400g"], gstRate: 18, hasExpiry: true, weightUnit: "g", priceRange: [250, 800], costRatio: 0.5, sellRatio: 0.85 },
    { name: "Candy Pack", brands: ["Cadbury", "Nestle", "Parle", "Haldiram"], packSizes: ["100g", "200g"], gstRate: 12, hasExpiry: true, weightUnit: "g", priceRange: [40, 120], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Khakhra/Gathiya", brands: ["Haldiram", "Bikanervala", "Balaji"], packSizes: ["200g", "400g"], gstRate: 5, hasExpiry: true, weightUnit: "g", priceRange: [50, 120], costRatio: 0.5, sellRatio: 0.88 },
  ],
  Beverages: [
    { name: "Tea Dust", brands: ["Tata Tea", "Brooke Bond", "Wagh Bakri", "Society"], packSizes: ["250g", "500g", "1kg"], gstRate: 5, hasExpiry: false, weightUnit: "g", priceRange: [120, 600], costRatio: 0.62, sellRatio: 0.9 },
    { name: "Instant Coffee", brands: ["Nescafe", "BRU", "Tata Coffee"], packSizes: ["50g", "100g", "200g"], gstRate: 18, hasExpiry: false, weightUnit: "g", priceRange: [120, 600], costRatio: 0.6, sellRatio: 0.9 },
    { name: "Green Tea Bags", brands: ["Tata Tea", "Lipton", "Organic India", "Himalaya"], packSizes: ["25 bags", "50 bags"], gstRate: 5, hasExpiry: false, weightUnit: "pcs", priceRange: [100, 350], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Fruit Juice 1L", brands: ["Real", "Tropicana", "Paper Boat", "Minute Maid"], packSizes: ["200ml", "1L"], gstRate: 12, hasExpiry: true, weightUnit: "l", priceRange: [25, 130], costRatio: 0.55, sellRatio: 0.9 },
    { name: "Soft Drink Can", brands: ["Coca-Cola", "Pepsi", "Sprite", "Thums Up"], packSizes: ["300ml", "600ml", "2L"], gstRate: 18, hasExpiry: true, weightUnit: "l", priceRange: [25, 100], costRatio: 0.45, sellRatio: 0.9 },
    { name: "Energy Drink", brands: ["Red Bull", "Monster", "Gatorade"], packSizes: ["250ml", "500ml"], gstRate: 18, hasExpiry: true, weightUnit: "l", priceRange: [100, 200], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Packaged Water Bottle", brands: ["Bisleri", "Kinley", "Aquafina", "Himalayan"], packSizes: ["1L", "2L", "20L"], gstRate: 18, hasExpiry: true, weightUnit: "l", priceRange: [20, 100], costRatio: 0.4, sellRatio: 0.85 },
  ],
  "Frozen Foods": [
    { name: "Frozen Green Peas", brands: ["Safal", "MTR", "ITC"], packSizes: ["300g", "500g"], gstRate: 5, hasExpiry: true, weightUnit: "g", priceRange: [40, 100], costRatio: 0.55, sellRatio: 0.9 },
    { name: "Frozen French Fries", brands: ["McCain", "ITC", "Safal"], packSizes: ["400g", "750g"], gstRate: 12, hasExpiry: true, weightUnit: "g", priceRange: [80, 180], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Ice Cream Tub", brands: ["Amul", "Mother Dairy", "Havmor", "Kwality"], packSizes: ["500ml", "1L"], gstRate: 18, hasExpiry: true, weightUnit: "l", priceRange: [150, 350], costRatio: 0.55, sellRatio: 0.88 },
    { name: "Frozen Paratha", brands: ["MTR", "ID", "Safal"], packSizes: ["10 pcs", "20 pcs"], gstRate: 12, hasExpiry: true, weightUnit: "pcs", priceRange: [120, 250], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Frozen Chicken Nuggets", brands: ["Venky's", "Suguna", "Safal"], packSizes: ["250g", "500g"], gstRate: 12, hasExpiry: true, weightUnit: "g", priceRange: [130, 280], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Frozen Pizza", brands: ["Dr. Oetker", "Domino's", "McCain"], packSizes: ["300g"], gstRate: 12, hasExpiry: true, weightUnit: "g", priceRange: [150, 280], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Frozen Mixed Vegetables", brands: ["Safal", "MTR", "ITC"], packSizes: ["400g", "1kg"], gstRate: 5, hasExpiry: true, weightUnit: "g", priceRange: [60, 150], costRatio: 0.55, sellRatio: 0.9 },
  ],
  Bakery: [
    { name: "White Bread", brands: ["Britannia", "Modern Bread", "Harvest Gold"], packSizes: ["400g"], gstRate: 0, hasExpiry: true, weightUnit: "g", priceRange: [35, 55], costRatio: 0.55, sellRatio: 0.92 },
    { name: "Brown Bread", brands: ["Britannia", "Modern Bread", "Harvest Gold", "English Oven"], packSizes: ["400g"], gstRate: 0, hasExpiry: true, weightUnit: "g", priceRange: [40, 65], costRatio: 0.55, sellRatio: 0.92 },
    { name: "Cake Slice", brands: ["Britannia", "Monginis", "Ribbons & Balloons"], packSizes: ["50g", "100g", "300g"], gstRate: 12, hasExpiry: true, weightUnit: "g", priceRange: [25, 180], costRatio: 0.45, sellRatio: 0.88 },
    { name: "Buns/Pav", brands: ["Britannia", "Harvest Gold", "Modern Bread"], packSizes: ["6 pcs"], gstRate: 0, hasExpiry: true, weightUnit: "pcs", priceRange: [25, 45], costRatio: 0.5, sellRatio: 0.9 },
    { name: "Rusk", brands: ["Britannia", "Parle", "Sunfeast"], packSizes: ["200g", "400g"], gstRate: 5, hasExpiry: true, weightUnit: "g", priceRange: [40, 90], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Cookies", brands: ["Britannia", "Parle", "Unibic", "Sunfeast", "Anmol"], packSizes: ["100g", "200g"], gstRate: 12, hasExpiry: true, weightUnit: "g", priceRange: [30, 100], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Croissant", brands: ["Britannia", "Modern Bread", "Harvest Gold"], packSizes: ["50g", "100g"], gstRate: 12, hasExpiry: true, weightUnit: "g", priceRange: [35, 80], costRatio: 0.45, sellRatio: 0.85 },
  ],
  "Personal Care": [
    { name: "Toothpaste 200g", brands: ["Colgate", "Dabur", "Patanjali", "Sensodyne", "Closeup"], packSizes: ["100g", "200g"], gstRate: 18, hasExpiry: true, weightUnit: "g", priceRange: [60, 180], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Toothbrush", brands: ["Colgate", "Oral-B", "Sensodyne", "Dabur"], packSizes: ["1 pc", "3 pcs"], gstRate: 12, hasExpiry: false, weightUnit: "pcs", priceRange: [25, 120], costRatio: 0.4, sellRatio: 0.85 },
    { name: "Bathing Soap", brands: ["Dove", "Pears", "Lux", "Cinthol", "Medimix", "Mysore Sandal"], packSizes: ["75g", "125g", "3 pcs"], gstRate: 18, hasExpiry: true, weightUnit: "g", priceRange: [30, 120], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Shampoo", brands: ["Clinic Plus", "Head & Shoulders", "Dove", "Sunsilk", "Pantene", "L'Oreal"], packSizes: ["200ml", "400ml"], gstRate: 18, hasExpiry: true, weightUnit: "ml", priceRange: [90, 350], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Face Wash", brands: ["Himalaya", "Patanjali", "Nivea", "Clean & Clear", "Garnier", "Biotique"], packSizes: ["50ml", "100ml"], gstRate: 18, hasExpiry: true, weightUnit: "ml", priceRange: [80, 250], costRatio: 0.45, sellRatio: 0.85 },
    { name: "Hair Oil", brands: ["Dabur Amla", "Parachute", "Bajaj Almond", "Indulekha", "Navratna"], packSizes: ["100ml", "200ml", "500ml"], gstRate: 18, hasExpiry: true, weightUnit: "ml", priceRange: [50, 300], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Hand Sanitizer", brands: ["Lifebuoy", "Dettol", "Savlon", "Patanjali"], packSizes: ["100ml", "500ml"], gstRate: 18, hasExpiry: true, weightUnit: "ml", priceRange: [40, 250], costRatio: 0.45, sellRatio: 0.85 },
  ],
  Cleaning: [
    { name: "Detergent Powder", brands: ["Surf Excel", "Tide", "Rin", "Ariel", "Nirma", "Wheel"], packSizes: ["500g", "1kg", "2kg"], gstRate: 18, hasExpiry: false, weightUnit: "kg", priceRange: [60, 350], costRatio: 0.55, sellRatio: 0.9 },
    { name: "Floor Cleaner", brands: ["Lizol", "Harpic", "Mr. Muscle", "Domex"], packSizes: ["500ml", "1L"], gstRate: 18, hasExpiry: false, weightUnit: "ml", priceRange: [80, 250], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Dishwashing Liquid", brands: ["Vim", "Patanjali", "Pril", "Exo"], packSizes: ["250ml", "750ml"], gstRate: 18, hasExpiry: false, weightUnit: "ml", priceRange: [60, 220], costRatio: 0.45, sellRatio: 0.88 },
    { name: "Toilet Cleaner", brands: ["Harpic", "Domex", "Mr. Muscle", "Lizol"], packSizes: ["500ml", "1L"], gstRate: 18, hasExpiry: false, weightUnit: "ml", priceRange: [80, 200], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Glass Cleaner", brands: ["Colin", "Mr. Muscle", "Harpic", "Lizol"], packSizes: ["500ml", "1L"], gstRate: 18, hasExpiry: false, weightUnit: "ml", priceRange: [80, 200], costRatio: 0.45, sellRatio: 0.85 },
    { name: "Scrub Pad/Sponge", brands: ["Scotch-Brite", "Gala", "Magic"], packSizes: ["1 pc", "3 pcs", "5 pcs"], gstRate: 12, hasExpiry: false, weightUnit: "pcs", priceRange: [15, 80], costRatio: 0.4, sellRatio: 0.85 },
    { name: "Room Freshener", brands: ["Odonil", "Air Wick", "Godrej Aer", "Ambi Pur"], packSizes: ["200ml", "350ml"], gstRate: 18, hasExpiry: false, weightUnit: "ml", priceRange: [80, 250], costRatio: 0.45, sellRatio: 0.85 },
  ],
  "Ready-to-Eat": [
    { name: "Instant Noodles", brands: ["Maggi", "Top Ramen", "Ching's", "Yippee"], packSizes: ["70g", "140g", "280g"], gstRate: 12, hasExpiry: true, weightUnit: "g", priceRange: [15, 60], costRatio: 0.45, sellRatio: 0.88 },
    { name: "Ready Poha", brands: ["MTR", "Gits", "Haldiram"], packSizes: ["60g", "120g"], gstRate: 5, hasExpiry: true, weightUnit: "g", priceRange: [20, 50], costRatio: 0.45, sellRatio: 0.88 },
    { name: "Ready Upma Mix", brands: ["MTR", "Gits", "Aashirvaad"], packSizes: ["100g", "200g"], gstRate: 5, hasExpiry: true, weightUnit: "g", priceRange: [30, 80], costRatio: 0.45, sellRatio: 0.88 },
    { name: "Ready Biryani Kit", brands: ["MTR", "ITC", "Haldiram"], packSizes: ["200g", "400g"], gstRate: 12, hasExpiry: true, weightUnit: "g", priceRange: [100, 250], costRatio: 0.5, sellRatio: 0.88 },
    { name: "Soup Sachet", brands: ["Knorr", "Maggi", "Haldiram", "MTR"], packSizes: ["20g", "50g"], gstRate: 12, hasExpiry: true, weightUnit: "g", priceRange: [20, 60], costRatio: 0.4, sellRatio: 0.88 },
    { name: "Instant Idli Mix", brands: ["MTR", "Gits", "Aashirvaad"], packSizes: ["200g", "500g"], gstRate: 5, hasExpiry: true, weightUnit: "g", priceRange: [40, 100], costRatio: 0.45, sellRatio: 0.88 },
    { name: "RTE Meal Box", brands: ["MTR", "ITC", "Haldiram", "Gits"], packSizes: ["250g", "500g"], gstRate: 12, hasExpiry: true, weightUnit: "g", priceRange: [80, 200], costRatio: 0.5, sellRatio: 0.88 },
  ],
};

// ---------------------------------------------------------------------------
// Customer data
// ---------------------------------------------------------------------------

const CUSTOMER_FIRSTS = [
  "Amit", "Priya", "Rajesh", "Sneha", "Vikram", "Deepa", "Karan", "Anjali",
  "Sanjay", "Meena", "Rahul", "Pooja", "Nikhil", "Divya", "Arjun", "Kavya",
  "Rohit", "Shreya", "Aditya", "Nandini", "Siddharth", "Lakshmi", "Vivek",
  "Radhika", "Akshay", "Manisha", "Harsh", "Ishita", "Gaurav", "Richa",
];

const CUSTOMER_LASTS = [
  "Sharma", "Patel", "Kumar", "Mehta", "Singh", "Reddy", "Verma", "Nair",
  "Joshi", "Das", "Gupta", "Agarwal", "Rao", "Iyer", "Pillai", "Malhotra",
  "Chopra", "Bhatt", "Desai", "Jain", "Menon", "Choudhary", "Thakur", "Yadav",
  "Mishra", "Sinha", "Pandey", "Nayak", "Dutta", "Chatterjee",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seededRandom(42);

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function getGstRateForClothing(mrp: number): number {
  return mrp < 1000 ? 5 : 12;
}

function getPriceByTier(tier: string): number {
  switch (tier) {
    case "budget": return randomInt(200, 499);
    case "standard": return randomInt(500, 1500);
    case "premium": return randomInt(1500, 4000);
    default: return randomInt(500, 1500);
  }
}

function formatSku(catPrefix: string, subcatAbbrev: string, num: number): string {
  return `${catPrefix}-${subcatAbbrev}-${String(num).padStart(4, "0")}`;
}

function getSubcatAbbrev(name: string): string {
  return name
    .split(/[\s&]+/)
    .map((w) => w.charAt(0).toUpperCase())
    .join("")
    .slice(0, 4);
}

function parsePackSizeToWeight(packSize: string): { weight: number; weightUnit: string } | null {
  const cleaned = packSize.replace("pcs", "").trim();
  if (packSize.includes("pcs") || packSize.includes("piece") || packSize.includes("bags")) {
    return null;
  }
  const match = cleaned.match(/^([\d.]+)\s*(g|kg|ml|l)$/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === "g") return { weight: val / 1000, weightUnit: "kg" };
    if (unit === "ml") return { weight: val / 1000, weightUnit: "l" };
    return { weight: val, weightUnit: unit };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main seeder
// ---------------------------------------------------------------------------

async function main() {
  console.log("\n=== Ezvento Stress Test Seed ===\n");
  console.log(`Tenant: ${SUBDOMAIN}`);
  console.log(`Email: ${EMAIL}\n`);

  // 1. Create Supabase Auth user via Admin API
  console.log("[1/15] Creating Auth user...");
  const supabase = getSupabaseAdmin();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { store_name: "Superstore" },
  });

  if (authError && !authError.message.includes("already registered")) {
    console.error("  Failed to create auth user:", authError.message);
  }

  const { data: { users } } = await supabase.auth.admin.listUsers();
  const authUser = users.find((u: { email?: string }) => u.email === EMAIL);
  const authUserId = authUser?.id || authData?.user?.id;

  if (!authUserId) {
    console.error("  Could not find or create auth user");
    process.exit(1);
  }
  console.log(`  Auth user: ${authUserId}`);

  // 2. Create tenant
  console.log("[2/15] Creating tenant...");
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: SUBDOMAIN },
    update: {},
    create: {
      name: "Superstore India",
      subdomain: SUBDOMAIN,
      email: EMAIL,
      phone: "+919999999999",
      address: "42 MG Road, Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      plan: TenantPlan.PRO,
    },
  });
  console.log(`  Tenant: ${tenant.id}`);

  // 3. Create DB user linked to auth
  console.log("[3/15] Creating DB user...");
  const passwordHash = await hash(PASSWORD, 10);
  const dbUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: EMAIL } },
    update: {},
    create: {
      id: authUserId,
      email: EMAIL,
      passwordHash,
      firstName: "Superstore",
      lastName: "Admin",
      tenantId: tenant.id,
      isOwner: true,
      emailVerified: true,
    },
  });
  console.log(`  DB User: ${dbUser.id}`);

  // 4. Create three stores
  console.log("[4/15] Creating stores & locations...");

  const storeConfigs = [
    {
      name: "Metro Central Mall",
      code: "SS-BIG",
      locationConfigs: [
        { name: "Counter A", type: LocationType.COUNTER },
        { name: "Counter B", type: LocationType.COUNTER },
        { name: "Counter C", type: LocationType.COUNTER },
        { name: "Counter D", type: LocationType.COUNTER },
        { name: "Main Warehouse", type: LocationType.WAREHOUSE },
        { name: "Showroom Floor", type: LocationType.SHOWROOM },
      ],
    },
    {
      name: "City Plaza",
      code: "SS-MED",
      locationConfigs: [
        { name: "Counter 1", type: LocationType.COUNTER },
        { name: "Counter 2", type: LocationType.COUNTER },
        { name: "Counter 3", type: LocationType.COUNTER },
        { name: "Warehouse", type: LocationType.WAREHOUSE },
        { name: "Showroom", type: LocationType.SHOWROOM },
      ],
    },
    {
      name: "Neighborhood Mart",
      code: "SS-SML",
      locationConfigs: [
        { name: "Billing Counter 1", type: LocationType.COUNTER },
        { name: "Billing Counter 2", type: LocationType.COUNTER },
        { name: "Store Warehouse", type: LocationType.WAREHOUSE },
        { name: "Display Rack", type: LocationType.RACK },
      ],
    },
  ];

  const storeMap: Record<string, { id: string; name: string; counters: string[]; allLocations: Record<string, string> }> = {};
  const allStoreIds: string[] = [];

  for (const cfg of storeConfigs) {
    // Re-runnable: find existing store, or create with locations
    let store = await prisma.store.findFirst({
      where: { tenantId: tenant.id, code: cfg.code },
      include: { locations: true },
    });

    if (!store) {
      store = await prisma.store.create({
        data: {
          tenantId: tenant.id,
          name: cfg.name,
          code: cfg.code,
          storeType: StoreType.MULTI_CATEGORY,
          phone: "+919999999999",
          address: "MG Road, Bengaluru",
          state: "Karnataka",
          pincode: "560001",
          locations: {
            create: cfg.locationConfigs.map((loc) => ({
              name: loc.name,
              type: loc.type,
            })),
          },
        },
        include: { locations: true },
      });
    }

    const counters = store.locations
      .filter((l) => l.type === LocationType.COUNTER)
      .map((l) => l.id);

    const allLocations: Record<string, string> = {};
    for (const loc of store.locations) {
      allLocations[loc.type] = loc.id;
    }

    const key = cfg === storeConfigs[0] ? "big" : cfg === storeConfigs[1] ? "medium" : "small";
    storeMap[key] = { id: store.id, name: store.name, counters, allLocations };
    allStoreIds.push(store.id);

    console.log(`  ${key.toUpperCase()}: ${store.name} (${store.id}) — ${store.locations.length} locations`);
  }

  // 5. UserStoreAccess
  console.log("[5/15] Creating UserStoreAccess...");
  let firstStore = true;
  for (const storeId of allStoreIds) {
    await prisma.userStoreAccess.upsert({
      where: { userId_storeId: { userId: dbUser.id, storeId } },
      update: {},
      create: {
        userId: dbUser.id,
        storeId,
        isDefault: firstStore,
      },
    });
    firstStore = false;
  }
  console.log(`  ${allStoreIds.length} access records`);

  // 6. Categories (3-tier hierarchy)
  console.log("[6/15] Creating categories...");
  const categoryMap: Record<string, Record<string, string>> = {};

  for (const [parentName, subcatNames] of Object.entries(CATEGORY_HIERARCHY)) {
    // Parent categories: can't use compound unique with null parentId in upsert
    let parentCat = await prisma.category.findFirst({
      where: { tenantId: tenant.id, parentId: null, name: parentName },
    });
    if (!parentCat) {
      parentCat = await prisma.category.create({
        data: {
          tenantId: tenant.id,
          name: parentName,
          isActive: true,
        },
      });
    }

    categoryMap[parentName] = {};

    for (const subcatName of subcatNames) {
      const subcat = await prisma.category.upsert({
        where: {
          tenantId_parentId_name: {
            tenantId: tenant.id,
            parentId: parentCat.id,
            name: subcatName,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          parentId: parentCat.id,
          name: subcatName,
          isActive: true,
        },
      });
      categoryMap[parentName][subcatName] = subcat.id;
    }
  }

  const totalCats = Object.values(categoryMap).reduce((sum, m) => sum + Object.keys(m).length, 0);
  console.log(`  3 parent + ${totalCats} subcategories = ${totalCats + 3} categories`);

  // 7. Generate products
  console.log("[7/15] Generating products...");
  const allProductIds: Record<string, string[]> = { clothing: [], electronics: [], groceries: [] };

  // --- CLOTHING ---
  console.log("  Generating clothing products...");
  let clothingSkuCounter = 1;

  for (const [subcatName, itemConfigs] of Object.entries(CLOTHING_ITEMS)) {
    const categoryId = categoryMap["Clothing"][subcatName];
    const subcatAbbrev = getSubcatAbbrev(subcatName);

    for (const itemCfg of itemConfigs) {
      const selectedBrands = itemCfg.brands.length > 5 ? pickRandom(itemCfg.brands, 5) : itemCfg.brands;

      for (const brand of selectedBrands) {
        const size = itemCfg.sizes[randomInt(0, itemCfg.sizes.length - 1)];
        const tier = itemCfg.priceTiers[randomInt(0, itemCfg.priceTiers.length - 1)];
        const mrp = getPriceByTier(tier);
        const gstRate = getGstRateForClothing(mrp);
        const costPrice = Math.round(mrp * (tier === "premium" ? 0.4 : tier === "standard" ? 0.45 : 0.5));
        const sellingPrice = Math.round(mrp * 0.9);
        const sku = formatSku("CL", subcatAbbrev, clothingSkuCounter);

        const product = await prisma.product.upsert({
          where: { tenantId_sku: { tenantId: tenant.id, sku } },
          update: {},
          create: {
            tenantId: tenant.id,
            categoryId,
            sku,
            name: `${brand} ${itemCfg.name} - ${size}`,
            brand,
            mrp,
            costPrice,
            sellingPrice,
            gstRate,
            productType: "STANDARD",
            hasVariants: false,
            hasSerialNumber: false,
            hasBatchNumber: false,
            hasExpiry: false,
            hsnCode: size.includes("Free Size") ? "6204" : "6205",
            isActive: true,
          },
        });

        allProductIds.clothing.push(product.id);
        clothingSkuCounter++;
      }
    }
  }
  console.log(`    ${allProductIds.clothing.length} clothing products`);

  // --- ELECTRONICS ---
  console.log("  Generating electronics products...");
  let elecSkuCounter = 1;

  for (const [subcatName, config] of Object.entries(ELECTRONICS_CONFIG)) {
    const categoryId = categoryMap["Electronics"][subcatName];
    const subcatAbbrev = getSubcatAbbrev(subcatName);

    for (const itemName of config.items) {
      const selectedBrands = config.brands.length > 4 ? pickRandom(config.brands, 4) : config.brands;

      for (const brand of selectedBrands) {
        const mrp = randomInt(config.priceRange[0], config.priceRange[1]);
        // 28% GST for phones >25000 and TVs >50000
        let gstRate = config.gstRate;
        if (
          (subcatName === "Mobile Phones" && mrp > 25000) ||
          (subcatName === "TVs & Entertainment" && mrp > 50000)
        ) {
          gstRate = 28;
        }
        const costPrice = Math.round(mrp * config.costRatio);
        const sellingPrice = Math.round(mrp * config.sellRatio);
        const sku = formatSku("EL", subcatAbbrev, elecSkuCounter);

        const product = await prisma.product.upsert({
          where: { tenantId_sku: { tenantId: tenant.id, sku } },
          update: {},
          create: {
            tenantId: tenant.id,
            categoryId,
            sku,
            name: `${brand} ${itemName}`,
            brand,
            mrp,
            costPrice,
            sellingPrice,
            gstRate,
            productType: "STANDARD",
            hasVariants: false,
            hasSerialNumber: config.hasSerial,
            hasBatchNumber: false,
            hasExpiry: false,
            hsnCode: subcatName.includes("Mobile") ? "8517" : subcatName.includes("TV") ? "8528" : "8471",
            isActive: true,
          },
        });

        allProductIds.electronics.push(product.id);
        elecSkuCounter++;
      }
    }
  }
  console.log(`    ${allProductIds.electronics.length} electronics products`);

  // --- GROCERIES ---
  console.log("  Generating grocery products...");
  let grocerySkuCounter = 1;

  for (const [subcatName, itemConfigs] of Object.entries(GROCERY_ITEMS)) {
    const categoryId = categoryMap["Groceries"][subcatName];
    const subcatAbbrev = getSubcatAbbrev(subcatName);

    for (const itemCfg of itemConfigs) {
      // Limit to 1 or 2 brands to keep total ~320 across 15 subcategories
      const maxBrands = itemCfg.brands.length === 1 ? 1 : 2;
      const selectedBrands =
        itemCfg.brands.length <= maxBrands
          ? itemCfg.brands
          : pickRandom(itemCfg.brands, maxBrands);

      for (const brand of selectedBrands) {
        for (const packSize of itemCfg.packSizes) {
          const mrp = randomInt(itemCfg.priceRange[0], itemCfg.priceRange[1]);
          const costPrice = Math.round(mrp * itemCfg.costRatio);
          const sellingPrice = Math.round(mrp * itemCfg.sellRatio);
          const sku = formatSku("GR", subcatAbbrev, grocerySkuCounter);

          const weightInfo = parsePackSizeToWeight(packSize);

          const product = await prisma.product.upsert({
            where: { tenantId_sku: { tenantId: tenant.id, sku } },
            update: {},
            create: {
              tenantId: tenant.id,
              categoryId,
              sku,
              name: `${brand} ${itemCfg.name} ${packSize}`,
              brand,
              mrp,
              costPrice,
              sellingPrice,
              gstRate: itemCfg.gstRate,
              productType: "STANDARD",
              hasVariants: false,
              hasSerialNumber: false,
              hasBatchNumber: false,
              hasExpiry: itemCfg.hasExpiry,
              weight: weightInfo?.weight ?? null,
              weightUnit: weightInfo?.weightUnit ?? null,
              hsnCode: subcatName.includes("Vegetable") || subcatName.includes("Fruit") ? "0702" : "2106",
              isActive: true,
            },
          });

          allProductIds.groceries.push(product.id);
          grocerySkuCounter++;
        }
      }
    }
  }
  console.log(`    ${allProductIds.groceries.length} grocery products`);

  const totalProducts =
    allProductIds.clothing.length + allProductIds.electronics.length + allProductIds.groceries.length;
  console.log(`  Total products: ${totalProducts}`);

  // 8. Seed inventory across stores
  console.log("[8/15] Seeding inventory...");
  let inventoryCount = 0;

  // Helper: find or create stock without variantId (avoids FK constraint)
  async function seedStock(productId: string, storeId: string, locationId: string, qty: number) {
    const existing = await prisma.inventoryStock.findFirst({
      where: { productId, storeId, locationId },
    });
    if (existing) return;
    await prisma.inventoryStock.create({
      data: { productId, storeId, locationId, quantity: qty },
    });
  }

  // Big store: all 4 counters + warehouse
  const bigCounters = storeMap.big.counters; // 4 counters
  const bigWarehouse = storeMap.big.allLocations["WAREHOUSE"];

  // Medium store: all 3 counters + warehouse
  const mediumCounters = storeMap.medium.counters; // 3 counters
  const mediumWarehouse = storeMap.medium.allLocations["WAREHOUSE"];

  // Small store: all 2 counters + warehouse
  const smallCounters = storeMap.small.counters; // 2 counters
  const smallWarehouse = storeMap.small.allLocations["WAREHOUSE"];

  const allProducts = [
    ...allProductIds.clothing,
    ...allProductIds.electronics,
    ...allProductIds.groceries,
  ];

  for (const productId of allProducts) {
    // Big store — pick 2 of 4 counters randomly + warehouse
    const bigSelected = pickRandom(bigCounters, 2);
    for (const locId of bigSelected) {
      await seedStock(productId, storeMap.big.id, locId, randomInt(50, 200));
      inventoryCount++;
    }
    // Big warehouse
    await seedStock(productId, storeMap.big.id, bigWarehouse, randomInt(100, 500));
    inventoryCount++;

    // Medium store — pick 2 of 3 counters randomly + warehouse
    const medSelected = pickRandom(mediumCounters, 2);
    for (const locId of medSelected) {
      await seedStock(productId, storeMap.medium.id, locId, randomInt(50, 200));
      inventoryCount++;
    }
    // Medium warehouse
    await seedStock(productId, storeMap.medium.id, mediumWarehouse, randomInt(100, 500));
    inventoryCount++;

    // Small store — pick 1 of 2 counters randomly + warehouse
    const smlSelected = pickRandom(smallCounters, 1);
    for (const locId of smlSelected) {
      await seedStock(productId, storeMap.small.id, locId, randomInt(50, 200));
      inventoryCount++;
    }
    // Small warehouse
    await seedStock(productId, storeMap.small.id, smallWarehouse, randomInt(100, 500));
    inventoryCount++;
  }
  console.log(`  ${inventoryCount} inventory records`);

  // 9. Create Owner persona
  console.log("[9/15] Creating Owner persona...");

  const persona = await prisma.persona.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "Owner/Admin" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Owner/Admin",
      description: "Full access to all modules",
      isSystem: true,
    },
  });

  // Owner gets all permissions
  const allPermissionModules: PermissionModule[] = [
    "STORE_VIEW",
    "STORE_EDIT",
    "USER_VIEW",
    "USER_CREATE",
    "USER_EDIT",
    "USER_DELETE",
    "PRODUCT_VIEW",
    "PRODUCT_CREATE",
    "PRODUCT_EDIT",
    "PRODUCT_DELETE",
    "INVENTORY_VIEW",
    "INVENTORY_EDIT",
    "INVENTORY_ADJUST",
    "BILLING_VIEW",
    "BILLING_CREATE",
    "BILLING_EDIT",
    "BILLING_DELETE",
    "BILLING_RETURN",
    "PURCHASE_VIEW",
    "PURCHASE_CREATE",
    "PURCHASE_EDIT",
    "CUSTOMER_VIEW",
    "CUSTOMER_CREATE",
    "CUSTOMER_EDIT",
    "CUSTOMER_DELETE",
    "VENDOR_VIEW",
    "VENDOR_CREATE",
    "VENDOR_EDIT",
    "VENDOR_DELETE",
    "REPORT_VIEW",
    "REPORT_EXPORT",
    "SETTINGS_VIEW",
    "SETTINGS_EDIT",
    "TABLE_MANAGE",
    "KOT_VIEW",
    "KOT_EDIT",
    "BOM_VIEW",
    "BOM_EDIT",
    "PRICE_OVERRIDE",
    "DISCOUNT_GLOBAL",
  ];

  let permCount = 0;
  for (const mod of allPermissionModules) {
    try {
      await prisma.personaPermission.upsert({
        where: {
          personaId_module_action: {
            personaId: persona.id,
            module: mod,
            action: "VIEW",
          },
        },
        update: {},
        create: {
          personaId: persona.id,
          module: mod,
          action: "VIEW",
        },
      });
      permCount++;
    } catch {
      // ignore duplicates
    }
  }
  console.log(`  ${permCount} permissions for Owner persona`);

  // Assign persona to user
  const existingPersona = await prisma.userPersona.findFirst({
    where: { userId: dbUser.id, personaId: persona.id, storeId: null },
  });
  if (!existingPersona) {
    await prisma.userPersona.create({
      data: {
        userId: dbUser.id,
        personaId: persona.id,
      },
    });
  }
  console.log("  Owner persona assigned");

  // 10. TenantSettings
  console.log("[10/15] Creating TenantSettings...");
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      defaultLanguage: "en",
      currency: "INR",
      fiscalYearStart: 4,
      lowStockAlertDays: 7,
      expiryAlertDays: 7,
      invoicePrefix: "INV",
      decimalPlaces: 2,
      roundOffEnabled: true,
      creditLimitMode: "SOFT",
      loyaltyEnabled: true,
      pointsPerRupee: 1,
      rupeePerPoint: 0.25,
      minimumRedemption: 100,
      pointsExpiryDays: 365,
      emailNotificationsEnabled: true,
      invoiceAutoSend: true,
      lowStockEmailAlerts: true,
      paymentReminderFrequency: "WEEKLY",
      shiftSummaryEmail: false,
    },
  });
  console.log("  Tenant settings created");

  // 11. Subscription (trial)
  console.log("[11/15] Creating trial subscription...");
  await prisma.subscription.upsert({
    where: { id: `${SUBDOMAIN}-sub` },
    update: {},
    create: {
      id: `${SUBDOMAIN}-sub`,
      tenantId: tenant.id,
      plan: TenantPlan.PRO,
      status: "TRIALING",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("  Trial subscription active");

  // 12. Store payment configs
  console.log("[12/15] Creating store payment configs...");
  for (const [key, store] of Object.entries(storeMap)) {
    await prisma.storePaymentConfig.upsert({
      where: { storeId: store.id },
      update: {},
      create: {
        storeId: store.id,
        merchantVPA: `superstore-${key}@upi`,
        merchantName: `Superstore ${store.name}`,
        phonepeEnabled: true,
        cashEnabled: true,
        cardEnabled: key === "big",
        upiQrEnabled: true,
        autoSendReceipt: true,
      },
    });
  }
  console.log(`  ${Object.keys(storeMap).length} payment configs`);

  // 13. Create vendors
  console.log("[13/15] Creating vendors...");
  const vendorData = [
    { name: "Samsung India", phone: "+918044123456", email: "orders@samsung-india.in", gstin: "29AAACS1234B1Z0", creditPeriodDays: 30 },
    { name: "Aditya Birla Fashion", phone: "+918022987654", email: "wholesale@abfrl.in", gstin: "27AABCA5678C1Z1", creditPeriodDays: 45 },
    { name: "ITC Distribution", phone: "+913344556677", email: "b2b@itc.in", gstin: "19AAACI9012D1Z2", creditPeriodDays: 15 },
    { name: "Metro Cash & Carry", phone: "+918044334455", email: "blr@metro.co.in", gstin: "29AAACM3456E1Z3", creditPeriodDays: 7 },
    { name: "Procter & Gamble", phone: "+912266778899", email: "distributor@pg-india.com", gstin: "27AAECP7890F1Z4", creditPeriodDays: 30 },
  ];

  for (const v of vendorData) {
    await prisma.vendor.upsert({
      where: { tenantId_gstin: { tenantId: tenant.id, gstin: v.gstin } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: v.name,
        phone: v.phone,
        email: v.email,
        gstin: v.gstin,
        address: "Bengaluru, Karnataka",
        state: "Karnataka",
        creditPeriodDays: v.creditPeriodDays,
        isActive: true,
      },
    });
  }
  console.log(`  ${vendorData.length} vendors`);

  // 14. Create customers
  console.log("[14/15] Creating customers...");
  const cities = ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belagavi"];

  for (let i = 0; i < 30; i++) {
    const custStoreId = allStoreIds[i % allStoreIds.length];
    const first = CUSTOMER_FIRSTS[i];
    const last = CUSTOMER_LASTS[i];
    const phone = `+9190${String(i + 1).padStart(2, "0")}${String(randomInt(100000, 999999))}`;

    await prisma.customer.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone } },
      update: {},
      create: {
        tenantId: tenant.id,
        storeId: custStoreId,
        customerType: i < 3 ? "WHOLESALE" : "RETAIL",
        firstName: first,
        lastName: last,
        phone,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@email.com`,
        city: cities[i % cities.length],
        state: "Karnataka",
        creditLimit: i < 3 ? 50000 : 10000,
        creditBalance: 0,
        loyaltyPoints: randomInt(0, 500),
        isActive: true,
      },
    });
  }
  console.log("  30 customers");

  // 15. Activity log
  console.log("[15/15] Creating seed activity log...");
  await prisma.activityLog.create({
    data: {
      tenantId: tenant.id,
      userId: dbUser.id,
      action: "SEED_STRESS_TEST",
      module: "SYSTEM",
      entityType: "SeedScript",
      metadata: {
        totalProducts,
        inventoryRecords: inventoryCount,
        stores: Object.keys(storeMap).length,
        customers: 30,
      },
    },
  });
  console.log("  Activity logged");

  // -----------------------------------------------------------------------
  // OUTPUT
  // -----------------------------------------------------------------------
  console.log("\n=== Seed Complete ===\n");
  console.log("```json");
  console.log(
    JSON.stringify(
      {
        email: EMAIL,
        password: PASSWORD,
        tenantId: tenant.id,
        stores: {
          big: {
            id: storeMap.big.id,
            name: storeMap.big.name,
            counters: storeMap.big.counters,
          },
          medium: {
            id: storeMap.medium.id,
            name: storeMap.medium.name,
            counters: storeMap.medium.counters,
          },
          small: {
            id: storeMap.small.id,
            name: storeMap.small.name,
            counters: storeMap.small.counters,
          },
        },
        products: {
          clothing: allProductIds.clothing,
          electronics: allProductIds.electronics,
          groceries: allProductIds.groceries,
        },
        categoryTree: CATEGORY_HIERARCHY,
        stats: {
          totalProducts,
          clothing: allProductIds.clothing.length,
          electronics: allProductIds.electronics.length,
          groceries: allProductIds.groceries.length,
          inventoryRecords: inventoryCount,
          stores: 3,
          customers: 30,
          vendors: vendorData.length,
        },
      },
      null,
      2
    )
  );
  console.log("```");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  prisma.$disconnect();
  process.exit(1);
});
