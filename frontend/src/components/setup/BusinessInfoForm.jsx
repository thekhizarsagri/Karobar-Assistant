import { useState } from "react";
import { currencies, fixedExpenseItems } from "./constants";
import CredentialsCard from "./CredentialsCard";
import BusinessProfileCard from "./BusinessProfileCard";
import ExpensesCard from "./ExpensesCard";
import { validateEmail, validatePassword, validateUsername } from "../../utils/validation";

function BusinessInfoForm({
  value,
  onChange,
  expenses,
  onToggleExpense,
  onChangeExpense,
  submitAttempted = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});

  const handleInput = (event) => {
    const { name, value: raw } = event.target;
    let next = raw;
    if (name === "phoneNumber") next = raw.replace(/[^0-9+\s-]/g, "");
    if (name === "username") next = raw.replace(/\s/g, "");
    onChange(name, next);
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    if (name) setTouched((prev) => ({ ...prev, [name]: true }));
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

  const emailResult = validateEmail(value.email);
  const passwordResult = validatePassword(value.password);
  const usernameResult = validateUsername(value.username);
  const showEmailError = submitAttempted || touched.email || Boolean(value.email);
  const showPasswordError =
    submitAttempted || touched.password || Boolean(value.password);
  const showUsernameError =
    submitAttempted || touched.username || Boolean(value.username);
  const errors = {
    email: !emailResult.valid && showEmailError ? emailResult.error : "",
    password:
      !passwordResult.valid && showPasswordError ? passwordResult.error : "",
    username:
      !usernameResult.valid && showUsernameError ? usernameResult.error : "",
  };

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
        onBlur={handleBlur}
        errors={errors}
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
