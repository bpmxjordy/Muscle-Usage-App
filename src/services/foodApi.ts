// Open Food Facts API wrapper for food search and nutrition data

export interface FoodItem {
    id: string
    name: string
    brand: string
    imageUrl?: string
    servingSize: string
    calories: number      // per 100g
    protein: number       // per 100g
    carbs: number         // per 100g
    fat: number           // per 100g
    fiber: number         // per 100g
    sugar: number         // per 100g
}

export interface LoggedFood {
    id: string
    food: FoodItem
    grams: number
    meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    timestamp: string
}

const BASE_URL = 'https://world.openfoodfacts.org'

// Simple in-memory cache
const cache = new Map<string, { data: FoodItem[]; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function searchFoods(query: string): Promise<FoodItem[]> {
    if (!query || query.length < 2) return []

    const cacheKey = query.toLowerCase().trim()
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

    try {
        const res = await fetch(
            `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,brands,image_front_small_url,serving_size,nutriments`
        )
        if (!res.ok) throw new Error('API request failed')

        const json = await res.json()
        const items: FoodItem[] = (json.products || [])
            .filter((p: any) => p.product_name && p.nutriments)
            .map((p: any) => ({
                id: p.code || crypto.randomUUID(),
                name: p.product_name || 'Unknown',
                brand: p.brands || '',
                imageUrl: p.image_front_small_url || undefined,
                servingSize: p.serving_size || '100g',
                calories: Math.round(p.nutriments['energy-kcal_100g'] || p.nutriments['energy-kcal'] || 0),
                protein: Math.round((p.nutriments.proteins_100g || 0) * 10) / 10,
                carbs: Math.round((p.nutriments.carbohydrates_100g || 0) * 10) / 10,
                fat: Math.round((p.nutriments.fat_100g || 0) * 10) / 10,
                fiber: Math.round((p.nutriments.fiber_100g || 0) * 10) / 10,
                sugar: Math.round((p.nutriments.sugars_100g || 0) * 10) / 10,
            }))
            .filter((item: FoodItem) => item.calories > 0 || item.protein > 0)

        cache.set(cacheKey, { data: items, ts: Date.now() })
        return items
    } catch (err) {
        console.error('Food search error:', err)
        return []
    }
}

// Common foods for quick-add (no API call needed)
export const quickAddFoods: FoodItem[] = [
    { id: 'qa-chicken-breast', name: 'Chicken Breast (cooked)', brand: '', servingSize: '100g', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0 },
    { id: 'qa-rice-white', name: 'White Rice (cooked)', brand: '', servingSize: '100g', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0 },
    { id: 'qa-brown-rice', name: 'Brown Rice (cooked)', brand: '', servingSize: '100g', calories: 123, protein: 2.7, carbs: 26, fat: 1, fiber: 1.6, sugar: 0 },
    { id: 'qa-egg', name: 'Egg (large, cooked)', brand: '', servingSize: '50g (1 egg)', calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1 },
    { id: 'qa-oats', name: 'Oats (dry)', brand: '', servingSize: '100g', calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 10.6, sugar: 1 },
    { id: 'qa-banana', name: 'Banana', brand: '', servingSize: '100g', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12 },
    { id: 'qa-salmon', name: 'Salmon (cooked)', brand: '', servingSize: '100g', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0 },
    { id: 'qa-sweet-potato', name: 'Sweet Potato (cooked)', brand: '', servingSize: '100g', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, sugar: 4.2 },
    { id: 'qa-greek-yogurt', name: 'Greek Yogurt (plain)', brand: '', servingSize: '100g', calories: 59, protein: 10, carbs: 3.6, fat: 0.7, fiber: 0, sugar: 3.2 },
    { id: 'qa-broccoli', name: 'Broccoli (cooked)', brand: '', servingSize: '100g', calories: 35, protein: 2.4, carbs: 7, fat: 0.4, fiber: 3.3, sugar: 1.4 },
    { id: 'qa-whey-protein', name: 'Whey Protein Shake', brand: '', servingSize: '30g (1 scoop)', calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0, sugar: 2 },
    { id: 'qa-peanut-butter', name: 'Peanut Butter', brand: '', servingSize: '100g', calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, sugar: 9 },
    { id: 'qa-avocado', name: 'Avocado', brand: '', servingSize: '100g', calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, sugar: 0.7 },
    { id: 'qa-milk-whole', name: 'Whole Milk', brand: '', servingSize: '100ml', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sugar: 5.1 },
    { id: 'qa-bread-whole-wheat', name: 'Whole Wheat Bread', brand: '', servingSize: '100g', calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7, sugar: 6 },
]
