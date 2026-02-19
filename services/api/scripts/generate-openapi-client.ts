import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateOpenApiClient() {
  console.log('🔄 Generating OpenAPI TypeScript client...');

  // Import the app to get the swagger spec
  const { default: app } = await import('./src/index.js');

  // Wait for swagger to be ready
  await app.ready();

  // Get the swagger spec
  const swaggerSpec = app.swagger();

  // Save to file
  const outputPath = path.join(__dirname, 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

  console.log(`✅ OpenAPI spec saved to ${outputPath}`);

  // Generate TypeScript client using openapi-typescript
  const { execSync } = await import('child_process');

  const typesOutputPath = path.join(__dirname, 'src', 'types', 'api.ts');

  try {
    execSync(`npx openapi-typescript ${outputPath} -o ${typesOutputPath}`, {
      stdio: 'inherit',
    });
    console.log(`✅ TypeScript types generated at ${typesOutputPath}`);
  } catch (error) {
    console.error('❌ Failed to generate TypeScript types:', error);
    process.exit(1);
  }

  await app.close();
  process.exit(0);
}

generateOpenApiClient().catch((error) => {
  console.error('❌ Generation failed:', error);
  process.exit(1);
});
