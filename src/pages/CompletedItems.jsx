import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { subscribeToCompletedItems } from '../services/firestoreService';
import { setItems, selectCompletedItems } from '../features/items/itemsSlice';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import dayjs from 'dayjs';

const CompletedItems = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const items = useSelector(selectCompletedItems);

    useEffect(() => {
        const unsubscribe = subscribeToCompletedItems((fetchedItems) => {
            dispatch(setItems(fetchedItems));
        });
        return () => unsubscribe();
    }, [dispatch]);

    return (
        <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 p-4 shadow-md sticky top-0 z-10 flex items-center gap-4 text-gray-800 dark:text-gray-200">
                <button onClick={() => navigate(-1)} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition">
                    <ArrowLeft />
                </button>
                <h1 className="text-xl font-medium">Purchase History</h1>
            </header>

            <main className="p-4 space-y-4">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                        <ShoppingBag size={48} className="mb-4 opacity-20" />
                        <p>No completed purchases yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">{item.type}</span>
                                            <span>•</span>
                                            <span>{item.quantity} {item.unit}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Bought on {dayjs(item.purchasedAt?.toDate ? item.purchasedAt.toDate() : item.purchasedAt).format('MMM D, YYYY')}
                                        </p>
                                        {item.note && (
                                            <p className="text-xs text-gray-400 mt-1 italic">"{item.note}"</p>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <span className="block text-lg font-bold text-green-600">₹{item.price}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CompletedItems;
