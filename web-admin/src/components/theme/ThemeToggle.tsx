import { useTheme } from "../../contexts/ThemeContext";
import "./theme-toggle.css";

const ThemeToggle = () => {
  const { theme, toggle, isSwitching } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className={`theme-toggle ${isDark ? "is-dark" : ""}`}
      aria-label="Chuyển giao diện"
      disabled={isSwitching}
    >
      <span className={`theme-toggle-thumb ${isDark ? "is-dark" : ""}`}>
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
};

export default ThemeToggle;