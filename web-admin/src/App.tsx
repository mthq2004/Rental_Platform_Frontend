import "./App.css";
import { Outlet } from "react-router-dom";

function App() {

  console.log("Test Deploy Admin Mạch Ngọc Xuân!!!!!!!!!!");
  

  return (
    <div className="flex-1">
      <Outlet />
    </div>
  );
}

export default App;
