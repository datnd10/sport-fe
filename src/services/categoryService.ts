import { apiClient } from './apiClient'
import type { CategoryResponse } from './productService.types'

// API client for the Category & Product module (design.md — "Module
// Category & Product"). Talks to the public GET /api/categories endpoint
// used by the homepage's Danh_Mục listing (Requirement 2.1) and by the
// Category product listing page's navigation.
const CATEGORY_BASE = '/categories'

/** Fetches the public list of Danh_Mục (Requirement 2.1, 2.2). */
async function getCategories(): Promise<CategoryResponse[]> {
  const response = await apiClient.get<CategoryResponse[]>(CATEGORY_BASE)
  return response.data
}

export const categoryService = {
  getCategories,
}

export default categoryService
