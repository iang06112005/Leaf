import packageJson from "../package.json";

export function appLabel(): string {
  return `TexFlow ${packageJson.version}`;
}
