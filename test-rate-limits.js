/**
 * Test script for Redis rate limiting
 * Tests both name generation and domain check rate limits
 */

// Configuration
const BASE_URL = 'http://localhost:3003'; // Use the port from your dev server
const TEST_PROMPT = 'A tech startup that helps small businesses with AI';

// Domain test configuration
const AVAILABLE_DOMAIN_PREFIX = 'available-test'; // These will be treated as available
const UNAVAILABLE_DOMAIN_PREFIX = 'unavailable-test'; // These will be treated as unavailable
const TEST_TLD = '.com';

// Mock the domain availability for testing
// In a real environment, we'd use actual domain availability from the API
function mockIsAvailable(domain) {
  return domain.startsWith(AVAILABLE_DOMAIN_PREFIX);
}

// Test the name generation rate limit (5 per day)
async function testGenerateRateLimit() {
  console.log('\n=== Testing Name Generation Rate Limit (5 per day) ===');
  
  for (let i = 1; i <= 6; i++) {
    console.log(`\nRequest ${i}:`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: TEST_PROMPT })
      });
      
      const data = await response.json();
      
      if (response.status === 429) {
        console.log('✓ Rate limit correctly enforced');
        console.log(`Error: ${data.error}`);
        console.log(`Remaining: ${data.rateLimitRemaining}/${data.rateLimitTotal}`);
      } else if (response.status === 200) {
        console.log('✓ Request successful');
        console.log(`Generated ${data.names.length} names`);
        console.log(`Remaining: ${data.rateLimitRemaining}/${data.rateLimitTotal}`);
      } else {
        console.log(`✗ Unexpected response: ${response.status}`);
        console.log(data);
      }
    } catch (error) {
      console.error('Error making request:', error.message);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Test the domain check rate limit (15 per day)
// Mix of available and unavailable domains to verify only available ones count against quota
async function testDomainCheckRateLimit() {
  console.log('\n=== Testing Domain Check Rate Limit (15 available domains per day) ===');
  console.log('Note: Only available domains should count against the quota');
  
  // Create a test sequence with a mix of available and unavailable domains
  const testSequence = [];
  
  // Add 10 available domains (should count against quota)
  for (let i = 1; i <= 10; i++) {
    testSequence.push({
      domain: `${AVAILABLE_DOMAIN_PREFIX}-${i}${TEST_TLD}`,
      shouldBeAvailable: true
    });
  }
  
  // Add 10 unavailable domains (should NOT count against quota)
  for (let i = 1; i <= 10; i++) {
    testSequence.push({
      domain: `${UNAVAILABLE_DOMAIN_PREFIX}-${i}${TEST_TLD}`,
      shouldBeAvailable: false
    });
  }
  
  // Add 10 more available domains (should count against quota until limit reached)
  for (let i = 11; i <= 20; i++) {
    testSequence.push({
      domain: `${AVAILABLE_DOMAIN_PREFIX}-${i}${TEST_TLD}`,
      shouldBeAvailable: true
    });
  }
  
  // Shuffle the array to mix available and unavailable domains
  testSequence.sort(() => Math.random() - 0.5);
  
  // Track quota usage
  let availableChecked = 0;
  let unavailableChecked = 0;
  
  // Run the tests
  for (let i = 0; i < testSequence.length; i++) {
    const test = testSequence[i];
    console.log(`\nRequest ${i + 1}: ${test.domain} (Expected: ${test.shouldBeAvailable ? 'Available' : 'Unavailable'})`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/check-domain`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-test-mode': 'true' // Enable test mode to override availability based on domain prefix
        },
        body: JSON.stringify({ domain: test.domain })
      });
      
      const data = await response.json();
      
      if (response.status === 429) {
        console.log('✓ Rate limit correctly enforced');
        console.log(`Error: ${data.error}`);
        console.log(`Remaining: ${data.rateLimitRemaining}/${data.rateLimitTotal}`);
      } else if (response.status === 200) {
        console.log('✓ Request successful');
        console.log(`Domain: ${data.domain}, Available: ${data.available}`);
        console.log(`Remaining: ${data.rateLimitRemaining}/${data.rateLimitTotal}`);
        
        // Track quota usage
        if (data.available) {
          availableChecked++;
        } else {
          unavailableChecked++;
        }
        
        // Verify the remaining count makes sense
        if (data.available) {
          const expectedRemaining = Math.max(0, 15 - availableChecked);
          if (data.rateLimitRemaining !== expectedRemaining) {
            console.log(`⚠️ Warning: Expected remaining to be ${expectedRemaining}, but got ${data.rateLimitRemaining}`);
          }
        }
      } else {
        console.log(`✗ Unexpected response: ${response.status}`);
        console.log(data);
      }
    } catch (error) {
      console.error('Error making request:', error.message);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n=== Domain Check Summary ===');
  console.log(`Available domains checked: ${availableChecked} (should count against quota)`);
  console.log(`Unavailable domains checked: ${unavailableChecked} (should NOT count against quota)`);
  console.log(`Expected remaining quota: ${Math.max(0, 15 - availableChecked)}/15`);
}

// Run the tests
async function runTests() {
  console.log('Starting rate limit tests...');
  
  // Test name generation rate limit
  await testGenerateRateLimit();
  
  // Test domain check rate limit with mixed availability
  await testDomainCheckRateLimit();
  
  console.log('\nTests completed!');
}

runTests().catch(console.error);
