import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
  const { guests, theme, avoidances } = req.body;

  if (!guests || !theme) {
    return res.status(400).json({ error: 'guests and theme are required' });
  }

  const avoidText = avoidances?.trim()
    ? `Strictly avoid any recipes containing: ${avoidances}.`
    : 'No specific ingredient restrictions.';

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 8192,
      tools: [RECIPE_TOOL],
      tool_choice: { type: 'tool', name: 'suggest_recipes' },
      system: 'You are an expert chef and party planner. Suggest a complete, balanced dinner party menu with recipes that authentically match the requested theme. Scale all ingredient quantities precisely for the specified number of guests. Provide clear, detailed step-by-step cooking instructions.',
      messages: [{
        role: 'user',
        content: `I am hosting a dinner party for ${guests} guests. Theme: ${theme}. ${avoidText} Please suggest a full menu with 7–10 recipes covering appetizers, mains, sides, and desserts. All ingredient quantities must be scaled for ${guests} guests.`
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
