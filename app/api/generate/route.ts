import { NextResponse } from "next/server";

const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1";

export async function POST(req: Request) {
  try {
    // Get the diff from the request body
    const { diff } = await req.json();

    // Handle missing inputs
    if (!diff) {
      return NextResponse.json(
        { error: "Git diff is required" },
        { status: 400 }
      );
    }

    // For now, use a fast mock response while Hugging Face API is slow
    // This generates realistic commit messages based on common patterns
    const commitMessage = generateMockCommitMessage(diff);

    // Return the result
    return NextResponse.json({
      commitMessage: commitMessage,
    });

  } catch (error) {
    console.error("Error generating commit message:", error);
    return NextResponse.json(
      { error: "Failed to generate commit message" },
      { status: 500 }
    );
  }
}

function generateMockCommitMessage(diff: string): string {
  // Analyze the diff to determine the type of change
  const lines = diff.toLowerCase();
  
  // Check for specific patterns in the actual code changes
  if (lines.includes('+') && lines.includes('-')) {
    // Check for bug fixes - look for common fix patterns
    if (lines.includes('.trim()') || lines.includes('.toLowerCase()') || lines.includes('.toUpperCase()') || 
        lines.includes('null') || lines.includes('undefined') || lines.includes('error') || 
        lines.includes('exception') || lines.includes('catch') || lines.includes('try')) {
      return `fix: improve ${extractFileName(diff)} validation

- Add input sanitization to prevent edge cases
- Handle whitespace and formatting issues
- Improve data validation reliability`;
    }
    
    // Check for new features - look for new functions, components, or major additions
    else if (lines.includes('function') || lines.includes('const ') || lines.includes('export') ||
             lines.includes('component') || lines.includes('interface') || lines.includes('class')) {
      return `feat: add new functionality to ${extractFileName(diff)}

- Implement new feature as requested
- Add necessary components and logic
- Enhance user experience`;
    }
    
    // Check for refactoring - look for structural changes
    else if (lines.includes('refactor') || lines.includes('clean') || lines.includes('optimize') ||
             lines.includes('import') || lines.includes('require')) {
      return `refactor: improve code structure in ${extractFileName(diff)}

- Clean up code organization
- Optimize performance and readability
- Maintain existing functionality`;
    }
    
    // Check for styling changes
    else if (lines.includes('style') || lines.includes('format') || lines.includes('lint') ||
             lines.includes('css') || lines.includes('className') || lines.includes('class=')) {
      return `style: update formatting and styling

- Apply consistent code formatting
- Fix linting issues
- Improve code readability`;
    }
    
    // Check for test files specifically
    else if (lines.includes('test') || lines.includes('spec') || lines.includes('.test.') || lines.includes('.spec.')) {
      return `test: add test coverage for ${extractFileName(diff)}

- Add comprehensive test cases
- Ensure proper test coverage
- Validate functionality`;
    }
    
    // Check for documentation
    else if (lines.includes('doc') || lines.includes('readme') || lines.includes('comment') ||
             lines.includes('//') || lines.includes('/*')) {
      return `docs: update documentation

- Improve code documentation
- Add helpful comments and examples
- Update README and guides`;
    }
    
    // Check for configuration changes
    else if (lines.includes('config') || lines.includes('package.json') || lines.includes('dependencies') ||
             lines.includes('webpack') || lines.includes('babel') || lines.includes('eslint')) {
      return `chore: update configuration and dependencies

- Update package dependencies
- Modify configuration settings
- Maintain project setup`;
    }
  }
  
  // Default fallback for any other changes
  return `chore: update ${extractFileName(diff)}

- Make necessary changes to improve functionality
- Update code as required
- Maintain project standards`;
}

function extractFileName(diff: string): string {
  const match = diff.match(/diff --git a\/([^\s]+)/);
  return match ? match[1].split('/').pop() || 'file' : 'file';
}
