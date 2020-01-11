import { ADD_URL, DELETE_URL, EDIT_URL } from "./types";
import { ipcRenderer as ipc } from "electron";

export const addUrl = () => dispatch => {
  const newid = Math.round(Number.MAX_SAFE_INTEGER * Math.random());
  const newUrl = {
    type: ADD_URL,
    url: {
      id: newid,
      dns: "",
      visits: 0,
      maxvisits: 0
    }
  };
  ipc.send(ADD_URL, newUrl.url);
  dispatch(newUrl);
};

export const deleteUrl = id => dispatch => {
  ipc.send(DELETE_URL, id);
  dispatch({
    type: DELETE_URL,
    id: id
  });
};

export const editUrl = (id, dns, maxvisits) => dispatch => {
  ipc.send(EDIT_URL, { id: id, dns: dns, maxvisits: maxvisits });
  dispatch({
    type: EDIT_URL,
    id: id,
    dns: dns,
    maxvisits: maxvisits
  });
};
