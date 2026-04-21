import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { env } from '../src/config/env.js';
import { NutritionFood } from '../src/modules/nutrition/nutrition.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputDir = path.resolve(__dirname, '../data/nutrition-input');

const headerAliases = {
  name: ['name', 'foodname', 'food_name', 'food', 'item', 'description', 'fooditem', 'drfoodlistdesc'],
  calories: ['calories', 'kcal', 'energy', 'energykcal', 'calorie', 'energy(kcal)', 'energykcal'],
  protein: ['protein', 'proteing', 'protein(g)', 'protein_g'],
  carbs: ['carbs', 'carbohydrate', 'carbohydrates', 'carbohydrateg', 'carbohydrate(g)', 'carb', 'totalcarbohydratesg'],
  fat: ['fat', 'totalfat', 'lipids', 'lipid', 'fat(g)', 'fats', 'totalfatsg'],
  aliases: ['aliases', 'alias', 'altname', 'sinhala', 'tamil', 'localname', 'commonname'],
  category: ['category', 'foodgroup', 'group', 'foodcategory', 'fctsource'],
  serving: ['serving', 'servingsize', 'portion', 'serving_size', 'recipesinglefooditem'],
};

function normalizeHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const matched = String(value).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  if (!matched) return 0;
  const num = Number(matched[0]);
  return Number.isFinite(num) ? num : 0;
}

function resolveFieldKey(headerMap, candidates) {
  for (const candidate of candidates) {
    const found = headerMap.get(normalizeHeader(candidate));
    if (found) return found;
  }
  return null;
}

function splitAliases(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];
  return raw
    .split(/[|,;/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapRows(rows, sourceName) {
  if (!rows.length) return [];
  const headers = Object.keys(rows[0] || {});
  const headerMap = new Map(headers.map((h) => [normalizeHeader(h), h]));

  const nameKey = resolveFieldKey(headerMap, headerAliases.name);
  const caloriesKey = resolveFieldKey(headerMap, headerAliases.calories);
  const proteinKey = resolveFieldKey(headerMap, headerAliases.protein);
  const carbsKey = resolveFieldKey(headerMap, headerAliases.carbs);
  const fatKey = resolveFieldKey(headerMap, headerAliases.fat);
  const aliasesKey = resolveFieldKey(headerMap, headerAliases.aliases);
  const categoryKey = resolveFieldKey(headerMap, headerAliases.category);
  const servingKey = resolveFieldKey(headerMap, headerAliases.serving);

  if (!nameKey) {
    return [];
  }

  return rows
    .map((row) => {
      const name = String(row[nameKey] || '').trim();
      const normalizedName = normalizeName(name);
      if (!normalizedName) return null;
      return {
        name,
        normalizedName,
        aliases: aliasesKey ? splitAliases(row[aliasesKey]) : [],
        calories: caloriesKey ? toNumber(row[caloriesKey]) : 0,
        protein: proteinKey ? toNumber(row[proteinKey]) : 0,
        carbs: carbsKey ? toNumber(row[carbsKey]) : 0,
        fat: fatKey ? toNumber(row[fatKey]) : 0,
        category: categoryKey ? String(row[categoryKey] || '').trim() : '',
        serving: servingKey ? String(row[servingKey] || '').trim() : '',
        source: sourceName,
        raw: row,
      };
    })
    .filter(Boolean);
}

async function run() {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing in backend/.env');
  }

  if (!fs.existsSync(inputDir)) {
    throw new Error(`Input folder does not exist: ${inputDir}`);
  }

  const files = fs
    .readdirSync(inputDir)
    .filter((file) => /\.(csv|xlsx|xls)$/i.test(file));

  if (!files.length) {
    throw new Error('No CSV/XLSX files found in backend/data/nutrition-input');
  }

  await mongoose.connect(env.MONGODB_URI);
  console.log(`Connected to MongoDB. Files found: ${files.length}`);

  let totalRows = 0;
  let upserted = 0;

  for (const fileName of files) {
    const filePath = path.join(inputDir, fileName);
    const workbook = XLSX.readFile(filePath, { raw: false });
    const sourceName = `sri-lanka-${path.parse(fileName).name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const mapped = mapRows(rows, sourceName);
      totalRows += mapped.length;

      for (const item of mapped) {
        await NutritionFood.findOneAndUpdate(
          { normalizedName: item.normalizedName },
          { $set: item },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        upserted += 1;
      }
    }

    console.log(`Imported: ${fileName}`);
  }

  await mongoose.disconnect();
  console.log(`Done. Processed rows: ${totalRows}, upsert operations: ${upserted}`);
}

run().catch(async (error) => {
  console.error('Import failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
