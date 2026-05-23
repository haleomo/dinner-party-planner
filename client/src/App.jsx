import { useEffect, useMemo, useState } from 'react';

const CATEGORY_ORDER = ['appetizer', 'main', 'side', 'dessert', 'drink'];

const categoryLabels = {
appetizer: 'Appetizers',
main: 'Mains',
side: 'Sides',
dessert: 'Desserts',
drink: 'Drinks',
};

const initialForm = {
guests: '8',
theme: 'Mediterranean garden dinner',
avoidances: '',
};

const PRINT_HEADER_COOKIE = 'dpp_print_header';
const DEFAULT_PRINT_HEADER = 'Selected Dinner Party';

function getCookieValue(name) {
const parts = document.cookie.split('; ').map((part) => part.split('='));
const found = parts.find(([key]) => key === name);

if (!found) {
    return '';
}

return decodeURIComponent(found[1] || '');
}

function setCookieValue(name, value, days = 365) {
const maxAge = days * 24 * 60 * 60;
document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export default function App() {
const [form, setForm] = useState(initialForm);
const [recipes, setRecipes] = useState([]);
const [error, setError] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [expandedRecipeIds, setExpandedRecipeIds] = useState([]);
const [selectedRecipeIds, setSelectedRecipeIds] = useState([]);
const [isSettingsOpen, setIsSettingsOpen] = useState(false);
const [printHeader, setPrintHeader] = useState(DEFAULT_PRINT_HEADER);
const [printHeaderInput, setPrintHeaderInput] = useState(DEFAULT_PRINT_HEADER);

useEffect(() => {
const savedHeader = getCookieValue(PRINT_HEADER_COOKIE);

if (savedHeader) {
    setPrintHeader(savedHeader);
    setPrintHeaderInput(savedHeader);
}
}, []);

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

function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
    ...current,
    [name]: value,
    }));
}

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

function printDocument(title, bodyHtml) {
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
    window.alert('Unable to open the print window. Please allow pop-ups and try again.');
    return;
    }

    printWindow.document.write(`
    <!doctype html>
    <html>
        <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
            body {
            font-family: Georgia, 'Times New Roman', serif;
            color: #2e190d;
            margin: 32px;
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
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

function handleSavePrintHeader(event) {
event.preventDefault();

const cleanedHeader = printHeaderInput.trim() || DEFAULT_PRINT_HEADER;
setPrintHeader(cleanedHeader);
setPrintHeaderInput(cleanedHeader);
setCookieValue(PRINT_HEADER_COOKIE, cleanedHeader);
setIsSettingsOpen(false);
}

function handlePrintSelectedMenu() {
    if (!selectedRecipes.length) {
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

    const menuTitle = `${printHeader} Menu`;

    printDocument(
    menuTitle,
    `<h1>${escapeHtml(menuTitle)}</h1>${menuSections}`
    );
}

function handlePrintSelectedRecipes() {
    if (!selectedRecipes.length) {
    return;
    }

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

    const recipeTitle = `${printHeader} Recipes`;
    printDocument(recipeTitle, `<h1>${escapeHtml(recipeTitle)}</h1>${recipesHtml}`);
}

async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setExpandedRecipeIds([]);
    setSelectedRecipeIds([]);

    try {
    const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        guests: Number(form.guests),
        theme: form.theme.trim(),
        avoidances: form.avoidances.trim(),
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
    <div className="page-settings">
        <button
        aria-label="Open print settings"
        className="icon-button"
        onClick={() => setIsSettingsOpen((current) => !current)}
        type="button"
        >
        ⚙
        </button>

        {isSettingsOpen ? (
        <section className="settings-popover">
            <p className="settings-title">Print settings</p>
            <form className="settings-form" onSubmit={handleSavePrintHeader}>
            <label>
                Print header
                <input
                onChange={(event) => setPrintHeaderInput(event.target.value)}
                placeholder="Selected Dinner Party"
                type="text"
                value={printHeaderInput}
                />
            </label>
            <div className="settings-actions">
                <button className="settings-cancel" onClick={() => setIsSettingsOpen(false)} type="button">
                Cancel
                </button>
                <button className="settings-save" type="submit">
                Save
                </button>
            </div>
            </form>
        </section>
        ) : null}
    </div>

    <main className="layout">
        <div className="top-content">
        <section className="hero card">
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

            <button className="primary-button" disabled={isLoading} type="submit">
                {isLoading ? 'Planning menu...' : 'Generate dinner party menu'}
            </button>
            </form>

            {error ? <p className="error-banner">{error}</p> : null}
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
                </div>

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
    </main>
    </div>
);
}