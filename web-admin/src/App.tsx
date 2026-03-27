import "./App.css";
import { Outlet } from "react-router-dom";

function App() {
  return (
    <div className="flex-1">
      <Outlet />
    </div>
  );
}

export default App;
