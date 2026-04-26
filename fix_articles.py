"""
fix_articles.py - Fix HTML issues in slotlab blog articles
1. Close unclosed <blockquote> tags
2. Remove duplicate nested article-layout divs
3. Ensure consistent HTML structure
"""
import os
import re
import sys

POSTS_DIR = os.path.join(os.path.dirname(__file__), 'blog', 'posts')

stats = {'blockquote_fixed': 0, 'nested_div_fixed': 0, 'files_modified': 0, 'files_scanned': 0}


def fix_unclosed_blockquotes(html):
    """Find unclosed <blockquote> tags and close them."""
    fixed = False
    # Count opens and closes
    opens = len(re.findall(r'<blockquote[^>]*>', html, re.IGNORECASE))
    closes = len(re.findall(r'</blockquote>', html, re.IGNORECASE))

    if opens > closes:
        missing = opens - closes
        # Strategy: find each <blockquote> that doesn't have a matching </blockquote>
        # Close it after the next </p> tag
        lines = html.split('\n')
        new_lines = []
        in_blockquote = 0

        for i, line in enumerate(lines):
            new_lines.append(line)

            if '<blockquote' in line.lower():
                in_blockquote += 1
            if '</blockquote>' in line.lower():
                in_blockquote -= 1

            # If we're in an unclosed blockquote and hit a </p> followed by non-blockquote content
            if in_blockquote > 0 and '</p>' in line:
                # Look ahead - if next non-empty line is not more blockquote content
                next_content = ''
                for j in range(i + 1, min(i + 5, len(lines))):
                    if lines[j].strip():
                        next_content = lines[j].strip()
                        break

                # Close blockquote if next content looks like it's outside the quote
                if next_content and not next_content.startswith('<p>') and not next_content.startswith('<blockquote'):
                    if '</blockquote>' not in next_content and '<blockquote' not in next_content:
                        new_lines.append('</blockquote>')
                        in_blockquote -= 1
                        fixed = True
                        stats['blockquote_fixed'] += 1

        html = '\n'.join(new_lines)

    # Final safety check - brute force close any remaining unclosed blockquotes
    opens = len(re.findall(r'<blockquote[^>]*>', html, re.IGNORECASE))
    closes = len(re.findall(r'</blockquote>', html, re.IGNORECASE))
    if opens > closes:
        for _ in range(opens - closes):
            # Insert before </div> that closes article-content
            html = html.replace('</div><!-- end article-content -->', '</blockquote>\n</div><!-- end article-content -->', 1)
            if opens - closes > 0:
                # Fallback: just append before closing body
                pass
            fixed = True
            stats['blockquote_fixed'] += 1

    return html, fixed


def fix_nested_article_layout(html):
    """Remove duplicate nested article-layout divs inside article-content."""
    fixed = False

    # Pattern: inside article-content, there's another article-layout > article-main > article-header
    # This is the broken pattern we need to remove
    pattern = r'(<div class="article-content">\s*(?:<p>[^<]*</p>\s*)*)\s*<div class="article-layout">\s*<article class="article-main">\s*<header class="article-header">\s*<div id="article-author"></div>\s*<div class="article-content">'

    if re.search(pattern, html, re.DOTALL):
        # Remove the duplicate nested structure
        html = re.sub(
            r'<div class="article-layout">\s*<article class="article-main">\s*<header class="article-header">\s*<div id="article-author"></div>\s*<div class="article-content">',
            '',
            html,
            count=1,
            flags=re.DOTALL
        )
        # Also need to remove the extra closing tags at the end
        # Remove one extra </div></article></div> from the end
        html = re.sub(r'</div>\s*</article>\s*</div>\s*(</div>\s*</article>\s*</div>)', r'\1', html, count=1, flags=re.DOTALL)
        fixed = True
        stats['nested_div_fixed'] += 1

    # Simpler approach: just check for the telltale sign
    if html.count('class="article-layout"') > 1:
        # Find and remove the second occurrence and its paired tags
        parts = html.split('class="article-layout"')
        if len(parts) > 2:
            # Keep first occurrence, remove second
            # This is complex, so let's do a line-by-line approach
            lines = html.split('\n')
            new_lines = []
            found_first = False
            skip_until_content = False

            for line in lines:
                if 'class="article-layout"' in line:
                    if not found_first:
                        found_first = True
                        new_lines.append(line)
                    else:
                        skip_until_content = True
                        stats['nested_div_fixed'] += 1
                        fixed = True
                        continue
                elif skip_until_content:
                    if 'class="article-content"' in line:
                        skip_until_content = False
                    continue
                else:
                    new_lines.append(line)

            html = '\n'.join(new_lines)

    return html, fixed


def fix_file(filepath):
    """Fix all issues in a single article file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    html = original
    modified = False

    # Fix 1: Unclosed blockquotes
    html, fix1 = fix_unclosed_blockquotes(html)
    modified = modified or fix1

    # Fix 2: Nested article-layout
    html, fix2 = fix_nested_article_layout(html)
    modified = modified or fix2

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        stats['files_modified'] += 1

    return modified


def main():
    if not os.path.isdir(POSTS_DIR):
        print(f'Posts directory not found: {POSTS_DIR}')
        sys.exit(1)

    print(f'Scanning {POSTS_DIR}...\n')

    files = sorted([f for f in os.listdir(POSTS_DIR) if f.endswith('.html')])

    for fname in files:
        filepath = os.path.join(POSTS_DIR, fname)
        stats['files_scanned'] += 1

        # Check issues before fix
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        has_blockquote_issue = len(re.findall(r'<blockquote', content, re.I)) > len(re.findall(r'</blockquote>', content, re.I))
        has_nested_issue = content.count('class="article-layout"') > 1

        if has_blockquote_issue or has_nested_issue:
            issues = []
            if has_blockquote_issue:
                issues.append('blockquote')
            if has_nested_issue:
                issues.append('nested-div')

            modified = fix_file(filepath)
            status = '[FIXED]' if modified else '[NEEDS MANUAL FIX]'
            print(f'  {status} {fname} [{", ".join(issues)}]')

    print(f'\n{"="*50}')
    print(f'Files scanned: {stats["files_scanned"]}')
    print(f'Files modified: {stats["files_modified"]}')
    print(f'Blockquotes fixed: {stats["blockquote_fixed"]}')
    print(f'Nested divs fixed: {stats["nested_div_fixed"]}')
    print(f'{"="*50}')


if __name__ == '__main__':
    main()
