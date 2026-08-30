import { useState } from "react";
import { currencies, fixedExpenseItems } from "./constants";
import CredentialsCard from "./CredentialsCard";
import BusinessProfileCard from "./BusinessProfileCard";
import ExpensesCard from "./ExpensesCard";

function BusinessInfoForm({
  value,
  onChange,
  expenses,
  onToggleExpense,
  onChangeExpense,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const handleInput = (event) => {
    const { name, value: raw } = event.target;
    const next = name === "phoneNumber" ? raw.replace(/[^0-9+\s-]/g, "") : raw;
    onChange(name, next);
  };

  const totalMonthlyExpenses = fixedExpenseItems.reduce((acc, item) => {
    if (expenses?.[item.key]?.enabled) {
      return acc + (Number(expenses[item.key]?.amount) || 0);
    }
    return acc;
  }, 0);

  const activeExpenseCount = fixedExpenseItems.filter(
    (item) => expenses?.[item.key]?.enabled
  ).length;

  const currentCurrency =
    currencies.find((c) => c.symbol === value.currency || c.code === value.currency) ||
    currencies[0];

  return (
    <div className="setup-left-column">
      <div className="column-header">
        <h2 className="column-title">Company Profile & Owner Access</h2>
        <p className="column-subtitle">
          Configure your business identity, manager credentials, and monthly operating costs.
        </p>
      </div>

      <CredentialsCard
        value={value}
        onInput={handleInput}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
      />

      <BusinessProfileCard
        value={value}
        onInput={handleInput}
        currentCurrency={currentCurrency}
      />

      <ExpensesCard
        expenses={expenses}
        onToggleExpense={onToggleExpense}
        onChangeExpense={onChangeExpense}
        currentCurrency={currentCurrency}
        activeExpenseCount={activeExpenseCount}
        totalMonthlyExpenses={totalMonthlyExpenses}
      />
    </div>
  );
}

export default BusinessInfoForm;
