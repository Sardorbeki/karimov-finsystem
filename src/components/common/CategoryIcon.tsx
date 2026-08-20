import React from 'react';
import * as LucideIcons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', size, color }) => {
  // Check if icon exists in Lucide
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Tag;
  return <IconComponent className={className} size={size} style={color ? { color } : undefined} />;
};

export const AVAILABLE_CATEGORY_ICONS = [
  'Briefcase',
  'TrendingUp',
  'Laptop',
  'PieChart',
  'ShoppingCart',
  'Home',
  'Car',
  'GraduationCap',
  'HeartPulse',
  'Shirt',
  'Coffee',
  'Heart',
  'Smartphone',
  'AlertCircle',
  'PlusCircle',
  'DollarSign',
  'CreditCard',
  'Gift',
  'Plane',
  'Film',
  'BookOpen',
  'Utensils',
  'Fuel',
  'Wrench',
  'Smile'
];

export const AVAILABLE_CATEGORY_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#059669', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0284c7', // Sky
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#64748b', // Slate
  '#78716c'  // Stone
];
