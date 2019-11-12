import { CHANGE_PAGE } from "./types";

export const gotoPage = pageNum => dispatch => {
  dispatch({
    type: CHANGE_PAGE,
    pageNum: pageNum
  });
};
