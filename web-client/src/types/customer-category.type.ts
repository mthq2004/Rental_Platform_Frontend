export interface CustomerCategory {
  id: string
  name: string
  color: string
  description: string
  conversationCount: number
}

export interface CreateCustomerCategoryDto {
    name: string
    color?: string
    description?: string
}

export interface AddConversationToCategoryDto {
    conversationId: string
    categoryIds: string[]
}