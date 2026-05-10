const CATEGORIES = [
  { id: 'general', label: 'عام', icon: '📁' },
  { id: 'fashion', label: 'الأزياء', icon: '👗' },
  { id: 'tech', label: 'التقنية', icon: '💻' },
  { id: 'food', label: 'الأغذية', icon: '🍔' },
  { id: 'beauty', label: 'الجمال', icon: '💄' },
  { id: 'sports', label: 'الرياضة', icon: '⚽' },
  { id: 'books', label: 'الكتب', icon: '📚' },
  { id: 'furniture', label: 'الأثاث', icon: '🪑' },
  { id: 'cars', label: 'السيارات', icon: '🚗' },
  { id: 'health', label: 'الصحة', icon: '🏥' },
  { id: 'entertainment', label: 'الترفيه', icon: '🎮' },
  { id: 'estate', label: 'العقارات', icon: '🏠' },
  { id: 'services', label: 'الخدمات', icon: '🔧' },
  { id: 'education', label: 'التعليم', icon: '📖' },
  { id: 'electronics', label: 'الإلكترونيات', icon: '📱' },
];

export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]));

export default CATEGORIES;
