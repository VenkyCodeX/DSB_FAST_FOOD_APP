import type { Category, MenuItem } from "@/src/types";
import { foodImages } from "@/src/data/images";

const descriptions: Record<Category, string> = {
  Noodles: "Wok-tossed, hot and spicy with fresh vegetables.",
  Rice: "Fragrant fried rice cooked fresh to order.",
  Starters: "Crispy, saucy bites made for sharing.",
  Drinks: "Chilled refreshment for every spicy bite.",
};

export const categories: Category[] = ["Noodles", "Rice", "Starters", "Drinks"];

export const initialMenu: MenuItem[] = [
  ["chicken-noodles", "Chicken Noodles", 80, "Noodles", foodImages.chickenNoodles],
  ["egg-noodles", "Egg Noodles", 70, "Noodles", foodImages.eggNoodles],
  ["veg-noodles", "Veg Noodles", 60, "Noodles", foodImages.vegNoodles],
  ["chicken-fried-rice", "Chicken Fried Rice", 90, "Rice", foodImages.chickenFriedRice],
  ["egg-fried-rice", "Egg Fried Rice", 75, "Rice", foodImages.eggFriedRice],
  ["veg-fried-rice", "Veg Fried Rice", 65, "Rice", foodImages.vegFriedRice],
  ["chicken-65", "Chicken 65", 120, "Starters", foodImages.chicken65],
  ["chilli-chicken", "Chilli Chicken", 130, "Starters", foodImages.chilliChicken],
  ["veg-manchurian", "Veg Manchurian", 90, "Starters", foodImages.vegManchurian],
  ["cool-drinks", "Cool Drinks", 30, "Drinks", foodImages.coolDrinks],
].map(([id, name, price, category, image]) => ({
  id: id as string,
  name: name as string,
  price: price as number,
  category: category as Category,
  description: descriptions[category as Category],
  image: image as string,
}));
