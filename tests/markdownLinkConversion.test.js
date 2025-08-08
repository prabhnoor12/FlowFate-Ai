// tests/markdownLinkConversion.test.js
// Test for markdown link conversion in appendMessage (frontend)

function convertMarkdownLinks(text) {
  return text.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-500 underline">$1</a>');
}

function runTest(input, expected, description) {
  const output = convertMarkdownLinks(input);
  if (output === expected) {
    console.log(`✅ ${description}`);
  } else {
    console.error(`❌ ${description}`);
    console.error('Expected:', expected);
    console.error('Got:', output);
  }
}

runTest(
  "Please connect: [Connect to Notion](https://www.notion.so/my-integrations)",
  'Please connect: <a href="https://www.notion.so/my-integrations" target="_blank" class="text-blue-500 underline">Connect to Notion</a>',
  'Single markdown link conversion'
);

runTest(
  "Multiple links: [Google](https://google.com) and [Notion](https://notion.so)",
  'Multiple links: <a href="https://google.com" target="_blank" class="text-blue-500 underline">Google</a> and <a href="https://notion.so" target="_blank" class="text-blue-500 underline">Notion</a>',
  'Multiple markdown links conversion'
);

runTest(
  "Edge case: [Text with (parentheses)](https://example.com)",
  'Edge case: <a href="https://example.com" target="_blank" class="text-blue-500 underline">Text with (parentheses)</a>',
  'Markdown link with parentheses in text'
);

runTest(
  "No link here.",
  'No link here.',
  'No markdown link present'
);

runTest(
  "Broken [link](not-a-url)",
  'Broken [link](not-a-url)',
  'Non-HTTP markdown link should not convert'
);
