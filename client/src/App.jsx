import { useEffect, useMemo, useRef, useState } from 'react';
import logoText from '../assets/images/KaIkenaMenus-Text-No-Background.png';
import logoTextCheddar from '../assets/images/KaIkenaMenus-Cheddar.png';
import logoTextSolid from '../assets/images/KaIkenaMenus-Text.png';
import logoNoText from '../assets/images/KaIkenaMenus-NoText.png';
import logoCheddarSmilingTransparent from '../assets/images/KaIkenaMenus-Cheddar-Smiling-Transparent.png';
import logoCheddarSmiling from '../assets/images/KaIkenaMenus-Cheddar-Smiling.png';

const CATEGORY_ORDER = ['appetizer', 'main', 'side', 'dessert', 'drink'];

const categoryLabels = {
appetizer: 'Appetizers',
main: 'Mains',
side: 'Sides',
dessert: 'Desserts',
drink: 'Drinks',
};

const suggestedDishCategories = [
    { value: 'appetizer', label: 'Appetizer' },
    { value: 'main', label: 'Main dish' },
    { value: 'side', label: 'Side' },
    { value: 'dessert', label: 'Dessert' },
];

const initialForm = {
guests: '8',
    meal: 'dinner',
theme: 'Mediterranean garden dinner',
avoidances: '',
};

function createDishIdea() {
    return {
    id: crypto.randomUUID(),
    idea: '',
    category: 'appetizer',
    };
}

const printLogoOptions = [
{ id: 'text-no-background', label: 'Ka Ikena Text (No Background)', src: logoText },
{ id: 'cheddar', label: 'Ka Ikena Cheddar', src: logoTextCheddar },
{ id: 'text-solid', label: 'Ka Ikena Text', src: logoTextSolid },
{ id: 'no-text', label: 'Ka Ikena (No Text)', src: logoNoText },
{ id: 'cheddar-smiling-transparent', label: 'Ka Ikena Cheddar Smiling (Transparent)', src: logoCheddarSmilingTransparent },
{ id: 'cheddar-smiling', label: 'Ka Ikena Cheddar Smiling', src: logoCheddarSmiling },
];

export default function App() {
const [form, setForm] = useState(initialForm);
const [recipes, setRecipes] = useState([]);
const [error, setError] = useState('');
const [printError, setPrintError] = useState('');
const [saveStatus, setSaveStatus] = useState('');
const [selectedPrintLogoId, setSelectedPrintLogoId] = useState(printLogoOptions[0].id);
const [isLoading, setIsLoading] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [expandedRecipeIds, setExpandedRecipeIds] = useState([]);
const [selectedRecipeIds, setSelectedRecipeIds] = useState([]);
const [savedMenus, setSavedMenus] = useState([]);
const [isFetchingMenus, setIsFetchingMenus] = useState(false);
const [savedMenusError, setSavedMenusError] = useState('');
const [showSavedMenus, setShowSavedMenus] = useState(false);
const [dishIdeas, setDishIdeas] = useState([createDishIdea()]);
const dishIdeaInputRefs = useRef(new Map());
const [focusedDishIdeaId, setFocusedDishIdeaId] = useState('');
const [activeTab, setActiveTab] = useState('menu');
const [beverageMenu, setBeverageMenu] = useState(null);
const [beverageFileName, setBeverageFileName] = useState('');
const [beverageError, setBeverageError] = useState('');
const [beveragePrintError, setBeveragePrintError] = useState('');
const beverageFileInputRef = useRef(null);

const groupedRecipes = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
    category,
    recipes: recipes.filter((recipe) => recipe.category === category),
    })).filter((group) => group.recipes.length > 0);
}, [recipes]);

const selectedRecipes = useMemo(() => {
    return recipes.filter((recipe) => selectedRecipeIds.includes(recipe.id));
}, [recipes, selectedRecipeIds]);

const groupedSelectedRecipes = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
    category,
    recipes: selectedRecipes.filter((recipe) => recipe.category === category),
    })).filter((group) => group.recipes.length > 0);
}, [selectedRecipes]);

const selectedPrintLogo = useMemo(() => {
    return printLogoOptions.find((option) => option.id === selectedPrintLogoId) || printLogoOptions[0];
}, [selectedPrintLogoId]);

function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
    ...current,
    [name]: value,
    }));
}

function addDishIdea() {
    const nextDishIdea = createDishIdea();
    setDishIdeas((current) => [...current, nextDishIdea]);
    setFocusedDishIdeaId(nextDishIdea.id);
}

function removeDishIdea(id) {
    setDishIdeas((current) => (current.length > 1 ? current.filter((idea) => idea.id !== id) : current));
}

function updateDishIdea(id, field, value) {
    setDishIdeas((current) => current.map((idea) => (
    idea.id === id ? { ...idea, [field]: value } : idea
    )));
}

useEffect(() => {
    if (!focusedDishIdeaId) {
    return;
    }

    const targetInput = dishIdeaInputRefs.current.get(focusedDishIdeaId);

    if (targetInput) {
    targetInput.focus();
    }

    setFocusedDishIdeaId('');
}, [focusedDishIdeaId]);

function toggleRecipeDetails(recipeId) {
    setExpandedRecipeIds((current) =>
    current.includes(recipeId)
        ? current.filter((id) => id !== recipeId)
        : [...current, recipeId]
    );
}

function toggleRecipeSelection(recipeId) {
    setSelectedRecipeIds((current) =>
    current.includes(recipeId)
        ? current.filter((id) => id !== recipeId)
        : [...current, recipeId]
    );
}

function escapeHtml(text) {
    return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function promptMenuHeaderDetails() {
    const welcomeName = window.prompt('Who would you like to welcome?', '');

    if (welcomeName === null) {
    return null;
    }

    const welcomePlace = window.prompt('Welcome them to where?', '');

    if (welcomePlace === null) {
    return null;
    }

    const eventDate = window.prompt('What is the custom date of the event?', '');

    if (eventDate === null) {
    return null;
    }

    return {
    eventDate: eventDate.trim(),
    welcomeName: welcomeName.trim(),
    welcomePlace: welcomePlace.trim(),
    };
}

function buildMenuHeaderPage(details, selectedLogo) {
    return `
    <section class="print-header-page">
        <div class="print-header-shell">
        <img class="print-header-logo" src="${escapeHtml(selectedLogo.src)}" alt="${escapeHtml(selectedLogo.label)}" />
        <p class="print-header-eyebrow">Selected Menu</p>
        <h1 class="print-header-title">
            <span class="print-header-title-line">Greetings to,</span>
            <span class="print-header-title-line">${escapeHtml(details.welcomeName || 'Our Guests')}</span>
            <span class="print-header-title-line">at ${escapeHtml(details.welcomePlace || 'This Celebration')}</span>
        </h1>
        <p class="print-header-date">${escapeHtml(details.eventDate || 'Event date to be announced')}</p>
        </div>
    </section>
    `;
}

function printDocument(title, bodyHtml) {
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
    return false;
    }

    printWindow.document.write(`
    <!doctype html>
    <html>
        <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
            @page {
            margin: 0;
            }
            body {
            font-family: Georgia, 'Times New Roman', serif;
            color: #2e190d;
            margin: 12mm;
            }
            h1, h2, h3 {
            margin-bottom: 0.4rem;
            }
            h1 {
            font-size: 24px;
            }
            h2 {
            font-size: 18px;
            margin-top: 20px;
            border-top: 1px solid #e4d2bc;
            padding-top: 14px;
            }
            h3 {
            font-size: 16px;
            margin-top: 16px;
            }
            p, li {
            font-size: 14px;
            line-height: 1.45;
            }
            .print-header-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            page-break-after: always;
            }
            .print-header-shell {
            max-width: 640px;
            width: 100%;
            padding: 32px;
            text-align: center;
            border: 2px solid #e4d2bc;
            border-radius: 24px;
            background: linear-gradient(180deg, #fffaf2 0%, #f7ebdc 100%);
            box-shadow: 0 12px 28px rgba(73, 45, 20, 0.1);
            }
            .print-header-logo {
            display: block;
            width: min(260px, 70%);
            height: auto;
            margin: 0 auto 18px;
            }
            .print-header-eyebrow {
            margin: 0 0 12px;
            color: #9c4f2a;
            font-family: Arial, sans-serif;
            font-size: 0.8rem;
            font-weight: 700;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            }
            .print-header-title {
            margin: 0;
            color: #2e190d;
            font-size: 28px;
            line-height: 1.25;
            }
            .print-header-title-line {
            display: block;
            }
            .print-header-title-line + .print-header-title-line {
            margin-top: 6px;
            }
            .print-header-date {
            margin: 18px 0 0;
            color: #6b3418;
            font-family: Arial, sans-serif;
            font-size: 1rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            }
            ul, ol {
            margin-top: 6px;
            }
            .meta {
            color: #7a5c45;
            margin-top: 0;
            }
            .recipe {
            page-break-inside: avoid;
            margin-bottom: 18px;
            }
        </style>
        </head>
        <body>
        ${bodyHtml}
        </body>
    </html>
    `);
    printWindow.document.close();

    printWindow.addEventListener('afterprint', () => {
    printWindow.close();
    }, { once: true });

    window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    }, 100);

    return true;
}

function handlePrintSelectedMenu() {
    if (!selectedRecipes.length) {
    setPrintError('Select at least one recipe before printing the menu.');
    return;
    }

    setPrintError('');

    const headerDetails = promptMenuHeaderDetails();

    if (!headerDetails) {
    return;
    }

    const menuSections = groupedSelectedRecipes
    .map((group) => {
        const items = group.recipes
        .map((recipe) => `<li><strong>${escapeHtml(recipe.name)}</strong> - ${escapeHtml(recipe.description)}</li>`)
        .join('');

        return `
        <section>
            <h2>${escapeHtml(categoryLabels[group.category] || group.category)}</h2>
            <ul>${items}</ul>
        </section>
        `;
    })
    .join('');

    const menuHeaderPage = buildMenuHeaderPage(headerDetails, selectedPrintLogo);

    const didOpen = printDocument(
    'Selected Menu',
    `${menuHeaderPage}${menuSections}`
    );

    if (!didOpen) {
    setPrintError('Unable to open the print window. Please allow pop-ups and try again.');
    }
}

function handlePrintSelectedRecipes() {
    if (!selectedRecipes.length) {
    setPrintError('Select at least one recipe before printing recipes.');
    return;
    }

    setPrintError('');

    const recipesHtml = selectedRecipes
    .map((recipe) => {
        const ingredientItems = recipe.ingredients
        .map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`)
        .join('');
        const instructionItems = recipe.instructions
        .map((step) => `<li>${escapeHtml(step)}</li>`)
        .join('');

        return `
        <article class="recipe">
            <h2>${escapeHtml(recipe.name)}</h2>
            <p class="meta">${escapeHtml(categoryLabels[recipe.category] || recipe.category)} | Prep: ${escapeHtml(recipe.prepTime)} | Cook: ${escapeHtml(recipe.cookTime)} | Serves ${escapeHtml(recipe.servings)}</p>
            <p>${escapeHtml(recipe.description)}</p>
            <h3>Ingredients</h3>
            <ul>${ingredientItems}</ul>
            <h3>Instructions</h3>
            <ol>${instructionItems}</ol>
        </article>
        `;
    })
    .join('');

    const didOpen = printDocument('Selected Recipes', recipesHtml);

    if (!didOpen) {
    setPrintError('Unable to open the print window. Please allow pop-ups and try again.');
    }
}

async function handleSaveMenu() {
    if (!recipes.length) {
    setSaveStatus('Generate a menu before saving.');
    return;
    }

    setIsSaving(true);
    setSaveStatus('');

    try {
    const response = await fetch('/api/menus', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        guests: Number(form.guests),
        meal: form.meal,
        theme: form.theme.trim(),
        avoidances: form.avoidances.trim(),
        recipes,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Unable to save menu right now.');
    }

    setSaveStatus(`Menu saved successfully (ID: ${data.id}).`);
    } catch (saveError) {
    setSaveStatus(saveError.message);
    } finally {
    setIsSaving(false);
    }
}

function handleBeverageFileUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
    return;
    }

    setBeverageError('');
    setBeveragePrintError('');
    setBeverageFileName(file.name);

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
    try {
        const parsed = JSON.parse(readerEvent.target.result);

        if (!Array.isArray(parsed?.headers)) {
        throw new Error('JSON must have a top-level "headers" array.');
        }

        for (const header of parsed.headers) {
        if (typeof header?.title !== 'string' || !header.title.trim()) {
            throw new Error('Each header must have a non-empty "title" string.');
        }

        if (!Array.isArray(header?.beverages)) {
            throw new Error(`Header "${header.title}" must have a "beverages" array.`);
        }
        }

        setBeverageMenu(parsed.headers);
    } catch (parseError) {
        setBeverageError(parseError.message);
        setBeverageMenu(null);
    }
    };

    reader.onerror = () => {
    setBeverageError('Failed to read the file. Please try again.');
    setBeverageMenu(null);
    };

    reader.readAsText(file);
}

function handleClearBeverageMenu() {
    setBeverageMenu(null);
    setBeverageFileName('');
    setBeverageError('');
    setBeveragePrintError('');

    if (beverageFileInputRef.current) {
    beverageFileInputRef.current.value = '';
    }
}

function handlePrintBeverageMenu() {
    if (!beverageMenu?.length) {
    setBeveragePrintError('Load a beverage menu file before printing.');
    return;
    }

    setBeveragePrintError('');

    const sectionsHtml = beverageMenu
    .map((header) => {
        const beveragesHtml = (header.beverages || [])
        .map((beverage) => {
            const descriptionHtml = beverage.description
            ? `<p class="bev-description">${escapeHtml(beverage.description)}</p>`
            : '';

            return `<li class="bev-item"><strong>${escapeHtml(beverage.title)}</strong>${descriptionHtml}</li>`;
        })
        .join('');

        return `<section class="bev-section"><h2>${escapeHtml(header.title)}</h2><ul class="bev-list">${beveragesHtml}</ul></section>`;
    })
    .join('');

    const didOpen = printDocument(
    'Beverage Menu',
    `<style>
        .bev-section { margin-bottom: 24px; }
        .bev-section h2 { font-size: 18px; border-bottom: 1px solid #e4d2bc; padding-bottom: 6px; margin-bottom: 10px; }
        .bev-list { list-style: none; margin: 0; padding: 0; }
        .bev-item { margin-bottom: 10px; }
        .bev-item strong { font-size: 14px; }
        .bev-description { margin: 2px 0 0 12px; font-size: 13px; color: #6b4226; }
    </style>${sectionsHtml}`
    );

    if (!didOpen) {
    setBeveragePrintError('Unable to open the print window. Please allow pop-ups and try again.');
    }
}

async function handleFetchMenus() {
    if (showSavedMenus) {
    setShowSavedMenus(false);
    return;
    }
    setIsFetchingMenus(true);
    setSavedMenusError('');
    try {
    const response = await fetch('/api/menus');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load saved menus.');
    setSavedMenus(data.menus || []);
    setShowSavedMenus(true);
    } catch (err) {
    setSavedMenusError(err.message);
    } finally {
    setIsFetchingMenus(false);
    }
}

function handleOpenMenu(menu) {
    setForm({
    guests: String(menu.guests),
    meal: menu.meal,
    theme: menu.theme,
    avoidances: menu.avoidances || '',
    });
    setDishIdeas([createDishIdea()]);
    setRecipes(menu.recipes);
    setExpandedRecipeIds([]);
    setSelectedRecipeIds([]);
    setError('');
    setPrintError('');
    setSaveStatus('');
    setShowSavedMenus(false);
}

async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setPrintError('');
    setSaveStatus('');
    setExpandedRecipeIds([]);
    setSelectedRecipeIds([]);

    try {
    const submittedDishIdeas = dishIdeas
    .map((idea) => ({
        idea: idea.idea.trim(),
        category: idea.category,
    }))
    .filter((idea) => idea.idea.length > 0);

    const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        guests: Number(form.guests),
        meal: form.meal,
        theme: form.theme.trim(),
        avoidances: form.avoidances.trim(),
        dishIdeas: submittedDishIdeas,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Unable to generate recipes right now.');
    }

    setRecipes(data.recipes || []);
    } catch (requestError) {
    setRecipes([]);
    setError(requestError.message);
    } finally {
    setIsLoading(false);
    }
}

return (
    <div className="page-shell">
    {isLoading ? (
        <div className="loading-overlay" role="status" aria-live="polite" aria-label="Generating menu">
        <div className="loading-spinner" />
        <p className="loading-text">Generating your menu and recipes...</p>
        </div>
    ) : null}
    <main className="layout">
        <nav className="tab-bar" role="tablist">
        <button
            className={`tab-button${activeTab === 'menu' ? ' tab-button--active' : ''}`}
            onClick={() => setActiveTab('menu')}
            role="tab"
            aria-selected={activeTab === 'menu'}
            type="button"
        >
            Menu Planner
        </button>
        <button
            className={`tab-button${activeTab === 'beverages' ? ' tab-button--active' : ''}`}
            onClick={() => setActiveTab('beverages')}
            role="tab"
            aria-selected={activeTab === 'beverages'}
            type="button"
        >
            Beverage Menu
        </button>
        </nav>

        {activeTab === 'beverages' ? (
        <section className="beverage-tab card">
            <div className="section-heading">
            <p className="eyebrow">Beverage Menu</p>
            <h2>Upload a beverage menu</h2>
            </div>

            <p className="beverage-tab-help">
            Upload a JSON file to display and print a beverage menu. The file must
            contain a top-level <code>headers</code> array, where each entry has a{' '}
            <code>title</code> and a <code>beverages</code> array.
            </p>

            <details className="beverage-schema-example">
            <summary>Show expected JSON format</summary>
            <pre>{`{
  "headers": [
    {
      "title": "Wine",
      "beverages": [
        { "title": "Pinot Noir 2021", "description": "Silky red from the Willamette Valley." },
        { "title": "Chardonnay 2022" }
      ]
    },
    {
      "title": "Beer",
      "beverages": [
        { "title": "IPA", "description": "Bright citrus hop-forward ale." }
      ]
    }
  ]
}`}</pre>
            </details>

            <div className="beverage-upload-row">
            <label className="beverage-file-label">
                <span>Choose JSON file</span>
                <input
                accept=".json,application/json"
                onChange={handleBeverageFileUpload}
                ref={beverageFileInputRef}
                type="file"
                />
            </label>
            {beverageFileName ? (
                <span className="beverage-file-name">{beverageFileName}</span>
            ) : null}
            {beverageMenu ? (
                <button
                className="secondary-button"
                onClick={handleClearBeverageMenu}
                type="button"
                >
                Clear
                </button>
            ) : null}
            </div>

            {beverageError ? (
            <p className="error-banner">{beverageError}</p>
            ) : null}

            {beverageMenu ? (
            <>
                <div className="beverage-actions">
                <button
                    className="secondary-button"
                    onClick={handlePrintBeverageMenu}
                    type="button"
                >
                    Print beverage menu
                </button>
                {beveragePrintError ? (
                    <p className="print-error">{beveragePrintError}</p>
                ) : null}
                </div>

                <div className="beverage-menu-display">
                {beverageMenu.map((header) => (
                    <section className="beverage-section" key={header.title}>
                    <h3 className="beverage-section-title">{header.title}</h3>
                    <ul className="beverage-list">
                        {(header.beverages || []).map((beverage, index) => (
                        <li className="beverage-item" key={`${header.title}-${index}`}>
                            <strong className="beverage-item-title">{beverage.title}</strong>
                            {beverage.description ? (
                            <p className="beverage-item-description">{beverage.description}</p>
                            ) : null}
                        </li>
                        ))}
                    </ul>
                    </section>
                ))}
                </div>
            </>
            ) : null}
        </section>
        ) : null}

        {activeTab === 'menu' ? (
        <>
        <div className="top-content">
        <section className="hero card">
        <img
            className="hero-logo"
            src={logoText}
            alt="Ka Ikena Menus"
        />
        <p className="eyebrow">Menu Planner</p>
        <h1>Plan a complete menu around your guest list and theme.</h1>
        <p className="hero-copy">
            Generate a balanced dinner-party spread with scaled ingredients,
            step-by-step instructions, and enough variety to cover the whole table.
        </p>
        <div className="hero-notes">
            <div>
            <span className="note-label">Best for</span>
            <strong>Celebrations, hosted dinners, and themed menus</strong>
            </div>
            <div>
            <span className="note-label">Output</span>
            <strong>7-10 recipes across courses with scaled ingredients</strong>
            </div>
        </div>
        </section>

        <section className="planner card">
            <div className="section-heading">
            <p className="eyebrow">Planner Input</p>
            <h2>Describe your ideal dinner</h2>
            </div>

            <form className="planner-form" onSubmit={handleSubmit}>
            <label>
                Guests
                <input
                min="1"
                max="30"
                name="guests"
                onChange={handleChange}
                required
                type="number"
                value={form.guests}
                />
            </label>

            <label>
                Meal
                <select
                name="meal"
                onChange={handleChange}
                value={form.meal}
                >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="brunch">Brunch</option>
                <option value="snack">Snack</option>
                </select>
            </label>


            <label>
                Theme
                <input
                name="theme"
                onChange={handleChange}
                placeholder="Tuscan harvest dinner"
                required
                type="text"
                value={form.theme}
                />
            </label>

            <label>
                Ingredient avoidances
                <input
                name="avoidances"
                onChange={handleChange}
                placeholder="shellfish, peanuts, cilantro"
                type="text"
                value={form.avoidances}
                />
            </label>

            <div className="dish-ideas-section">
                <div className="dish-ideas-header">
                <span>Dish ideas</span>
                <button className="secondary-button dish-idea-add" onClick={addDishIdea} type="button">
                    Add idea
                </button>
                </div>
                <p className="dish-ideas-help">
                Add one or more suggestions and choose the course. The generator will adapt them to the meal and ingredient avoidances.
                </p>
                <div className="dish-ideas-list">
                {dishIdeas.map((dishIdea, index) => (
                    <div className="dish-idea-row" key={dishIdea.id}>
                    <label>
                        <textarea
                        ref={(element) => {
                            if (element) {
                            dishIdeaInputRefs.current.set(dishIdea.id, element);
                            } else {
                            dishIdeaInputRefs.current.delete(dishIdea.id);
                            }
                        }}
                        onChange={(event) => updateDishIdea(dishIdea.id, 'idea', event.target.value)}
                        placeholder="Tofu Musubi"
                        rows="2"
                        value={dishIdea.idea}
                        />
                    </label>
                    <div className="dish-idea-row-controls">
                    <label>
                        Course
                        <select
                        onChange={(event) => updateDishIdea(dishIdea.id, 'category', event.target.value)}
                        value={dishIdea.category}
                        >
                        {suggestedDishCategories.map((option) => (
                            <option key={option.value} value={option.value}>
                            {option.label}
                            </option>
                        ))}
                        </select>
                    </label>
                    <button
                        className="secondary-button dish-idea-remove"
                        disabled={dishIdeas.length === 1}
                        onClick={() => removeDishIdea(dishIdea.id)}
                        type="button"
                    >
                        Remove
                    </button>
                    </div>
                    </div>
                ))}
                </div>
            </div>

            <button className="primary-button" disabled={isLoading} type="submit">
                {isLoading ? 'Planning menu...' : 'Generate dinner party menu'}
            </button>
            </form>

            {error ? <p className="error-banner">{error}</p> : null}

            <div className="saved-menus-section">
            <button
                className="secondary-button saved-menus-toggle"
                disabled={isFetchingMenus}
                onClick={handleFetchMenus}
                type="button"
            >
                {isFetchingMenus ? 'Loading...' : showSavedMenus ? 'Hide saved menus' : 'Load a saved menu'}
            </button>
            {savedMenusError ? <p className="print-error">{savedMenusError}</p> : null}
            {showSavedMenus ? (
                <div className="saved-menus-list">
                {savedMenus.length === 0 ? (
                    <p className="selection-hint">No saved menus yet.</p>
                ) : (
                    savedMenus.map((menu) => (
                    <div className="saved-menu-item" key={menu.id}>
                        <div className="saved-menu-meta">
                        <strong>{menu.theme}</strong>
                        <span>{menu.guests} guests &middot; {menu.meal} &middot; {new Date(menu.created_at).toLocaleDateString()}</span>
                        </div>
                        <button
                        className="secondary-button"
                        onClick={() => handleOpenMenu(menu)}
                        type="button"
                        >
                        Open
                        </button>
                    </div>
                    ))
                )}
                </div>
            ) : null}
            </div>
        </section>
        </div>

        <section className="results card">
            <div className="section-heading">
            <p className="eyebrow">Generated Menu</p>
            <h2>{recipes.length ? 'Recipes for your table' : 'Your menu will appear here'}</h2>
            </div>

            {recipes.length ? (
            <div className="selected-menu-panel">
                <p className="selected-count">Selected items: {selectedRecipes.length}</p>
                {printError ? <p className="print-error">{printError}</p> : null}
                <div className="selected-actions">
                <button
                    className="secondary-button"
                    disabled={!selectedRecipes.length}
                    onClick={handlePrintSelectedMenu}
                    type="button"
                >
                    Print selected menu
                </button>
                <button
                    className="secondary-button"
                    disabled={!selectedRecipes.length}
                    onClick={handlePrintSelectedRecipes}
                    type="button"
                >
                    Print selected recipes
                </button>
                <button
                    className="secondary-button"
                    disabled={!recipes.length || isSaving || isLoading}
                    onClick={handleSaveMenu}
                    type="button"
                >
                    {isSaving ? 'Saving menu...' : 'Save menu to database'}
                </button>
                </div>
                {saveStatus ? <p className="save-status">{saveStatus}</p> : null}
                <div className="print-logo-picker">
                <label htmlFor="print-logo-select">Menu print logo</label>
                <select
                    id="print-logo-select"
                    onChange={(event) => setSelectedPrintLogoId(event.target.value)}
                    value={selectedPrintLogoId}
                >
                    {printLogoOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.label}
                    </option>
                    ))}
                </select>
                <img
                    alt={`${selectedPrintLogo.label} preview`}
                    className="print-logo-preview"
                    src={selectedPrintLogo.src}
                />
                </div>
                <p className="print-note">
                Tip: In the browser print dialog, disable Headers and Footers for a clean menu/PDF.
                </p>

                {groupedSelectedRecipes.length ? (
                <div className="selected-menu-list">
                    {groupedSelectedRecipes.map((group) => (
                    <div key={group.category}>
                        <h3>{categoryLabels[group.category] || group.category}</h3>
                        <ul>
                        {group.recipes.map((recipe) => (
                            <li key={`selected-${recipe.id}`}>{recipe.name}</li>
                        ))}
                        </ul>
                    </div>
                    ))}
                </div>
                ) : (
                <p className="selection-hint">Select recipes below to build your printable menu.</p>
                )}
            </div>
            ) : null}

            {recipes.length ? (
            <div className="recipe-groups">
                {groupedRecipes.map((group) => (
                <div className="recipe-group" key={group.category}>
                    <h3>{categoryLabels[group.category] || group.category}</h3>
                    <div className="recipe-grid">
                    {group.recipes.map((recipe) => {
                        const isExpanded = expandedRecipeIds.includes(recipe.id);

                        return (
                        <article className="recipe-card" key={recipe.id}>
                            <label className="select-recipe-toggle">
                            <input
                                checked={selectedRecipeIds.includes(recipe.id)}
                                onChange={() => toggleRecipeSelection(recipe.id)}
                                type="checkbox"
                            />
                            Include in menu
                            </label>

                            <p className="recipe-category">{recipe.category}</p>
                            <h4>{recipe.name}</h4>
                            <p className="recipe-description">{recipe.description}</p>

                            {isExpanded ? (
                            <>
                                <dl className="recipe-meta">
                                <div>
                                    <dt>Prep</dt>
                                    <dd>{recipe.prepTime}</dd>
                                </div>
                                <div>
                                    <dt>Cook</dt>
                                    <dd>{recipe.cookTime}</dd>
                                </div>
                                <div>
                                    <dt>Serves</dt>
                                    <dd>{recipe.servings}</dd>
                                </div>
                                </dl>

                                <div className="tag-row">
                                {recipe.tags.map((tag) => (
                                    <span className="tag" key={tag}>
                                    {tag}
                                    </span>
                                ))}
                                </div>

                                <div className="recipe-columns">
                                <div>
                                    <h5>Ingredients</h5>
                                    <ul>
                                    {recipe.ingredients.map((ingredient) => (
                                        <li key={ingredient}>{ingredient}</li>
                                    ))}
                                    </ul>
                                </div>

                                <div>
                                    <h5>Instructions</h5>
                                    <ol>
                                    {recipe.instructions.map((step) => (
                                        <li key={step}>{step}</li>
                                    ))}
                                    </ol>
                                </div>
                                </div>
                            </>
                            ) : null}

                            <button
                            className="secondary-button"
                            onClick={() => toggleRecipeDetails(recipe.id)}
                            type="button"
                            >
                            {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                        </article>
                        );
                    })}
                    </div>
                </div>
                ))}
            </div>
            ) : (
            <div className="empty-state">
                <p>Start with a theme, number of guests, and any avoidances.</p>
                <p>
                The planner will generate a full menu with appetizers, mains,
                sides, desserts, and optional drinks.
                </p>
            </div>
            )}
        </section>
        </>
        ) : null}
    </main>
    </div>
);
}