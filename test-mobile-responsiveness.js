import puppeteer from 'puppeteer';

const MOBILE_VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800 },
  { name: 'iPad Mini', width: 768, height: 1024 }
];

const PAGES_TO_TEST = [
  { name: 'Landing', path: '/' },
  { name: 'Login', path: '/login' },
  { name: 'Signup', path: '/signup' },
  { name: 'Dashboard', path: '/dashboard' }
];

async function testMobileResponsiveness() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null 
  });

  const issues = [];

  for (const viewport of MOBILE_VIEWPORTS) {
    console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    for (const page of PAGES_TO_TEST) {
      const browserPage = await browser.newPage();
      await browserPage.setViewport(viewport);
      
      try {
        await browserPage.goto(`http://localhost:3000${page.path}`, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        // Check for horizontal overflow
        const hasHorizontalScroll = await browserPage.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        if (hasHorizontalScroll) {
          issues.push({
            viewport: viewport.name,
            page: page.name,
            issue: 'Horizontal scroll detected'
          });
        }
        
        // Check for text overflow on buttons
        const buttonOverflows = await browserPage.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const overflowing = [];
          
          buttons.forEach((btn, index) => {
            const text = btn.textContent;
            const rect = btn.getBoundingClientRect();
            const style = window.getComputedStyle(btn);
            
            // Create a temporary span to measure text width
            const span = document.createElement('span');
            span.style.font = style.font;
            span.style.position = 'absolute';
            span.style.visibility = 'hidden';
            span.textContent = text;
            document.body.appendChild(span);
            
            const textWidth = span.offsetWidth;
            const buttonWidth = rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
            
            document.body.removeChild(span);
            
            if (textWidth > buttonWidth) {
              overflowing.push({
                text: text,
                textWidth: textWidth,
                buttonWidth: buttonWidth,
                selector: btn.className || `button[${index}]`
              });
            }
          });
          
          return overflowing;
        });
        
        if (buttonOverflows.length > 0) {
          buttonOverflows.forEach(overflow => {
            issues.push({
              viewport: viewport.name,
              page: page.name,
              issue: `Button text overflow: "${overflow.text}" (${overflow.textWidth}px > ${overflow.buttonWidth}px)`,
              selector: overflow.selector
            });
          });
        }
        
        // Check for excessive spacing
        const spacingIssues = await browserPage.evaluate(() => {
          const issues = [];
          
          // Check for space-y classes that might be too large on mobile
          const spacingElements = Array.from(document.querySelectorAll('[class*="space-y-"]'));
          spacingElements.forEach(el => {
            const classes = el.className.split(' ');
            const spaceClass = classes.find(c => c.includes('space-y-'));
            if (spaceClass) {
              const value = parseInt(spaceClass.split('-').pop());
              if (value >= 8) {
                issues.push({
                  selector: el.className,
                  class: spaceClass,
                  description: 'Large vertical spacing detected'
                });
              }
            }
          });
          
          // Check for large padding/margin
          const paddingElements = Array.from(document.querySelectorAll('[class*="p-"], [class*="py-"], [class*="px-"]'));
          paddingElements.forEach(el => {
            const classes = el.className.split(' ');
            const paddingClasses = classes.filter(c => c.match(/^p[xy]?-\d+$/));
            paddingClasses.forEach(pClass => {
              const value = parseInt(pClass.split('-').pop());
              if (value >= 12) {
                issues.push({
                  selector: el.className,
                  class: pClass,
                  description: 'Large padding detected'
                });
              }
            });
          });
          
          return issues;
        });
        
        spacingIssues.forEach(spacing => {
          issues.push({
            viewport: viewport.name,
            page: page.name,
            issue: `${spacing.description}: ${spacing.class}`,
            selector: spacing.selector
          });
        });
        
        // Check for font sizes that might be too large
        const fontSizeIssues = await browserPage.evaluate(() => {
          const issues = [];
          const elements = Array.from(document.querySelectorAll('[class*="text-"]'));
          
          elements.forEach(el => {
            const classes = el.className.split(' ');
            const textClasses = classes.filter(c => c.match(/^text-(4xl|5xl|6xl)/));
            
            if (textClasses.length > 0 && window.innerWidth < 640) {
              issues.push({
                selector: el.className,
                class: textClasses.join(', '),
                text: el.textContent.substring(0, 50)
              });
            }
          });
          
          return issues;
        });
        
        fontSizeIssues.forEach(font => {
          issues.push({
            viewport: viewport.name,
            page: page.name,
            issue: `Large font size on mobile: ${font.class}`,
            selector: font.selector,
            text: font.text
          });
        });
        
        // Take screenshot for visual reference
        await browserPage.screenshot({ 
          path: `screenshots/${viewport.name.replace(/\s+/g, '-')}-${page.name}.png`,
          fullPage: true 
        });
        
      } catch (error) {
        console.error(`Error testing ${page.name} on ${viewport.name}:`, error.message);
      }
      
      await browserPage.close();
    }
  }
  
  await browser.close();
  
  // Generate report
  console.log('\n📊 Mobile Responsiveness Report\n');
  console.log('================================\n');
  
  if (issues.length === 0) {
    console.log('✅ No mobile responsiveness issues detected!');
  } else {
    console.log(`Found ${issues.length} issues:\n`);
    
    // Group by page
    const issuesByPage = {};
    issues.forEach(issue => {
      if (!issuesByPage[issue.page]) {
        issuesByPage[issue.page] = [];
      }
      issuesByPage[issue.page].push(issue);
    });
    
    Object.entries(issuesByPage).forEach(([page, pageIssues]) => {
      console.log(`\n📄 ${page} Page:`);
      pageIssues.forEach(issue => {
        console.log(`  - [${issue.viewport}] ${issue.issue}`);
        if (issue.selector) {
          console.log(`    Selector: ${issue.selector}`);
        }
      });
    });
  }
  
  return issues;
}

// Run the test
testMobileResponsiveness().catch(console.error);