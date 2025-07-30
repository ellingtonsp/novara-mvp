/**
 * Test script for timezone handling
 * Run this to verify date handling works correctly across timezones
 */

import { getLocalDateString, parseLocalDateString, isSameLocalDay, logTimezoneDebug } from '../lib/dateUtils';

console.log('🧪 Testing Timezone Handling\n');

// Test 1: Current date formatting
console.log('Test 1: Current Date Formatting');
const now = new Date();
const localDateString = getLocalDateString(now);
console.log('Current date:', now.toString());
console.log('Local date string:', localDateString);
console.log('ISO string:', now.toISOString());
logTimezoneDebug('Test 1');

// Test 2: Date parsing
console.log('\nTest 2: Date Parsing');
const testDateString = '2025-07-30';
const parsedDate = parseLocalDateString(testDateString);
console.log('Input string:', testDateString);
console.log('Parsed date:', parsedDate.toString());
console.log('Parsed ISO:', parsedDate.toISOString());

// Test 3: Same day comparison
console.log('\nTest 3: Same Day Comparison');
const date1 = new Date('2025-07-30T23:59:59Z'); // Near midnight UTC
const date2 = new Date('2025-07-31T00:00:01Z'); // Just after midnight UTC
console.log('Date 1 (UTC):', date1.toISOString());
console.log('Date 1 (Local):', date1.toString());
console.log('Date 2 (UTC):', date2.toISOString());
console.log('Date 2 (Local):', date2.toString());
console.log('Same local day?:', isSameLocalDay(date1, date2));

// Test 4: Edge case - different timezones
console.log('\nTest 4: Timezone Edge Cases');
const edgeDate = new Date('2025-07-30T04:00:00Z'); // 4 AM UTC
console.log('UTC Date:', edgeDate.toISOString());
console.log('Local Date:', edgeDate.toString());
console.log('Local Date String:', getLocalDateString(edgeDate));

// Test 5: Consistency check
console.log('\nTest 5: Consistency Check');
const checkDate = '2025-07-30';
const parsed = parseLocalDateString(checkDate);
const formatted = getLocalDateString(parsed);
console.log('Original:', checkDate);
console.log('Parsed then formatted:', formatted);
console.log('Match?:', checkDate === formatted);

console.log('\n✅ Timezone handling tests complete');