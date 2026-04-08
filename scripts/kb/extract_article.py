#!/usr/bin/env python3
import argparse
import json
import re
import sys
from html import unescape
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse


VOID_TAGS = {
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
}
SKIP_TAGS = {"script", "style", "noscript", "svg", "canvas", "iframe", "form", "button"}
BLOCK_TAGS = {
    "article",
    "section",
    "div",
    "main",
    "aside",
    "header",
    "footer",
    "p",
    "ul",
    "ol",
    "li",
    "blockquote",
    "pre",
    "figure",
    "table",
}
PREFERRED_IDS = [
    "js_content",
    "article_content",
    "article-body",
    "articleBody",
    "post-content",
    "entry-content",
    "content",
    "main-content",
    "article-content",
    "rich_media_content",
]
PREFERRED_CLASS_TOKENS = [
    "article-content",
    "article-body",
    "post-content",
    "entry-content",
    "rich_media_content",
    "rich_media_area_primary_inner",
    "content",
]
NEGATIVE_CLASS_TOKENS = [
    "comment",
    "footer",
    "header",
    "sidebar",
    "recommend",
    "related",
    "share",
    "advert",
    "nav",
    "toolbar",
    "menu",
    "popup",
]


def normalize_space(text: str) -> str:
    text = unescape(text or "")
    text = text.replace("\xa0", " ")
    text = re.sub(r"\r", "", text)
    text = re.sub(r"[ \t\f\v]+", " ", text)
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    return text.strip()


class Node:
    def __init__(self, tag, attrs=None, parent=None, data=""):
        self.tag = (tag or "").lower()
        self.attrs = {k.lower(): v for k, v in (attrs or {}).items()}
        self.parent = parent
        self.children = []
        self.data = data

    def add_child(self, child):
        self.children.append(child)

    def attr(self, key, default=""):
        return self.attrs.get(key, default)

    def classes(self):
        return set(filter(None, self.attr("class").split()))


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("document")
        self.stack = [self.root]

    def current(self):
        return self.stack[-1]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, dict(attrs), self.current())
        self.current().add_child(node)
        if tag.lower() not in VOID_TAGS:
            self.stack.append(node)

    def handle_endtag(self, tag):
        tag = (tag or "").lower()
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                break

    def handle_startendtag(self, tag, attrs):
        node = Node(tag, dict(attrs), self.current())
        self.current().add_child(node)

    def handle_data(self, data):
        if not data:
            return
        node = Node("#text", parent=self.current(), data=data)
        self.current().add_child(node)

    def handle_comment(self, data):
        return


def iter_nodes(node):
    for child in node.children:
        yield child
        yield from iter_nodes(child)


def text_content(node):
    if node.tag in SKIP_TAGS:
        return ""
    if node.tag == "#text":
        return node.data
    pieces = []
    for child in node.children:
        child_text = text_content(child)
        if child_text:
            pieces.append(child_text)
    if node.tag in {"p", "div", "section", "article", "main", "li", "blockquote", "pre", "br"}:
        return "".join(pieces) + "\n"
    return "".join(pieces)


def find_first(node, predicate):
    for current in iter_nodes(node):
        if predicate(current):
            return current
    return None


def find_all(node, predicate):
    return [current for current in iter_nodes(node) if predicate(current)]


def get_meta(root):
    meta = {}
    for node in iter_nodes(root):
        if node.tag != "meta":
            continue
        key = node.attr("property") or node.attr("name") or node.attr("itemprop")
        value = node.attr("content")
        if key and value and key not in meta:
            meta[key.lower()] = value.strip()
    return meta


def get_title(root, meta):
    candidates = [
        meta.get("og:title"),
        meta.get("twitter:title"),
    ]
    title_node = find_first(root, lambda n: n.tag == "title")
    if title_node:
        candidates.append(normalize_space(text_content(title_node)))
    h1 = find_first(root, lambda n: n.tag == "h1")
    if h1:
        candidates.append(normalize_space(text_content(h1)))
    for item in candidates:
        if item:
            return item
    return ""


def get_description(meta):
    for key in ["description", "og:description", "twitter:description"]:
        if meta.get(key):
            return meta[key]
    return ""


def get_author(meta, root):
    for key in ["author", "article:author", "profile:username"]:
        if meta.get(key):
            return meta[key]
    author_node = find_first(
        root,
        lambda n: (
            n.attr("id") in {"js_name", "profileBt"} or "author" in n.attr("class") or "nickname" in n.attr("class")
        ),
    )
    if author_node:
        return normalize_space(text_content(author_node))
    return ""


def get_published(meta, root):
    for key in ["article:published_time", "publishdate", "pubdate", "date", "og:release_date"]:
        if meta.get(key):
            return meta[key]
    time_node = find_first(root, lambda n: n.tag == "time" and (n.attr("datetime") or normalize_space(text_content(n))))
    if time_node:
        return time_node.attr("datetime") or normalize_space(text_content(time_node))
    return ""


def has_negative_class(node):
    class_name = f"{node.attr('class')} {node.attr('id')}".lower()
    return any(token in class_name for token in NEGATIVE_CLASS_TOKENS)


def node_score(node):
    if node.tag not in {"article", "main", "div", "section", "body"}:
        return -1
    text = normalize_space(text_content(node))
    if len(text) < 200:
        return -1
    paragraphs = len(find_all(node, lambda n: n.tag == "p"))
    headings = len(find_all(node, lambda n: n.tag in {"h1", "h2", "h3"}))
    images = len(find_all(node, lambda n: n.tag == "img"))
    links = len(find_all(node, lambda n: n.tag == "a"))
    score = len(text) + paragraphs * 120 + headings * 80 + images * 40 - links * 20
    if has_negative_class(node):
      score -= 400
    id_name = node.attr("id").lower()
    class_name = node.attr("class").lower()
    if id_name in PREFERRED_IDS:
        score += 3000
    if any(token in class_name for token in PREFERRED_CLASS_TOKENS):
        score += 1800
    return score


def choose_content_root(root):
    for preferred_id in PREFERRED_IDS:
        match = find_first(root, lambda n, pid=preferred_id: n.attr("id").lower() == pid)
        if match:
            return match, f"id:{preferred_id}"

    for token in PREFERRED_CLASS_TOKENS:
        match = find_first(root, lambda n, t=token: t in n.attr("class").lower())
        if match:
            return match, f"class:{token}"

    for tag in ["article", "main"]:
        match = find_first(root, lambda n, wanted=tag: n.tag == wanted)
        if match and len(normalize_space(text_content(match))) >= 200:
            return match, f"tag:{tag}"

    best = None
    best_score = -1
    for node in iter_nodes(root):
        score = node_score(node)
        if score > best_score:
            best = node
            best_score = score

    return best, "scored-node" if best else "none"


def inline_markdown(node, base_url):
    if node.tag == "#text":
        return normalize_space(node.data)
    if node.tag in SKIP_TAGS:
        return ""
    if node.tag == "br":
        return "\n"
    if node.tag == "img":
        src = urljoin(base_url, node.attr("src")) if base_url else node.attr("src")
        alt = normalize_space(node.attr("alt"))
        return f"![{alt}]({src})" if src else ""
    if node.tag == "a":
        text = "".join(inline_markdown(child, base_url) for child in node.children).strip()
        href = urljoin(base_url, node.attr("href")) if base_url else node.attr("href")
        if href and text:
            return f"[{text}]({href})"
        return text
    if node.tag in {"strong", "b"}:
        text = "".join(inline_markdown(child, base_url) for child in node.children).strip()
        return f"**{text}**" if text else ""
    if node.tag in {"em", "i"}:
        text = "".join(inline_markdown(child, base_url) for child in node.children).strip()
        return f"*{text}*" if text else ""
    return "".join(inline_markdown(child, base_url) for child in node.children)


def block_markdown(node, base_url, depth=0):
    if node.tag in SKIP_TAGS:
        return ""
    if node.tag == "#text":
        return normalize_space(node.data)

    if node.tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
        level = int(node.tag[1])
        text = normalize_space("".join(inline_markdown(child, base_url) for child in node.children))
        return f"{'#' * level} {text}\n\n" if text else ""

    if node.tag == "p":
        text = normalize_space("".join(inline_markdown(child, base_url) for child in node.children))
        return f"{text}\n\n" if text else ""

    if node.tag == "blockquote":
        text = normalize_space("".join(block_markdown(child, base_url, depth + 1) for child in node.children))
        lines = [line for line in text.splitlines() if line.strip()]
        return "".join(f"> {line}\n" for line in lines) + ("\n" if lines else "")

    if node.tag == "pre":
        code = normalize_space(text_content(node))
        return f"```\n{code}\n```\n\n" if code else ""

    if node.tag == "ul":
        parts = []
        for child in node.children:
            if child.tag == "li":
                item = normalize_space("".join(block_markdown(grand, base_url, depth + 1) for grand in child.children))
                if item:
                    parts.append(f"- {item}")
        return "\n".join(parts) + ("\n\n" if parts else "")

    if node.tag == "ol":
        parts = []
        idx = 1
        for child in node.children:
            if child.tag == "li":
                item = normalize_space("".join(block_markdown(grand, base_url, depth + 1) for grand in child.children))
                if item:
                    parts.append(f"{idx}. {item}")
                    idx += 1
        return "\n".join(parts) + ("\n\n" if parts else "")

    if node.tag == "figure":
        return "".join(block_markdown(child, base_url, depth + 1) for child in node.children) + "\n"

    if node.tag == "img":
        src = urljoin(base_url, node.attr("src")) if base_url else node.attr("src")
        alt = normalize_space(node.attr("alt"))
        return f"![{alt}]({src})\n\n" if src else ""

    if node.tag == "hr":
        return "---\n\n"

    parts = []
    for child in node.children:
        chunk = block_markdown(child, base_url, depth + 1)
        if chunk:
            parts.append(chunk)
    joined = "".join(parts)
    if node.tag in BLOCK_TAGS and joined and not joined.endswith("\n\n"):
        joined += "\n\n"
    return joined


def extract(html, url):
    parser = TreeBuilder()
    parser.feed(html)
    root = parser.root
    meta = get_meta(root)
    title = get_title(root, meta)
    description = get_description(meta)
    author = get_author(meta, root)
    published = get_published(meta, root)
    content_root, method = choose_content_root(root)
    markdown = normalize_space(block_markdown(content_root or root, url)) if content_root else ""
    plain_text = normalize_space(text_content(content_root or root))
    site_name = meta.get("og:site_name") or urlparse(url).netloc

    if not description and plain_text:
        description = plain_text[:140]

    return {
        "title": title,
        "description": description,
        "author": author,
        "publishedAt": published,
        "siteName": site_name,
        "url": url,
        "contentMarkdown": markdown,
        "plainText": plain_text,
        "textLength": len(plain_text),
        "extractionMethod": method,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    args = parser.parse_args()
    html = sys.stdin.read()
    result = extract(html, args.url)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
