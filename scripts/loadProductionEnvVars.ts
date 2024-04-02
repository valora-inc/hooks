import yaml from 'js-yaml'
import fs from 'fs'

// load static env vars from production.yaml into the environment
// useful for e2e tests that would otherwise fail if required env vars were missing
const envFileContent = yaml.load(
  fs.readFileSync('src/api/production.yaml', 'utf8'),
) as Record<string, string>
for (const [key, value] of Object.entries(envFileContent)) {
  process.env[key] = value
}
