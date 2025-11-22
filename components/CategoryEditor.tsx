"use client";

import { useState } from "react";
import { useCustomization } from "./CustomizationContext";
import Modal from "./Modal";
import { X, Plus, Check } from "lucide-react";

type Props = {
    open: boolean;
    category?: { id: string; name: string; color: string } | null;
    onClose: () => void;
    onSave: () => void;
};

const PRESET_COLORS = [
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#f59e0b", // amber
    "#10b981", // emerald
    "#06b6d4", // cyan
    "#f97316", // orange
    "#ef4444", // red
    "#6366f1", // indigo
    "#14b8a6", // teal
];

export default function CategoryEditor({ open, category, onClose, onSave }: Props) {
    const { categories, updateCategories } = useCustomization();
    const [name, setName] = useState(category?.name || "");
    const [color, setColor] = useState(category?.color || PRESET_COLORS[0]);
    const [error, setError] = useState("");

    const isEditing = !!category;

    const handleSave = async () => {
        if (!name.trim()) {
            setError("Category name is required");
            return;
        }

        // Check for duplicate names (excluding current category if editing)
        const duplicate = categories.find(
            (c) => c.name.toLowerCase() === name.trim().toLowerCase() &&
                (!isEditing || c.id !== category.id)
        );

        if (duplicate) {
            setError("A category with this name already exists");
            return;
        }

        let newCategories;

        if (isEditing) {
            // Update existing category
            newCategories = categories.map((c) =>
                c.id === category.id ? { ...c, name: name.trim(), color } : c
            );
        } else {
            // Add new category
            const newCategory = {
                id: name.trim().toLowerCase().replace(/\s+/g, "-"),
                name: name.trim(),
                color,
            };
            newCategories = [...categories, newCategory];
        }

        await updateCategories(newCategories);
        onSave();
        handleClose();
    };

    const handleClose = () => {
        setName("");
        setColor(PRESET_COLORS[0]);
        setError("");
        onClose();
    };

    if (!open) return null;

    return (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && handleClose()}>
            <div className="modal-content" style={{ minWidth: "450px" }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditing ? "Edit Category" : "Add New Category"}
                    </h2>
                    <button onClick={handleClose} className="modal-close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Category Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError("");
                            }}
                            placeholder="e.g., Finance, Health, Career"
                            className="form-input"
                            autoFocus
                        />
                        {error && <p className="form-error">{error}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Color</label>
                        <div className="color-picker">
                            {PRESET_COLORS.map((presetColor) => (
                                <button
                                    key={presetColor}
                                    className={`color-swatch ${color === presetColor ? "color-swatch--selected" : ""}`}
                                    style={{ backgroundColor: presetColor }}
                                    onClick={() => setColor(presetColor)}
                                    type="button"
                                />
                            ))}
                        </div>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="color-input-native"
                        />
                    </div>

                    <div className="category-preview">
                        <p className="text-xs text-muted mb-2">Preview:</p>
                        <div className="chip" style={{ backgroundColor: `${color}20`, borderColor: color }}>
                            <div className="chip__dot" style={{ backgroundColor: color }} />
                            <span style={{ color }}>{name || "Category Name"}</span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={handleClose} className="btn btn--ghost">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="btn btn--primary">
                        {isEditing ? (
                            <>
                                <Check className="w-4 h-4" />
                                Save Changes
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Add Category
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
