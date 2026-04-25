export function categoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    'Rent': '🏠',
    'Groceries': '🛒',
    'Food & Groceries': '🛒',
    'Transport': '🚌',
    'Utilities': '💡',
    'Entertainment': '🎬',
    'Dining': '🍽️',
    'Eating Out': '🍽️',
    'Shopping': '🛍️',
    'Healthcare': '💊',
    'Education': '📚',
    'Subscriptions': '📱',
    'Travel': '✈️',
    'Other': '📦',
    'Salary': '💼',
    'Freelance': '💻',
    'Part-time': '⏱️',
    'Part-time Job': '⏱️',
    'Transfer from India': '🇮🇳',
    'Family Support': '🇮🇳',
    'Scholarship': '🎓',
    'Student Loan': '🎓',
    'Investment': '📈',
    'Owned Money': '💰',
    'Savings': '🏦',
    'Credit Card': '💳',
    'Cash': '💵',
    'Main Account': '🏦',
    'Bank Account': '🏦',
    'Digital Wallet': '📱',
    'Gift': '🎁',
    'Internship': '💼',
    'Clothing': '👕',
    'Coffee': '☕',
    'Books & Supplies': '📚',
    'Phone & Internet': '📱',
    'Gym': '💪',
  };
  return map[cat] || '📦';
}

export function sourceEmoji(src: string): string {
  return categoryEmoji(src);
}
