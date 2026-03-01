export interface Price {
  price?: number;
  unit?: string;
}

export interface Ingredient {
  '@id'?: string;
  id?: number;
  name?: string;
  price?: Price;
}

export interface DishIngredient {
  '@id'?: string;
  id?: number;
  weight?: string;
  dish?: string;
  ingredient?: Ingredient | string;
  comment?: string;
}

export interface Recipe {
  text?: string;
}

export interface Dish {
  '@id'?: string;
  id?: number;
  name?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  recipe?: Recipe;
  dishIngredients?: DishIngredient[] | string[];
}
