#!/usr/bin/env node
/*
  📦 Sync Env Examples
  --------------------
  Copies files from the canonical env-examples directory back to their historical
  locations (frontend/ and backend/) so legacy scripts that reference the old
  paths continue to work. Safe to run repeatedly.
*/

const fs = require('fs');
const path = require('path');

const mappings = [
  // Root combined example
  {
    src: path.join(__dirname, '../../env-examples/env.example'),
    dest: path.join(__dirname, '../../env.example'),
  },
  // Frontend examples
  {
    src: path.join(__dirname, '../../env-examples/frontend/env.development.example'),
    dest: path.join(__dirname, '../../frontend/env.development.example'),
  },
  {
    src: path.join(__dirname, '../../env-examples/frontend/env.staging.example'),
    dest: path.join(__dirname, '../../frontend/env.staging.example'),
  },
  {
    src: path.join(__dirname, '../../env-examples/frontend/env.production.example'),
    dest: path.join(__dirname, '../../frontend/env.production.example'),
  },
  // Backend examples
  {
    src: path.join(__dirname, '../../env-examples/backend/env.development.example'),
    dest: path.join(__dirname, '../../backend/env.development.example'),
  },
  {
    src: path.join(__dirname, '../../env-examples/backend/env.staging.example'),
    dest: path.join(__dirname, '../../backend/env.staging.example'),
  },
  {
    src: path.join(__dirname, '../../env-examples/backend/env.production.example'),
    dest: path.join(__dirname, '../../backend/env.production.example'),
  },
  {
    src: path.join(__dirname, '../../env-examples/backend/railway.env.example'),
    dest: path.join(__dirname, '../../backend/railway.env.example'),
  },
  {
    src: path.join(__dirname, '../../env-examples/backend/railway-staging.env.example'),
    dest: path.join(__dirname, '../../backend/railway-staging.env.example'),
  },
];

mappings.forEach(({ src, dest }) => {
  if (!fs.existsSync(src)) return;
  fs.copyFileSync(src, dest);
});

console.log('✅ Env example files synced to legacy locations'); 