import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import App from "./components/App";
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";

import "./assets/css/index.css";
import rootReducer from "./reducers/rootReducer";
import defaultState from "../config/defaultstate";

//Setup redux store
const middleware = [thunk];
const store = createStore(
  rootReducer,
  defaultState,
  applyMiddleware(...middleware)
);

// Now we can render our application into it
render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("app")
);
