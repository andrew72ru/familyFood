import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchApi, fetchWithResponse } from '../api';
import { Dish, DishIngredient, RecipeComment } from '../types/Dish';
import { useMercure } from './useMercure';

export const useDish = (id: string | undefined) => {
  const [dish, setDish] = useState<Dish | null>(null);
  const [dishIngredients, setDishIngredients] = useState<DishIngredient[]>([]);
  const [recipeComments, setRecipeComments] = useState<RecipeComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);
  const [mercureTopics, setMercureTopics] = useState<string[]>([]);
  const [hubUrl, setHubUrl] = useState<string | null>(null);

  // Derive topics from dish and dishIngredients to ensure we're always subscribed to everything
  useEffect(() => {
    const topics = new Set<string>();

    // Add the dish itself as a topic
    if (dish && dish['@id']) {
      let dishId = dish['@id'];
      if (dishId.startsWith('http')) {
        try {
          dishId = new URL(dishId).pathname;
        } catch (e) {}
      }
      topics.add(dishId);
      if (dishId.startsWith('/')) {
        topics.add(`${window.location.origin}${dishId}`);
        if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== window.location.origin) {
          topics.add(`${process.env.REACT_APP_API_URL}${dishId}`);
        }
      }
    }

    // Add all dish ingredients and their base ingredients as topics
    dishIngredients.forEach((di) => {
      // Add DishIngredient topic
      if (di['@id']) {
        let diId = di['@id'];
        if (diId.startsWith('http')) {
          try {
            diId = new URL(diId).pathname;
          } catch (e) {}
        }
        topics.add(diId);
        if (diId.startsWith('/')) {
          topics.add(`${window.location.origin}${diId}`);
          if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== window.location.origin) {
            topics.add(`${process.env.REACT_APP_API_URL}${diId}`);
          }
        }
      }

      // Add base Ingredient topic
      let ingredientIri = typeof di.ingredient === 'string' ? di.ingredient : di.ingredient?.['@id'];
      if (ingredientIri) {
        if (ingredientIri.startsWith('http')) {
          try {
            ingredientIri = new URL(ingredientIri).pathname;
          } catch (e) {}
        }
        topics.add(ingredientIri);
        if (ingredientIri.startsWith('/')) {
          topics.add(`${window.location.origin}${ingredientIri}`);
          if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== window.location.origin) {
            topics.add(`${process.env.REACT_APP_API_URL}${ingredientIri}`);
          }
        }
      }
    });

    // Add DishIngredient collection topic to catch new ingredients being added
    const diCollectionTopic = '/api/dish_ingredients';
    topics.add(diCollectionTopic);
    topics.add(`${window.location.origin}${diCollectionTopic}`);
    if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== window.location.origin) {
      topics.add(`${process.env.REACT_APP_API_URL}${diCollectionTopic}`);
    }

    // Add RecipeComment collection topic to catch new comments being added
    const rcCollectionTopic = '/api/recipe_comments';
    topics.add(rcCollectionTopic);
    topics.add(`${window.location.origin}${rcCollectionTopic}`);
    if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== window.location.origin) {
      topics.add(`${process.env.REACT_APP_API_URL}${rcCollectionTopic}`);
    }

    // Add every current comment as a topic (to catch updates to existing comments)
    recipeComments.forEach((rc) => {
      if (rc['@id']) {
        let rcId = rc['@id'];
        if (rcId.startsWith('http')) {
          try {
            rcId = new URL(rcId).pathname;
          } catch (e) {}
        }
        topics.add(rcId);
        if (rcId.startsWith('/')) {
          topics.add(`${window.location.origin}${rcId}`);
          if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== window.location.origin) {
            topics.add(`${process.env.REACT_APP_API_URL}${rcId}`);
          }
        }
      }
    });

    if (topics.size > 0) {
      const sortedTopics = Array.from(topics).sort();
      setMercureTopics((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(sortedTopics)) {
          return prev;
        }
        return sortedTopics;
      });
    }
  }, [dish, dishIngredients, recipeComments, id]);

  const fetchDish = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, response } = await fetchWithResponse(`/api/dishes/${id}`, {
        preload: '/api/dish_ingredients/*',
      });
      setDish(data);

      // Extract Mercure hub URL from the Link header
      const linkHeader = response.headers.get('Link');
      if (linkHeader) {
        // API Platform uses rel="mercure" for the hub URL
        const hubMatch = linkHeader.match(/<([^>]+)>;\s*rel="mercure"/);
        if (hubMatch) {
          setHubUrl(hubMatch[1]);
        }
      }

      // Fetch full dish ingredients if they are IRIs
      if (data.dishIngredients && Array.isArray(data.dishIngredients)) {
        const fullIngredients = await Promise.all(
          data.dishIngredients.map(async (di: any) => {
            let diData = di;
            if (typeof di === 'string') {
              diData = await fetchApi(di);
            }

            // Normalize DishIngredient @id to relative
            if (diData['@id'] && diData['@id'].startsWith('http')) {
              try {
                diData['@id'] = new URL(diData['@id']).pathname;
              } catch (e) {}
            }

            // Also fetch nested ingredient if it's an IRI
            if (typeof diData.ingredient === 'string') {
              diData.ingredient = await fetchApi(diData.ingredient, {
                preload: '/api/ingredients/*',
              });
            }

            // Normalize nested Ingredient @id to relative
            if (diData.ingredient?.['@id'] && diData.ingredient['@id'].startsWith('http')) {
              try {
                diData.ingredient['@id'] = new URL(diData.ingredient['@id']).pathname;
              } catch (e) {}
            }

            return diData;
          }),
        );
        setDishIngredients(fullIngredients);
      } else {
        setDishIngredients([]);
      }

      // Fetch recipe comments using the sub-resource endpoint
      const commentsData = await fetchApi(`/api/dishes/${id}/recipe_comments`);
      const commentsRaw =
        commentsData?.['hydra:member'] || commentsData?.['member'] || (Array.isArray(commentsData) ? commentsData : []);

      // Normalize comment IRIs
      const comments = commentsRaw.map((rc: any) => {
        if (rc['@id'] && rc['@id'].startsWith('http')) {
          try {
            rc['@id'] = new URL(rc['@id']).pathname;
          } catch (e) {}
        }
        return rc;
      });

      setRecipeComments(comments);

      setLoading(false);
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [id]);

  const onUpdateRef = useRef<(update: any) => void>(null!);

  const onUpdate = useCallback(
    async (update: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[useDish] Received update:', update);
      }

      // API Platform Mercure updates can sometimes be just the IRI string
      // if it's a delete or if configured that way, but for updates it's usually the object.
      if (typeof update === 'string') {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useDish] Update is a string (IRI), fetching data...');
        }
        try {
          const data = await fetchApi(update);
          if (onUpdateRef.current) {
            onUpdateRef.current(data);
          }
        } catch (err) {
          console.error('[useDish] Failed to fetch update data', err);
        }
        return;
      }

      // ... rest of the function stays same ...
      // Some API Platform versions wrap the object in a data property or something similar,
      // but usually it's the object itself. Let's handle both just in case.
      const data = update.data || update;
      const updateId = data['@id'];
      if (!updateId) return;

      // Extract only the path part for topic matching (normalize to relative IRI)
      let normalizedUpdateId = updateId;
      try {
        if (updateId.startsWith('http')) {
          normalizedUpdateId = new URL(updateId).pathname;
        }
      } catch (e) {
        // Fallback to original if not a valid absolute URL
      }

      if (normalizedUpdateId === `/api/dishes/${id}`) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useDish] Updating dish state');
        }

        setDish((prev) => (prev ? { ...prev, ...data } : data));

        // If dishIngredients were updated in the Dish object, we need to sync them
        if (data.dishIngredients && Array.isArray(data.dishIngredients)) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[useDish] Syncing dishIngredients from Dish update');
          }
          try {
            const fullIngredients = await Promise.all(
              data.dishIngredients.map(async (di: any) => {
                if (typeof di === 'string') {
                  return await fetchApi(di);
                }
                return di;
              }),
            );
            setDishIngredients(fullIngredients);
          } catch (err) {
            console.error('[useDish] Failed to sync dishIngredients', err);
          }
        }
        // If recipeComments were updated in the Dish object, we need to sync them
        if (data.recipeComments && Array.isArray(data.recipeComments)) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[useDish] Syncing recipeComments from Dish update');
          }
          try {
            const fullComments = await Promise.all(
              data.recipeComments.map(async (rc: any) => {
                let rcData = rc;
                if (typeof rc === 'string') {
                  rcData = await fetchApi(rc);
                }

                // Normalize RecipeComment @id
                if (rcData['@id'] && rcData['@id'].startsWith('http')) {
                  try {
                    rcData['@id'] = new URL(rcData['@id']).pathname;
                  } catch (e) {}
                }
                return rcData;
              }),
            );
            // Sort by creation date if available (usually descending)
            setRecipeComments(fullComments);
          } catch (err) {
            console.error('[useDish] Failed to sync recipeComments', err);
          }
        }
      } else if (data['@type'] === 'DishIngredient' || normalizedUpdateId.includes('/api/dish_ingredients/')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useDish] Updating dishIngredients state for DishIngredient');
        }

        // If the update is partial (e.g. from POST and missing nested ingredient object), fetch the full data
        let fullData = data;
        if (typeof data.ingredient === 'string') {
          if (process.env.NODE_ENV === 'development') {
            console.log('[useDish] DishIngredient update has IRI for ingredient, fetching full data');
          }
          try {
            fullData = await fetchApi(normalizedUpdateId);
          } catch (err) {
            console.error('[useDish] Failed to fetch full DishIngredient data', err);
          }
        }

        setDishIngredients((prev) => {
          const index = prev.findIndex((di) => di['@id'] === normalizedUpdateId);
          if (index !== -1) {
            const newIngredients = [...prev];
            newIngredients[index] = { ...newIngredients[index], ...fullData };
            return newIngredients;
          }

          // Normalize parent dish IRI from update
          let parentDishIri = fullData.dish;
          if (typeof parentDishIri === 'object' && parentDishIri?.['@id']) {
            parentDishIri = parentDishIri['@id'];
          }
          if (typeof parentDishIri === 'string' && parentDishIri.startsWith('http')) {
            try {
              parentDishIri = new URL(parentDishIri).pathname;
            } catch (e) {}
          }

          if (parentDishIri === `/api/dishes/${id}`) {
            return [...prev, fullData];
          }
          return prev;
        });
      } else if (data['@type'] === 'Ingredient' || normalizedUpdateId.includes('/api/ingredients/')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useDish] Updating dishIngredients state for Ingredient');
        }
        setDishIngredients((prev) => {
          return prev.map((di) => {
            let ingredientIri = typeof di.ingredient === 'string' ? di.ingredient : di.ingredient?.['@id'];
            // Normalize current ingredient IRI for comparison
            if (ingredientIri && ingredientIri.startsWith('http')) {
              try {
                ingredientIri = new URL(ingredientIri).pathname;
              } catch (e) {}
            }

            if (ingredientIri === normalizedUpdateId) {
              return {
                ...di,
                ingredient: typeof di.ingredient === 'string' ? data : { ...di.ingredient, ...data },
              };
            }
            return di;
          });
        });
      } else if (data['@type'] === 'RecipeComment' || normalizedUpdateId.includes('/api/recipe_comments/')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useDish] Updating recipeComments state for RecipeComment');
        }

        // If the update is partial (e.g. from POST and missing fields), fetch the full data
        let fullData = data;
        if (!data.text || !data.dish) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[useDish] RecipeComment update is partial, fetching full data');
          }
          try {
            fullData = await fetchApi(normalizedUpdateId);
          } catch (err) {
            console.error('[useDish] Failed to fetch full RecipeComment data', err);
          }
        }

        // Normalize ID
        if (fullData['@id'] && fullData['@id'].startsWith('http')) {
          try {
            fullData['@id'] = new URL(fullData['@id']).pathname;
          } catch (e) {}
        }

        setRecipeComments((prev) => {
          const index = prev.findIndex((rc) => {
            let rcId = rc['@id'];
            if (rcId && rcId.startsWith('http')) {
              try {
                rcId = new URL(rcId).pathname;
              } catch (e) {}
            }
            return rcId === normalizedUpdateId;
          });

          if (index !== -1) {
            const newComments = [...prev];
            newComments[index] = { ...newComments[index], ...fullData };
            return newComments;
          }

          // Normalize parent dish IRI from update
          let parentDishIri = fullData.dish;
          if (typeof parentDishIri === 'object' && parentDishIri?.['@id']) {
            parentDishIri = parentDishIri['@id'];
          }
          if (typeof parentDishIri === 'string' && parentDishIri.startsWith('http')) {
            try {
              parentDishIri = new URL(parentDishIri).pathname;
            } catch (e) {}
          }

          // Also check if it's currently on this dish's sub-resource
          if (parentDishIri === `/api/dishes/${id}`) {
            return [fullData, ...prev]; // Comments are usually prepended (desc order)
          }
          return prev;
        });
      } else if (process.env.NODE_ENV === 'development') {
        console.log('[useDish] Update did not match any criteria', { normalizedUpdateId, type: data['@type'] });
      }
    },
    [id],
  );

  useMercure(mercureTopics, onUpdate, hubUrl);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

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
