#!/usr/bin/env node

/**
 * Pre-publish validation script
 * Ensures the package is ready for NPM publication
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const errors = [];
const warnings = [];

console.log('🔍 Running pre-publish checks...\n');

// Check 1: Ensure dist directory exists
if (!fs.existsSync(path.join(__dirname, '../dist'))) {
  errors.push('❌ dist/ directory not found. Run "npm run build" first.');
}

// Check 2: Verify all exports exist
const pkg = require('../package.json');
const exports = pkg.exports;

Object.entries(exports).forEach(([key, value]) => {
  if (key === './package.json') return;
  
  const paths = typeof value === 'string' ? [value] : Object.values(value);
  paths.forEach(filePath => {
    if (!fs.existsSync(path.join(__dirname, '..', filePath))) {
      errors.push(`❌ Export file missing: ${filePath}`);
    }
  });
});

// Check 3: Verify version bump
try {
  const gitTags = execSync('git tag --sort=-version:refname', { encoding: 'utf-8' });
  const latestTag = gitTags.split('\n')[0];
  if (latestTag && latestTag.includes(pkg.version)) {
    warnings.push(`⚠️  Version ${pkg.version} already exists as a git tag`);
  }
} catch (e) {
  warnings.push('⚠️  Could not check git tags');
}

// Check 4: Ensure tests pass
console.log('Running tests...');
try {
  execSync('npm run test:ci', { stdio: 'inherit' });
  console.log('✅ Tests passed\n');
} catch (e) {
  errors.push('❌ Tests failed');
}

// Check 5: Type checking
console.log('Running type checks...');
try {
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log('✅ Type checks passed\n');
} catch (e) {
  errors.push('❌ Type checking failed');
}

// Check 6: Linting
console.log('Running linter...');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ Linting passed\n');
} catch (e) {
  errors.push('❌ Linting failed');
}

// Check 7: Bundle size
console.log('Checking bundle sizes...');
try {
  execSync('npm run build:size', { stdio: 'inherit' });
  console.log('✅ Bundle sizes within limits\n');
} catch (e) {
  warnings.push('⚠️  Bundle size check failed or not configured');
}

// Check 8: README exists
if (!fs.existsSync(path.join(__dirname, '../README.md'))) {
  errors.push('❌ README.md not found');
}

// Check 9: CHANGELOG exists
if (!fs.existsSync(path.join(__dirname, '../CHANGELOG.md'))) {
  warnings.push('⚠️  CHANGELOG.md not found');
}

// Check 10: License
if (!pkg.license) {
  errors.push('❌ No license specified in package.json');
}

// Report results
console.log('\n📊 Pre-publish Check Results:\n');

if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach(w => console.log(`   ${w}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Errors:');
  errors.forEach(e => console.log(`   ${e}`));
  console.log('\n❌ Pre-publish checks failed! Fix the errors above before publishing.\n');
  process.exit(1);
} else {
  console.log('✅ All checks passed! Package is ready for publication.\n');
  console.log('📦 To publish, run: npm publish\n');
}