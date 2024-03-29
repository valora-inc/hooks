import yaml from 'js-yaml'
import fs from 'fs'

const envFileContent = yaml.load(
  fs.readFileSync('src/api/production.yaml', 'utf8'),
) as Record<string, string>
for (const [key, value] of Object.entries(envFileContent)) {
  process.env[key] = value
}
