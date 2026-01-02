import "./App.css";
import { Outlet } from "react-router-dom";
import { store } from "./stores/store";
import { Provider } from 'react-redux'

function App() {
  return (
    <Provider store={store}>
      <div className="flex-1">
        <Outlet />
      </div>
    </Provider>
  );
}

export default App;
