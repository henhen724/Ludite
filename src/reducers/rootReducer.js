import { ADD_URL, DELETE_URL, EDIT_URL, CHANGE_PAGE } from "../actions/types";

const initState = {
  block_urls: [{ id: 0, dns: "facebook.com", visits: 0, maxvisits: 0 }],
  currentPageNum: 0
};

const rootReducer = (state = initState, action) => {
  console.log(state);
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
    default:
      return state;
  }
};

export default rootReducer;
