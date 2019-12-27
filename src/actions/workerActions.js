import { RECEIVED_STATE } from "./types";

export const onUpdate = state => dispatch => {
    dispatch({
        type: RECEIVED_STATE,
        state: state
    })
}