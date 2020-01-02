import { EDIT_SRT, EDIT_END } from "./types";
import { ipcRenderer as ipc } from "electron";

export const editStartTime = time => dispatch => {
    ipc.send(EDIT_SRT, time);
    dispatch({
        type: EDIT_SRT,
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