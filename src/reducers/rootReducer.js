import {
  ADD_URL,
  DELETE_URL,
  EDIT_URL,
  CHANGE_PAGE,
  RECEIVED_STATE
} from "../actions/types";

const rootReducer = (state, action) => {
  console.log("State: ", state, "\nAction: \n", action);
  switch (action.type) {
    case ADD_URL:
      return {
        ...state,
        block_urls: [...state.block_urls, action.url]
      };
    case DELETE_URL:
      return {
        ...state,
        block_urls: state.block_urls.filter(e => e.id !== action.id)
      };
    case EDIT_URL:
      return {
        ...state,
        block_urls: state.block_urls.map(url => {
          if (url.id === action.id) {
            url.dns = action.dns ? action.dns : url.dns;
            url.maxvisits = action.maxvisits ? action.maxvisits : url.maxvisits;
          }
          return url;
        })
      };
    case CHANGE_PAGE:
      return {
        ...state,
        currentPageNum: action.pageNum
      };
    case RECEIVED_STATE:
      var initState = action.state;
      if (!initState.block_urls) initState.block_urls = [];
      if (!initState.currentPageNum) initState.currentPageNum = 0;
      return initState;
    default:
      return state;
  }
};

export default rootReducer;
