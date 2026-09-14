"use server";

import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requirePremium } from "../../lib/entitlements";

const categorySchema = z.enum(["RENT", "FOOD", "TRANSPORT", "DATA_AIRTIME", "HEALTH", "MISC"]);
const amountSchema = z.coerce.number().int().positive().max(1_000_000);
const monthSchema = z.object({ month: z.coerce.number().int().min(1).max(12), year: z.coerce.number().int().min(2020).max(2100) });

export async function setMonthlyIncome(amount: unknown) {
  const user = await requirePremium("CORP_PREMIUM");
  const monthlyIncome = amountSchema.parse(amount);
  return prisma.allowanceBudget.upsert({ where: { userId: user.id }, update: { monthlyIncome }, create: { userId: user.id, monthlyIncome } });
}

export async function addExpense(category: unknown, amount: unknown, note?: unknown, spentAt?: unknown) {
  const user = await requirePremium("CORP_PREMIUM");
  const parsedCategory = categorySchema.parse(category);
  const parsedAmount = amountSchema.parse(amount);
  const parsedNote = z.string().trim().max(240).optional().parse(note);
  const parsedDate = spentAt ? z.coerce.date().max(new Date()).parse(spentAt) : new Date();
  const budget = await prisma.allowanceBudget.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!budget) throw new Error("Set your monthly income before adding an expense.");
  return prisma.allowanceExpense.create({ data: { budgetId: budget.id, category: parsedCategory, amount: parsedAmount, note: parsedNote || null, spentAt: parsedDate } });
}

export async function deleteExpense(expenseId: unknown) {
  const user = await requirePremium("CORP_PREMIUM");
  const id = z.string().cuid().parse(expenseId);
  const result = await prisma.allowanceExpense.deleteMany({ where: { id, budget: { userId: user.id } } });
  if (result.count !== 1) throw new Error("Expense not found.");
  return { success: true };
}

export async function getMonthSummary(month: unknown, year: unknown) {
  const user = await requirePremium("CORP_PREMIUM");
  const { month: m, year: y } = monthSchema.parse({ month, year });
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  const budget = await prisma.allowanceBudget.findUnique({ where: { userId: user.id }, include: { expenses: { where: { spentAt: { gte: start, lt: end } }, orderBy: { spentAt: "desc" } } } });
  const expenses = budget?.expenses || [];
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const byCategory = Object.fromEntries(categorySchema.options.map((category) => [category, expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0)]));
  return { monthlyIncome: budget?.monthlyIncome || 0, totalSpent, remaining: (budget?.monthlyIncome || 0) - totalSpent, byCategory, expenses };
}
