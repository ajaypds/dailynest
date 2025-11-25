import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    items: [],
    loading: false,
    error: null,
};

const itemsSlice = createSlice({
    name: 'items',
    initialState,
    reducers: {
        setItems: (state, action) => {
            state.items = action.payload;
            state.loading = false;
        },
        setItemsLoading: (state, action) => {
            state.loading = action.payload;
        },
        setItemsError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const { setItems, setItemsLoading, setItemsError } = itemsSlice.actions;

import { createSelector } from '@reduxjs/toolkit';

export const selectAllItems = (state) => state.items.items;

export const selectPendingItems = createSelector(
    [selectAllItems],
    (items) => items.filter(item => item.status === 'pending')
);

export const selectCompletedItems = createSelector(
    [selectAllItems],
    (items) => items.filter(item => item.status === 'completed')
);
export const selectItemsLoading = (state) => state.items.loading;

export default itemsSlice.reducer;
