export const AD_CATEGORIES = {
  haraj: {
    label: 'حراج',
    icon: '🚗',
    subtitle: 'بيع وشراء كل شيء',
    benefits: [
      'انتشار سريع لإعلانك',
      'إحصائيات دقيقة للمشاهدات',
      'وسام ثقة للمتاجر الموثقة'
    ],
    formFields: []
  },
  estate: {
    label: 'عقار',
    icon: '🏢',
    subtitle: 'عقارات للبيع والإيجار',
    benefits: [
      'مساحات متنوعة للعرض',
      'جاهزة للإيجار الفوري',
      'مواقع مميزة'
    ],
    formFields: [
      { name: 'valLicense', label: 'رقم الترخيص العقاري', type: 'text', required: true }
    ]
  },
  freelancer: {
    label: 'فريلانسر',
    icon: '💻',
    subtitle: 'خدمات مستقلة',
    benefits: [
      'كوادر مستقلة',
      'تعاقد مباشر',
      'تقييمات حقيقية'
    ],
    formFields: [
      { name: 'hourlyRate', label: 'السعر بالساعة', type: 'number' }
    ]
  },
  jobs: {
    label: 'وظائف',
    icon: '💼',
    subtitle: 'فرص عمل',
    benefits: [
      'فرص وظيفية متنوعة',
      'كفاءات مؤهلة',
      'رواتب تنافسية'
    ],
    formFields: [
      { name: 'jobType', label: 'نوع الوظيفة', type: 'select', options: ['دوام كامل', 'دوام جزئي', 'عن بعد'] }
    ]
  },
  werash: {
    label: 'ورش',
    icon: '🔨',
    subtitle: 'ورش النجارة والحدادة والحرف اليدوية',
    benefits: [
      'وصول للعملاء',
      'أهمية الموقع',
      'تقييمات'
    ],
    formFields: []
  }
};

export const AD_PRICE = 49; // SAR per ad
