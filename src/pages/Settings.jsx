import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    subscribeToTypesWithIds,
    subscribeToUnitsWithIds,
    addType,
    addUnit,
    deleteType,
    deleteUnit
} from '../services/firestoreService';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";

import { App } from '@capacitor/app';

const Settings = () => {
    const navigate = useNavigate();
    const [types, setTypes] = useState([]);
    const [units, setUnits] = useState([]);
    const [newType, setNewType] = useState('');
    const [newUnit, setNewUnit] = useState('');
    const [loading, setLoading] = useState({ type: false, unit: false });
    const [appVersion, setAppVersion] = useState('1.0.0');

    useEffect(() => {
        const getAppVersion = async () => {
            try {
                const info = await App.getInfo();
                setAppVersion(`${info.version} (${info.build})`);
            } catch (error) {
                console.log('Error getting app info:', error);
                // Fallback for web dev if needed, though 1.0.0 default is fine
            }
        };
        getAppVersion();
    }, []);

    useEffect(() => {
        const unsubscribeTypes = subscribeToTypesWithIds((fetchedTypes) => {
            setTypes(fetchedTypes);
        });

        const unsubscribeUnits = subscribeToUnitsWithIds((fetchedUnits) => {
            setUnits(fetchedUnits);
        });

        return () => {
            unsubscribeTypes();
            unsubscribeUnits();
        };
    }, []);

    const handleAddType = async (e) => {
        e.preventDefault();
        if (!newType.trim()) return;

        setLoading({ ...loading, type: true });
        try {
            await addType(newType.trim());
            setNewType('');
        } catch (error) {
            alert('Failed to add type');
        } finally {
            setLoading({ ...loading, type: false });
        }
    };

    const handleAddUnit = async (e) => {
        e.preventDefault();
        if (!newUnit.trim()) return;

        setLoading({ ...loading, unit: true });
        try {
            await addUnit(newUnit.trim());
            setNewUnit('');
        } catch (error) {
            alert('Failed to add unit');
        } finally {
            setLoading({ ...loading, unit: false });
        }
    };

    const handleDeleteType = async (id) => {
        if (!confirm('Are you sure you want to delete this type?')) return;

        try {
            await deleteType(id);
        } catch (error) {
            alert('Failed to delete type');
        }
    };

    const handleDeleteUnit = async (id) => {
        if (!confirm('Are you sure you want to delete this unit?')) return;

        try {
            await deleteUnit(id);
        } catch (error) {
            alert('Failed to delete unit');
        }
    };

    return (
        <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 p-4 shadow-md sticky top-0 z-10 flex items-center gap-4 text-gray-800 dark:text-gray-200">
                <button onClick={() => navigate(-1)} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition">
                    <ArrowLeft />
                </button>
                <h1 className="text-xl font-medium">Settings</h1>
            </header>

            <main className="p-6 max-w-2xl mx-auto space-y-8">
                {/* Item Types Section */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Item Categories</h2>

                    <form onSubmit={handleAddType} className="flex gap-2 mb-4">
                        <Input
                            type="text"
                            value={newType}
                            onChange={(e) => setNewType(e.target.value)}
                            placeholder="Add new category..."
                            className="flex-1"
                        />
                        <button
                            type="submit"
                            disabled={loading.type || !newType.trim()}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add
                        </button>
                    </form>

                    <div className="space-y-2">
                        {types.length === 0 ? (
                            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No categories yet</p>
                        ) : (
                            types.map((type) => (
                                <div
                                    key={type.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                >
                                    <span className="text-gray-800 dark:text-gray-200">{type.name}</span>
                                    <button
                                        onClick={() => handleDeleteType(type.id)}
                                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Units Section */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Units</h2>

                    <form onSubmit={handleAddUnit} className="flex gap-2 mb-4">
                        <Input
                            type="text"
                            value={newUnit}
                            onChange={(e) => setNewUnit(e.target.value)}
                            placeholder="Add new unit..."
                            className="flex-1"
                        />
                        <button
                            type="submit"
                            disabled={loading.unit || !newUnit.trim()}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add
                        </button>
                    </form>

                    <div className="space-y-2">
                        {units.length === 0 ? (
                            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No units yet</p>
                        ) : (
                            units.map((unit) => (
                                <div
                                    key={unit.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                >
                                    <span className="text-gray-800 dark:text-gray-200">{unit.name}</span>
                                    <button
                                        onClick={() => handleDeleteUnit(unit.id)}
                                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <div className="text-center pt-8 pb-4">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        App Version {appVersion}
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Settings;
