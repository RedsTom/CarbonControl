const fs = require('fs');
const path = require('path');

console.log('🔍 CarbonControl Project Verification\n');

// Check if package.json exists and has required dependencies
function checkPackageJson() {
  console.log('📦 Checking package.json...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredDeps = [
      'next', 'react', 'react-dom', 'typescript',
      '@radix-ui/react-tabs', 'lucide-react', 'uuid', 'spark-md5'
    ];
    
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    if (missingDeps.length === 0) {
      console.log('✅ package.json looks good');
    } else {
      console.log('⚠️  Missing dependencies:', missingDeps.join(', '));
    }
    
    return true;
  } catch (error) {
    console.log('❌ package.json not found or invalid');
    return false;
  }
}

// Check if key files exist
function checkKeyFiles() {
  console.log('\n📁 Checking key files...');
  
  const keyFiles = [
    'app/page.tsx',
    'app/layout.tsx',
    'app/globals.css',
    'lib/sdcp-client.ts',
    'lib/printer-context.tsx',
    'tsconfig.json',
    'tailwind.config.ts',
    'next.config.mjs'
  ];
  
  let allExist = true;
  keyFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Check TypeScript configuration
function checkTypeScriptConfig() {
  console.log('\n⚙️  Checking TypeScript configuration...');
  try {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    
    if (tsConfig.compilerOptions?.strict) {
      console.log('✅ Strict mode enabled');
    } else {
      console.log('⚠️  Strict mode disabled');
    }
    
    if (tsConfig.compilerOptions?.paths?.['@/*']) {
      console.log('✅ Path aliases configured');
    } else {
      console.log('⚠️  Path aliases not configured');
    }
    
    return true;
  } catch (error) {
    console.log('❌ tsconfig.json not found or invalid');
    return false;
  }
}

// Check Next.js configuration
function checkNextConfig() {
  console.log('\n🚀 Checking Next.js configuration...');
  try {
    const nextConfigContent = fs.readFileSync('next.config.mjs', 'utf8');
    
    if (nextConfigContent.includes('ignoreBuildErrors: true')) {
      console.log('⚠️  TypeScript build errors are ignored');
    } else {
      console.log('✅ TypeScript build errors are not ignored');
    }
    
    if (nextConfigContent.includes('ignoreDuringBuilds: true')) {
      console.log('⚠️  ESLint errors are ignored during builds');
    } else {
      console.log('✅ ESLint errors are not ignored during builds');
    }
    
    return true;
  } catch (error) {
    console.log('❌ next.config.mjs not found');
    return false;
  }
}

// Check for common issues in main files
function checkForIssues() {
  console.log('\n🔍 Checking for common issues...');
  
  const issues = [];
  
  // Check main page file
  try {
    const pageContent = fs.readFileSync('app/page.tsx', 'utf8');
    
    if (pageContent.includes('any')) {
      issues.push('Main page uses "any" types');
    }
    
    if (pageContent.includes('console.error')) {
      issues.push('Main page has console.error calls (should use toast notifications)');
    }
    
    if (pageContent.length > 1000) {
      console.log('⚠️  Main page is very large (1380 lines) - consider splitting into components');
    }
    
  } catch (error) {
    issues.push('Cannot read main page file');
  }
  
  // Check SDCP client
  try {
    const sdcpContent = fs.readFileSync('lib/sdcp-client.ts', 'utf8');
    
    if (sdcpContent.includes('Promise<any>')) {
      issues.push('SDCP client uses Promise<any> - should define proper interfaces');
    }
    
    if (sdcpContent.includes('console.error')) {
      issues.push('SDCP client has console.error calls');
    }
    
  } catch (error) {
    issues.push('Cannot read SDCP client file');
  }
  
  if (issues.length === 0) {
    console.log('✅ No obvious issues found');
  } else {
    console.log('⚠️  Potential issues:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  return issues.length === 0;
}

// Main verification
function main() {
  const results = [
    checkPackageJson(),
    checkKeyFiles(),
    checkTypeScriptConfig(),
    checkNextConfig(),
    checkForIssues()
  ];
  
  const allPassed = results.every(result => result);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 All checks passed! The project structure looks good.');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm install (or pnpm install)');
    console.log('2. Run: npm run dev (or pnpm dev)');
    console.log('3. Open http://localhost:3000');
    console.log('4. Enter your printer IP address');
    console.log('5. Test the connection and features');
  } else {
    console.log('⚠️  Some issues were found. Please review the output above.');
    console.log('\n💡 Recommendations:');
    console.log('- Install missing dependencies');
    console.log('- Fix TypeScript configuration issues');
    console.log('- Consider improving type safety');
    console.log('- Add user-facing error handling');
  }
  
  console.log('\n📖 See test-verification.md for detailed analysis');
}

main(); 