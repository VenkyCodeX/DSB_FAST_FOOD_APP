// Realistic food photography from Unsplash. Sized and quality-tuned for mobile.
const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop`;

export const foodImages = {
  // Category / generic fallbacks
  noodles: unsplash("photo-1585032226651-759b368d7246"),
  rice: unsplash("photo-1603133872878-684f208fb84b"),
  starter: unsplash("photo-1610057099443-fde8c4d50f91"),
  drink: unsplash("photo-1544145945-f90425340c7e"),

  // Hero banner (moody, fiery street food)
  hero: unsplash("photo-1552611052-33e04de081de"),

  // Per-item photos
  chickenNoodles: unsplash("photo-1585032226651-759b368d7246"),
  eggNoodles: unsplash("photo-1552611052-33e04de081de"),
  vegNoodles: unsplash("photo-1526318896980-cf78c088247c"),
  chickenFriedRice: unsplash("photo-1603133872878-684f208fb84b"),
  eggFriedRice: unsplash("photo-1596797038530-2c107229654b"),
  vegFriedRice: unsplash("photo-1512058564366-18510be2db19"),
  chicken65: unsplash("photo-1610057099443-fde8c4d50f91"),
  chilliChicken: unsplash("photo-1625938144755-652e08e359b7"),
  vegManchurian: unsplash("photo-1626082927389-6cd097cee6a6"),
  coolDrinks: unsplash("photo-1544145945-f90425340c7e"),
} as const;
