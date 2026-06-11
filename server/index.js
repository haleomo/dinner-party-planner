import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import pg from 'pg';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const { Pool } = pg;
const DB_CONFIG = {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'dinner_user',
  password: process.env.PGPASSWORD || 'dinner_password',
  database: process.env.PGDATABASE || 'dinner_party_planner',
};

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : DB_CONFIG
);

function getDatabaseConnectionInfo() {
  if (process.env.DATABASE_URL) {
    return {
      source: 'DATABASE_URL',
      database: process.env.PGDATABASE || DB_CONFIG.database,
    };
  }

  return {
    source: 'individual env vars',
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    database: DB_CONFIG.database,
  };
}

function formatDatabaseError(err) {
  return {
    name: err?.name,
    message: err?.message,
    code: err?.code,
    severity: err?.severity,
    detail: err?.detail,
    hint: err?.hint,
    where: err?.where,
    schema: err?.schema,
    table: err?.table,
    column: err?.column,
    constraint: err?.constraint,
    routine: err?.routine,
    stack: err?.stack,
    errors: Array.isArray(err?.errors)
      ? err.errors.map((nestedError) => formatDatabaseError(nestedError))
      : undefined,
  };
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CREATE_MENUS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS menus (
    id BIGSERIAL PRIMARY KEY,
    guests INTEGER NOT NULL,
    meal TEXT NOT NULL,
    theme TEXT NOT NULL,
    avoidances TEXT NOT NULL DEFAULT '',
    recipes JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

async function initDatabase() {
  await pool.query(CREATE_MENUS_TABLE_SQL);
}

function formatDishIdeas(dishIdeas) {
  if (!Array.isArray(dishIdeas) || !dishIdeas.length) {
    return 'No user-suggested dish ideas were provided.';
  }

  return dishIdeas
    .map((dishIdea, index) => {
      const ideaText = String(dishIdea?.idea || '').trim();
      const category = String(dishIdea?.category || '').trim() || 'appetizer';
      return `${index + 1}. ${category}: ${ideaText}`;
    })
    .join('\n');
}

const RECIPE_TOOL = {
  name: 'suggest_recipes',
  description: 'Suggest a curated, balanced set of recipes for a dinner party.',
  input_schema: {
    type: 'object',
    properties: {
      recipes: {
        type: 'array',
        description: 'Array of 7-10 recipes spanning appetizers, mains, sides, and desserts',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique kebab-case slug, e.g. "mango-chicken-skewers"' },
            name: { type: 'string' },
            description: { type: 'string', description: 'One or two appetising sentences' },
            category: { type: 'string', enum: ['appetizer', 'main', 'side', 'dessert', 'drink'] },
            prepTime: { type: 'string', description: 'e.g. "15 minutes"' },
            cookTime: { type: 'string', description: 'e.g. "30 minutes"' },
            servings: { type: 'number' },
            ingredients: {
              type: 'array',
              items: { type: 'string' },
              description: 'Ingredients with quantities scaled to the requested guest count'
            },
            instructions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Clear, numbered step-by-step instructions'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Short descriptive tags, e.g. ["vegan", "gluten-free", "quick"]'
            }
          },
          required: ['id', 'name', 'description', 'category', 'prepTime', 'cookTime', 'servings', 'ingredients', 'instructions', 'tags']
        }
      }
    },
    required: ['recipes']
  }
};

app.post('/api/recipes', async (req, res) => {
  const { guests, theme, avoidances, meal, dishIdeas } = req.body;
  const selectedMeal = String(meal || 'dinner').trim().toLowerCase();

  if (!guests || !theme) {
    return res.status(400).json({ error: 'guests and theme are required' });
  }

  const avoidText = avoidances?.trim()
    ? `Strictly avoid any recipes containing: ${avoidances}.`
    : 'No specific ingredient restrictions.';
  const dishIdeasText = formatDishIdeas(dishIdeas);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 8192,
      tools: [RECIPE_TOOL],
      tool_choice: { type: 'tool', name: 'suggest_recipes' },
      system: 'You are an expert chef and party planner. Suggest a complete, balanced party menu for the requested meal type with recipes that authentically match the requested theme. Scale all ingredient quantities precisely for the specified number of guests. Provide clear, detailed step-by-step cooking instructions. Treat ingredient avoidances as hard constraints. When the user provides dish ideas, use each idea as a menu direction and adapt it into a suitable recipe if needed while preserving the stated course.',
      messages: [{
        role: 'user',
        content: `I am hosting a ${selectedMeal} party for ${guests} guests. Theme: ${theme}. ${avoidText}

User-suggested dish ideas:
${dishIdeasText}

Please suggest a full menu with 7–10 recipes appropriate for ${selectedMeal}, covering appetizers, mains, sides, desserts, and optional drinks when suitable. Include the user-suggested ideas as part of the menu when they fit the meal and theme. If a suggested idea is not suitable as written, create the closest appropriate recipe version that still respects the chosen course and ingredient avoidances. All ingredient quantities must be scaled for ${guests} guests.`
      }]
    });

    const toolUse = response.content.find(b => b.type === 'tool_use');
    if (!toolUse?.input?.recipes?.length) {
      return res.status(500).json({ error: 'No recipes were generated. Please try again.' });
    }

    const recipes = toolUse.input.recipes.map((r, i) => ({
      ...r,
      id: r.id || `recipe-${i}`,
    }));

    res.json({ recipes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menus', async (req, res) => {
  const { guests, meal, theme, avoidances, recipes } = req.body;

  if (!guests || !theme || !Array.isArray(recipes) || !recipes.length) {
    return res.status(400).json({ error: 'guests, theme, and at least one recipe are required' });
  }

  const selectedMeal = String(meal || 'dinner').trim().toLowerCase();

  try {
    const result = await pool.query(
      `
        INSERT INTO menus (guests, meal, theme, avoidances, recipes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at
      `,
      [
        Number(guests),
        selectedMeal,
        String(theme).trim(),
        String(avoidances || '').trim(),
        JSON.stringify(recipes),
      ]
    );

    res.status(201).json({
      id: result.rows[0].id,
      createdAt: result.rows[0].created_at,
      message: 'Menu saved successfully.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save menu.' });
  }
});

app.get('/api/menus', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, guests, meal, theme, avoidances, recipes, created_at
      FROM menus
      ORDER BY created_at DESC
      LIMIT 50
    `);

    res.json({ menus: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load saved menus.' });
  }
});

const PORT = process.env.PORT || 3001;
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', {
      ...formatDatabaseError(err),
      connection: getDatabaseConnectionInfo(),
    });
    process.exit(1);
  });
