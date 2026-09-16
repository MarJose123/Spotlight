import * as fs from "node:fs";
import * as path from "node:path";

interface PackageJson {
  name?: string;
  version?: string;
  [key: string]: unknown;
}

const root = path.resolve(__dirname, "..");
const rootPackagePath = path.join(root, "package.json");

const apps = ["apps", "web"];

const rootPackage: PackageJson = JSON.parse(
  fs.readFileSync(rootPackagePath, "utf8"),
);

if (!rootPackage.version) {
  throw new Error("Root package.json does not have a version.");
}

for (const app of apps) {
  const packagePath = path.join(root, app, "package.json");

  if (!fs.existsSync(packagePath)) {
    console.warn(`Skipping ${app}: package.json not found.`);
    continue;
  }

  const packageJson: PackageJson = JSON.parse(
    fs.readFileSync(packagePath, "utf8"),
  );

  packageJson.version = rootPackage.version;

  fs.writeFileSync(
    packagePath,
    JSON.stringify(packageJson, null, 2) + "\n",
  );

  console.log(`${app}: ${packageJson.version}`);
}
