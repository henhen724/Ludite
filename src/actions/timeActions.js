import { EDIT_STR, EDIT_END } from "./types";
import { ipcRenderer as ipc } from "electron";

export const editStartTime = time => dispatch => {
    ipc.send(EDIT_STR, time);
    dispatch({
        type: EDIT_STR,
        time: time
    });
}

export const editEndTime = time => dispatch => {
    ipc.send(EDIT_END, time);
    dispatch({
        type: EDIT_END,
        time: time
    });
}