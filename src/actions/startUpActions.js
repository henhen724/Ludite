import { REQUEST_STATE, RECEIVED_STATE } from "./types";
import { ipcRenderer as ipc } from "electron";

export const getState = () => dispatch => {
  console.log("GETTING STATE");
  ipc.on(RECEIVED_STATE, (event, arg) => {
    console.log(arg);
    dispatch({
      type: RECEIVED_STATE,
      state: arg
    });
  });
  ipc.send(REQUEST_STATE, null);
};
