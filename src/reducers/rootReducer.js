import {
  ADD_URL,
  DELETE_URL,
  EDIT_URL,
  EDIT_USR,
  EDIT_STR,
  EDIT_END,
  EDIT_REF,
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
        block_urls: state.block_urls.map(aUrl => {
          if (aUrl.id === action.id) {
            aUrl.dns = action.dns ? action.dns : aUrl.dns;
            aUrl.maxvisits = action.maxvisits
              ? action.maxvisits
              : aUrl.maxvisits;
          }
          return aUrl;
        })
      };
    case EDIT_USR:
      return {
        ...state,
        user_email: action.email
      }
    case EDIT_REF:
      return {
        ...state,
        ref_email: action.email
      }
    case EDIT_STR:
      return {
        ...state,
        start_time: action.time
      }
    case EDIT_END:
      return {
        ...state,
        end_time: action.time
      }
    case CHANGE_PAGE:
      return {
        ...state,
        currentPageNum: action.pageNum
      };
    case RECEIVED_STATE:
      var initState = action.state;
      if (!initState.block_urls) initState.block_urls = [];
      if (!initState.currentPageNum) initState.currentPageNum = state.currentPageNum;
      return initState;
    default:
      return state;
  }
};

export default rootReducer;
