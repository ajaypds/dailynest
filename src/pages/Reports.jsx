import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, PieChart, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';

const Reports = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState([]);
    const [total, setTotal] = useState(0);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        const fetchExpenses = async () => {
            setLoading(true);
            try {
                const start = dayjs(selectedDate).startOf('month').toDate();
                const end = dayjs(selectedDate).endOf('month').toDate();

                const q = query(
                    collection(db, 'items'),
                    where('status', '==', 'completed'),
                    where('purchasedAt', '>=', start),
                    where('purchasedAt', '<=', end),
                    orderBy('purchasedAt', 'desc')
                );

                const snapshot = await getDocs(q);
                const items = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setExpenses(items);
                const sum = items.reduce((acc, item) => acc + (item.price || 0), 0);
                setTotal(sum);
            } catch (error) {
                console.error('Error fetching expenses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExpenses();
    }, [selectedDate]);

    const handlePrevMonth = () => {
        setSelectedDate(dayjs(selectedDate).subtract(1, 'month').toDate());
    };

    const handleNextMonth = () => {
        setSelectedDate(dayjs(selectedDate).add(1, 'month').toDate());
    };

    const groupedExpenses = expenses.reduce((acc, expense) => {
        const category = expense.type || 'Other';
        if (!acc[category]) {
            acc[category] = { total: 0, count: 0 };
        }
        acc[category].total += expense.price || 0;
        acc[category].count += 1;
        return acc;
    }, {});

    return (
        <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 p-4 shadow-md sticky top-0 z-10 flex items-center gap-4 text-gray-800 dark:text-gray-200">
                <button onClick={() => navigate(-1)} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition">
                    <ArrowLeft />
                </button>
                <h1 className="text-xl font-medium">Expense Reports</h1>
            </header>

            <main className="p-4 space-y-6">
                {/* Month Selector */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-700 dark:text-gray-300"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {dayjs(selectedDate).format('MMMM YYYY')}
                        </h2>
                        <button
                            onClick={handleNextMonth}
                            disabled={dayjs(selectedDate).isAfter(dayjs(), 'month')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Total */}
                <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <PieChart size={24} />
                        <h3 className="text-sm font-medium opacity-90">Total Expenses</h3>
                    </div>
                    <p className="text-4xl font-bold">₹{total.toFixed(2)}</p>
                    <p className="text-sm opacity-75 mt-1">{expenses.length} transactions</p>
                </div>

                {/* Category Breakdown */}
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-primary-500" size={32} />
                    </div>
                ) : Object.keys(groupedExpenses).length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No expenses for this month
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">By Category</h3>
                        <div className="space-y-3">
                            {Object.entries(groupedExpenses)
                                .sort(([, a], [, b]) => b.total - a.total)
                                .map(([category, data]) => (
                                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{category}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{data.count} items</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-gray-100">₹{data.total.toFixed(2)}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {((data.total / total) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Reports;
