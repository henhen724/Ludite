import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import App from "./components/App";
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { ipcRenderer as ipc } from "electron";
import { onUpdate } from "./actions/workerActions";
import { RECEIVED_STATE } from "./actions/types";

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

ipc.on(RECEIVED_STATE, arg => {
  console.log("Recieved State: ", arg);
  var visitChange = false;
  const curState = store.getState();
  if (typeof arg.block_urls !== 'undefined')
    arg.block_urls.forEach(url, index => {
      if (url.visits !== curState.block_urls[index].visits)
        visitChange = true;
    });
  if (arg.length !== curState.length || visitChange)
    onUpdate(arg)(store.dispatch);
})

// Now we can render our application into it
render(
  <Provider store={store} >
    <App />
  </Provider >,
  document.getElementById("app")
);
