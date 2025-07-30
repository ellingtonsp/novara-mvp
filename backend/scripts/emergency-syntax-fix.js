#!/usr/bin/env node

/**
 * Emergency fix for syntax errors in server.js
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Fix the specific syntax error at line 2431
const brokenSection = `      },
        ? 'Daily check-in completed successfully! We love your positive energy today! 🎉' 
        : 'Daily check-in completed successfully! 🌟'
        ? 'Daily check-in completed successfully! We love your positive energy today! 🎉' 
        : 'Daily check-in completed successfully! 🌟'
    };`;

const fixedSection = `      },
      message: sentiment_analysis?.sentiment === 'positive'
        ? 'Daily check-in completed successfully! We love your positive energy today! 🎉' 
        : 'Daily check-in completed successfully! 🌟'
    };`;

serverContent = serverContent.replace(brokenSection, fixedSection);

// Write the fixed content
fs.writeFileSync(serverPath, serverContent);

console.log('✅ Fixed syntax error in server.js');
console.log('📝 The duplicate orphaned ternary operators have been replaced with a proper message field');