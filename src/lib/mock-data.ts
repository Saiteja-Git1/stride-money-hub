export type AccountType = "bank" | "cash" | "wallet" | "credit";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  gradient: string;
  last4?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense";
}

export interface Transaction {
  id: string;
  accountId: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  categoryId: string;
  note: string;
  date: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  spent: number;
}

export const accounts: Account[] = [
  { id: "a1", name: "Main Bank", type: "bank", balance: 8421.5, currency: "USD", gradient: "var(--gradient-primary)", last4: "4821" },
  { id: "a2", name: "Savings", type: "bank", balance: 14250.0, currency: "USD", gradient: "var(--gradient-violet)", last4: "9032" },
  { id: "a3", name: "Cash", type: "cash", balance: 320.0, currency: "USD", gradient: "linear-gradient(135deg, oklch(0.7 0.18 30), oklch(0.65 0.2 50))" },
  { id: "a4", name: "Credit Card", type: "credit", balance: -642.8, currency: "USD", gradient: "linear-gradient(135deg, oklch(0.4 0.05 270), oklch(0.25 0.04 270))", last4: "1190" },
];

export const categories: Category[] = [
  { id: "c1", name: "Food & Drink", icon: "Utensils", color: "oklch(0.78 0.18 30)", type: "expense" },
  { id: "c2", name: "Transport", icon: "Car", color: "oklch(0.7 0.16 220)", type: "expense" },
  { id: "c3", name: "Shopping", icon: "ShoppingBag", color: "oklch(0.7 0.16 290)", type: "expense" },
  { id: "c4", name: "Rent", icon: "Home", color: "oklch(0.7 0.14 200)", type: "expense" },
  { id: "c5", name: "Entertainment", icon: "Film", color: "oklch(0.78 0.16 340)", type: "expense" },
  { id: "c6", name: "Salary", icon: "Briefcase", color: "oklch(0.78 0.18 155)", type: "income" },
  { id: "c7", name: "Freelance", icon: "Laptop", color: "oklch(0.78 0.16 180)", type: "income" },
];

export const transactions: Transaction[] = [
  { id: "t1", accountId: "a1", type: "expense", amount: 18.4, categoryId: "c1", note: "Blue Bottle Coffee", date: "2026-04-20T08:12:00Z" },
  { id: "t2", accountId: "a4", type: "expense", amount: 64.2, categoryId: "c3", note: "Uniqlo", date: "2026-04-19T15:42:00Z" },
  { id: "t3", accountId: "a1", type: "income", amount: 4200, categoryId: "c6", note: "April salary", date: "2026-04-18T09:00:00Z" },
  { id: "t4", accountId: "a1", type: "expense", amount: 12.5, categoryId: "c2", note: "Uber to office", date: "2026-04-18T18:24:00Z" },
  { id: "t5", accountId: "a1", type: "expense", amount: 1450, categoryId: "c4", note: "April rent", date: "2026-04-15T10:00:00Z" },
  { id: "t6", accountId: "a2", type: "income", amount: 850, categoryId: "c7", note: "Logo project", date: "2026-04-14T11:30:00Z" },
  { id: "t7", accountId: "a4", type: "expense", amount: 32, categoryId: "c5", note: "Netflix + Spotify", date: "2026-04-13T20:10:00Z" },
  { id: "t8", accountId: "a1", type: "expense", amount: 56.8, categoryId: "c1", note: "Trader Joe's", date: "2026-04-12T17:20:00Z" },
];

export const budgets: Budget[] = [
  { id: "b1", categoryId: "c1", limit: 600, spent: 412 },
  { id: "b2", categoryId: "c2", limit: 250, spent: 188 },
  { id: "b3", categoryId: "c3", limit: 400, spent: 364 },
  { id: "b4", categoryId: "c5", limit: 150, spent: 92 },
];

export const monthlyFlow = [
  { day: "1", income: 0, expense: 45 },
  { day: "5", income: 0, expense: 120 },
  { day: "8", income: 850, expense: 80 },
  { day: "12", income: 0, expense: 220 },
  { day: "15", income: 0, expense: 1450 },
  { day: "18", income: 4200, expense: 95 },
  { day: "20", income: 0, expense: 82 },
];

export function totalBalance() {
  return accounts.reduce((s, a) => s + a.balance, 0);
}
export function monthIncome() {
  return transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
}
export function monthExpense() {
  return transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
}
export function categoryById(id: string) {
  return categories.find(c => c.id === id)!;
}
export function accountById(id: string) {
  return accounts.find(a => a.id === id)!;
}
export function formatMoney(n: number, currency = "USD") {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}