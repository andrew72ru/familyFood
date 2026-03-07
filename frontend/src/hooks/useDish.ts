import { useState, useCallback, useEffect } from 'react';
import { fetchApi } from '../api';
import { Dish, DishIngredient } from '../types/Dish';

export const useDish = (id: string | undefined) => {
  const [dish, setDish] = useState<Dish | null>(null);
  const [dishIngredients, setDishIngredients] = useState<DishIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const fetchDish = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchApi(`/api/dishes/${id}`);
      setDish(data);

      // Fetch full dish ingredients if they are IRIs
      if (data.dishIngredients && Array.isArray(data.dishIngredients)) {
        const fullIngredients = await Promise.all(
          data.dishIngredients.map(async (di: any) => {
            if (typeof di === 'string') {
              const diData = await fetchApi(di);
              // Also fetch nested ingredient if it's an IRI
              if (typeof diData.ingredient === 'string') {
                diData.ingredient = await fetchApi(diData.ingredient);
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
    loading,
    error,
    fetchDish,
    setDish,
    setDishIngredients,
    setLoading,
    setError,
  };
};
