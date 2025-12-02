import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCompletedItems, updateItem, subscribeToTypes } from '../services/firestoreService';
import { useHousehold } from '../context/HouseholdContext';
import { setItems, selectCompletedItems } from '../features/items/itemsSlice';
import { ArrowLeft, ShoppingBag, Pencil, Save, X, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

const CompletedItems = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    // We'll manage local items state for pagination instead of redux for this specific view
    // to avoid complex merging logic in redux for now, or we can sync.
    // Let's use local state for simplicity as per plan.
    const [items, setLocalItems] = useState([]);
    const { currentHousehold } = useHousehold();

    const [types, setTypes] = useState(['Grocery']);
    const [editingId, setEditingId] = useState(null);
    const [editType, setEditType] = useState('');

    // Pagination state
    const [lastDoc, setLastDoc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef();

    useEffect(() => {
        if (!currentHousehold) return;

        const unsubscribeTypes = subscribeToTypes((fetchedTypes) => {
            setTypes(fetchedTypes);
        }, currentHousehold.id);

        // Reset state when household changes
        setLocalItems([]);
        setLastDoc(null);
        setHasMore(true);
        // We need to trigger loadItems, but loadItems depends on state which might not be updated yet.
        // So we can just rely on the effect below or call a reset function.

        // Actually, let's just reset here and let the next effect or the observer trigger load.
        // But observer might not trigger if list is empty and sentinel is visible? 
        // Let's manually trigger loadItems after a small delay or state update.

        // Better approach: Add currentHousehold to dependency of a new effect that resets and loads.

    }, [currentHousehold]);

    useEffect(() => {
        if (currentHousehold) {
            loadItems(true); // true for reset
        }
        return () => {
            // cleanup if needed
        };
    }, [currentHousehold]);

    // We need to modify the original useEffect to not run on mount if we handle it here,
    // or just let it be. The original one had [] dependency.
    // Let's remove the original [] effect and split it.


    const loadItems = async (reset = false) => {
        if (!currentHousehold) return;
        if (loading || (!hasMore && !reset)) return;

        setLoading(true);
        try {
            const { items: newItems, lastDoc: newLastDoc } = await fetchCompletedItems({
                lastDoc: reset ? null : lastDoc,
                pageSize: 20,
                householdId: currentHousehold.id
            });

            if (newItems.length < 20) {
                setHasMore(false);
            }

            setLocalItems(prev => {
                if (reset) return newItems;
                // Deduplicate items to prevent double rendering
                const existingIds = new Set(prev.map(i => i.id));
                const uniqueNewItems = newItems.filter(i => !existingIds.has(i.id));
                return [...prev, ...uniqueNewItems];
            });
            setLastDoc(newLastDoc);
            if (reset) setHasMore(newItems.length >= 20);
        } catch (error) {
            console.error("Failed to load items", error);
        } finally {
            setLoading(false);
        }
    };

    const lastItemElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadItems();
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setEditType(item.type);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditType('');
    };

    const handleSaveEdit = async () => {
        if (!editType) return;

        try {
            await updateItem(editingId, {
                type: editType
            });

            // Update local state
            setLocalItems(prev => prev.map(item =>
                item.id === editingId ? { ...item, type: editType } : item
            ));

            setEditingId(null);
        } catch (error) {
            console.error("Failed to update item category", error);
            alert("Failed to update item category");
        }
    };

    const groupedItems = useMemo(() => {
        const groups = {};
        items.forEach(item => {
            const date = item.purchasedAt?.toDate ? item.purchasedAt.toDate() : new Date(item.purchasedAt);
            const dateKey = dayjs(date).format('YYYY-MM-DD');
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(item);
        });

        return Object.keys(groups).sort((a, b) => dayjs(b).diff(dayjs(a))).map(date => {
            const groupItems = groups[date];
            const total = groupItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
            return {
                date,
                items: groupItems,
                total
            };
        });
    }, [items]);

    const getDateLabel = (dateString) => {
        const date = dayjs(dateString);
        if (date.isToday()) return 'Today';
        if (date.isYesterday()) return 'Yesterday';
        return date.format('MMMM D, YYYY');
    };

    return (
        <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 p-4 shadow-md sticky top-0 z-10 flex items-center gap-4 text-gray-800 dark:text-gray-200">
                <button onClick={() => navigate(-1)} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition">
                    <ArrowLeft />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-xl font-medium">Purchase History</h1>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{currentHousehold?.name}</span>
                </div>
            </header>

            <main className="p-4 space-y-6 pb-20">
                {items.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                        <ShoppingBag size={48} className="mb-4 opacity-20" />
                        <p>No completed purchases yet.</p>
                    </div>
                ) : (
                    <>
                        {groupedItems.map((group) => (
                            <div key={group.date} className="space-y-3">
                                <div className="sticky top-16 bg-gray-50 dark:bg-gray-900 py-1 z-0 flex justify-between items-center px-1">
                                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                        {getDateLabel(group.date)}
                                    </h2>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        ₹{group.total.toLocaleString()}
                                    </span>
                                </div>
                                {group.items.map((item) => (
                                    <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
                                                    {editingId !== item.id && (
                                                        <button
                                                            onClick={() => handleEditClick(item)}
                                                            className="text-gray-300 dark:text-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                    )}
                                                </div>

                                                {editingId === item.id ? (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="w-40">
                                                            <Select value={editType} onValueChange={setEditType}>
                                                                <SelectTrigger className="h-8 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                                                        >
                                                            <Save size={16} />
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">{item.type}</span>
                                                        <span>•</span>
                                                        <span>{item.quantity} {item.unit}</span>
                                                    </div>
                                                )}

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
                        ))}

                        {/* Sentinel element for infinite scroll */}
                        <div ref={lastItemElementRef} className="h-10 flex items-center justify-center">
                            {loading && <Loader2 className="animate-spin text-primary-500" />}
                            {!hasMore && items.length > 0 && (
                                <p className="text-xs text-gray-400">No more items</p>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default CompletedItems;
