const ExcelJS = require("exceljs");

const EXCEL_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const sanitizeFilename = (name) => {
  const trimmed = String(name ?? "").trim();
  const replaced = trimmed.replace(/[^A-Za-z0-9 _-]/g, "_");
  const collapsed = replaced.replace(/[_ ]+/g, "-");
  const stripped = collapsed.replace(/^-+|-+$/g, "");
  return stripped || "recipe";
};

const blank = (value) => (value === undefined || value === null ? "" : value);

const ingredientLine = (row) => {
  const unit = row.ingredient?.unit ?? "";
  const name = row.ingredient?.name ?? "";
  return `${row.quantity} ${unit} ${name}`.trim();
};

const sortedIngredients = (recipe) =>
  [...(recipe.recipeIngredient ?? [])].sort((a, b) => {
    const left = a.ingredient?.name ?? "";
    const right = b.ingredient?.name ?? "";
    return left.localeCompare(right);
  });

const sortedSteps = (recipe) =>
  [...(recipe.recipeStep ?? [])].sort(
    (a, b) => (a.stepNumber ?? 0) - (b.stepNumber ?? 0)
  );

const escapePdf = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const buildPdf = async (recipe) => {
  const lines = [recipe.name || ""];
  if (recipe.description) {
    lines.push(recipe.description);
  }
  if (recipe.servings) {
    lines.push(`Servings: ${recipe.servings}`);
  }
  if (recipe.time) {
    lines.push(`Time: ${recipe.time} minutes`);
  }
  if (recipe.category) {
    lines.push(`Category: ${recipe.category}`);
  }
  sortedIngredients(recipe).forEach((row) => {
    lines.push(ingredientLine(row));
  });
  sortedSteps(recipe).forEach((step) => {
    lines.push(`${step.stepNumber}. ${step.instruction}`);
  });

  const content = [
    "BT",
    "/F1 12 Tf",
    "50 750 Td",
    ...lines.flatMap((line, index) =>
      index === 0
        ? [`(${escapePdf(line)}) Tj`]
        : ["0 -16 Td", `(${escapePdf(line)}) Tj`]
    ),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];

  let body = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(Buffer.byteLength(body));
    body += `${obj}\n`;
  });
  const xrefStart = Buffer.byteLength(body);
  body += `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i += 1) {
    body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
};

const addRecipeSheet = (workbook, recipe) => {
  const sheet = workbook.addWorksheet("Recipe");
  sheet.addRow(["name", "description", "servings", "time", "category"]);
  sheet.addRow([
    recipe.name ?? "",
    recipe.description ?? "",
    blank(recipe.servings),
    blank(recipe.time),
    blank(recipe.category),
  ]);
};

const addIngredientsSheet = (workbook, recipe) => {
  const sheet = workbook.addWorksheet("Ingredients");
  sheet.addRow(["quantity", "unit", "name"]);
  sortedIngredients(recipe).forEach((row) => {
    sheet.addRow([
      blank(row.quantity),
      row.ingredient?.unit ?? "",
      row.ingredient?.name ?? "",
    ]);
  });
};

const addStepsSheet = (workbook, recipe) => {
  const sheet = workbook.addWorksheet("Steps");
  sheet.addRow(["stepNumber", "instruction"]);
  sortedSteps(recipe).forEach((step) => {
    sheet.addRow([step.stepNumber, step.instruction ?? ""]);
  });
};

const buildSingleXlsx = async (recipe) => {
  const workbook = new ExcelJS.Workbook();
  addRecipeSheet(workbook, recipe);
  addIngredientsSheet(workbook, recipe);
  addStepsSheet(workbook, recipe);
  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const buildCollectionXlsx = async (recipes) => {
  const workbook = new ExcelJS.Workbook();
  const list = [...recipes].sort((a, b) => {
    const byName = String(a.name ?? "").localeCompare(String(b.name ?? ""));
    if (byName !== 0) {
      return byName;
    }
    return (a.id ?? 0) - (b.id ?? 0);
  });

  const recipesSheet = workbook.addWorksheet("Recipes");
  recipesSheet.addRow(["id", "name", "description", "servings", "time", "category"]);
  list.forEach((recipe) => {
    recipesSheet.addRow([
      recipe.id,
      recipe.name ?? "",
      recipe.description ?? "",
      blank(recipe.servings),
      blank(recipe.time),
      blank(recipe.category),
    ]);
  });

  const ingredientsSheet = workbook.addWorksheet("Ingredients");
  ingredientsSheet.addRow(["recipeName", "quantity", "unit", "name"]);
  const ingredientRows = [];
  list.forEach((recipe) => {
    sortedIngredients(recipe).forEach((row) => {
      ingredientRows.push({
        recipeName: recipe.name ?? "",
        quantity: blank(row.quantity),
        unit: row.ingredient?.unit ?? "",
        name: row.ingredient?.name ?? "",
      });
    });
  });
  ingredientRows
    .sort((a, b) => {
      const byRecipe = a.recipeName.localeCompare(b.recipeName);
      if (byRecipe !== 0) {
        return byRecipe;
      }
      return a.name.localeCompare(b.name);
    })
    .forEach((row) => {
      ingredientsSheet.addRow([
        row.recipeName,
        row.quantity,
        row.unit,
        row.name,
      ]);
    });

  const stepsSheet = workbook.addWorksheet("Steps");
  stepsSheet.addRow(["recipeName", "stepNumber", "instruction"]);
  const stepRows = [];
  list.forEach((recipe) => {
    sortedSteps(recipe).forEach((step) => {
      stepRows.push({
        recipeName: recipe.name ?? "",
        stepNumber: step.stepNumber,
        instruction: step.instruction ?? "",
      });
    });
  });
  stepRows
    .sort((a, b) => {
      const byRecipe = a.recipeName.localeCompare(b.recipeName);
      if (byRecipe !== 0) {
        return byRecipe;
      }
      return (a.stepNumber ?? 0) - (b.stepNumber ?? 0);
    })
    .forEach((row) => {
      stepsSheet.addRow([row.recipeName, row.stepNumber, row.instruction]);
    });

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const sendFile = (res, { buffer, contentType, filename }) => {
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(buffer);
};

module.exports = {
  EXCEL_TYPE,
  sanitizeFilename,
  buildPdf,
  buildSingleXlsx,
  buildCollectionXlsx,
  sendFile,
};
