#!/usr/bin/env python3
"""
auto_publish.py - Auto-publish script for rtp96.com (slotlab) blog.

Scans blog/posts/ for all .html files, extracts metadata, and regenerates:
  1. blog/index.html (blog listing page)
  2. Homepage article section in index.html
  3. Category pages: slots/index.html, casinos/index.html, guides/index.html, rtp/index.html
  4. ARTICLE_COUNTS in js/components.js

Also moves ready drafts from blog/drafts/ to blog/posts/ if they exist.
"""

import os
import re
import shutil
import json
from datetime import datetime
from pathlib import Path
from html.parser import HTMLParser

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SITE_ROOT = Path(__file__).resolve().parent
POSTS_DIR = SITE_ROOT / "blog" / "posts"
DRAFTS_DIR = SITE_ROOT / "blog" / "drafts"
BLOG_INDEX = SITE_ROOT / "blog" / "index.html"
HOME_INDEX = SITE_ROOT / "index.html"
COMPONENTS_JS = SITE_ROOT / "js" / "components.js"

CATEGORY_PAGES = {
    "slots":   SITE_ROOT / "slots" / "index.html",
    "casinos": SITE_ROOT / "casinos" / "index.html",
    "guides":  SITE_ROOT / "guides" / "index.html",
    "rtp":     SITE_ROOT / "rtp" / "index.html",
}

# Map Chinese category names to internal keys and CSS classes
CATEGORY_MAP = {
    "老虎機":   {"key": "slots",   "css_pill": "cat-slots",   "accent": "post-accent-amber",  "blog_cat": "老虎機"},
    "娛樂城":   {"key": "casinos", "css_pill": "cat-casinos", "accent": "post-accent-blue",   "blog_cat": "娛樂城"},
    "攻略":     {"key": "guides",  "css_pill": "cat-guides",  "accent": "post-accent-green",  "blog_cat": "攻略"},
    "RTP分析":  {"key": "rtp",     "css_pill": "cat-rtp",     "accent": "post-accent-purple", "blog_cat": "RTP分析"},
    "RTP":      {"key": "rtp",     "css_pill": "cat-rtp",     "accent": "post-accent-purple", "blog_cat": "RTP"},
}

# ---------------------------------------------------------------------------
# Metadata extraction
# ---------------------------------------------------------------------------

def extract_metadata(filepath: Path) -> dict | None:
    """Extract article metadata from an HTML file's <head> section."""
    try:
        text = filepath.read_text(encoding="utf-8")
    except Exception as e:
        print(f"  [WARN] Cannot read {filepath}: {e}")
        return None

    # Only parse <head> for speed
    head_match = re.search(r"<head>(.*?)</head>", text, re.DOTALL | re.IGNORECASE)
    if not head_match:
        return None
    head = head_match.group(1)

    def meta(prop_or_name):
        """Extract content from meta tag by property or name."""
        m = re.search(
            rf'<meta\s+(?:property|name)="{re.escape(prop_or_name)}"\s+content="([^"]*)"',
            head, re.IGNORECASE
        )
        if not m:
            m = re.search(
                rf'<meta\s+content="([^"]*)"\s+(?:property|name)="{re.escape(prop_or_name)}"',
                head, re.IGNORECASE
            )
        return m.group(1).strip() if m else ""

    # Title: from og:title or <title> tag (strip site suffix)
    title = meta("og:title")
    if not title:
        tm = re.search(r"<title>([^<]+)</title>", head)
        title = tm.group(1).strip() if tm else ""
    # Remove " | 大衛の電子攻略站" suffix
    title = re.sub(r"\s*[|｜]\s*大衛の電子攻略站\s*$", "", title)

    description = meta("og:description") or meta("description")

    # Date from article:published_time or JSON-LD
    date = meta("article:published_time")
    if not date:
        jld = re.search(r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"', head)
        if jld:
            date = jld.group(1)
    if not date:
        date = "2026-01-01"

    # Category from article:section or JSON-LD or .category/.cat span in body
    category = meta("article:section")
    if not category:
        # Try body for <span class="category"> or <span class="cat">
        cat_m = re.search(r'<span\s+class="(?:category|cat)"[^>]*>([^<]+)</span>', text)
        if cat_m:
            category = cat_m.group(1).strip()
    if not category:
        category = "攻略"

    # Reading time: try to find in body, default 6 min
    rt_m = re.search(r'(\d+)\s*min\s*read', text)
    reading_time = f"{rt_m.group(1)} min read" if rt_m else "6 min read"

    return {
        "filename": filepath.name,
        "title": title,
        "description": description,
        "category": category,
        "date": date,
        "reading_time": reading_time,
    }


# ---------------------------------------------------------------------------
# HTML generators
# ---------------------------------------------------------------------------

def get_cat_info(category: str) -> dict:
    """Get CSS class info for a category name."""
    return CATEGORY_MAP.get(category, CATEGORY_MAP["攻略"])


def blog_card(post: dict) -> str:
    """Generate a card for blog/index.html (main site post-item style)."""
    cat_info = get_cat_info(post["category"])
    return f"""          <a href="posts/{post['filename']}" class="post-item">
            <div class="post-accent {cat_info['accent']}"></div>
            <div class="post-body">
              <div class="post-title">{post['title']}</div>
              <div class="post-excerpt">{post['description']}</div>
              <div class="post-meta">
                <span class="cat-pill {cat_info['css_pill']}">{post['category']}</span>
                <span>{post['date']}</span>
                <span>{post.get('readtime', '6 min read')}</span>
              </div>
            </div>
          </a>"""


def homepage_card(post: dict) -> str:
    """Generate a card for the homepage (post-item style with .html extension)."""
    cat_info = get_cat_info(post["category"])
    return f"""          <a href="blog/posts/{post['filename']}" class="post-item">
            <div class="post-accent {cat_info['accent']}"></div>
            <div class="post-body">
              <div class="post-title">{post['title']}</div>
              <div class="post-excerpt">{post['description']}</div>
              <div class="post-meta">
                <span class="cat-pill {cat_info['css_pill']}">{post['category']}</span>
                <span>{post['date']}</span>
                <span>{post['reading_time']}</span>
              </div>
            </div>
          </a>"""


def category_card(post: dict, is_blog_post: bool = True) -> str:
    """Generate a card for category index pages (post-item style, relative href)."""
    cat_info = get_cat_info(post["category"])
    if is_blog_post:
        href = f"../blog/posts/{post['filename']}"
    else:
        href = post["filename"]
    return f"""        <a href="{href}" class="post-item">
            <div class="post-accent {cat_info['accent']}"></div>
            <div class="post-body">
              <div class="post-title">{post['title']}</div>
              <div class="post-excerpt">{post['description']}</div>
              <div class="post-meta">
                <span class="cat-pill {cat_info['css_pill']}">{post['category']}</span>
                <span>{post['date']}</span>
                <span>{post['reading_time']}</span>
              </div>
            </div>
          </a>"""


# ---------------------------------------------------------------------------
# Category page article scanning (for non-blog articles in slots/, casinos/, etc.)
# ---------------------------------------------------------------------------

def scan_category_articles(cat_dir: Path) -> list[dict]:
    """Scan .html files in a category directory (excluding index.html)."""
    articles = []
    if not cat_dir.exists():
        return articles
    for f in cat_dir.glob("*.html"):
        if f.name == "index.html":
            continue
        meta = extract_metadata(f)
        if meta:
            meta["_source"] = "category"
            articles.append(meta)
    return articles


# ---------------------------------------------------------------------------
# Updaters
# ---------------------------------------------------------------------------

def move_drafts() -> list[str]:
    """Move all drafts from blog/drafts/ to blog/posts/."""
    moved = []
    if not DRAFTS_DIR.exists():
        return moved
    for f in DRAFTS_DIR.glob("*.html"):
        dest = POSTS_DIR / f.name
        if dest.exists():
            print(f"  [SKIP] Draft {f.name} already exists in posts/")
            continue
        shutil.move(str(f), str(dest))
        moved.append(f.name)
        print(f"  [MOVE] {f.name} -> blog/posts/")
    return moved


def update_blog_index(posts: list[dict]) -> None:
    """Regenerate blog/index.html with all articles between markers."""
    text = BLOG_INDEX.read_text(encoding="utf-8")

    cards_html = "\n".join(blog_card(p) for p in posts)
    new_section = f"<!-- BLOG_CARDS_START -->\n{cards_html}\n<!-- BLOG_CARDS_END -->"

    text = re.sub(
        r"<!-- BLOG_CARDS_START -->.*?<!-- BLOG_CARDS_END -->",
        new_section,
        text,
        flags=re.DOTALL,
    )

    # Update count display
    text = re.sub(
        r'<div class="count">\d+ 篇文章</div>',
        f'<div class="count">{len(posts)} 篇文章</div>',
        text,
    )

    BLOG_INDEX.write_text(text, encoding="utf-8")
    print(f"  [OK] blog/index.html updated ({len(posts)} articles)")


def update_homepage(posts: list[dict], cat_articles: dict) -> None:
    """Update the homepage 'latest articles' section between the post-list div."""
    text = HOME_INDEX.read_text(encoding="utf-8")

    # Build the combined article list for homepage (blog posts + category articles)
    # The homepage currently shows all articles from blog/posts + some from category dirs
    # We'll combine blog posts with category-only articles, sorted by date
    all_articles = list(posts)  # blog posts

    # Add category articles that aren't already in blog posts
    blog_filenames = {p["filename"] for p in posts}
    for cat_key, cat_arts in cat_articles.items():
        for art in cat_arts:
            if art.get("_source") == "category" and art["filename"] not in blog_filenames:
                all_articles.append(art)

    all_articles.sort(key=lambda x: x["date"], reverse=True)

    # Generate homepage cards
    homepage_cards = []
    for art in all_articles:
        if art.get("_source") == "category":
            # These are from category dirs, need different href pattern
            cat_info = get_cat_info(art["category"])
            cat_key = cat_info["key"]
            homepage_cards.append(
                f"""          <a href="{cat_key}/{art['filename']}" class="post-item">
            <div class="post-accent {cat_info['accent']}"></div>
            <div class="post-body">
              <div class="post-title">{art['title']}</div>
              <div class="post-excerpt">{art['description']}</div>
              <div class="post-meta">
                <span class="cat-pill {cat_info['css_pill']}">{art['category']}</span>
                <span>{art['date']}</span>
                <span>{art['reading_time']}</span>
              </div>
            </div>
          </a>"""
            )
        else:
            homepage_cards.append(homepage_card(art))

    cards_html = "\n".join(homepage_cards)

    # Find the first <div class="post-list"> ... </div> block (latest articles section)
    # We need to replace only the content inside the first post-list under "最新文章"
    pattern = r'(<div class="section-header">\s*<h2 class="section-title">最新文章</h2>.*?<div class="post-list">)\s*(.*?)\s*(</div>\s*</section>)'
    match = re.search(pattern, text, re.DOTALL)
    if match:
        text = text[:match.start(2)] + "\n" + cards_html + "\n        " + text[match.end(2):]

    HOME_INDEX.write_text(text, encoding="utf-8")
    print(f"  [OK] index.html homepage updated ({len(all_articles)} articles in latest section)")


def update_category_page(cat_key: str, blog_posts: list[dict], native_articles: list[dict]) -> None:
    """Update a category index page with combined blog + native articles."""
    cat_page = CATEGORY_PAGES[cat_key]
    if not cat_page.exists():
        print(f"  [SKIP] {cat_page} does not exist")
        return

    text = cat_page.read_text(encoding="utf-8")

    # Map category key to category names
    cat_names = {
        "slots":   ["老虎機"],
        "casinos": ["娛樂城"],
        "guides":  ["攻略"],
        "rtp":     ["RTP分析", "RTP"],
    }

    valid_names = cat_names.get(cat_key, [])

    # Filter blog posts for this category
    filtered_blog = [p for p in blog_posts if p["category"] in valid_names]

    # Combine: category-native articles first, then blog posts, all sorted by date
    combined = []

    # Category-native articles (from the category dir itself)
    for art in native_articles:
        entry = {**art}
        entry["_is_native"] = True
        combined.append(entry)

    # Blog posts for this category
    for art in filtered_blog:
        entry = {**art}
        entry["_is_native"] = False
        combined.append(entry)

    # Deduplicate by title (prefer native)
    seen_titles = set()
    deduped = []
    for art in combined:
        if art["title"] not in seen_titles:
            seen_titles.add(art["title"])
            deduped.append(art)

    deduped.sort(key=lambda x: x["date"], reverse=True)

    # Generate cards
    cards = []
    for art in deduped:
        if art.get("_is_native"):
            cards.append(category_card(art, is_blog_post=False))
        else:
            cards.append(category_card(art, is_blog_post=True))

    cards_html = "\n".join(cards)

    # Replace content inside <div class="post-list"> ... </div>
    new_post_list = f'<div class="post-list">\n{cards_html}\n\n      </div>'
    text = re.sub(
        r'<div class="post-list">.*?</div>\s*(?=</main>)',
        new_post_list + "\n    ",
        text,
        flags=re.DOTALL,
    )

    cat_page.write_text(text, encoding="utf-8")
    print(f"  [OK] {cat_key}/index.html updated ({len(deduped)} articles)")


def update_article_counts(blog_posts: list[dict], cat_articles: dict) -> None:
    """Update ARTICLE_COUNTS in js/components.js."""
    # Count unique articles per category (combine blog + category-native)
    counts = {"slots": 0, "casinos": 0, "guides": 0, "rtp": 0}

    seen_titles = set()

    # Count category-native articles
    for cat_key, arts in cat_articles.items():
        for art in arts:
            if art["title"] not in seen_titles:
                seen_titles.add(art["title"])
                counts[cat_key] = counts.get(cat_key, 0) + 1

    # Count blog posts
    for post in blog_posts:
        if post["title"] not in seen_titles:
            seen_titles.add(post["title"])
            cat_info = get_cat_info(post["category"])
            key = cat_info["key"]
            counts[key] = counts.get(key, 0) + 1

    text = COMPONENTS_JS.read_text(encoding="utf-8")
    new_counts = f"const ARTICLE_COUNTS = {{ slots: {counts['slots']}, casinos: {counts['casinos']}, guides: {counts['guides']}, rtp: {counts['rtp']} }};"
    text = re.sub(
        r"const ARTICLE_COUNTS\s*=\s*\{[^}]+\};",
        new_counts,
        text,
    )
    COMPONENTS_JS.write_text(text, encoding="utf-8")
    total = sum(counts.values())
    print(f"  [OK] js/components.js ARTICLE_COUNTS updated: {counts} (total: {total})")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("  auto_publish.py - rtp96.com Blog Auto-Publisher")
    print("=" * 60)
    print(f"  Site root: {SITE_ROOT}")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Step 1: Move drafts
    print("[1/5] Moving drafts...")
    moved = move_drafts()
    if not moved:
        print("  No drafts to move.")
    print()

    # Step 2: Scan blog/posts/
    print("[2/5] Scanning blog/posts/...")
    blog_posts = []
    for f in sorted(POSTS_DIR.glob("*.html")):
        meta = extract_metadata(f)
        if meta:
            blog_posts.append(meta)
        else:
            print(f"  [WARN] Could not extract metadata from {f.name}")

    blog_posts.sort(key=lambda x: x["date"], reverse=True)
    print(f"  Found {len(blog_posts)} blog posts.")
    print()

    # Step 3: Scan category directories for native articles
    print("[3/5] Scanning category directories...")
    cat_articles = {}
    for cat_key, cat_page in CATEGORY_PAGES.items():
        cat_dir = cat_page.parent
        arts = scan_category_articles(cat_dir)
        cat_articles[cat_key] = arts
        print(f"  {cat_key}/: {len(arts)} native articles")
    print()

    # Step 4: Update all index pages
    print("[4/5] Updating index pages...")
    update_blog_index(blog_posts)
    update_homepage(blog_posts, cat_articles)
    for cat_key in CATEGORY_PAGES:
        update_category_page(cat_key, blog_posts, cat_articles[cat_key])
    print()

    # Step 5: Update ARTICLE_COUNTS
    print("[5/5] Updating article counts...")
    update_article_counts(blog_posts, cat_articles)
    print()

    # Summary
    print("=" * 60)
    print("  DONE!")
    if moved:
        print(f"  Drafts moved: {len(moved)} ({', '.join(moved)})")
    cat_breakdown = {}
    for p in blog_posts:
        c = p["category"]
        cat_breakdown[c] = cat_breakdown.get(c, 0) + 1
    print(f"  Blog posts: {len(blog_posts)}")
    for c, n in sorted(cat_breakdown.items(), key=lambda x: -x[1]):
        print(f"    {c}: {n}")
    print("=" * 60)


if __name__ == "__main__":
    main()
