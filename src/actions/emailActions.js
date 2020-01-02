import { EDIT_USR, EDIT_REF } from "./types";
import { ipcRenderer as ipc } from "electron";

export const editUserEmail = email => dispatch => {
    ipc.send(EDIT_USR, email);
    dispatch({
        type: EDIT_USR,
        email: email
    });
}

export const editRefEmail = email => dispatch => {
    ipc.send(EDIT_REF, email);
    dispatch({
        type: EDIT_REF,
        email: email
    });
}