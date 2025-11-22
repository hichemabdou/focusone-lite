"use client";

import { useState, useRef, useEffect } from "react";

type SelectOption = {
    id: string;
    name: string;
    color?: string;
    description?: string;
};

type EnhancedSelectProps = {
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    allowCreate?: boolean;
    onCreateNew?: (name: string, color?: string) => void;
    label?: string;
    disabled?: boolean;
    type?: "category" | "priority" | "status" | "default";
};

export default function EnhancedSelect({
    value,
    options,
    onChange,
    placeholder = "Select...",
    allowCreate = false,
    onCreateNew,
    label,
    disabled = false,
    type = "default",
}: EnhancedSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((opt) =>
        opt.id === value || opt.name.toUpperCase() === value.toUpperCase()
    );

    // Filter options based on search query
    const filteredOptions = options.filter((opt) =>
        opt.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery("");
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
                break;
            case "Enter":
                e.preventDefault();
                if (filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex]);
                } else if (allowCreate && searchQuery.trim()) {
                    handleCreateNew();
                }
                break;
            case "Escape":
                e.preventDefault();
                setIsOpen(false);
                setSearchQuery("");
                break;
        }
    };

    const handleSelect = (option: SelectOption) => {
        onChange(option.name);
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(0);
    };

    const handleCreateNew = () => {
        if (onCreateNew && searchQuery.trim()) {
            // Generate a default color for new categories
            const defaultColor = type === "category"
                ? `hsl(${Math.random() * 360}, 65%, 55%)`
                : undefined;
            onCreateNew(searchQuery.trim(), defaultColor);
            setIsOpen(false);
            setSearchQuery("");
        }
    };

    const getColorIndicator = (option: SelectOption) => {
        if (!option.color) return null;

        return (
            <span
                className="enhanced-select__color-indicator"
                style={{ backgroundColor: option.color }}
            />
        );
    };

    return (
        <div className="enhanced-select-wrapper">
            {label && <label className="enhanced-select__label">{label}</label>}

            <div
                ref={dropdownRef}
                className={`enhanced-select ${isOpen ? "enhanced-select--open" : ""} ${disabled ? "enhanced-select--disabled" : ""
                    } enhanced-select--${type}`}
            >
                <button
                    type="button"
                    className="enhanced-select__trigger"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <div className="enhanced-select__value">
                        {selectedOption ? (
                            <>
                                {getColorIndicator(selectedOption)}
                                <span className="enhanced-select__value-text">
                                    {selectedOption.name}
                                </span>
                            </>
                        ) : (
                            <span className="enhanced-select__placeholder">{placeholder}</span>
                        )}
                    </div>
                    <svg
                        className="enhanced-select__arrow"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                    >
                        <path
                            d="M3 4.5L6 7.5L9 4.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                {isOpen && (
                    <div className="enhanced-select__dropdown">
                        {(options.length > 5 || allowCreate) && (
                            <div className="enhanced-select__search">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    className="enhanced-select__search-input"
                                    placeholder={`Search ${type}...`}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setHighlightedIndex(0);
                                    }}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                        )}

                        <div className="enhanced-select__options" role="listbox">
                            {filteredOptions.map((option, index) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    className={`enhanced-select__option ${index === highlightedIndex ? "enhanced-select__option--highlighted" : ""
                                        } ${selectedOption?.id === option.id ? "enhanced-select__option--selected" : ""
                                        }`}
                                    onClick={() => handleSelect(option)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    role="option"
                                    aria-selected={selectedOption?.id === option.id}
                                >
                                    {getColorIndicator(option)}
                                    <div className="enhanced-select__option-content">
                                        <span className="enhanced-select__option-name">{option.name}</span>
                                        {option.description && (
                                            <span className="enhanced-select__option-description">
                                                {option.description}
                                            </span>
                                        )}
                                    </div>
                                    {selectedOption?.id === option.id && (
                                        <svg
                                            className="enhanced-select__check"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                        >
                                            <path
                                                d="M13 4L6 11L3 8"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </button>
                            ))}

                            {filteredOptions.length === 0 && !allowCreate && (
                                <div className="enhanced-select__empty">No options found</div>
                            )}

                            {allowCreate && searchQuery.trim() && (
                                <button
                                    type="button"
                                    className="enhanced-select__create"
                                    onClick={handleCreateNew}
                                >
                                    <span className="enhanced-select__create-icon">+</span>
                                    <span>Create "{searchQuery}"</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
