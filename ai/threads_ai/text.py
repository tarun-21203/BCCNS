"""Text normalization shared by the Language Bridge, retrieval and citation checks."""

from __future__ import annotations

import re
import unicodedata

_TOKEN_RE = re.compile(r"[a-z0-9]+")

# Words that carry no search meaning in questions about archives.
STOPWORDS = frozenset(
    """
    a an and are as at be by did do does for from had has have how i in is it its me my
    of on or our show tell that the their there these they this those to was were what
    when where which who whom whose why will with you your any all about can could
    find list give please exist exists existed record records document documents
    archive archives archival collection collections held hold holds material materials
    information info know anything something
    """.split()
)


def fold(text: str) -> str:
    """Lowercase and strip accents so 'Néo-Écossais' matches 'neo ecossais'."""
    decomposed = unicodedata.normalize("NFKD", text or "")
    return "".join(c for c in decomposed if not unicodedata.combining(c)).lower()


def _stem(token: str) -> str:
    # Deliberately tiny: plural folding only, applied identically to records and queries.
    if len(token) > 4 and token.endswith("ies"):
        return token[:-3] + "y"
    if len(token) > 3 and token.endswith("s") and not token.endswith("ss"):
        return token[:-1]
    return token


_POSSESSIVE_RE = re.compile(r"(\w)['’]s\b")


def tokens(text: str) -> list[str]:
    # "Desmond's" -> "desmond", not "desmond" + "s".
    text = _POSSESSIVE_RE.sub(r"\1", fold(text))
    return [_stem(t) for t in _TOKEN_RE.findall(text)]


def content_tokens(text: str) -> list[str]:
    return [t for t in tokens(text) if t not in STOPWORDS]


def token_string(text: str) -> str:
    """Space-joined tokens with sentinel spaces, so ' phrase ' matching respects word boundaries."""
    return " " + " ".join(tokens(text)) + " "


def phrase_key(text: str) -> str:
    return " ".join(tokens(text))


def normalize_for_quote(text: str) -> str:
    """Loose normalization for checking that a quote appears in a record."""
    text = fold(text)
    text = text.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    text = re.sub(r"[‐-―]", "-", text)
    return re.sub(r"\s+", " ", text).strip()
