import re
from urllib.parse import urlparse

import requests
from django.conf import settings


class GitHubScrapeError(Exception):
    pass


class GitHubScraper:
    base_api = "https://api.github.com"

    def __init__(self):
        token = getattr(settings, "GITHUB_TOKEN", "")
        self.headers = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "cv-analyzer-bot",
        }
        if token:
            self.headers["Authorization"] = f"Bearer {token}"

    def scrape(self, github_url: str) -> dict:
        parsed = self._parse_github_url(github_url)
        if parsed["type"] == "repo":
            return self._scrape_repo(parsed["owner"], parsed["repo"], github_url)
        return self._scrape_user(parsed["username"], github_url)

    def _parse_github_url(self, github_url: str) -> dict:
        try:
            parsed = urlparse(github_url)
            if "github.com" not in parsed.netloc.lower():
                raise GitHubScrapeError("Only github.com URLs are supported.")
            parts = [p for p in parsed.path.split("/") if p]
            if not parts:
                raise GitHubScrapeError("Invalid GitHub URL.")
            if len(parts) >= 2:
                return {"type": "repo", "owner": parts[0], "repo": parts[1]}
            return {"type": "user", "username": parts[0]}
        except Exception as exc:
            if isinstance(exc, GitHubScrapeError):
                raise
            raise GitHubScrapeError("Failed to parse GitHub URL.") from exc

    def _request_json(self, path: str):
        response = requests.get(f"{self.base_api}{path}", headers=self.headers, timeout=15)
        if response.status_code >= 400:
            raise GitHubScrapeError(f"GitHub API error ({response.status_code}).")
        return response.json()

    def _request_text(self, path: str):
        headers = dict(self.headers)
        headers["Accept"] = "application/vnd.github.raw+json"
        response = requests.get(f"{self.base_api}{path}", headers=headers, timeout=15)
        if response.status_code >= 400:
            return ""
        return response.text

    def _scrape_repo(self, owner: str, repo: str, input_url: str) -> dict:
        repo_data = self._request_json(f"/repos/{owner}/{repo}")
        languages_data = self._request_json(f"/repos/{owner}/{repo}/languages")
        readme_text = self._request_text(f"/repos/{owner}/{repo}/readme")

        return {
            "source_type": "github_repo",
            "input": input_url,
            "full_name": repo_data.get("full_name", f"{owner}/{repo}"),
            "description": repo_data.get("description") or "",
            "stars": repo_data.get("stargazers_count", 0),
            "forks": repo_data.get("forks_count", 0),
            "topics": repo_data.get("topics", []),
            "languages": list(languages_data.keys())[:10],
            "readme_excerpt": (readme_text or "")[:5000],
            "pushed_at": repo_data.get("pushed_at", ""),
        }

    def _scrape_user(self, username: str, input_url: str) -> dict:
        profile = self._request_json(f"/users/{username}")
        repos = self._request_json(f"/users/{username}/repos?sort=updated&per_page=8")

        repo_summaries = []
        language_set = set()
        for repo in repos:
            lang = repo.get("language")
            if lang:
                language_set.add(lang)
            repo_summaries.append(
                {
                    "name": repo.get("name", ""),
                    "description": repo.get("description") or "",
                    "stars": repo.get("stargazers_count", 0),
                    "language": lang or "",
                    "updated_at": repo.get("updated_at", ""),
                }
            )

        return {
            "source_type": "github_user",
            "input": input_url,
            "username": profile.get("login", username),
            "name": profile.get("name") or "",
            "bio": profile.get("bio") or "",
            "followers": profile.get("followers", 0),
            "public_repos": profile.get("public_repos", 0),
            "top_languages": sorted(language_set)[:10],
            "recent_repos": repo_summaries,
        }

    def to_analysis_text(self, scraped: dict) -> str:
        # Convert structured GitHub metadata into prompt-friendly text.
        lines = [
            f"Source Type: {scraped.get('source_type', 'github')}",
            f"Input: {scraped.get('input', '')}",
        ]

        if scraped.get("source_type") == "github_repo":
            lines.extend(
                [
                    f"Repository: {scraped.get('full_name', '')}",
                    f"Description: {scraped.get('description', '')}",
                    f"Stars: {scraped.get('stars', 0)}",
                    f"Forks: {scraped.get('forks', 0)}",
                    f"Topics: {', '.join(scraped.get('topics', []))}",
                    f"Languages: {', '.join(scraped.get('languages', []))}",
                    f"Last Push: {scraped.get('pushed_at', '')}",
                    "README Excerpt:",
                    scraped.get("readme_excerpt", ""),
                ]
            )
        else:
            lines.extend(
                [
                    f"Username: {scraped.get('username', '')}",
                    f"Name: {scraped.get('name', '')}",
                    f"Bio: {scraped.get('bio', '')}",
                    f"Followers: {scraped.get('followers', 0)}",
                    f"Public Repos: {scraped.get('public_repos', 0)}",
                    f"Top Languages: {', '.join(scraped.get('top_languages', []))}",
                    "Recent Repositories:",
                    self._format_recent_repos(scraped.get("recent_repos", [])),
                ]
            )

        text = "\n".join(lines)
        return re.sub(r"\n{3,}", "\n\n", text)[:12000]

    def _format_recent_repos(self, repos: list) -> str:
        chunks = []
        for repo in repos[:8]:
            chunks.append(
                "- "
                + f"{repo.get('name', '')} | lang={repo.get('language', '')} | stars={repo.get('stars', 0)} | "
                + f"updated={repo.get('updated_at', '')} | {repo.get('description', '')}"
            )
        return "\n".join(chunks)


github_scraper = GitHubScraper()
