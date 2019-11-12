import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import App from "./components/App";
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";

import "./assets/css/index.css";
import rootReducer from "./reducers/rootReducer";

//Setup redux store
const middleware = [thunk];
const store = createStore(
  rootReducer,
  {
    block_urls: [{ id: 0, dns: "facebook.com", visits: 0, maxvisits: 0 }],
    currentPageNum: 0
  },
  applyMiddleware(...middleware)
);

// Now we can render our application into it
render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("app")
);
