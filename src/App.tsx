import React from "react";
import "./App.css";
import Game from "./components/Game";

const logo: string = require("./logo.svg").default;
function App() {
  return (
    <div className="🌚">
      <div className="🖥️">
        <Game />
      </div>
    </div>
  );
}

export default App;
