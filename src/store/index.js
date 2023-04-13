import { messages } from "modules/avl-components/src";

import { Reducers } from "modules/ams/src";

import data_manager from "pages/DataManager/store";

import { configureStore } from "@reduxjs/toolkit";


// export default createStore(reducer, applyMiddleware(thunk))
export default configureStore({
  reducer: {
    data_manager,
    ...Reducers,
    messages,
  },
});

