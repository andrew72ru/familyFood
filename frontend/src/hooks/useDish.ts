import { useState, useCallback, useEffect } from 'react';
import { fetchApi } from '../api';
import { Dish, DishIngredient, RecipeComment } from '../types/Dish';

export const useDish = (id: string | undefined) => {
  const [dish, setDish] = useState<Dish | null>(null);
  const [dishIngredients, setDishIngredients] = useState<DishIngredient[]>([]);
  const [recipeComments, setRecipeComments] = useState<RecipeComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const fetchDish = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchApi(`/api/dishes/${id}`, {
        preload: '/api/dish_ingredients/*',
      });
      setDish(data);

      // Fetch full dish ingredients if they are IRIs
      if (data.dishIngredients && Array.isArray(data.dishIngredients)) {
        const fullIngredients = await Promise.all(
          data.dishIngredients.map(async (di: any) => {
            if (typeof di === 'string') {
              const diData = await fetchApi(di);
              // Also fetch nested ingredient if it's an IRI
              if (typeof diData.ingredient === 'string') {
                diData.ingredient = await fetchApi(diData.ingredient, {
                  preload: '/api/ingredients/*',
                });
              }
              return diData;
            }
            // If it's already an object, check nested ingredients
            if (di.ingredient && typeof di.ingredient === 'string') {
              di.ingredient = await fetchApi(di.ingredient);
            }
            return di;
          }),
        );
        setDishIngredients(fullIngredients);
      } else {
        setDishIngredients([]);
      }

      // Fetch recipe comments using the sub-resource endpoint
      const commentsData = await fetchApi(`/api/dishes/${id}/recipe_comments`);
      const comments =
        commentsData?.['hydra:member'] || commentsData?.['member'] || (Array.isArray(commentsData) ? commentsData : []);
      setRecipeComments(comments);

      setLoading(false);
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDish();
  }, [fetchDish]);

  return {
    dish,
    dishIngredients,
    recipeComments,
    loading,
    error,
    fetchDish,
    setDish,
    setDishIngredients,
    setRecipeComments,
    setLoading,
    setError,
  };
};
