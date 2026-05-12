export interface Market {
  _id: string;
  name: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface Product {
  _id: string;
  name: string;
  imageUrl?: string;
  marketId: Market | string;
  price: number;
  oldPrice?: number;
  discountRate?: number;
  sourceUrl?: string;
  campaignStartDate?: string;
  campaignEndDate?: string;
}

export interface Category {
  _id: string;
  name: string;
  icon?: string;
}
